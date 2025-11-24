// Auto-unregister all service workers on app load
// This ensures no service worker will ever run again
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister());
  });
}

