import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const Avatar = ({ user, showAvatar }) => {
  if (!showAvatar) return null;

  return (
    <div
      className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-600/20 to-primary-700/40 flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm"
      style={{ backgroundColor: user.color }}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={`${user.name} avatar`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-xs font-bold text-white drop-shadow-sm">
          {user.initials || user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
};

const Notification = ({
  notification,
  showAvatars,
  showTimestamps,
  variant,
  onDismiss,
  onClick,
  allowDismiss
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return "bg-white/95 border border-gray-200/50 backdrop-blur-xl";
      case 'glass':
        return "bg-white/30 backdrop-blur-2xl border border-white/20 shadow-2xl";
      case 'bordered':
        return "bg-white/95 border-2 border-primary-600/30 backdrop-blur-lg shadow-xl";
      default:
        return "bg-white/30 backdrop-blur-2xl border border-white/20 shadow-2xl";
    }
  };

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'high':
        return 'border-l-4 border-l-red-500 shadow-red-500/20';
      case 'medium':
        return 'border-l-4 border-l-yellow-500 shadow-yellow-500/20';
      case 'low':
        return 'border-l-4 border-l-blue-500 shadow-blue-500/20';
      default:
        return 'border-l-4 border-l-primary-600/50 shadow-primary-600/20';
    }
  };

  return (
    <div
      className={cn(
        "group relative transition-all duration-500 ease-out transform hover:scale-[1.02] hover:-translate-y-1",
        "rounded-xl p-4 flex items-start gap-3 w-80 max-w-80 cursor-pointer",
        getVariantStyles(),
        getPriorityStyles(),
        notification.fadingOut && "animate-pulse"
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
      
      <Avatar user={notification.user} showAvatar={showAvatars} />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-900/90 truncate">
            {notification.user.name}
          </h3>
          {showTimestamps && notification.timestamp && (
            <span className="text-xs text-gray-500/70 font-mono">
              {notification.timestamp}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700/80 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
      </div>

      {allowDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
          className="flex-shrink-0 w-5 h-5 text-gray-500/50 hover:text-gray-700 transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const AnimatedNotification = ({
  maxNotifications = 3,
  notifications = [],
  animationDuration = 800,
  position = 'top-right',
  width = 320,
  showAvatars = true,
  showTimestamps = true,
  className,
  onNotificationClick,
  onNotificationDismiss,
  allowDismiss = true,
  autoDismissTimeout = 5000,
  variant = 'glass'
}) => {
  const [notes, setNotes] = useState([]);
  const dismissTimeouts = useRef(new Map());

  const dismissNotification = useCallback((id) => {
    setNotes(prev => {
      const noteToDismiss = prev.find(note => note.id === id);
      if (!noteToDismiss || noteToDismiss.fadingOut) {
        return prev;
      }

      const updatedNotes = prev.map(note =>
        note.id === id ? { ...note, fadingOut: true } : note
      );

      const timeout = dismissTimeouts.current.get(id);
      if (timeout) {
        clearTimeout(timeout);
        dismissTimeouts.current.delete(id);
      }

      setTimeout(() => {
        setNotes(current => current.filter(note => note.id !== id));
      }, animationDuration);

      return updatedNotes;
    });
  }, [animationDuration]);

  // Auto-dismiss notifications
  useEffect(() => {
    notes.forEach(note => {
      if (!note.fadingOut && autoDismissTimeout > 0) {
        const timeout = setTimeout(() => {
          dismissNotification(note.id);
        }, autoDismissTimeout);
        dismissTimeouts.current.set(note.id, timeout);
      }
    });

    return () => {
      dismissTimeouts.current.forEach(timeout => clearTimeout(timeout));
      dismissTimeouts.current.clear();
    };
  }, [notes, autoDismissTimeout, dismissNotification]);

  // Update notifications when prop changes
  useEffect(() => {
    if (notifications.length > 0) {
      // Only add new notifications, don't replace all
      const existingIds = new Set(notes.map(n => n.id));
      const newNotifications = notifications.filter(n => !existingIds.has(n.id));
      
      if (newNotifications.length > 0) {
        setNotes(prev => {
          let currentNotes = [...prev];
          
          // Remove oldest if we exceed max
          if (currentNotes.length + newNotifications.length > maxNotifications) {
            const toRemove = currentNotes.length + newNotifications.length - maxNotifications;
            for (let i = 0; i < toRemove; i++) {
              if (currentNotes[i] && !currentNotes[i].fadingOut) {
                dismissNotification(currentNotes[i].id);
              }
            }
          }
          
          return [...currentNotes, ...newNotifications];
        });
      }
    }
  }, [notifications, maxNotifications, dismissNotification, notes]);

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'fixed top-6 left-6 z-50';
      case 'top-right':
        return 'fixed top-6 right-6 z-50';
      case 'bottom-left':
        return 'fixed bottom-6 left-6 z-50';
      case 'bottom-right':
        return 'fixed bottom-6 right-6 z-50';
      default:
        return 'flex items-center justify-center min-h-auto p-6';
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes notification-enter {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
              filter: blur(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0px);
            }
          }
          @keyframes notification-exit {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0px);
            }
            to {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
              filter: blur(4px);
            }
          }
          .notification-enter {
            animation: notification-enter var(--animation-duration) cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          .notification-exit {
            animation: notification-exit var(--animation-duration) cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
        `
      }} />
      <div className={cn(getPositionStyles(), className)}>
        <Flipper flipKey={notes.map((note) => note.id).join("")}>
          <div className="flex flex-col gap-4 items-center" style={{ width }}>
            {notes.map((note) => (
              <Flipped key={note.id} flipId={note.id}>
                <div
                  className={cn(
                    "notification-item",
                    note.fadingOut ? "notification-exit" : "notification-enter"
                  )}
                  style={{ '--animation-duration': `${animationDuration}ms` }}
                >
                  <Notification
                    notification={note}
                    showAvatars={showAvatars}
                    showTimestamps={showTimestamps}
                    variant={variant}
                    allowDismiss={allowDismiss}
                    onClick={() => onNotificationClick?.(note)}
                    onDismiss={() => {
                      onNotificationDismiss?.(note);
                      dismissNotification(note.id);
                    }}
                  />
                </div>
              </Flipped>
            ))}
          </div>
        </Flipper>
      </div>
    </>
  );
};

export default AnimatedNotification;

