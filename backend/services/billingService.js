const BillingHistory = require('../models/BillingHistory');
const PaymentMethod = require('../models/PaymentMethod');
const Subscription = require('../models/Subscription');
const Salon = require('../models/Salon');
const emailService = require('./emailService');
const { getPlanDetails } = require('../config/subscriptionPlans');

// Stripe is optional - only load if configured
let stripeService = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripeService = require('./stripeService');
  }
} catch (error) {
  console.log('Stripe not configured - using manual billing');
}

/**
 * Process monthly billing for all active subscriptions
 * This should be run as a cron job daily
 */
const processMonthlyBilling = async () => {
  try {
    console.log('🔄 Starting monthly billing process...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find subscriptions due for billing today
    const dueSubscriptions = await Subscription.find({
      status: { $in: ['trial', 'active'] },
      nextBillingDate: { $lte: today },
    }).populate('salon');

    console.log(`Found ${dueSubscriptions.length} subscriptions due for billing`);

    let successCount = 0;
    let failureCount = 0;

    for (const subscription of dueSubscriptions) {
      try {
        const result = await chargeSalonSubscription(subscription);
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        console.error(`Error billing subscription ${subscription._id}:`, error);
        failureCount++;
      }
    }

    console.log(`✅ Billing complete: ${successCount} succeeded, ${failureCount} failed`);

    return {
      total: dueSubscriptions.length,
      succeeded: successCount,
      failed: failureCount,
    };
  } catch (error) {
    console.error('Error in monthly billing process:', error);
    throw error;
  }
};

/**
 * Charge a specific salon subscription
 */
const chargeSalonSubscription = async (subscription) => {
  try {
    const salon = subscription.salon;
    
    // Get payment method (optional for manual billing)
    const paymentMethod = await PaymentMethod.findOne({
      salon: salon._id,
      isDefault: true,
      isActive: true,
    });

    // For Tunisia: Manual payment is default (cash, bank transfer, etc.)
    // No need to fail if no payment method - just create invoice for manual payment
    const useManualBilling = !paymentMethod || !stripeService || 
                             ['cash', 'bank_transfer', 'ccp', 'd17', 'flouci', 'cheque'].includes(paymentMethod?.type);

    // Calculate billing period
    const billingPeriodStart = new Date();
    const billingPeriodEnd = new Date(billingPeriodStart);
    billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);

    // Get plan pricing
    const planDetails = getPlanDetails(subscription.plan);
    const amount = subscription.price || planDetails.price;

    // Create billing history record
    const billingRecord = await BillingHistory.create({
      salon: salon._id,
      subscription: subscription._id,
      amount: amount,
      currency: 'TND', // Tunisian Dinar
      status: useManualBilling ? 'pending' : 'processing',
      paymentMethod: paymentMethod?.type || 'cash',
      description: `${subscription.plan} Plan - Monthly Subscription`,
      billingPeriod: {
        start: billingPeriodStart,
        end: billingPeriodEnd,
      },
      nextBillingDate: billingPeriodEnd,
    });

    // TUNISIA MODE: Create invoice for manual payment
    if (useManualBilling) {
      // Send invoice email to salon owner
      await sendInvoiceEmail(salon, billingRecord);

      // Update subscription
      subscription.status = 'active'; // Keep active, payment pending
      subscription.nextBillingDate = billingPeriodEnd;
      await subscription.save();

      console.log(`📧 Invoice sent to ${salon.name} - ${amount} TND (Manual payment)`);

      return { success: true, billingRecord, manual: true };
    }

    try {
      // STRIPE MODE: Charge via Stripe (if configured)
      const paymentIntent = await stripeService.chargeSubscription(
        paymentMethod.stripeCustomerId,
        amount,
        'tnd', // Tunisian Dinar
        `Xaura ${subscription.plan} Plan - ${salon.name}`,
        {
          salonId: salon._id.toString(),
          subscriptionId: subscription._id.toString(),
          billingRecordId: billingRecord._id.toString(),
        }
      );

      // Update billing record with success
      billingRecord.status = 'succeeded';
      billingRecord.stripePaymentIntentId = paymentIntent.id;
      billingRecord.transactionId = `TXN-${Date.now()}-${salon._id.toString().slice(-6)}`;
      billingRecord.paidAt = new Date();
      billingRecord.receiptUrl = paymentIntent.receipt_url || null;
      await billingRecord.save();

      // Update subscription
      subscription.status = 'active';
      subscription.nextBillingDate = billingPeriodEnd;
      subscription.lastPaymentDate = new Date();
      subscription.lastPaymentAmount = subscription.price;
      await subscription.save();

      // Send payment receipt email
      await sendPaymentReceipt(salon, billingRecord);

      console.log(`✅ Successfully charged ${salon.name} - $${subscription.price}`);

      return { success: true, billingRecord };
    } catch (stripeError) {
      // Payment failed
      console.error(`Stripe payment failed for ${salon.name}:`, stripeError);
      return await handleBillingFailure(
        subscription,
        stripeError.message,
        billingRecord.retryAttempts + 1,
        billingRecord
      );
    }
  } catch (error) {
    console.error('Error charging salon subscription:', error);
    throw error;
  }
};

