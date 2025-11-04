// FH Shipping Icons Enhancer

// Section: Versand Icons ändern & einfügen (läuft auf ALLEN Seiten inkl. Checkout)
fhOnReady(function () {
  const shippingIcons = {
    'ShippingProfileID731': 'https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/DHLVersand_Icon_D1.png',
    'ShippingProfileID745': 'https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/GO_Express_Versand_Icon_D1.1.png',
    'ShippingProfileID710': 'https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/Selbstabholung_Lager_Versand_Icon_D1.1.png'
  };

  function applyShippingIcons(root = document) {
    const scope = root && typeof root.querySelectorAll === 'function' ? root : document;

    Object.keys(shippingIcons).forEach(function (profileId) {
      const selector = `label[for="${profileId}"]`;
      const labels = scope.querySelectorAll ? scope.querySelectorAll(selector) : [];

      Array.prototype.forEach.call(labels, function (label) {
        const iconContainers = label.querySelectorAll('.icon');

        Array.prototype.forEach.call(iconContainers, function (iconContainer) {
          const existingIcons = iconContainer.querySelectorAll('.shipping-icon');

          Array.prototype.forEach.call(existingIcons, function (existingIcon) {
            if (existingIcon && existingIcon.parentNode) existingIcon.parentNode.removeChild(existingIcon);
          });

          const defaultIcons = iconContainer.querySelectorAll('img:not(.shipping-icon)');

          Array.prototype.forEach.call(defaultIcons, function (defaultIcon) {
            if (!defaultIcon) return;

            defaultIcon.classList.add('shipping-icon-hidden');
            defaultIcon.setAttribute('aria-hidden', 'true');
            defaultIcon.style.display = 'none';
          });

          const img = document.createElement('img');
          img.src = shippingIcons[profileId];
          img.alt = 'Versandart Icon';
          img.className = 'shipping-icon';

          iconContainer.appendChild(img);
        });
      });
    });
  }

  window.applyShippingIcons = applyShippingIcons;

  const shippingIconObserverCleanups = [];

  function registerCleanup(callback) {
    if (typeof callback === 'function') shippingIconObserverCleanups.push(callback);
  }

  function disconnectShippingIconObservers() {
    while (shippingIconObserverCleanups.length) {
      const cleanup = shippingIconObserverCleanups.pop();

      try {
        cleanup();
      } catch (error) {
        /* Ignore cleanup errors during teardown. */
      }
    }
  }

  function initShippingMethodObserver(container) {
    if (!container || container.__fhShippingIconObserver) return;

    const observerConfig = { childList: true, subtree: true };

    const observer = new MutationObserver(function () {
      observer.disconnect();

      try {
        applyShippingIcons(container);
      } finally {
        observer.observe(container, observerConfig);
      }
    });

    applyShippingIcons(container);
    observer.observe(container, observerConfig);

    container.__fhShippingIconObserver = observer;

    registerCleanup(function () {
      observer.disconnect();
      delete container.__fhShippingIconObserver;
    });
  }

  function bootstrapShippingMethodObservers(root = document) {
    const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
    const containers = scope.querySelectorAll ? scope.querySelectorAll('.shipping-method-select') : [];

    Array.prototype.forEach.call(containers, function (container) {
      initShippingMethodObserver(container);
    });
  }

  applyShippingIcons();
  bootstrapShippingMethodObservers();

  if (document.body) {
    const bodyObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes, function (node) {
          if (!node || (node.nodeType !== 1 && node.nodeType !== 11)) return;

          if (node.nodeType === 1 && node.matches && node.matches('.shipping-method-select')) {
            initShippingMethodObserver(node);
          }

          if (node.querySelectorAll) {
            bootstrapShippingMethodObservers(node);
            applyShippingIcons(node);
          }
        });
      });
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true });

    registerCleanup(function () {
      bodyObserver.disconnect();
    });
  }

  window.addEventListener('beforeunload', disconnectShippingIconObservers);
});
// End Section: Versand Icons ändern & einfügen
