
// Section: Footer background cleanup
(function () {
  var footerSelector = '#vue-app > div.footer.container-max.d-print-none';

  function resetFooterBackground() {
    var footer = document.querySelector(footerSelector) || document.querySelector('#vue-app .footer.container-max.d-print-none');

    if (!footer) return false;

    footer.style.setProperty('background', 'transparent', 'important');
    footer.style.setProperty('background-color', 'transparent', 'important');
    footer.style.setProperty('box-shadow', 'none', 'important');
    footer.style.removeProperty('background-image');

    return true;
  }

  function onReady() {
    if (resetFooterBackground()) return;

    var observer = new MutationObserver(function () {
      if (resetFooterBackground()) observer.disconnect();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
