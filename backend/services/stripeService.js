// Initialize Stripe only if key is provided
const stripe = process.env.STRIPE_SECRET_KEY 
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// Helper to check if Stripe is configured
const checkStripeConfigured = () => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to .env file');
  }
};

/**
 * Create a Stripe customer for a salon
 */
const createCustomer = async (salon, email, name) => {
  try {
    checkStripeConfigured();
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        salonId: salon._id.toString(),
        salonName: salon.name,
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create customer in Stripe');
  }
};

/**
 * Attach a payment method to a customer
 */
const attachPaymentMethod = async (paymentMethodId, customerId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return paymentMethod;
  } catch (error) {
    console.error('Error attaching payment method:', error);
    throw new Error('Failed to attach payment method');
  }
};

/**
 * Set default payment method for customer
 */
const setDefaultPaymentMethod = async (customerId, paymentMethodId) => {
  try {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return true;
  } catch (error) {
    console.error('Error setting default payment method:', error);
    throw new Error('Failed to set default payment method');
  }
};

/**
 * Create a Stripe subscription
 */
const createSubscription = async (customerId, priceId, metadata = {}) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata,
    });

    return subscription;
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    throw new Error('Failed to create subscription in Stripe');
  }
};

/**
 * Charge a subscription (one-time payment)
 */
const chargeSubscription = async (customerId, amount, currency = 'usd', description, metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId,
      description,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error charging subscription:', error);
    throw new Error('Failed to charge subscription');
  }
};

/**
 * Create an invoice for a customer
 */
const createInvoice = async (customerId, amount, currency = 'usd', description, metadata = {}) => {
  try {
    // Create invoice item
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
    });

    // Create and finalize invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true, // Auto-finalize
      metadata,
    });

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    return finalizedInvoice;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new Error('Failed to create invoice');
  }
};

/**
 * Pay an invoice
 */
const payInvoice = async (invoiceId) => {
  try {
    const invoice = await stripe.invoices.pay(invoiceId);
    return invoice;
  } catch (error) {
    console.error('Error paying invoice:', error);
    throw new Error('Failed to pay invoice');
  }
};

/**
 * Cancel a Stripe subscription
 */
const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
};

/**
 * Update Stripe subscription
 */
const updateSubscription = async (subscriptionId, updates) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, updates);
    return subscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Failed to update subscription');
  }
};

/**
 * Retrieve payment method details
 */
const getPaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    console.error('Error retrieving payment method:', error);
    throw new Error('Failed to retrieve payment method');
  }
};

/**
 * Detach payment method from customer
 */
const detachPaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    console.error('Error detaching payment method:', error);
    throw new Error('Failed to detach payment method');
  }
};

/**
 * Create a refund
 */
const createRefund = async (paymentIntentId, amount = null) => {
  try {
    const refundData = { payment_intent: paymentIntentId };
    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundData);
    return refund;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw new Error('Failed to create refund');
  }
};

/**
 * Handle Stripe webhook events
 */
const handleWebhook = async (event) => {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        // Handle successful payment
        break;

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        // Handle failed payment
        break;

      case 'invoice.payment_succeeded':
        console.log('Invoice payment succeeded:', event.data.object.id);
        // Handle successful invoice payment
        break;

      case 'invoice.payment_failed':
        console.log('Invoice payment failed:', event.data.object.id);
        // Handle failed invoice payment
        break;

      case 'customer.subscription.deleted':
        console.log('Subscription cancelled:', event.data.object.id);
        // Handle subscription cancellation
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return { received: true };
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
};

/**
 * Verify webhook signature
 */
const verifyWebhookSignature = (payload, signature, secret) => {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};

module.exports = {
  createCustomer,
  attachPaymentMethod,
  setDefaultPaymentMethod,
  createSubscription,
  chargeSubscription,
  createInvoice,
  payInvoice,
  cancelSubscription,
  updateSubscription,
  getPaymentMethod,
  detachPaymentMethod,
  createRefund,
  handleWebhook,
  verifyWebhookSignature,
};

