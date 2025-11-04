// FH Authentication Helpers

// Section: Ensure auth modals load their Vue components before opening
fhOnReady(function () {
  function getVueStore() {
    if (window.vueApp && window.vueApp.$store) return window.vueApp.$store;

    if (window.ceresStore && typeof window.ceresStore.dispatch === 'function') return window.ceresStore;

    return null;
  }

  function loadLazyComponent(componentName) {
    const store = getVueStore();

    if (!store || typeof store.dispatch !== 'function') return;

    store.dispatch('loadComponent', componentName);
  }

  function registerTrigger(selector, componentName) {
    document.querySelectorAll(selector).forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        loadLazyComponent(componentName);
      });
    });
  }

  registerTrigger('[data-fh-login-trigger]', 'login-modal');
  registerTrigger('[data-fh-registration-trigger]', 'register-modal');
});
// End Section: Ensure auth modals load their Vue components before opening
