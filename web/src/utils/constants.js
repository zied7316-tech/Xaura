export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const USER_ROLES = {
  OWNER: 'Owner',
  WORKER: 'Worker',
  CLIENT: 'Client',
}

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const SERVICE_CATEGORIES = [
  'Haircut',
  'Coloring',
  'Styling',
  'Manicure',
  'Pedicure',
  'Facial',
  'Massage',
  'Waxing',
  'Therapy',
  'Body Treatment',
  'Aromatherapy',
  'Hot Stone',
  'Deep Tissue',
  'Swedish Massage',
  'Other',
]

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const NOTIFICATION_TYPES = {
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
}

