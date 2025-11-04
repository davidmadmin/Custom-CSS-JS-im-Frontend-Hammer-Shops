// FH Core Utilities

// Section: Global scripts for all pages

function fhOnReady(callback) {
  if (typeof callback !== 'function') return;

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', callback); return; }

  callback();
}
