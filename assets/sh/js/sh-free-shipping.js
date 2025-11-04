// SH Free Shipping Progress Logic

// Section: Gratisversand Fortschritt Balken
  document.addEventListener('DOMContentLoaded', function () {
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
      styles.getPropertyValue('--primary') ||
      styles.getPropertyValue('--color-primary') ||
      styles.getPropertyValue('--bs-primary') ||
      '#f20000'
    ).trim();
  }

  const primaryColor = getPrimaryColor();

  function parseEuro(el) {
    if (!el) return 0;
    return (
      parseFloat(
        el.textContent.replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.')
      ) || 0
    );
  }

  function formatEuro(val) {
    return (
      val.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + '\u00a0€'
    );
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

  function createCheckIcon() {
    const check = document.createElement('span');
    check.className = 'free-shipping-bar__check';
    check.setAttribute('aria-hidden', 'true');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('role', 'presentation');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M5 13l4 4L19 7');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');

    svg.appendChild(path);
    check.appendChild(svg);

    return check;
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

  function setRegularText(container, message) {
    const { content, label } = ensureTextContent(container);
    content.classList.remove('free-shipping-bar__text-content--celebrate-enter');
    content.classList.remove('free-shipping-bar__text-content--celebrate-exit');

    const check = content.querySelector('.free-shipping-bar__check');
    if (check) check.remove();

    if (label.textContent !== message) label.textContent = message;
  }

  function celebrateText(container, message) {
    const current = container.querySelector('.free-shipping-bar__text-content');
    if (current) {
      current.classList.add('free-shipping-bar__text-content--celebrate-exit');
      current.addEventListener(
        'animationend',
        () => {
          current.remove();
        },
        { once: true }
      );
    }

    const next = document.createElement('span');
    next.className =
      'free-shipping-bar__text-content free-shipping-bar__text-content--celebrate-enter';

    const check = createCheckIcon();
    next.appendChild(check);

    const label = document.createElement('span');
    label.className = 'free-shipping-bar__label';
    label.textContent = message;
    next.appendChild(label);

    container.appendChild(next);
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

    if (reached) {
      if (!state.reached) celebrateText(text, message);
    } else if (state.reached || state.message !== message) {
      setRegularText(text, message);
    }

    state.message = message;
    state.reached = reached;
  }

  function toggleFreeShippingBar() {
    const bar = document.getElementById('free-shipping-bar');
    const pickup = document.getElementById('ShippingProfileID1310');
    if (!bar) return;
    const path = window.location.pathname;
    const total = parseEuro(document.querySelector('dd[data-testing="item-sum"]'));
    const inCartPreview = Boolean(bar.closest('.basket-preview'));
    const hide =
      (pickup && pickup.checked) ||
      (isCheckoutPage() && !isGermanySelected()) ||
      (inCartPreview && !isGermanySelectedInCartPreview()) ||
      (path.includes('/bestellbestaetigung') && total < THRESHOLD);
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

// ===============================
// RESTLICHER JS-Code (ausgeblendet auf Checkout/Kaufabwicklung/Kasse)
// ===============================

(function () {
  var path = window.location.pathname;
  // Bei folgenden Pfaden abbrechen:
  if (
    path.includes("/checkout") ||
    path.includes("/kaufabwicklung") ||
    path.includes("/kasse")
  ) {
    return;
  }

  // Section: Restlicher Code

  // Section: Animierte Suchplatzhalter Vorschläge

  document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector("input.search-input");
    if (!searchInput) return;

    const clearButton = document.querySelector("[data-search-clear]");
    const toggleClearButton = () => {
      if (!clearButton) return;
      clearButton.style.display = searchInput.value ? "flex" : "none";
    };

    if (clearButton) {
      clearButton.addEventListener("click", function (event) {
        event.preventDefault();
        searchInput.value = "";
        searchInput.focus();
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        toggleClearButton();
      });

      searchInput.addEventListener("input", toggleClearButton);
      searchInput.addEventListener("focus", toggleClearButton);
      searchInput.addEventListener("blur", toggleClearButton);

      toggleClearButton();
    }

    let inputFocused = false;

    // CSS-based device detection
    function getDeviceType() {
      return getComputedStyle(document.body, "::after").content.replace(
        /"/g,
        "",
      );
    }

    function getPrefix() {
      return getDeviceType() === "mobile" ? "Suche: " : "Häufig gesucht: ";
    }

    let prefix = getPrefix();

    const allWords = [
      '"Bolzenanker"',
      '"Terrassenschrauben"',
      '"Holzschutzband"',
      '"Solar Befestigung"',
      '"Edelstahl Ketten"',
      '"Schrauben mit ETA"',
      '"Winkel"',
      '"Edelstahl Bits"',
      '"Terrassenschrauben"',
      '"Holzschutzband"',
      '"Fassadenschrauben"',
      '"Nägel"',
      '"Universalbohrer"',
      '"Wera Werkzeug"',
      '"Tellerkopfschrauben"',
      '"Justierschraube"',
    ];

    // Track the current word index in the full word list
    let currentWord = 0;
    let currentChar = 0;
    let isDeleting = false;
    let typingTimer;
    let animationActive = false;
    let inactivityTimer;

    function isInViewport(el) {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight)
      );
    }

    function type() {
      if (!animationActive || !isInViewport(searchInput) || inputFocused)
        return;

      const fullWord = allWords[currentWord];
      const currentText = fullWord.substring(0, currentChar);
      searchInput.placeholder = prefix + currentText;

      if (!isDeleting && currentChar < fullWord.length) {
        currentChar++;
        if (animationActive) typingTimer = setTimeout(type, 100);
      } else if (!isDeleting && currentChar === fullWord.length) {
        isDeleting = true;
        if (animationActive) typingTimer = setTimeout(type, 2000);
      } else if (isDeleting && currentChar > 0) {
        currentChar--;
        if (animationActive) typingTimer = setTimeout(type, 50);
      } else {
        isDeleting = false;
        currentWord = (currentWord + 1) % allWords.length;
        currentChar = 0;
        prefix = getPrefix();
        if (animationActive) typingTimer = setTimeout(type, 500);
      }
    }

    function startTyping() {
      if (!animationActive && !inputFocused && !searchInput.value) {
        prefix = getPrefix();
        currentChar = 0;
        animationActive = true;
        type();
      }
    }

    function stopTyping() {
      animationActive = false;
      clearTimeout(typingTimer);
    }

    function resetInactivityTimer() {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (!inputFocused && !searchInput.value) {
          startTyping();
        }
      }, 10000);
    }

    // --- Fokus- und Input-Logik ---
    function showPlaceholder() {
      stopTyping();
      clearTimeout(inactivityTimer);
      searchInput.placeholder = "Wonach suchen Sie?";
    }

    function handleFocus() {
      inputFocused = true;
      showPlaceholder();
      // Keine Animation starten während Fokus!
    }

    searchInput.addEventListener("focus", handleFocus);
    searchInput.addEventListener("click", function () {
      if (!searchInput.value) handleFocus();
    });

    searchInput.addEventListener("input", function () {
      stopTyping();
      clearTimeout(inactivityTimer);
      if (!searchInput.value) {
        searchInput.placeholder = "Wonach suchen Sie?";
      } else {
        searchInput.placeholder = "";
      }
      // Keine Animation starten während Fokus!
    });

    searchInput.addEventListener("blur", function () {
      inputFocused = false;
      if (!searchInput.value) {
        // Wenn nichts eingegeben ist, den Standardplatzhalter anzeigen
        searchInput.placeholder = "Wonach suchen Sie?";
      }
      resetInactivityTimer(); // Erst nach Verlassen ggf. Animation nach 10s
    });

    window.addEventListener("scroll", function () {
      if (!isInViewport(searchInput)) {
        stopTyping();
      } else if (!animationActive && !inputFocused) {
        startTyping();
      }
    });

    // Beim Start direkt Animation starten
    startTyping();
  });

  // End Section: Animierte Suchplatzhalter Vorschläge

  // Section: Trusted Shops Badge toggle during search overlay
  (function () {
    var BODY_CLASS = 'sh-search-overlay-open';
    var OVERLAY_SELECTORS = ['[data-dfd-screen="mobile-initial"]', '[data-dfd-screen="embedded"]'];

    function isElementVisible(element) {
      if (!(element instanceof HTMLElement)) return false;

      var style = window.getComputedStyle(element);

      if (!style) return false;

      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

      return true;
    }

    function updateOverlayState() {
      var overlayIsActive = OVERLAY_SELECTORS.some(function (selector) {
        var element = document.querySelector(selector);

        if (!element) return false;

        return isElementVisible(element);
      });

      if (!overlayIsActive) {
        overlayIsActive = Boolean(document.querySelector('.dfd-results-grid'));
      }

      if (!document.body) return;

      document.body.classList.toggle(BODY_CLASS, overlayIsActive);
    }

    function setupObserver() {
      var observerTarget = document.body || document.documentElement;

      if (!observerTarget) return;

      var observer = new MutationObserver(function () {
        updateOverlayState();
      });

      observer.observe(observerTarget, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'data-dfd-screen'],
      });

      updateOverlayState();

      window.addEventListener('beforeunload', function () {
        observer.disconnect();
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupObserver);
    } else {
      setupObserver();
    }
  })();
  // End Section: Trusted Shops Badge toggle during search overlay

  // Section: Restrict focus to the basket preview while it is open
  function installBasketPreviewFocusLock() {
    var body = document.body;

    if (!body) return;

    var focusableSelector = [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]'
    ].join(',');

    function isInsideBasket(element) {
      return Boolean(element.closest('.fh-basket-preview') || element.closest('.sh-basket-preview') || element.closest('.basket-preview'));
    }

    function restoreElement(element) {
      if (!element || !element.hasAttribute('data-sh-basket-tab-restore')) return;

      var previous = element.getAttribute('data-sh-basket-tab-restore');
      element.removeAttribute('data-sh-basket-tab-restore');

      if (previous) element.setAttribute('tabindex', previous); else element.removeAttribute('tabindex');
    }

    var lastKnownState = null;

    function updateFocusState() {
      var basketOpen = body.classList.contains('basket-open');

      if (basketOpen === lastKnownState) return;
      lastKnownState = basketOpen;

      var elements = document.querySelectorAll(focusableSelector);

      for (var index = 0; index < elements.length; index += 1) {
        var element = elements[index];

        if (!element) continue;

        if (basketOpen && !isInsideBasket(element)) {
          if (!element.hasAttribute('data-sh-basket-tab-restore')) {
            var existing = element.getAttribute('tabindex');
            element.setAttribute('data-sh-basket-tab-restore', existing === null ? '' : existing);
          }

          element.setAttribute('tabindex', '-1');
        } else if (!basketOpen && element.hasAttribute('data-sh-basket-tab-restore')) {
          restoreElement(element);
        }
      }
    }

    var observer = new MutationObserver(function (mutations) {
      for (var index = 0; index < mutations.length; index += 1) {
        if (mutations[index].type === 'attributes') {
          updateFocusState();
          break;
        }
      }
    });

    observer.observe(body, { attributes: true, attributeFilter: ['class'] });

    updateFocusState();

    window.addEventListener('beforeunload', function () {
      observer.disconnect();
      lastKnownState = null;

      var storedElements = document.querySelectorAll('[data-sh-basket-tab-restore]');

      for (var index = 0; index < storedElements.length; index += 1) {
        restoreElement(storedElements[index]);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installBasketPreviewFocusLock);
  } else {
    installBasketPreviewFocusLock();
  }
  // End Section: Restrict focus to the basket preview while it is open

  // Section: SH wish list button enhancer
  shOnReady(function () {
    var wishlistHeartSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9a2 2 0 0 1 2 2v16l-6.5-3.5L4 21V5a2 2 0 0 1 2-2z"></path></svg>';
    var addTooltipText = 'Zur Merkliste hinzufügen';
    var removeTooltipText = 'Von der Merkliste entfernen';
    var attributeNames = ['title', 'data-original-title', 'aria-label', 'data-title-add', 'data-title-remove'];
    var stateAttributeNames = ['aria-pressed', 'class', 'data-mode', 'data-added', 'data-in-wish-list'];
    var observerAttributeNames = attributeNames.concat(stateAttributeNames);

    function normalizeTooltipValue(value) {
      if (!value) return value;

      var normalized = value.replace(/wunschliste/gi, 'Merkliste');

      if (/entfern/i.test(normalized)) return removeTooltipText;

      if (/hinzuf[üu]g/i.test(normalized)) return addTooltipText;

      return normalized;
    }

    function ensureWishlistMarkup(button) {
      if (!button) return;

      var legacyIcons = button.querySelectorAll('i');

      Array.prototype.forEach.call(legacyIcons, function (icon) {
        if (!icon || !(icon.classList && icon.classList.contains('fa'))) return;

        if (icon.parentNode) icon.parentNode.removeChild(icon);
      });

      var iconWrapper = button.querySelector('.fh-wishlist-button-icon');

      if (!iconWrapper) {
        iconWrapper = document.createElement('span');
        iconWrapper.className = 'fh-wishlist-button-icon';
        button.insertBefore(iconWrapper, button.firstChild);
      }

      if (iconWrapper.innerHTML !== wishlistHeartSvg) iconWrapper.innerHTML = wishlistHeartSvg;

      var labelWrapper = button.querySelector('.fh-wishlist-button-label');

      if (!labelWrapper) {
        labelWrapper = document.createElement('span');
        labelWrapper.className = 'fh-wishlist-button-label';
        button.appendChild(labelWrapper);
      }

      labelWrapper.textContent = 'Merkliste';

      if (iconWrapper.nextSibling !== labelWrapper) button.insertBefore(labelWrapper, iconWrapper.nextSibling);

      Array.prototype.forEach.call(button.childNodes, function (node) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) node.parentNode.removeChild(node);
      });

      Array.prototype.forEach.call(button.children, function (child) {
        if (child === iconWrapper || child === labelWrapper) return;

        var className = typeof child.className === 'string' ? child.className : '';

        if (/(^|\s)(sr-only|visually-hidden)(\s|$)/i.test(className)) return;

        if (child.getAttribute && child.getAttribute('aria-hidden') === 'true') return;

        if (child.closest('.fh-wishlist-button-icon') || child.closest('.fh-wishlist-button-label')) return;

        child.parentNode.removeChild(child);
      });
    }

    function normalizeWishlistAttributes(button) {
      attributeNames.forEach(function (name) {
        var value = button.getAttribute(name);

        if (typeof value === 'string' && value.length) {
          var normalized = normalizeTooltipValue(value);

          if (normalized !== value) button.setAttribute(name, normalized);
        }
      });

      if (button.getAttribute('data-title-add') !== addTooltipText) button.setAttribute('data-title-add', addTooltipText);

      if (button.getAttribute('data-title-remove') !== removeTooltipText) button.setAttribute('data-title-remove', removeTooltipText);
    }

    function updateWishlistButtonState(button) {
      if (!button) return;

      var stateAttributes = ['title', 'data-original-title', 'aria-label'];
      var hasRemoveText = stateAttributes.some(function (name) {
        var value = button.getAttribute(name);

        return typeof value === 'string' && value.trim() === removeTooltipText;
      });

      var dataMode = (button.getAttribute('data-mode') || '').toLowerCase();
      var dataAdded = (button.getAttribute('data-added') || button.getAttribute('data-in-wish-list') || '').toLowerCase();
      var ariaPressed = button.getAttribute('aria-pressed') === 'true';

      var isActive =
        hasRemoveText ||
        ariaPressed ||
        dataMode === 'remove' ||
        dataAdded === 'true' ||
        button.classList.contains('is-active') ||
        button.classList.contains('is-wish-list-item') ||
        button.classList.contains('is-wish-list') ||
        button.classList.contains('added-to-wish-list');

      button.classList.toggle('fh-wishlist-button--active', isActive);

      var iconWrapper = button.querySelector('.fh-wishlist-button-icon');

      if (iconWrapper) iconWrapper.classList.toggle('fh-wishlist-button-icon--active', isActive);
    }

    function enhanceWishlistButton(button, options) {
      var fromObserver = options && options.fromObserver;

      if (!fromObserver && button.getAttribute('data-sh-wishlist-enhanced') === 'true') return;

      ensureWishlistMarkup(button);
      normalizeWishlistAttributes(button);
      updateWishlistButtonState(button);
      button.setAttribute('data-sh-wishlist-enhanced', 'true');
    }

    function observeWishlistButton(button) {
      if (button.__shWishlistObserver) return;

      var observer = new MutationObserver(function () {
        enhanceWishlistButton(button, { fromObserver: true });
      });

      observer.observe(button, {
        childList: true,
        subtree: false,
        attributes: true,
        attributeFilter: observerAttributeNames
      });

      button.__shWishlistObserver = observer;
    }

    function initWishlistButtons(root) {
      var buttons = (root || document).querySelectorAll('.widget.widget-add-to-wish-list .btn');

      Array.prototype.forEach.call(buttons, function (button) {
        enhanceWishlistButton(button);
        observeWishlistButton(button);
      });
    }

    initWishlistButtons(document);

    var body = document.body;

    if (body) {
      var rootObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          Array.prototype.forEach.call(mutation.addedNodes, function (node) {
            if (!node || (node.nodeType !== 1 && node.nodeType !== 11)) return;

            if (node.nodeType === 1 && node.matches && node.matches('.widget.widget-add-to-wish-list .btn')) {
              enhanceWishlistButton(node);
              observeWishlistButton(node);
            }

            if (node.querySelectorAll) initWishlistButtons(node);
          });
        });
      });

      rootObserver.observe(body, { childList: true, subtree: true });

      window.addEventListener('beforeunload', function () {
        rootObserver.disconnect();
      });
    }
  });
  // End Section: SH wish list button enhancer

  // Section: Warenkorbvorschau "Warenkorb" zu "Weiter einkaufen" Funktion

  function patchBasketButton() {
    var weiterEinkaufenBtn = document.querySelector(
      ".basket-preview-footer .btn-outline-primary.btn-block",
    );
    var closeBtn = document.querySelector(".basket-preview-header .close");
    if (weiterEinkaufenBtn && closeBtn) {
      // Button immer entsperren und Ladeklassen entfernen
      weiterEinkaufenBtn.removeAttribute("disabled");
      weiterEinkaufenBtn.disabled = false;
      weiterEinkaufenBtn.classList.remove(
        "disabled",
        "is-loading",
        "loading",
        "plenty-loader",
      );

      // Nur Spinner-Icons entfernen (nicht das Arrow-Icon!)
      weiterEinkaufenBtn
        .querySelectorAll("i.fa-spin, i.fa-circle-o-notch")
        .forEach(function (spinner) {
          spinner.remove();
        });

      // Button-Text und Arrow setzen, falls Icon fehlt (kein Spinner!)
      if (!weiterEinkaufenBtn.querySelector("i.fa-arrow-left")) {
        weiterEinkaufenBtn.innerHTML =
          '<i class="fa fa-arrow-left" aria-hidden="true" style="margin-right:8px"></i>Weiter einkaufen';
      }

      // Eventlistener nur einmal hinzufügen
      if (!weiterEinkaufenBtn.classList.contains("weiter-einkaufen-patched")) {
        weiterEinkaufenBtn.addEventListener("click", function (e) {
          e.preventDefault();

          // Spinner sofort entfernen
          weiterEinkaufenBtn
            .querySelectorAll("i.fa-spin, i.fa-circle-o-notch")
            .forEach(function (spinner) {
              spinner.remove();
            });
          // Button aktiv lassen
          weiterEinkaufenBtn.removeAttribute("disabled");
          weiterEinkaufenBtn.disabled = false;
          weiterEinkaufenBtn.classList.remove(
            "disabled",
            "is-loading",
            "loading",
            "plenty-loader",
          );

          // Overlay schließen
          closeBtn.click();

          // Nach kurzem Timeout sicherheitshalber Spinner nochmal entfernen
          setTimeout(function () {
            weiterEinkaufenBtn
              .querySelectorAll("i.fa-spin, i.fa-circle-o-notch")
              .forEach(function (spinner) {
                spinner.remove();
              });
            weiterEinkaufenBtn.removeAttribute("disabled");
            weiterEinkaufenBtn.disabled = false;
            weiterEinkaufenBtn.classList.remove(
              "disabled",
              "is-loading",
              "loading",
              "plenty-loader",
            );
          }, 80);
        });

        weiterEinkaufenBtn.classList.add("weiter-einkaufen-patched");
      }
    }
  }

  var observer = new MutationObserver(function (mutationsList, observer) {
    patchBasketButton();
  });

  document.addEventListener("DOMContentLoaded", function () {
    observer.observe(document.body, { childList: true, subtree: true });
    patchBasketButton();
  });

  // End Section: Warenkorbvorschau "Warenkorb" zu "Weiter einkaufen" Funktion

})();
