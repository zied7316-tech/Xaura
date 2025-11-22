export const formatCurrency = (amount, currency = 'TND') => {
  // Convert to number if it's not already
  let numAmount = amount;
  if (typeof amount === 'object' && amount !== null) {
    // If it's an object with month/year, use month as default
    numAmount = amount.month || amount.year || 0;
  }
  // Ensure it's a number
  numAmount = Number(numAmount) || 0;
  
  if (currency === 'TND') {
    // Tunisian Dinar - 3 decimal places with Arabic symbol
    const formatted = numAmount.toFixed(3);
    return `${formatted} د.ت`; // Arabic TND symbol
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(numAmount)
}

export const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDuration = (minutes) => {
  if (!minutes) return 'N/A'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

export const getDayOfWeek = (date) => {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
}

export const isToday = (date) => {
  const today = new Date()
  const checkDate = new Date(date)
  return today.toDateString() === checkDate.toDateString()
}

export const isPast = (date) => {
  return new Date(date) < new Date()
}

export const isFuture = (date) => {
  return new Date(date) > new Date()
}

export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const formatPhoneNumber = (phone) => {
  if (!phone) return 'N/A'
  // Format: (123) 456-7890
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    'in progress': 'bg-purple-100 text-purple-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    vip: 'bg-yellow-100 text-yellow-800',
    available: 'bg-green-100 text-green-800',
    on_break: 'bg-orange-100 text-orange-800',
    offline: 'bg-red-100 text-red-800'
  }
  return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
}