/**
 * Handle billing failure
 */
const handleBillingFailure = async (subscription, reason, retryAttempts, billingRecord = null) => {
  try {
    // Update or create billing record
    if (billingRecord) {
      billingRecord.status = 'failed';
      billingRecord.failureReason = reason;
      billingRecord.retryAttempts = retryAttempts;
      await billingRecord.save();
    } else {
      await BillingHistory.create({
        salon: subscription.salon,
        subscription: subscription._id,
        amount: subscription.price,
        currency: 'USD',
        status: 'failed',
        failureReason: reason,
        retryAttempts,
        description: `${subscription.plan} Plan - Payment Failed`,
      });
    }

    // If max retries reached, suspend subscription
    if (retryAttempts >= 3) {
      subscription.status = 'suspended';
      await subscription.save();

      // Suspend salon
      const salon = await Salon.findById(subscription.salon);
      if (salon) {
        salon.isActive = false;
        await salon.save();

        // Send suspension email
        await sendSuspensionEmail(salon, reason);
      }

      console.log(`⚠️ Subscription suspended after 3 failed attempts: ${subscription._id}`);
    } else {
      // Schedule retry (next day)
      const nextRetry = new Date();
      nextRetry.setDate(nextRetry.getDate() + 1);
      subscription.nextBillingDate = nextRetry;
      await subscription.save();

      // Send payment failure email
      const salon = await Salon.findById(subscription.salon);
      if (salon) {
        await sendPaymentFailureEmail(salon, reason, retryAttempts);
      }

      console.log(`⚠️ Payment failed, will retry: ${subscription._id} (Attempt ${retryAttempts}/3)`);
    }

    return { success: false, reason, retryAttempts };
  } catch (error) {
    console.error('Error handling billing failure:', error);
    throw error;
  }
};

/**
 * Retry failed payment
 */
const retryFailedPayment = async (billingRecordId) => {
  try {
    const billingRecord = await BillingHistory.findById(billingRecordId).populate('subscription');

    if (!billingRecord || !billingRecord.canRetry()) {
      throw new Error('Payment cannot be retried');
    }

    const subscription = await Subscription.findById(billingRecord.subscription).populate('salon');

    return await chargeSalonSubscription(subscription);
  } catch (error) {
    console.error('Error retrying failed payment:', error);
    throw error;
  }
};

/**
 * Send payment receipt email
 */
const sendPaymentReceipt = async (salon, billingRecord) => {
  try {
    const owner = await require('../models/User').findOne({
      role: 'Owner',
      salonId: salon._id,
    });

    if (!owner || !owner.email) return;

    const emailHtml = `
      <h2>Payment Successful! 🎉</h2>
      <p>Hi ${owner.name},</p>
      <p>Your payment for Xaura has been processed successfully.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Payment Details</h3>
        <p><strong>Amount:</strong> $${billingRecord.amount.toFixed(2)}</p>
        <p><strong>Transaction ID:</strong> ${billingRecord.transactionId}</p>
        <p><strong>Date:</strong> ${new Date(billingRecord.paidAt).toLocaleDateString()}</p>
        <p><strong>Next Billing Date:</strong> ${new Date(billingRecord.nextBillingDate).toLocaleDateString()}</p>
      </div>
      
      <p>Thank you for using Xaura!</p>
      <p>If you have any questions, please contact support.</p>
    `;

    await emailService.sendEmail(
      owner.email,
      'Payment Receipt - Xaura',
      emailHtml
    );
  } catch (error) {
    console.error('Error sending payment receipt:', error);
    // Don't throw - email failure shouldn't stop billing
  }
};

/**
 * Send payment failure email
 */
