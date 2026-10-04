// Vercel Web Analytics - Injected via @vercel/analytics
// This script initializes Vercel Web Analytics for the site
(function() {
  // Initialize the queue for analytics events
  if (window.va) return;
  
  window.va = function() {
    if (!window.vaq) window.vaq = [];
    window.vaq.push(arguments);
  };
  
  // Detect if we're in development mode
  const isDev = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.includes('local');
  
  // Only inject in production
  if (!isDev) {
    // The actual analytics script will be loaded by Vercel
    var script = document.createElement('script');
    script.defer = true;
    script.src = '/_vercel/insights/script.js';
    document.head.appendChild(script);
  }
})();
