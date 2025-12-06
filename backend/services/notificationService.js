const Notification = require('../models/Notification');
const WhatsAppService = require('./whatsappService');
const Appointment = require('../models/Appointment');
const Subscription = require('../models/Subscription');
const { formatTunisianPhone } = require('../utils/phoneFormatter');

/**
 * Notification Service
 * Handles SMS and WhatsApp notifications via Twilio
 */
class NotificationService {
  constructor() {
    // Log initialization
    console.log('[NotificationService] Initializing...');
    
    // Check if Twilio credentials are present
    const hasAccountSid = !!process.env.TWILIO_ACCOUNT_SID;
    const hasAuthToken = !!process.env.TWILIO_AUTH_TOKEN;
    const hasWhatsAppNumber = !!process.env.TWILIO_WHATSAPP_NUMBER;
    
    console.log('[NotificationService] Twilio Configuration Check:');
    console.log(`  TWILIO_ACCOUNT_SID: ${hasAccountSid ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`  TWILIO_AUTH_TOKEN: ${hasAuthToken ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`  TWILIO_WHATSAPP_NUMBER: ${hasWhatsAppNumber ? '✅ Set' : '❌ NOT SET'}`);
    
    if (hasWhatsAppNumber) {
      console.log(`  WhatsApp Number: ${process.env.TWILIO_WHATSAPP_NUMBER.substring(0, 25)}...`);
    }
    
    // Initialize WhatsApp service with Twilio credentials
    this.whatsappService = new WhatsAppService(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
      process.env.TWILIO_WHATSAPP_NUMBER // Format: 'whatsapp:+14155238886'
    );
    
    console.log('[NotificationService] ✅ Initialized');
  }

  /**
   * Helper: Get all services from appointment (handles both single serviceId and services array)
   */
  _getServicesFromAppointment(appointment) {
    const services = [];
    
    // Check if appointment has services array (multiple services)
    if (appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) {
      appointment.services.forEach(service => {
        if (service.name) {
          services.push(service.name);
        }
      });
    }
    
    // Fallback to single serviceId if services array is empty
    if (services.length === 0 && appointment.serviceId) {
      if (typeof appointment.serviceId === 'object' && appointment.serviceId.name) {
        services.push(appointment.serviceId.name);
      } else if (typeof appointment.serviceId === 'string') {
        // Service not populated, use serviceId as fallback
        services.push('Service');
      }
    }
    
    return services;
  }

  /**
   * Helper: Format date and time in French
   */
  _formatDateFrench(dateTime) {
    const date = new Date(dateTime);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
  }

  /**
   * Helper: Format date only in French
   */
  _formatDateOnlyFrench(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  /**
   * Helper: Format time only in French
   */
  _formatTimeOnlyFrench(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Helper: Check if appointment is part of multi-person booking
   */
  async _isMultiPersonBooking(appointment) {
    // Check notes for multi-person indicator
    if (appointment.notes && appointment.notes.includes('Person') && appointment.notes.includes('Multi-person')) {
      return true;
    }
    
    // Check for other appointments at the same time with same client and worker
    if (!appointment.clientId || !appointment.workerId) {
      return false;
    }
    
    const clientId = appointment.clientId._id || appointment.clientId;
    const workerId = appointment.workerId._id || appointment.workerId;
    
    const sameTimeAppointments = await Appointment.countDocuments({
      clientId: clientId,
      workerId: workerId,
      dateTime: appointment.dateTime,
      _id: { $ne: appointment._id },
      status: { $in: ['Pending', 'Confirmed'] }
    });
    
    return sameTimeAppointments > 0;
  }

  /**
   * Helper: Get multi-person booking info (how many people total and all services)
   */
  async _getMultiPersonBookingInfo(appointment) {
    if (!appointment.clientId || !appointment.workerId) {
      return null;
    }
    
    const clientId = appointment.clientId._id || appointment.clientId;
    const workerId = appointment.workerId._id || appointment.workerId;
    
    const sameTimeAppointments = await Appointment.find({
      clientId: clientId,
      workerId: workerId,
      dateTime: appointment.dateTime,
      status: { $in: ['Pending', 'Confirmed'] }
    }).populate('serviceId', 'name').lean();
    
    if (sameTimeAppointments.length <= 1) {
      return null; // Not a multi-person booking
    }
    
    // Get all services from all appointments in this multi-person booking
    const allServices = [];
    sameTimeAppointments.forEach(apt => {
      if (apt.services && Array.isArray(apt.services)) {
        apt.services.forEach(s => {
          if (s.name) allServices.push(s.name);
        });
      } else if (apt.serviceId && apt.serviceId.name) {
        allServices.push(apt.serviceId.name);
      }
    });
    
    return {
      totalPeople: sameTimeAppointments.length,
      allServices: [...new Set(allServices)] // Remove duplicates
    };
  }
  /**
   * Send SMS notification (MOCK implementation)
   * @param {String} userId - User ID to send notification to
   * @param {String} phoneNumber - Recipient phone number
   * @param {String} message - Message content
   * @param {Object} metadata - Additional metadata (appointmentId, salonId, etc.)
   */
  async sendSMS(userId, phoneNumber, message, metadata = {}) {
    try {
      // Create notification record
      const notification = await Notification.create({
        userId,
        type: 'SMS',
        message,
        recipient: phoneNumber,
        status: 'sent', // Mock: immediately mark as sent
        metadata,
        sentAt: new Date()
      });

      // TODO: In production, integrate with Twilio
      // const twilio = require('twilio');
      // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // await client.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: phoneNumber
      // });

      console.log(`[MOCK SMS] To: ${phoneNumber}`);
      console.log(`[MOCK SMS] Message: ${message}`);

      return {
        success: true,
        notificationId: notification._id,
        message: 'SMS sent successfully (mock)'
      };
    } catch (error) {
      // Log failed notification
      await Notification.create({
        userId,
        type: 'SMS',
        message,
        recipient: phoneNumber,
        status: 'failed',
        metadata,
        errorMessage: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get subscription from salonId for usage tracking
   * @param {String|Object} salonId - Salon ID (can be ObjectId or populated object)
   * @returns {Object|null} - Subscription object or null
   */
  async _getSubscriptionFromSalonId(salonId) {
    try {
      const salonIdValue = salonId?._id ? salonId._id : salonId;
      if (!salonIdValue) return null;
      
      const subscription = await Subscription.findOne({ salonId: salonIdValue });
      return subscription;
    } catch (error) {
      console.error('[NotificationService] Error getting subscription:', error.message);
      return null;
    }
  }

  /**
   * Send WhatsApp notification using Twilio with usage tracking
   * @param {String} userId - User ID to send notification to
   * @param {String} phoneNumber - Recipient phone number (will be formatted with +216)
   * @param {String} message - Message content
   * @param {Object} metadata - Additional metadata (must include salonId for usage tracking)
   */
  async sendWhatsApp(userId, phoneNumber, message, metadata = {}) {
    try {
      // Validate phone number
      if (!phoneNumber) {
        console.error('[NotificationService] sendWhatsApp: Phone number is missing');
        return {
          success: false,
          error: 'Phone number is required'
        };
      }

      // Format phone number with Tunisian country code (+216)
      const formattedPhone = formatTunisianPhone(phoneNumber);
      if (!formattedPhone) {
        console.error('[NotificationService] sendWhatsApp: Invalid phone number format:', phoneNumber);
        return {
          success: false,
          error: 'Invalid phone number format. Please provide a valid Tunisian phone number.'
        };
      }

      // Check usage limits if salonId is provided
      let usageChecked = false;
      let canSend = true;
      let usageError = null;
      
      if (metadata.salonId) {
        try {
          const subscription = await this._getSubscriptionFromSalonId(metadata.salonId);
          
          if (subscription) {
            // Check if we can send WhatsApp message
            const usageCheck = await subscription.canSendWhatsAppMessage();
            canSend = usageCheck.canSend;
            usageError = usageCheck.reason;
            usageChecked = true;
            
            if (!canSend) {
              console.warn('[NotificationService] WhatsApp message blocked by usage limit:', {
                salonId: metadata.salonId,
                reason: usageError,
                monthlyLimit: usageCheck.monthlyLimit,
                currentUsage: usageCheck.currentUsage,
                creditsAvailable: usageCheck.creditsAvailable
              });
              
              return {
                success: false,
                error: usageError || 'WhatsApp message limit reached',
                limitReached: true,
                usageInfo: {
                  monthlyLimit: usageCheck.monthlyLimit,
                  currentUsage: usageCheck.currentUsage,
                  creditsAvailable: usageCheck.creditsAvailable
                }
              };
            }
          }
        } catch (usageError) {
          console.error('[NotificationService] Error checking usage limits:', usageError.message);
          // Continue sending even if usage check fails (don't block messages)
        }
      }

      // Log attempt with formatted phone
      console.log('[NotificationService] Sending WhatsApp:', {
        originalPhone: phoneNumber,
        formattedPhone: formattedPhone,
        userId: userId
      });
      console.log('[NotificationService] Message preview:', message.substring(0, 50) + '...');

      // Send WhatsApp via Twilio (with formatted phone number)
      const result = await this.whatsappService.sendWhatsApp(formattedPhone, message);

      // Track usage if message was sent successfully
      if (result.success && usageChecked && metadata.salonId) {
        try {
          const subscription = await this._getSubscriptionFromSalonId(metadata.salonId);
          if (subscription) {
            await subscription.trackWhatsAppMessage();
            console.log('[NotificationService] ✅ Usage tracked for salon:', metadata.salonId);
          }
        } catch (trackError) {
          console.error('[NotificationService] Error tracking usage (message was sent):', trackError.message);
          // Don't fail the send if tracking fails
        }
      }

      // Log result
      if (result.success) {
        console.log('[NotificationService] ✅ WhatsApp sent successfully:', {
          phoneNumber: formattedPhone,
          messageSid: result.messageSid,
          status: result.status
        });
      } else {
        console.error('[NotificationService] ❌ WhatsApp send failed:', {
          phoneNumber: formattedPhone,
          error: result.error
        });
      }

      return {
        success: result.success,
        messageSid: result.messageSid,
        status: result.status,
        message: result.mock 
          ? 'WhatsApp message sent successfully (test mode)' 
          : result.success 
            ? 'WhatsApp message sent successfully' 
            : 'Failed to send WhatsApp message',
        error: result.error || null,
        formattedPhone: formattedPhone
      };
    } catch (error) {
      console.error('[NotificationService] Exception sending WhatsApp:', {
        phoneNumber,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send appointment confirmation notification via WhatsApp (FRENCH)
   * @param {Object} appointment - Appointment object with populated fields
   */
  async sendAppointmentConfirmation(appointment) {
    try {
      // Validate appointment has required fields
      if (!appointment || !appointment.clientId || !appointment.workerId || !appointment.salonId) {
        console.error('[NotificationService] sendAppointmentConfirmation: Appointment missing required fields');
        return;
      }

      const clientPhone = appointment.clientId.phone;
      const workerPhone = appointment.workerId.phone;
      const salonName = appointment.salonId.name || appointment.salonId;
      const clientName = appointment.clientId.name;
      const workerName = appointment.workerId.name;
      
      // Get all services
      const services = this._getServicesFromAppointment(appointment);
      const servicesList = services.length > 0 ? services.join(', ') : 'Service';
      
      // Format date and time in French
      const dateTimeStr = this._formatDateFrench(appointment.dateTime);
      
      // Check for multi-person booking
      const isMultiPerson = await this._isMultiPersonBooking(appointment);
      const multiPersonInfo = isMultiPerson ? await this._getMultiPersonBookingInfo(appointment) : null;

      // Validate phone numbers exist
      if (!clientPhone) {
        console.error('[NotificationService] Client phone number missing for appointment:', appointment._id);
      }
      if (!workerPhone) {
        console.error('[NotificationService] Worker phone number missing for appointment:', appointment._id);
      }

      // Send WhatsApp to client (FRENCH)
      if (clientPhone) {
        let clientMessage = `Bonjour ${clientName},\n\n`;
        clientMessage += `Votre rendez-vous à ${salonName} a été réservé !\n\n`;
        clientMessage += `📍 Salon: ${salonName}\n`;
        clientMessage += `💇 Service${services.length > 1 ? 's' : ''}: ${servicesList}\n`;
        
        if (multiPersonInfo) {
          clientMessage += `👥 Nombre de personnes: ${multiPersonInfo.totalPeople}\n`;
          clientMessage += `📋 Tous les services: ${multiPersonInfo.allServices.join(', ')}\n`;
        }
        
        clientMessage += `👤 Prestataire: ${workerName}\n`;
        clientMessage += `📅 Date et heure: ${dateTimeStr}\n\n`;
        clientMessage += `À bientôt !`;
        
        const clientResult = await this.sendWhatsApp(
          appointment.clientId._id || appointment.clientId,
          clientPhone,
          clientMessage,
          {
            appointmentId: appointment._id,
            salonId: appointment.salonId._id || appointment.salonId
          }
        );
        
        if (!clientResult.success) {
          console.error('[NotificationService] Failed to send WhatsApp to client:', clientResult.error);
        }
      } else {
        console.warn('[NotificationService] Skipping client WhatsApp - no phone number');
      }

      // Send WhatsApp to worker (FRENCH)
      if (workerPhone) {
        let workerMessage = `Nouveau rendez-vous programmé !\n\n`;
        workerMessage += `👤 Client: ${clientName}\n`;
        workerMessage += `💇 Service${services.length > 1 ? 's' : ''}: ${servicesList}\n`;
        
        if (multiPersonInfo) {
          workerMessage += `👥 Nombre de personnes: ${multiPersonInfo.totalPeople}\n`;
          workerMessage += `📋 Tous les services: ${multiPersonInfo.allServices.join(', ')}\n`;
        }
        
        workerMessage += `📅 Date et heure: ${dateTimeStr}`;
        
        const workerResult = await this.sendWhatsApp(
          appointment.workerId._id || appointment.workerId,
          workerPhone,
          workerMessage,
          {
            appointmentId: appointment._id,
            salonId: appointment.salonId._id || appointment.salonId
          }
        );
        
        if (!workerResult.success) {
          console.error('[NotificationService] Failed to send WhatsApp to worker:', workerResult.error);
        }
      } else {
        console.warn('[NotificationService] Skipping worker WhatsApp - no phone number');
      }
    } catch (error) {
      console.error('[NotificationService] Exception in sendAppointmentConfirmation:', error);
      // Don't throw - allow appointment creation to succeed even if notifications fail
    }
  }

  /**
   * Send appointment status update notification via WhatsApp (FRENCH)
   * @param {Object} appointment - Appointment object with populated fields
   */
  async sendAppointmentStatusUpdate(appointment) {
    try {
      // Validate appointment has required fields
      if (!appointment || !appointment.clientId || !appointment.salonId) {
        console.error('[NotificationService] sendAppointmentStatusUpdate: Appointment missing required fields');
        return;
      }

      const clientPhone = appointment.clientId.phone;
      const salonName = appointment.salonId.name || appointment.salonId;
      const clientName = appointment.clientId.name;
      
      // Get all services
      const services = this._getServicesFromAppointment(appointment);
      const servicesList = services.length > 0 ? services.join(', ') : 'Service';
      
      // Format date and time in French
      const dateTimeStr = this._formatDateFrench(appointment.dateTime);
      const dateOnlyStr = this._formatDateOnlyFrench(appointment.dateTime);
      const timeOnlyStr = this._formatTimeOnlyFrench(appointment.dateTime);

      // Validate phone number exists
      if (!clientPhone) {
        console.error('[NotificationService] Client phone number missing for status update:', appointment._id);
        return;
      }

      let message = '';
      
      switch (appointment.status) {
        case 'Confirmed':
        case 'confirmed':
          message = `Bonjour ${clientName},\n\n`;
          message += `Votre rendez-vous à ${salonName} a été confirmé !\n\n`;
          message += `📍 Salon: ${salonName}\n`;
          message += `💇 Service${services.length > 1 ? 's' : ''}: ${servicesList}\n`;
          message += `📅 Date: ${dateOnlyStr}\n`;
          message += `⏰ Heure: ${timeOnlyStr}\n\n`;
          message += `Nous avons hâte de vous accueillir !`;
          break;
        case 'Cancelled':
        case 'cancelled':
          message = `Bonjour ${clientName},\n\n`;
          message += `Votre rendez-vous à ${salonName} a été annulé.\n\n`;
          message += `📍 Salon: ${salonName}\n`;
          message += `💇 Service${services.length > 1 ? 's' : ''}: ${servicesList}\n`;
          message += `📅 Date: ${dateOnlyStr}\n`;
          message += `⏰ Heure: ${timeOnlyStr}\n\n`;
          message += `N'hésitez pas à prendre un nouveau rendez-vous.`;
          break;
        case 'Completed':
        case 'completed':
          message = `Bonjour ${clientName},\n\n`;
          message += `Merci d'avoir visité ${salonName} !\n\n`;
          message += `Nous espérons que vous avez apprécié ${services.length > 1 ? 'vos services' : 'votre service'} ${servicesList}.\n\n`;
          message += `À bientôt !`;
          break;
        default:
          message = `Bonjour ${clientName},\n\n`;
          message += `Le statut de votre rendez-vous a été mis à jour: ${appointment.status}`;
      }

      const result = await this.sendWhatsApp(
        appointment.clientId._id || appointment.clientId,
        clientPhone,
        message,
        {
          appointmentId: appointment._id,
          salonId: appointment.salonId._id || appointment.salonId
        }
      );

      if (!result.success) {
        console.error('[NotificationService] Failed to send WhatsApp status update:', result.error);
      }
    } catch (error) {
      console.error('[NotificationService] Exception in sendAppointmentStatusUpdate:', error);
      // Don't throw - allow appointment status update to succeed even if notification fails
    }
  }

  /**
   * Send appointment reminder 1 hour before (FRENCH)
   * @param {Object} appointment - Appointment object with populated fields
   */
  async sendAppointmentReminder(appointment) {
    try {
      // Validate appointment has required fields
      if (!appointment || !appointment.clientId || !appointment.salonId) {
        console.error('[NotificationService] sendAppointmentReminder: Appointment missing required fields');
        return { success: false, error: 'Appointment missing required fields' };
      }

      const clientPhone = appointment.clientId.phone;
      const salonName = appointment.salonId.name || appointment.salonId;
      const clientName = appointment.clientId.name;
      const workerName = appointment.workerId?.name || 'votre prestataire';
      
      // Get all services
      const services = this._getServicesFromAppointment(appointment);
      const servicesList = services.length > 0 ? services.join(', ') : 'Service';
      
      // Format date and time in French
      const dateOnlyStr = this._formatDateOnlyFrench(appointment.dateTime);
      const timeOnlyStr = this._formatTimeOnlyFrench(appointment.dateTime);

      // Validate phone number exists
      if (!clientPhone) {
        console.error('[NotificationService] Client phone number missing for reminder:', appointment._id);
        return { success: false, error: 'Client phone number missing' };
      }

      let message = `🔔 Rappel: Vous avez un rendez-vous dans 1 heure !\n\n`;
      message += `Bonjour ${clientName},\n\n`;
      message += `📍 Salon: ${salonName}\n`;
      message += `💇 Service${services.length > 1 ? 's' : ''}: ${servicesList}\n`;
      message += `👤 Prestataire: ${workerName}\n`;
      message += `📅 Date: ${dateOnlyStr}\n`;
      message += `⏰ Heure: ${timeOnlyStr}\n\n`;
      message += `À tout à l'heure !`;

      const result = await this.sendWhatsApp(
        appointment.clientId._id || appointment.clientId,
        clientPhone,
        message,
        {
          appointmentId: appointment._id,
          salonId: appointment.salonId._id || appointment.salonId,
          additionalInfo: { type: 'reminder' }
        }
      );

      if (!result.success) {
        console.error('[NotificationService] Failed to send WhatsApp reminder:', result.error);
      }

      return result;
    } catch (error) {
      console.error('[NotificationService] Exception in sendAppointmentReminder:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();