const sendPaymentFailureEmail = async (salon, reason, retryAttempts) => {
  try {
    const owner = await require('../models/User').findOne({
      role: 'Owner',
      salonId: salon._id,
    });

    if (!owner || !owner.email) return;

    const emailHtml = `
      <h2>Payment Failed ⚠️</h2>
      <p>Hi ${owner.name},</p>
      <p>We were unable to process your payment for Xaura.</p>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Failure Details</h3>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Attempt:</strong> ${retryAttempts} of 3</p>
        <p><strong>Next Retry:</strong> Tomorrow</p>
      </div>
      
      <p>Please update your payment method to avoid service interruption.</p>
      <p><a href="${process.env.FRONTEND_URL}/owner/billing" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Update Payment Method</a></p>
      
      <p>If you need help, please contact support.</p>
    `;

    await emailService.sendEmail(
      owner.email,
      'Payment Failed - Action Required',
      emailHtml
    );
  } catch (error) {
    console.error('Error sending payment failure email:', error);
  }
};

/**
 * Send suspension email
 */
const sendSuspensionEmail = async (salon, reason) => {
  try {
    const owner = await require('../models/User').findOne({
      role: 'Owner',
      salonId: salon._id,
    });

    if (!owner || !owner.email) return;

    const emailHtml = `
      <h2>Account Suspended 🚫</h2>
      <p>Hi ${owner.name},</p>
      <p>Your Xaura account has been suspended due to payment failure.</p>
      
      <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Suspension Reason</h3>
        <p>${reason}</p>
        <p>We attempted to charge your payment method 3 times without success.</p>
      </div>
      
      <p><strong>To reactivate your account:</strong></p>
      <ol>
        <li>Update your payment method</li>
        <li>Contact our support team</li>
        <li>Your account will be reactivated upon successful payment</li>
      </ol>
      
      <p><a href="${process.env.FRONTEND_URL}/owner/billing" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reactivate Account</a></p>
      
      <p>We're here to help if you need assistance.</p>
    `;

    await emailService.sendEmail(
      owner.email,
      'Account Suspended - Urgent Action Required',
      emailHtml
    );
  } catch (error) {
    console.error('Error sending suspension email:', error);
  }
};

/**
 * Send invoice email (for manual payment in Tunisia)
 */
const sendInvoiceEmail = async (salon, billingRecord) => {
  try {
    const owner = await require('../models/User').findOne({
      role: 'Owner',
      salonId: salon._id,
    });

    if (!owner || !owner.email) return;

    const emailHtml = `
      <h2>فاتورة شهرية - Monthly Invoice 📄</h2>
      <p>Bonjour ${owner.name} / مرحبا ${owner.name},</p>
      <p>Votre facture mensuelle Xaura est prête / فاتورتك الشهرية جاهزة.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>تفاصيل الفاتورة - Invoice Details</h3>
        <p><strong>المبلغ - Amount:</strong> ${billingRecord.amount.toFixed(3)} د.ت TND</p>
        <p><strong>الخطة - Plan:</strong> ${billingRecord.description}</p>
        <p><strong>فترة الفوترة - Billing Period:</strong> ${new Date(billingRecord.billingPeriod.start).toLocaleDateString()} - ${new Date(billingRecord.billingPeriod.end).toLocaleDateString()}</p>
        <p><strong>الموعد النهائي - Due Date:</strong> ${new Date(billingRecord.nextBillingDate).toLocaleDateString()}</p>
      </div>
      
      <h3>طرق الدفع المتاحة - Available Payment Methods:</h3>
      <ul>
        <li>💵 نقدا - Cash</li>
        <li>🏦 تحويل بنكي - Bank Transfer</li>
        <li>📮 CCP - Compte Chèque Postal</li>
        <li>💳 D17 - Dinar Électronique</li>
        <li>📱 Flouci - Mobile Payment</li>
        <li>📝 شيك - Cheque</li>
      </ul>
      
      <p><strong>معلومات الدفع - Payment Information:</strong></p>
      <p>Please contact us to confirm your payment method.</p>
      <p>تواصل معنا لتأكيد طريقة الدفع الخاصة بك.</p>
      
      <p>شكرا لاستخدامك Xaura!</p>
      <p>Thank you for using Xaura!</p>
    `;

    await emailService.sendEmail(
      owner.email,
      'Invoice - فاتورة | Xaura',
      emailHtml
    );
  } catch (error) {
    console.error('Error sending invoice email:', error);
    // Don't throw - email failure shouldn't stop billing
  }
};

module.exports = {
  processMonthlyBilling,
  chargeSalonSubscription,
  retryFailedPayment,
  handleBillingFailure,
  sendPaymentReceipt,
  sendPaymentFailureEmail,
  sendSuspensionEmail,
  sendInvoiceEmail,
};

