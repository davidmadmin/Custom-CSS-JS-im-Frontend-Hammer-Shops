// Section: Versand Icons ändern & einfügen (läuft auf ALLEN Seiten inkl. Checkout)
shOnReady(function () {
  const shippingIconRules = [
    {
      match: function (labelText) {
        return labelText.includes('dhl');
      },
      src: 'https://bilder.schrauben-hammer.de/frontend/DHLVersand_Icon_D1.png'
    },
    {
      match: function (labelText) {
        return labelText.includes('general overnight express') || labelText.includes('go express');
      },
      src: 'https://bilder.schrauben-hammer.de/frontend/GO_Express_Versand_Icon_D1.1.png'
    },
    {
      match: function (labelText) {
        return labelText.includes('selbstabholung');
      },
      src: 'https://bilder.schrauben-hammer.de/frontend/Selbstabholung_Lager_Versand_Icon_D1.1.png'
    }
  ];

  function normalizeShippingLabel(text) {
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function applyShippingIcons(root = document) {
    const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
    const labels = scope.querySelectorAll ? scope.querySelectorAll('.shipping-method-select label.provider-select-label') : [];

    Array.prototype.forEach.call(labels, function (label) {
      const content = label.querySelector('.content');
      const labelText = normalizeShippingLabel((content && content.textContent) || label.textContent);

      if (!labelText) return;

      const matchedRule = shippingIconRules.find(function (rule) {
        return rule.match(labelText);
      });

      if (!matchedRule) return;

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
        img.src = matchedRule.src;
        img.alt = 'Versandart Icon';
        img.className = 'shipping-icon';

        iconContainer.appendChild(img);
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
    if (!container || container.__shShippingIconObserver) return;

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

    container.__shShippingIconObserver = observer;

    registerCleanup(function () {
      observer.disconnect();
      delete container.__shShippingIconObserver;
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

// Section: Gratisversand Fortschritt Balken
shOnReady(function () {
  const THRESHOLD = 150;

  const COUNTRY_SELECT_ID_FRAGMENTS = [
    'shipping-country-select',
    'invoice-country-select',
    'country-id-select'
  ];

  function findCountrySelects(fragment, root = document) {
    return Array.from(root.querySelectorAll(`select[id*="${fragment}"]`));
  }

  function isGermanySelected() {
    return COUNTRY_SELECT_ID_FRAGMENTS.some((fragment) =>
      findCountrySelects(fragment).some((select) => select.value === '1')
    );
  }

  function isGermanySelectedInCartPreview() {
    const bar = document.getElementById('free-shipping-bar');
    if (!bar) return true;
    const previewRoot = bar.closest('.basket-preview');
    if (!previewRoot) return true;
    const selects = findCountrySelects('shipping-country-select', previewRoot);
    if (!selects.length) return true;
    return selects.some((select) => select.value === '1');
  }

  function isCheckoutPage() {
    const path = window.location.pathname;
    return (
      path.includes('/checkout') ||
      path.includes('/kaufabwicklung') ||
      path.includes('/kasse')
    );
  }

  function getPrimaryColor() {
    const styles = getComputedStyle(document.documentElement);
    return (
      styles.getPropertyValue('--sh-color-primary-red') ||
      styles.getPropertyValue('--sh-color-secondary-red') ||
      styles.getPropertyValue('--primary') ||
      styles.getPropertyValue('--color-primary') ||
      styles.getPropertyValue('--bs-primary') ||
      'var(--sh-color-primary-red)'
    ).trim();
  }

  const primaryColor = getPrimaryColor();

  function parseEuro(el) {
    if (!el) return 0;
    return parseFloat(
      el.textContent.replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.')
    ) || 0;
  }

  function formatEuro(val) {
    return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0€';
  }

  function createBar(id) {
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = 'free-shipping-bar';

    const text = document.createElement('div');
    text.className = 'free-shipping-bar__text';
    text.setAttribute('role', 'status');
    text.setAttribute('aria-live', 'polite');
    wrapper.appendChild(text);

    const progress = document.createElement('div');
    progress.className = 'free-shipping-bar__progress';
    wrapper.appendChild(progress);

    const bar = document.createElement('div');
    bar.className = 'free-shipping-bar__progress-fill';
    bar.style.background = primaryColor;
    progress.appendChild(bar);

    const shine = document.createElement('div');
    shine.className = 'free-shipping-bar__shine';
    bar.appendChild(shine);

    return { wrapper, bar, text, shine };
  }

  function ensureTextContent(container) {
    let content = container.querySelector('.free-shipping-bar__text-content');
    if (!content) {
      content = document.createElement('span');
      content.className = 'free-shipping-bar__text-content';
      container.appendChild(content);
    }

    let label = content.querySelector('.free-shipping-bar__label');
    if (!label) {
      label = document.createElement('span');
      label.className = 'free-shipping-bar__label';
      content.appendChild(label);
    }

    return { content, label };
  }

  function setText(container, message) {
    const { content, label } = ensureTextContent(container);
    if (label.textContent !== message) label.textContent = message;
  }

  function update(bar, text, shine, state) {
    const total = parseEuro(document.querySelector('dd[data-testing="item-sum"]'));
    const ratio = THRESHOLD === 0 ? 1 : total / THRESHOLD;
    const reached = total >= THRESHOLD;
    const widthRatio = reached ? 1 : Math.max(Math.min(ratio, 1), 0.02);

    bar.style.width = (widthRatio * 100).toFixed(2) + '%';

    const wrapper = bar.closest('.free-shipping-bar');
    if (wrapper) wrapper.classList.toggle('free-shipping-bar--reached', reached);

    if (shine) {
      if (reached) shine.classList.add('free-shipping-bar__shine--paused');
      else shine.classList.remove('free-shipping-bar__shine--paused');
    }

    const message = reached
      ? 'Gratisversand erreicht!'
      : `Noch ${formatEuro(Math.max(THRESHOLD - total, 0))} bis zum Gratisversand`;

    if (state.reached !== reached || state.message !== message) {
      setText(text, message);
    }

    state.message = message;
    state.reached = reached;
  }

  function toggleFreeShippingBar() {
    const bar = document.getElementById('free-shipping-bar');
    const pickup = document.getElementById('ShippingProfileID710');
    if (!bar) return;
    const path = window.location.pathname;
    const total = parseEuro(document.querySelector('dd[data-testing="item-sum"]'));
    const inCartPreview = Boolean(bar.closest('.basket-preview'));
    const shouldHideOnPage =
      path.includes('/kundenkonto') || path.includes('/bestellbestaetigung');
    const hide =
      (pickup && pickup.checked) ||
      (isCheckoutPage() && !isGermanySelected()) ||
      (inCartPreview && !isGermanySelectedInCartPreview()) ||
      shouldHideOnPage;
    bar.style.display = hide ? 'none' : '';
  }

  const observer = new MutationObserver(() => {
    const totals = document.querySelector('.cmp-totals');
    if (totals && !document.getElementById('free-shipping-bar')) {
      const { wrapper, bar, text, shine } = createBar('free-shipping-bar');
      totals.parentNode.insertBefore(wrapper, totals);
      const state = { message: '', reached: false };
      update(bar, text, shine, state);
      setInterval(() => update(bar, text, shine, state), 1000);
    }
    toggleFreeShippingBar();
  });
  observer.observe(document.body, { childList: true, subtree: true });

    const countrySelectors = COUNTRY_SELECT_ID_FRAGMENTS.map(
      (frag) => `select[id*="${frag}"]`
    ).join(', ');

    document.body.addEventListener('change', function (e) {
      if (
        e.target.matches('input[type="radio"][id^="ShippingProfileID"]') ||
        e.target.matches(countrySelectors)
      ) {
        toggleFreeShippingBar();
      }
    });
  });
// End Section: Gratisversand Fortschritt Balken
