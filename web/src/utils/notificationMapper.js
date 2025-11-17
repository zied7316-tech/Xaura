/**
 * Maps backend notification format to AnimatedNotification format
 */
export const mapNotificationToAnimated = (notification, user) => {
  // Map backend priority to animated notification priority
  const backendPriority = notification.priority || 'normal';
  let priority = 'medium';
  if (backendPriority === 'urgent' || backendPriority === 'high') {
    priority = 'high';
  } else if (backendPriority === 'low') {
    priority = 'low';
  }

  // Determine type based on notification type
  let type = 'info';
  if (notification.type === 'appointment_confirmed' || notification.type === 'new_appointment') {
    type = 'success';
  } else if (notification.type === 'appointment_cancelled') {
    type = 'error';
  } else if (notification.type === 'payment_received') {
    type = 'success';
  } else if (notification.type === 'low_stock' || notification.type === 'system') {
    type = 'warning';
  }

  // Get user info from notification
  const relatedUser = notification.relatedUser || {};
  const userName = relatedUser?.name || user?.name || 'System';
  const userAvatar = relatedUser?.avatar || relatedUser?.profilePicture;
  const userInitials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Format message - use title as name, message as content
  const message = notification.message || notification.title || 'New notification';
  const displayName = notification.title || userName;
  
  // Format timestamp
  const timestamp = notification.createdAt 
    ? new Date(notification.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

  return {
    id: notification._id || notification.id || `notif-${Date.now()}`,
    user: {
      name: displayName,
      avatarUrl: userAvatar,
      initials: userInitials,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`
    },
    message: message,
    timestamp: timestamp,
    priority: priority,
    type: type,
    fadingOut: false
  };
};

