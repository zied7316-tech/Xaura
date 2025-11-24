/**
 * Force cleanup of all service workers
 * This ensures old cached service workers are unregistered for all clients
 */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      console.log('🗑️ Unregistering service worker:', reg.scope);
      reg.unregister().then((success) => {
        if (success) {
          console.log('✅ Service worker unregistered successfully');
        } else {
          console.warn('⚠️ Service worker unregistration failed');
        }
      }).catch((error) => {
        console.error('❌ Error unregistering service worker:', error);
      });
    });
  }).catch((error) => {
    console.error('❌ Error getting service worker registrations:', error);
  });
  
  // Also clear all caches
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ All caches cleared');
    }).catch((error) => {
      console.error('❌ Error clearing caches:', error);
    });
  }
}

