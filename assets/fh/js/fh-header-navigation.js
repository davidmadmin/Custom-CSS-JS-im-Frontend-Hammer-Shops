// FH Header & Navigation Behaviours

// Section: FH account menu toggle behaviour
fhOnReady(function () {
  function resolveGreeting(defaultGreeting) {
    const hour = new Date().getHours();

    if (hour >= 0 && hour < 10) return 'Guten Morgen,';

    if (hour < 16) return 'Guten Tag,';

    if (hour < 24) return 'Guten Abend,';

    return defaultGreeting;
  }

  function applyGreeting(root) {
    const elements = (root || document).querySelectorAll('.fh-account-greeting');

    elements.forEach(function (element) {
      const defaultGreeting = element.getAttribute('data-default-greeting') || element.textContent || '';
      const nextGreeting = resolveGreeting(defaultGreeting);

      if (element.textContent !== nextGreeting) element.textContent = nextGreeting;
    });
  }

  window.fhAccountMenu = window.fhAccountMenu || {};
  window.fhAccountMenu.applyGreeting = applyGreeting;

  applyGreeting();

  const container = document.querySelector('[data-fh-account-menu-container]');

  if (container) {
    const observer = new MutationObserver(function () {
      applyGreeting(container);
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  if (!container) return;

  const toggleButton = container.querySelector('[data-fh-account-menu-toggle]');
  const menu = container.querySelector('[data-fh-account-menu]');

  if (!toggleButton || !menu) return;

  let isOpen = false;

  function openMenu() {
    if (isOpen) return;

    if (window.fhWishlistMenu && typeof window.fhWishlistMenu.close === 'function') window.fhWishlistMenu.close();

    menu.style.display = 'block';
    menu.setAttribute('aria-hidden', 'false');
    toggleButton.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeydown);
    isOpen = true;
  }

  function closeMenu() {
    if (!isOpen) return;

    menu.style.display = 'none';
    menu.setAttribute('aria-hidden', 'true');
    toggleButton.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleKeydown);
    isOpen = false;
  }

  function handleDocumentClick(event) {
    if (!container.contains(event.target)) closeMenu();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      closeMenu();
      toggleButton.focus();
    }
  }

  toggleButton.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (isOpen) closeMenu(); else {
      openMenu();
    }
  });

  menu.addEventListener('click', function (event) {
    const trigger = event.target.closest('[data-fh-login-trigger], [data-fh-registration-trigger], [data-fh-account-close]');

    if (trigger) closeMenu();
  });

  function getVueStore() {
    if (window.vueApp && window.vueApp.$store) return window.vueApp.$store;

    if (window.ceresStore && typeof window.ceresStore.dispatch === 'function') return window.ceresStore;

    return null;
  }

  function resolveStoreAction(store, actionNames) {
    if (!store || !store._actions) return null;

    for (let index = 0; index < actionNames.length; index += 1) {
      const name = actionNames[index];

      if (store._actions[name]) return name;
    }

    return null;
  }

  function resolveStoreMutation(store, mutationNames) {
    if (!store || !store._mutations) return null;

    for (let index = 0; index < mutationNames.length; index += 1) {
      const name = mutationNames[index];

      if (store._mutations[name]) return name;
    }

    return null;
  }

  function getStoreShowNetPrices(store) {
    if (!store || !store.state || !store.state.basket || typeof store.state.basket.showNetPrices === 'undefined') return null;

    return !!store.state.basket.showNetPrices;
  }

  function setStoreShowNetPrices(store, showNet) {
    if (!store) return false;

    const target = !!showNet;
    const current = getStoreShowNetPrices(store);

    if (current === target) return false;

    let applied = false;
    const mutationName = resolveStoreMutation(store, ['basket/setShowNetPrices', 'basket/setBasketShowNetPrices', 'setShowNetPrices']);

    if (mutationName) {
      try {
        store.commit(mutationName, target);
        applied = true;
      } catch (error) {
        applied = false;
      }
    }

    if (!applied && store.state && store.state.basket) {
      store.state.basket.showNetPrices = target;
      applied = true;
    }

    return applied;
  }

  function refreshBasketTotals(store) {
    const actionName = resolveStoreAction(store, [
      'basket/updateBasket',
      'updateBasket',
      'basket/loadBasket',
      'loadBasket',
      'basket/getBasket',
      'getBasket'
    ]);

    if (!actionName) return;

    try {
      const result = store.dispatch(actionName);

      if (result && typeof result.catch === 'function') result.catch(function () {});
    } catch (error) {
      /* Ignore dispatch errors in the custom integration to avoid breaking the UI. */
    }
  }

  function installPriceToggle(priceToggleRoot, priceToggleButton) {
    const grossOption = priceToggleRoot.querySelector("[data-fh-price-toggle-option='gross']");
    const netOption = priceToggleRoot.querySelector("[data-fh-price-toggle-option='net']");
    const noteElement = priceToggleRoot.querySelector('[data-fh-price-toggle-note]');
    const STORAGE_KEY = 'fh:price-display:show-net-prices';
    let currentShowNet = false;
    let hasIntegratedStore = false;
    let storeWatcherCleanup = null;
    let storeSyncTimeoutId = null;
    let lastKnownStore = null;
    const PRICE_TOGGLE_EVENT_NAME = 'fh:price-toggle-change';

    const priceDisplayManager = (function () {
      const managerState = {
        rafId: null,
        lastApplied: null,
        observerInstalled: false,
      };

      function getCurrencyFormatter() {
        let formatter = null;

        return function format(value, currency, fallback) {
          if (typeof value !== 'number' || !isFinite(value)) {
            return typeof fallback === 'string' ? fallback : fallback == null ? null : fallback;
          }

          if (!formatter) {
            if (typeof window !== 'undefined' && window.Vue && typeof window.Vue.filter === 'function') {
              const currencyFilter = window.Vue.filter('currency');

              if (typeof currencyFilter === 'function') {
                formatter = function (amount, isoCode) {
                  return currencyFilter(amount, isoCode);
                };
              }
            }

            if (!formatter) {
              const locale =
                (typeof window !== 'undefined' && window.App && (App.language || App.locale || App.defaultLocale)) ||
                'de-DE';

              formatter = function (amount, isoCode) {
                const currencyCode = isoCode || (typeof window !== 'undefined' && window.App && App.activeCurrency) || 'EUR';

                try {
                  return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(amount);
                } catch (error) {
                  const formatted = amount.toFixed(2);

                  return currencyCode ? formatted + ' ' + currencyCode : formatted;
                }
              };
            }
          }

          try {
            return formatter(value, currency);
          } catch (error) {
            return typeof fallback === 'string' ? fallback : fallback == null ? null : fallback;
          }
        };
      }

      const formatCurrency = getCurrencyFormatter();

      function pickNumericValue(source, grossKey, netKey, showNet, fallback) {
        if (!source || typeof source !== 'object') return typeof fallback === 'number' ? fallback : null;

        const gross = source[grossKey];
        const net = netKey ? source[netKey] : undefined;

        if (showNet) {
          if (typeof net === 'number' && isFinite(net)) return net;
          if (typeof gross === 'number' && isFinite(gross)) return gross;
        } else {
          if (typeof gross === 'number' && isFinite(gross)) return gross;
          if (typeof net === 'number' && isFinite(net)) return net;
        }

        return typeof fallback === 'number' && isFinite(fallback) ? fallback : null;
      }

      function assignFormatted(target, value, currency, fallback) {
        if (!target || typeof target !== 'object') return;

        if (Object.prototype.hasOwnProperty.call(target, 'value') && typeof value === 'number' && isFinite(value)) {
          target.value = value;
        }

        if (Object.prototype.hasOwnProperty.call(target, 'formatted')) {
          const existing = target.formatted;
          const fallbackValue = typeof existing === 'undefined' ? fallback : existing;

          target.formatted = formatCurrency(value, currency, fallbackValue);
        }
      }

      function updatePriceContainer(container, showNet) {
        if (!container || typeof container !== 'object') return;

        const raw = container.data;

        if (!raw || typeof raw !== 'object') return;

        const currency = raw.currency || (container.price && container.price.currency) || (window.App && App.activeCurrency) || 'EUR';

        const priceValue = pickNumericValue(raw, 'price', 'priceNet', showNet, container.price && container.price.value);
        assignFormatted(container.price, priceValue, currency, container.price && container.price.formatted);

        const unitPriceValue = pickNumericValue(raw, 'unitPrice', 'unitPriceNet', showNet, container.unitPrice && container.unitPrice.value);
        assignFormatted(container.unitPrice, unitPriceValue, currency, container.unitPrice && container.unitPrice.formatted);

        if (Object.prototype.hasOwnProperty.call(container, 'totalPrice')) {
          const totalValue = pickNumericValue(raw, 'totalPrice', 'totalPriceNet', showNet, container.totalPrice && container.totalPrice.value);
          assignFormatted(container.totalPrice, totalValue, currency, container.totalPrice && container.totalPrice.formatted);
        }

        if (Object.prototype.hasOwnProperty.call(container, 'lowestPrice')) {
          const lowestValue = pickNumericValue(raw, 'lowestPrice', 'lowestPriceNet', showNet, container.lowestPrice && container.lowestPrice.value);
          assignFormatted(container.lowestPrice, lowestValue, currency, container.lowestPrice && container.lowestPrice.formatted);
        }

        if (Object.prototype.hasOwnProperty.call(container, 'basePrice')) {
          const baseValue = pickNumericValue(raw, 'basePrice', 'basePriceNet', showNet, null);

          if (typeof baseValue === 'number' && isFinite(baseValue)) {
            container.basePrice = formatCurrency(baseValue, currency, container.basePrice);
          }
        }

        if (container.contactClassDiscount && Object.prototype.hasOwnProperty.call(container.contactClassDiscount, 'amount')) {
          const discountValue = pickNumericValue(raw, 'customerClassDiscount', 'customerClassDiscountNet', showNet, container.contactClassDiscount.amount);

          if (typeof discountValue === 'number' && isFinite(discountValue)) container.contactClassDiscount.amount = discountValue;
        }

        if (container.categoryDiscount && Object.prototype.hasOwnProperty.call(container.categoryDiscount, 'amount')) {
          const discountValue = pickNumericValue(raw, 'categoryDiscount', 'categoryDiscountNet', showNet, container.categoryDiscount.amount);

          if (typeof discountValue === 'number' && isFinite(discountValue)) container.categoryDiscount.amount = discountValue;
        }

        container.isNet = !!showNet;
      }

      function updatePriceCollection(prices, showNet) {
        if (!prices || typeof prices !== 'object') return;

        updatePriceContainer(prices.default, showNet);
        updatePriceContainer(prices.rrp, showNet);
        updatePriceContainer(prices.specialOffer, showNet);

        if (Array.isArray(prices.graduatedPrices)) {
          prices.graduatedPrices.forEach(function (entry) {
            updatePriceContainer(entry, showNet);
          });
        }
      }

      function isPriceCollection(candidate) {
        return !!(candidate && typeof candidate === 'object' && candidate.default && typeof candidate.default === 'object' && candidate.default.data);
      }

      function traverseValue(value, showNet, seen) {
        if (!value || typeof value !== 'object') return;

        if (seen) {
          if (seen.has(value)) return;
          seen.add(value);
        }

        if (value.prices && isPriceCollection(value.prices)) updatePriceCollection(value.prices, showNet);

        if (Array.isArray(value)) {
          for (let index = 0; index < value.length; index += 1) traverseValue(value[index], showNet, seen);
          return;
        }

        const keys = Object.keys(value);

        for (let idx = 0; idx < keys.length; idx += 1) {
          const child = value[keys[idx]];

          if (child && typeof child === 'object') traverseValue(child, showNet, seen);
        }
      }

      function applyNow(store, showNet) {
        if (!store || !store.state) return;

        const seen = typeof WeakSet === 'function' ? new WeakSet() : null;

        traverseValue(store.state, showNet, seen);

        if (typeof document !== 'undefined' && document.documentElement) {
          document.documentElement.setAttribute('data-fh-show-net-prices', showNet ? 'net' : 'gross');
        }

        if (typeof window !== 'undefined' && window.App && window.App.initialData) {
          window.App.initialData.showNetPrices = !!showNet;
        }

        managerState.lastApplied = !!showNet;
      }

      function schedule(store, showNet) {
        if (!store || !store.state) return;

        const nextState = !!showNet;

        if (managerState.rafId) {
          if (typeof window.cancelAnimationFrame === 'function') {
            window.cancelAnimationFrame(managerState.rafId);
          }
          if (typeof window.clearTimeout === 'function') window.clearTimeout(managerState.rafId);
          managerState.rafId = null;
        }

        const scheduler = typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame : window.setTimeout;

        managerState.rafId = scheduler(function () {
          managerState.rafId = null;
          applyNow(store, nextState);
        });
      }

      function ensureObserver(store, getState) {
        if (!store || typeof store.subscribe !== 'function' || managerState.observerInstalled) return;

        store.subscribe(function () {
          const desired = typeof getState === 'function' ? getState() : managerState.lastApplied;

          if (typeof desired === 'boolean') schedule(store, desired);
        });

        managerState.observerInstalled = true;
      }

      return {
        scheduleUpdate: schedule,
        ensureMutationObserver: ensureObserver,
        applyImmediately: applyNow,
      };
    })();

    function updateSingleItemVatWidgets(showNet) {
      if (typeof document === 'undefined') return;

      const prefix = showNet ? '* zzgl. ges. MwSt. zzgl. ' : '* inkl. ges. MwSt. zzgl. ';
      const vatSpans = document.querySelectorAll('.widget.widget-code.widget-none.vat .widget-inner > span');

      vatSpans.forEach(function (span) {
        if (!span) return;

        let firstTextNode = null;

        for (let index = 0; index < span.childNodes.length; index += 1) {
          const node = span.childNodes[index];

          if (node && node.nodeType === 3) {
            firstTextNode = node;
            break;
          }
        }

        if (!firstTextNode) {
          firstTextNode = document.createTextNode('');
          span.insertBefore(firstTextNode, span.firstChild || null);
        }

        firstTextNode.textContent = prefix;
      });
    }

    function findVueInstance(element) {
      let current = element;

      for (let depth = 0; depth < 20 && current; depth += 1) {
        if (current.__vue__) return current.__vue__;

        current = current.parentNode;
      }

      return null;
    }

    function updateCategoryItemData(showNet) {
      if (typeof document === 'undefined') return;

      if (!priceDisplayManager || typeof priceDisplayManager.applyImmediately !== 'function') return;

      const elements = document.querySelectorAll('.cmp-product-thumb');

      if (!elements.length) return;

      const seenObjects = typeof WeakSet === 'function' ? new WeakSet() : null;

      function applyToTarget(target) {
        if (!target || typeof target !== 'object') return;

        if (seenObjects) {
          if (seenObjects.has(target)) return;

          seenObjects.add(target);
        }

        priceDisplayManager.applyImmediately({ state: target }, showNet);
      }

      elements.forEach(function (element) {
        const instance = element.__vue__ || findVueInstance(element);

        if (!instance) return;

        let rootInstance = instance;

        for (let depth = 0; depth < 10 && rootInstance && rootInstance.$el !== element; depth += 1) {
          rootInstance = rootInstance.$parent;
        }

        if (!rootInstance || rootInstance.$el !== element) return;

        applyToTarget(rootInstance.item);
        applyToTarget(rootInstance.itemData);
        applyToTarget(rootInstance.itemDataRef);
        applyToTarget(rootInstance.itemSlotData);

        if (typeof rootInstance.$forceUpdate === 'function') rootInstance.$forceUpdate();
      });
    }

    function updatePageDisplays(showNet) {
      updateSingleItemVatWidgets(showNet);
      updateCategoryItemData(showNet);
      if (typeof window !== 'undefined' && window.fhWishlistMenu && typeof window.fhWishlistMenu.updatePrices === 'function') {
        try {
          window.fhWishlistMenu.updatePrices(showNet);
        } catch (error) {
          /* Suppress wishlist price update errors to avoid blocking the toggle. */
        }
      }
    }

    let pageDisplayUpdateHandle = null;

    function schedulePageDisplayUpdate(showNet, immediate) {
      if (pageDisplayUpdateHandle) {
        if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
          window.cancelAnimationFrame(pageDisplayUpdateHandle);
        } else if (typeof window !== 'undefined' && typeof window.clearTimeout === 'function') {
          window.clearTimeout(pageDisplayUpdateHandle);
        }

        pageDisplayUpdateHandle = null;
      }

      const runner = function () {
        pageDisplayUpdateHandle = null;
        updatePageDisplays(showNet);
      };

      if (immediate) {
        runner();
        return;
      }

      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        pageDisplayUpdateHandle = window.requestAnimationFrame(runner);
      } else if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
        pageDisplayUpdateHandle = window.setTimeout(runner, 0);
      } else {
        runner();
      }
    }

    let categoryMutationObserver = null;

    function ensureCategoryMutationObserver() {
      if (categoryMutationObserver || typeof MutationObserver !== 'function' || typeof document === 'undefined') return;

      categoryMutationObserver = new MutationObserver(function (mutations) {
        for (let index = 0; index < mutations.length; index += 1) {
          const mutation = mutations[index];

          if (!mutation || !mutation.addedNodes) continue;

          const nodes = mutation.addedNodes;

          for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
            const node = nodes[nodeIndex];

            if (!node || node.nodeType !== 1) continue;

            if ((node.classList && node.classList.contains('cmp-product-thumb')) ||
              (typeof node.querySelector === 'function' && node.querySelector('.cmp-product-thumb'))
            ) {
              schedulePageDisplayUpdate(currentShowNet);
              return;
            }
          }
        }
      });

      if (document.body) categoryMutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    function broadcastState(showNet) {
      if (typeof document === 'undefined') return;

      let event = null;

      try {
        event = new CustomEvent(PRICE_TOGGLE_EVENT_NAME, {
          detail: { showNet: !!showNet },
        });
      } catch (error) {
        if (typeof document.createEvent === 'function') {
          event = document.createEvent('CustomEvent');

          if (event && typeof event.initCustomEvent === 'function') {
            event.initCustomEvent(PRICE_TOGGLE_EVENT_NAME, false, false, { showNet: !!showNet });
          } else {
            event = null;
          }
        }
      }

      if (event) document.dispatchEvent(event);
    }

    function readStoredPreference() {
      try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);

        if (raw === '1') return true;

        if (raw === '0') return false;
      } catch (error) {
        /* Ignore storage access issues (e.g. Safari private mode). */
      }

      return null;
    }

    function persistPreference(value) {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, value ? '1' : '0');
      } catch (error) {
        /* Ignore storage access issues (e.g. Safari private mode). */
      }
    }

    function updateToggleUi(showNet, shouldBroadcast) {
      const isNet = !!showNet;
      const isGross = !isNet;

      priceToggleButton.setAttribute('aria-checked', isGross ? 'true' : 'false');
      priceToggleButton.setAttribute(
        'aria-label',
        isNet ? 'Preise ohne Mehrwertsteuer anzeigen' : 'Preise mit Mehrwertsteuer anzeigen'
      );

      if (isGross) priceToggleButton.classList.add('is-active');
      else priceToggleButton.classList.remove('is-active');

      if (grossOption) grossOption.setAttribute('aria-hidden', isGross ? 'false' : 'true');

      if (netOption) netOption.setAttribute('aria-hidden', isGross ? 'true' : 'false');

      if (noteElement) noteElement.textContent = isNet ? 'Preise ohne MwSt' : 'Preise mit MwSt';

      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('data-fh-show-net-prices', isNet ? 'net' : 'gross');
      }

      if (shouldBroadcast) broadcastState(showNet);
    }

    function applyStateToStore(store, desiredState) {
      const changed = setStoreShowNetPrices(store, desiredState);

      if (store) priceDisplayManager.scheduleUpdate(store, desiredState);
      schedulePageDisplayUpdate(desiredState);

      if (changed) refreshBasketTotals(store);
    }

    function ensureStoreWatcher(store) {
      if (!store || typeof store.watch !== 'function' || storeWatcherCleanup) return;

      storeWatcherCleanup = store.watch(
        function (state) {
          return state && state.basket ? !!state.basket.showNetPrices : false;
        },
        function (value) {
          const normalized = !!value;
          const storedPreference = readStoredPreference();
          const hasStoredPreference = storedPreference === true || storedPreference === false;

          if (hasStoredPreference && normalized !== storedPreference) {
            currentShowNet = storedPreference;
            updateToggleUi(storedPreference, true);
            persistPreference(storedPreference);

            if (lastKnownStore) {
              applyStateToStore(lastKnownStore, storedPreference);
            } else {
              priceDisplayManager.scheduleUpdate(store, storedPreference);
              schedulePageDisplayUpdate(storedPreference);
            }

            return;
          }

          currentShowNet = normalized;
          updateToggleUi(normalized, true);
          persistPreference(normalized);
          if (lastKnownStore) priceDisplayManager.scheduleUpdate(lastKnownStore, normalized);
          else priceDisplayManager.scheduleUpdate(store, normalized);
          schedulePageDisplayUpdate(normalized);
        }
      );
    }

    function integrateWithStore(store) {
      if (!store) return;

      const storedPreference = readStoredPreference();
      const storeValue = getStoreShowNetPrices(store);

      if (!hasIntegratedStore) {
        if (storedPreference === true || storedPreference === false) {
          currentShowNet = storedPreference;
        } else if (typeof storeValue === 'boolean') {
          currentShowNet = storeValue;
          persistPreference(storeValue);
        }

        hasIntegratedStore = true;
      }

      lastKnownStore = store;
      updateToggleUi(currentShowNet, false);
      applyStateToStore(store, currentShowNet);
      ensureStoreWatcher(store);
      priceDisplayManager.ensureMutationObserver(store, function () {
        return currentShowNet;
      });
    }

    function scheduleStoreIntegration(delay) {
      if (storeSyncTimeoutId) window.clearTimeout(storeSyncTimeoutId);

      storeSyncTimeoutId = window.setTimeout(function () {
        storeSyncTimeoutId = null;

        const store = getVueStore();

        if (!store) {
          scheduleStoreIntegration(250);
          return;
        }

        integrateWithStore(store);
      }, typeof delay === 'number' ? delay : 0);
    }

    const initialPreference = readStoredPreference();

    if (initialPreference === true || initialPreference === false) currentShowNet = initialPreference;

    updateToggleUi(currentShowNet, false);
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-fh-show-net-prices', currentShowNet ? 'net' : 'gross');
    }
    if (typeof window !== 'undefined' && window.App && window.App.initialData) {
      window.App.initialData.showNetPrices = !!currentShowNet;
    }
    schedulePageDisplayUpdate(currentShowNet, true);
    ensureCategoryMutationObserver();

    function handleExternalToggle(event) {
      if (!event || !event.detail) return;

      const desired = !!event.detail.showNet;

      if (desired === currentShowNet) return;

      currentShowNet = desired;
      updateToggleUi(currentShowNet, false);
      persistPreference(currentShowNet);
      if (typeof window !== 'undefined' && window.App && window.App.initialData) {
        window.App.initialData.showNetPrices = !!currentShowNet;
      }
      if (lastKnownStore) priceDisplayManager.scheduleUpdate(lastKnownStore, currentShowNet);
      schedulePageDisplayUpdate(currentShowNet);
      scheduleStoreIntegration(0);
    }

    document.addEventListener(PRICE_TOGGLE_EVENT_NAME, handleExternalToggle);

    priceToggleButton.addEventListener('click', function (event) {
      event.preventDefault();

      currentShowNet = !currentShowNet;
      updateToggleUi(currentShowNet, true);
      persistPreference(currentShowNet);
      if (typeof window !== 'undefined' && window.App && window.App.initialData) {
        window.App.initialData.showNetPrices = !!currentShowNet;
      }
      if (lastKnownStore) priceDisplayManager.scheduleUpdate(lastKnownStore, currentShowNet);
      else if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('data-fh-show-net-prices', currentShowNet ? 'net' : 'gross');
      }
      schedulePageDisplayUpdate(currentShowNet);
      scheduleStoreIntegration(0);
    });

    scheduleStoreIntegration(0);
  }

  function attemptInstallPriceToggle(root) {
    const element = root || menu.querySelector('[data-fh-price-toggle-root]');

    if (!element || element.__fhPriceToggleInitialized) return false;

    const button = element.querySelector('[data-fh-price-toggle]');

    if (!button) return false;

    element.__fhPriceToggleInitialized = true;
    installPriceToggle(element, button);

    return true;
  }

  attemptInstallPriceToggle();

  const priceToggleObserver = new MutationObserver(function (mutations) {
    for (let index = 0; index < mutations.length; index += 1) {
      const mutation = mutations[index];

      if (mutation.type !== 'childList') continue;

      if (attemptInstallPriceToggle()) return;

      const addedNodes = mutation.addedNodes;

      for (let nodeIndex = 0; nodeIndex < addedNodes.length; nodeIndex += 1) {
        const node = addedNodes[nodeIndex];

        if (node && node.nodeType === 1 && typeof node.querySelector === 'function') {
          if (node.matches && node.matches('[data-fh-price-toggle-root]')) {
            if (attemptInstallPriceToggle(node)) return;
          }

          const nestedRoot = node.querySelector('[data-fh-price-toggle-root]');

          if (nestedRoot && attemptInstallPriceToggle(nestedRoot)) return;
        }
      }
    }
  });

  priceToggleObserver.observe(menu, { childList: true, subtree: true });

  window.fhAccountMenu = window.fhAccountMenu || {};
  window.fhAccountMenu.close = closeMenu;
  window.fhAccountMenu.isOpen = function () {
    return isOpen;
  };
  window.fhAccountMenu.installPriceToggle = function (root) {
    return attemptInstallPriceToggle(root);
  };
});
// End Section: FH account menu toggle behaviour

// Section: FH account page navigation
fhOnReady(function () {
  const nav = document.querySelector('[data-fh-account-nav]');

  if (!nav) return;

  const links = Array.prototype.slice.call(nav.querySelectorAll('[data-fh-account-nav-link]'));

  if (!links.length) return;

  if (window.fhAccountMenu && typeof window.fhAccountMenu.applyGreeting === 'function') {
    window.fhAccountMenu.applyGreeting(nav);

    if (typeof MutationObserver === 'function') {
      const greetingObserver = new MutationObserver(function () {
        window.fhAccountMenu.applyGreeting(nav);
      });

      greetingObserver.observe(nav, { childList: true, subtree: true, characterData: true });
    }
  }

  const pathParser = document.createElement('a');
  const rootTarget = 'overview';
  const rootPath = normalisePath(nav.getAttribute('data-fh-account-nav-root') || '/my-account');

  function normaliseTarget(value) {
    if (typeof value !== 'string') return rootTarget;

    let normalised = value.trim();

    if (!normalised) return rootTarget;

    if (normalised.charAt(0) === '#') normalised = normalised.slice(1);

    if (!normalised) return rootTarget;

    return normalised.toLowerCase();
  }

  function normalisePath(value) {
    if (typeof value !== 'string' || !value) return '/';

    pathParser.href = value;

    const path = pathParser.pathname || '/';

    return path.replace(/\/+$/, '') || '/';
  }

  function extractHash(value) {
    if (typeof value !== 'string') return '';

    const index = value.indexOf('#');

    return index === -1 ? '' : value.slice(index);
  }

  function applyActive(targetValue) {
    const activeTarget = normaliseTarget(targetValue);

    links.forEach(function (link) {
      const linkTarget = normaliseTarget(
        link.getAttribute('data-fh-account-nav-target') || link.hash || extractHash(link.getAttribute('href') || '')
      );

      if (linkTarget === activeTarget) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('is-active');
      }
    });
  }

  applyActive(window.location.hash);

  window.addEventListener('hashchange', function () {
    applyActive(window.location.hash);
  });

  nav.addEventListener('click', function (event) {
    const trigger = event.target.closest('[data-fh-account-nav-link]');

    if (!trigger) return;

    const href = trigger.getAttribute('href') || '';
    const targetHint = trigger.getAttribute('data-fh-account-nav-target');
    const nextTarget = targetHint || trigger.hash || extractHash(href);

    if (
      href &&
      !trigger.hash &&
      extractHash(href) === '' &&
      normalisePath(href) === rootPath &&
      normalisePath(window.location && window.location.pathname) === rootPath
    ) {
      event.preventDefault();
    }

    applyActive(nextTarget);
  });
});
// End Section: FH account page navigation

// Section: FH desktop header scroll behaviour
fhOnReady(function () {
  const header = document.querySelector('[data-fh-header-root]');

  if (!header) return;

  const desktopMediaQuery = window.matchMedia('(min-width: 992px)');
  const scrolledClassName = 'fh-header--scrolled';
  const hiddenClassName = 'fh-header--topbar-hidden';
  const topBar = header.querySelector('.fh-header__top-bar');
  const SCROLL_DELTA_THRESHOLD = 8;
  let topBarHeight = topBar ? topBar.scrollHeight : 0;
  let lastKnownScrollY = window.scrollY;
  let lastAppliedScrollY = window.scrollY;
  let isTicking = false;

  function measureTopBar() {
    if (!topBar) return;

    topBarHeight = topBar.scrollHeight || 0;
    header.style.setProperty('--fh-top-bar-max-height', topBarHeight + 'px');
  }

  function applyScrollState() {
    isTicking = false;

    const currentY = lastKnownScrollY;
    const isDesktop = desktopMediaQuery.matches;

    if (!isDesktop) {
      header.classList.remove(scrolledClassName);
      header.classList.remove(hiddenClassName);
      lastAppliedScrollY = currentY;
      return;
    }

    if (currentY <= 0) {
      header.classList.remove(hiddenClassName);
      header.classList.remove(scrolledClassName);
      lastAppliedScrollY = currentY;
      return;
    }

    header.classList.add(scrolledClassName);

    if (!topBar) {
      lastAppliedScrollY = currentY;
      return;
    }

    const delta = currentY - lastAppliedScrollY;
    const absoluteDelta = Math.abs(delta);
    const collapseBoundary = Math.max(topBarHeight, 40);

    if (currentY <= collapseBoundary) {
      header.classList.remove(hiddenClassName);
    } else if (delta > 0 && absoluteDelta > SCROLL_DELTA_THRESHOLD) {
      header.classList.add(hiddenClassName);
    } else if (delta < 0 && absoluteDelta > SCROLL_DELTA_THRESHOLD) {
      header.classList.remove(hiddenClassName);
    }

    lastAppliedScrollY = currentY;
  }

  function requestScrollUpdate() {
    lastKnownScrollY = window.scrollY;

    if (!isTicking) {
      window.requestAnimationFrame(applyScrollState);
      isTicking = true;
    }
  }

  function updateImmediately() {
    lastKnownScrollY = window.scrollY;
    applyScrollState();
  }

  function handleMediaChange() {
    measureTopBar();
    lastAppliedScrollY = window.scrollY;
    updateImmediately();
  }

  measureTopBar();

  if (typeof desktopMediaQuery.addEventListener === 'function') {
    desktopMediaQuery.addEventListener('change', handleMediaChange);
  } else if (typeof desktopMediaQuery.addListener === 'function') {
    desktopMediaQuery.addListener(handleMediaChange);
  }

  window.addEventListener('resize', function () {
    measureTopBar();
    updateImmediately();
  });

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });

  updateImmediately();
});
// End Section: FH desktop header scroll behaviour

// Section: FH mobile navigation toggle
fhOnReady(function () {
  const header = document.querySelector('[data-fh-header-root]');

  if (!header) return;

  const menu = header.querySelector('[data-fh-mobile-menu]');
  const toggleButtons = header.querySelectorAll('[data-fh-mobile-menu-toggle]');

  if (!menu || toggleButtons.length === 0) return;

  const closeButtons = header.querySelectorAll('[data-fh-mobile-menu-close]');
  const focusableSelectors = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const desktopMedia = window.matchMedia('(min-width: 992px)');
  const panelContainer = menu.querySelector('[data-fh-mobile-views]');
  const panelElements = panelContainer
    ? Array.prototype.slice.call(panelContainer.querySelectorAll('[data-fh-mobile-panel]'))
    : [];
  const panelTriggers = menu.querySelectorAll('[data-fh-mobile-submenu-target]');
  const rootLabel = menu.getAttribute('data-fh-mobile-root-label') || 'Start';
  const panelTitleMap = new Map();
  const breadcrumbTargets = new Map();
  const ROOT_PANEL_ID = 'root';
  let isOpen = false;
  let previouslyFocusedElement = null;
  let panelStack = [{ id: ROOT_PANEL_ID, trigger: null }];
  const PANEL_STORAGE_KEY = 'fh-mobile-menu-panel-path';
  const PANEL_STORAGE_VERSION = '1';
  let suppressPersistence = false;

  if (panelElements.length > 0) {
    panelElements.forEach(function (panel) {
      if (!panel) return;

      const panelId = panel.getAttribute('data-fh-mobile-panel');

      if (!panelId) return;

      const titleElement = panel.querySelector('.fh-header__mobile-submenu-title');

      if (titleElement && typeof titleElement.textContent === 'string') {
        panelTitleMap.set(panelId, titleElement.textContent.trim());
      }

      const breadcrumbElement = panel.querySelector('[data-fh-mobile-breadcrumb]');

      if (breadcrumbElement) breadcrumbTargets.set(panelId, breadcrumbElement);
    });
  }

  function readStoredPanelPath() {
    try {
      const storage = window.localStorage;

      if (!storage) return null;

      const rawValue = storage.getItem(PANEL_STORAGE_KEY);

      if (!rawValue) return null;

      const parsedValue = JSON.parse(rawValue);

      if (!parsedValue || parsedValue.version !== PANEL_STORAGE_VERSION || !Array.isArray(parsedValue.path)) {
        storage.removeItem(PANEL_STORAGE_KEY);
        return null;
      }

      return parsedValue.path.filter(function (id) {
        return typeof id === 'string' && id.trim().length > 0;
      });
    } catch (error) {
      return null;
    }
  }

  function clearStoredPanelPath() {
    try {
      const storage = window.localStorage;

      if (!storage) return;

      storage.removeItem(PANEL_STORAGE_KEY);
    } catch (error) {
      /* noop */
    }
  }

  function persistPanelStack() {
    if (suppressPersistence) return;

    try {
      const storage = window.localStorage;

      if (!storage) return;

      const path = panelStack
        .slice(1)
        .map(function (entry) {
          return entry && typeof entry.id === 'string' ? entry.id : null;
        })
        .filter(function (id) {
          return typeof id === 'string' && id.trim().length > 0;
        });

      storage.setItem(
        PANEL_STORAGE_KEY,
        JSON.stringify({
          version: PANEL_STORAGE_VERSION,
          path: path,
        })
      );
    } catch (error) {
      /* noop */
    }
  }

  function restorePanelPath() {
    if (!panelContainer || panelElements.length === 0 || desktopMedia.matches) return false;

    const storedPath = readStoredPanelPath();

    if (!storedPath || storedPath.length === 0) return false;

    const validIds = [];

    storedPath.every(function (panelId) {
      if (typeof panelId !== 'string') return false;

      const panel = getPanelById(panelId);

      if (!panel) return false;

      validIds.push(panelId);
      return true;
    });

    if (validIds.length === 0) {
      clearStoredPanelPath();
      return false;
    }

    suppressPersistence = true;

    try {
      resetPanels({ skipFocus: true });

      validIds.forEach(function (panelId) {
        const trigger = menu.querySelector('[data-fh-mobile-submenu-target="' + panelId + '"]');

        openPanel(panelId, trigger, { skipFocus: true });
      });
    } finally {
      suppressPersistence = false;
    }

    persistPanelStack();

    return true;
  }

  function setExpandedState(value) {
    const expandedValue = value ? 'true' : 'false';

    toggleButtons.forEach(function (button) {
      button.setAttribute('aria-expanded', expandedValue);
    });
  }

  function focusInitialElement() {
    const closeButton = menu.querySelector('[data-fh-mobile-menu-close]');

    if (closeButton instanceof HTMLElement) { closeButton.focus(); return; }

    const firstLink = menu.querySelector('.fh-header__nav-link');

    if (firstLink instanceof HTMLElement) firstLink.focus();
  }

  function handleDocumentKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') closeMenu();
  }

  function handleTrapFocus(event) {
    if (!isOpen || event.key !== 'Tab') return;

    const focusableElements = Array.prototype.slice
      .call(menu.querySelectorAll(focusableSelectors))
      .filter(function (element) {
        return (
          element instanceof HTMLElement &&
          element.offsetParent !== null &&
          !element.hasAttribute('disabled') &&
          element.getAttribute('aria-hidden') !== 'true'
        );
      });

    if (focusableElements.length === 0) { event.preventDefault(); return; }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }

      return;
    }

    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function getPanelById(id) {
    if (!panelContainer || !id) return null;

    for (let index = 0; index < panelElements.length; index += 1) {
      const panel = panelElements[index];

      if (panel && panel.getAttribute('data-fh-mobile-panel') === id) return panel;
    }

    return null;
  }

  function getPanelLabel(panelId) {
    if (panelId === ROOT_PANEL_ID) return rootLabel;

    if (panelTitleMap.has(panelId)) return panelTitleMap.get(panelId);

    const panel = getPanelById(panelId);

    if (!panel) return '';

    const titleElement = panel.querySelector('.fh-header__mobile-submenu-title');
    const label = titleElement && typeof titleElement.textContent === 'string' ? titleElement.textContent.trim() : '';

    if (panelId && label) panelTitleMap.set(panelId, label);

    return label;
  }

  function renderBreadcrumb(currentPanel, depth) {
    if (!panelContainer || panelElements.length === 0) return;

    breadcrumbTargets.forEach(function (container) {
      if (container) container.innerHTML = '';
    });

    if (!currentPanel) return;

    const currentEntry = panelStack[Math.max(depth, 0)];
    const currentId = currentEntry ? currentEntry.id : ROOT_PANEL_ID;
    const container = breadcrumbTargets.get(currentId);

    if (!container) return;

    const path = panelStack.slice(0, Math.max(depth, 0) + 1);
    const fragment = document.createDocumentFragment();

    path.forEach(function (entry, index) {
      const label = getPanelLabel(entry ? entry.id : null);

      if (!label) return;

      const isLast = index === path.length - 1;

      if (!isLast) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'fh-header__mobile-breadcrumb-link';
        button.setAttribute('data-fh-mobile-breadcrumb-depth', String(index));
        button.setAttribute('aria-label', 'Zu ' + label);
        button.textContent = label;
        fragment.appendChild(button);
      } else {
        const current = document.createElement('span');
        current.className = 'fh-header__mobile-breadcrumb-current';
        current.setAttribute('aria-current', 'page');
        current.textContent = label;
        fragment.appendChild(current);
      }

      if (index < path.length - 1) {
        const separator = document.createElement('span');
        separator.className = 'fh-header__mobile-breadcrumb-separator';
        separator.setAttribute('aria-hidden', 'true');
        separator.textContent = '›';
        fragment.appendChild(separator);
      }
    });

    container.appendChild(fragment);
  }

  function navigateToDepth(targetDepth) {
    if (!panelContainer || panelElements.length === 0) return;

    const normalizedDepth = Number(targetDepth);

    if (!Number.isInteger(normalizedDepth)) return;

    if (normalizedDepth < 0 || normalizedDepth >= panelStack.length) return;

    if (normalizedDepth === panelStack.length - 1) return;

    const removedEntries = panelStack.splice(normalizedDepth + 1);

    removedEntries.forEach(function (entry) {
      if (entry && entry.trigger instanceof HTMLElement) entry.trigger.setAttribute('aria-expanded', 'false');
    });

    updatePanelState();
    persistPanelStack();
  }

  function updatePanelState(options) {
    if (!panelContainer || panelElements.length === 0) return;

    const skipFocus = !!(options && options.skipFocus === true);
    const preventRootFocus = !!(options && options.preventRootFocus === true);
    const depth = Math.max(panelStack.length - 1, 0);
    const currentEntry = panelStack[depth] || panelStack[0];
    const currentPanel = getPanelById(currentEntry ? currentEntry.id : ROOT_PANEL_ID);

    renderBreadcrumb(currentPanel, depth);

    panelElements.forEach(function (panel) {
      const isActive = panel === currentPanel;

      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    panelContainer.style.transform = '';
    menu.classList.toggle('fh-header__nav--submenu-open', depth > 0);

    if (menu instanceof HTMLElement) menu.scrollTop = 0;

    if (currentPanel instanceof HTMLElement) {
      currentPanel.scrollTop = 0;

      const scrollableList = currentPanel.querySelector('.fh-header__mobile-submenu-list');

      if (scrollableList instanceof HTMLElement) scrollableList.scrollTop = 0;
    }

    if (skipFocus) return;

    if (depth === 0) {
      if (preventRootFocus) return;

      const firstLink = menu.querySelector('.fh-header__nav-link');

      if (firstLink instanceof HTMLElement) firstLink.focus();
      return;
    }

    if (currentPanel) {
      const backButton = currentPanel.querySelector('[data-fh-mobile-submenu-back]');

      if (backButton instanceof HTMLElement) {
        backButton.focus();
        return;
      }
    }

    if (currentEntry && currentEntry.trigger instanceof HTMLElement) currentEntry.trigger.focus();
  }

  function resetPanels(options) {
    if (!panelContainer || panelElements.length === 0) return;

    const skipFocus = !!(options && options.skipFocus === true);

    panelStack
      .slice(1)
      .forEach(function (entry) {
        if (entry && entry.trigger instanceof HTMLElement) entry.trigger.setAttribute('aria-expanded', 'false');
      });

    panelStack = [{ id: ROOT_PANEL_ID, trigger: null }];

    updatePanelState({ skipFocus: skipFocus, preventRootFocus: true });

    persistPanelStack();
  }

  function openPanel(panelId, trigger, options) {
    if (!panelContainer || panelElements.length === 0 || !panelId || desktopMedia.matches) return;

    const nextPanel = getPanelById(panelId);

    if (!nextPanel) return;

    const normalizedTrigger = trigger instanceof HTMLElement ? trigger : null;
    const skipFocus = !!(options && options.skipFocus === true);
    const existingIndex = panelStack.findIndex(function (entry) {
      return entry && entry.id === panelId;
    });

    if (existingIndex > -1) {
      panelStack
        .slice(existingIndex + 1)
        .forEach(function (entry) {
          if (entry && entry.trigger instanceof HTMLElement) entry.trigger.setAttribute('aria-expanded', 'false');
        });

      panelStack = panelStack.slice(0, existingIndex + 1);
    } else {
      panelStack.push({ id: panelId, trigger: normalizedTrigger });
    }

    if (normalizedTrigger) normalizedTrigger.setAttribute('aria-expanded', 'true');

    updatePanelState({ skipFocus: skipFocus });

    persistPanelStack();
  }

  function stepBack(options) {
    if (!panelContainer || panelElements.length === 0 || panelStack.length <= 1) return;

    const removedEntry = panelStack.pop();

    const parentEntry = panelStack[panelStack.length - 1];

    if (removedEntry && removedEntry.trigger instanceof HTMLElement) removedEntry.trigger.setAttribute('aria-expanded', 'false');

    updatePanelState({ skipFocus: true });

    persistPanelStack();

    if (options && options.skipFocus === true) return;

    if (parentEntry) {
      if (parentEntry.id !== ROOT_PANEL_ID) {
        const parentPanel = getPanelById(parentEntry.id);

        if (parentPanel) {
          const backButton = parentPanel.querySelector('[data-fh-mobile-submenu-back]');

          if (backButton instanceof HTMLElement) {
            backButton.focus();
            return;
          }
        }
      }

      if (removedEntry && removedEntry.trigger instanceof HTMLElement) {
        removedEntry.trigger.focus();
        return;
      }

      if (parentEntry.trigger instanceof HTMLElement) {
        parentEntry.trigger.focus();
        return;
      }
    }

    const firstLink = menu.querySelector('.fh-header__nav-link');

    if (firstLink instanceof HTMLElement) firstLink.focus();
  }

  function clearPendingSelection() {
    menu.classList.remove('fh-header__nav--pending');

    var pendingLinks = menu.querySelectorAll('[data-fh-mobile-pending="true"]');

    pendingLinks.forEach(function (link) {
      link.removeAttribute('data-fh-mobile-pending');
      link.classList.remove('fh-header__nav-link--pending');
      link.classList.remove('fh-header__mobile-submenu-link--pending');
    });
  }

  function markPendingSelection(link) {
    if (!(link instanceof HTMLElement)) return;

    clearPendingSelection();

    link.setAttribute('data-fh-mobile-pending', 'true');

    if (link.classList.contains('fh-header__mobile-submenu-link')) {
      link.classList.add('fh-header__mobile-submenu-link--pending');
    } else {
      link.classList.add('fh-header__nav-link--pending');
    }

    menu.classList.add('fh-header__nav--pending');
  }

  function openMenu() {
    if (isOpen) return;

    previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const restored = restorePanelPath();

    if (!restored) resetPanels({ skipFocus: true });

    menu.classList.add('fh-header__nav--open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fh-mobile-menu-open');
    setExpandedState(true);
    document.addEventListener('keydown', handleDocumentKeydown);
    document.addEventListener('keydown', handleTrapFocus);
    if (restored) updatePanelState(); else focusInitialElement();
    isOpen = true;
  }

  function closeMenu(options) {
    const skipFocus = !!(options && options.skipFocus === true);

    menu.classList.remove('fh-header__nav--open');
    menu.setAttribute('aria-hidden', desktopMedia.matches ? 'false' : 'true');
    document.body.classList.remove('fh-mobile-menu-open');
    clearPendingSelection();
    setExpandedState(false);
    const wasSuppressed = suppressPersistence;
    suppressPersistence = true;
    try {
      resetPanels({ skipFocus: true });
    } finally {
      suppressPersistence = wasSuppressed;
    }

    if (!isOpen) return;

    document.removeEventListener('keydown', handleDocumentKeydown);
    document.removeEventListener('keydown', handleTrapFocus);
    isOpen = false;

    if (skipFocus) { previouslyFocusedElement = null; return; }

    const target = previouslyFocusedElement || toggleButtons[0];

    if (target instanceof HTMLElement) target.focus();

    previouslyFocusedElement = null;
  }

  toggleButtons.forEach(function (button) {
    button.setAttribute('aria-expanded', 'false');

    button.addEventListener('click', function (event) {
      event.preventDefault();

      if (isOpen) { closeMenu(); return; }

      openMenu();
    });
  });

  closeButtons.forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      closeMenu();
    });
  });

  menu.addEventListener('click', function (event) {
    if (event.target && event.target.closest('[data-fh-mobile-menu-close]')) {
      event.preventDefault();
      closeMenu();
      return;
    }

    const navLink = event.target && event.target.closest('.fh-header__nav-link');

    if (navLink && !navLink.closest('.dropdown-menu')) {
      if (!desktopMedia.matches) {
        if (navLink.hasAttribute('data-fh-mobile-submenu-target')) return;

        markPendingSelection(navLink);
        return;
      }

      closeMenu();
    }
  });

  if (panelContainer && panelElements.length > 0) {
    panelTriggers.forEach(function (trigger) {
      trigger.setAttribute('aria-expanded', trigger.getAttribute('aria-expanded') || 'false');

      trigger.addEventListener('click', function (event) {
        if (desktopMedia.matches) return;

        const target = trigger.getAttribute('data-fh-mobile-submenu-target');

        if (!target) return;

        event.preventDefault();
        event.stopPropagation();
        openPanel(target, trigger);
      });
    });

    panelContainer.addEventListener('click', function (event) {
      const breadcrumbButton = event.target && event.target.closest('[data-fh-mobile-breadcrumb-depth]');

      if (breadcrumbButton) {
        event.preventDefault();
        const depth = parseInt(breadcrumbButton.getAttribute('data-fh-mobile-breadcrumb-depth'), 10);

        if (!Number.isNaN(depth)) navigateToDepth(depth);

        return;
      }

      const backButton = event.target && event.target.closest('[data-fh-mobile-submenu-back]');

      if (backButton) {
        event.preventDefault();
        stepBack();
        return;
      }

      const submenuLink = event.target && event.target.closest('.fh-header__mobile-submenu-link');

      if (submenuLink && !submenuLink.hasAttribute('data-fh-mobile-submenu-target')) {
        markPendingSelection(submenuLink);
      }
    });

    updatePanelState({ skipFocus: true, preventRootFocus: true });
  }

  function handleBreakpointChange() {
    closeMenu({ skipFocus: true });
  }

  if (typeof desktopMedia.addEventListener === 'function') desktopMedia.addEventListener('change', handleBreakpointChange); else if (typeof desktopMedia.addListener === 'function') {
    desktopMedia.addListener(handleBreakpointChange);
  }

  closeMenu({ skipFocus: true });
});
// End Section: FH mobile navigation toggle

// Section: FH mobile search row scroll hide/show
fhOnReady(function () {
  const header = document.querySelector('[data-fh-header-root]');

  if (!header) return;

  if (!header.querySelector('.fh-header__search-area')) return;

  const mobileMedia = window.matchMedia('(max-width: 991.98px)');
  const SCROLL_THRESHOLD = 40;
  const raf =
    typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : function (callback) { return window.setTimeout(callback, 16); };
  let lastScrollY = window.pageYOffset || 0;
  let downDistance = 0;
  let upDistance = 0;
  let isHidden = false;
  let ticking = false;
  let lastToggleAt = Date.now();
  const TOGGLE_DEBOUNCE_MS = 180;

  function showRow() {
    if (!isHidden) return;

    header.classList.remove('fh-header--search-hidden');
    isHidden = false;
    lastToggleAt = Date.now();
  }

  function hideRow() {
    if (isHidden) return;

    header.classList.add('fh-header--search-hidden');
    isHidden = true;
    lastToggleAt = Date.now();
  }

  function resetTracking(scrollPosition) {
    downDistance = 0;
    upDistance = 0;
    lastScrollY = typeof scrollPosition === 'number' ? scrollPosition : window.pageYOffset || 0;
  }

  function handleScrollFrame() {
    ticking = false;

    if (!mobileMedia.matches) {
      showRow();
      resetTracking(window.pageYOffset || 0);
      return;
    }

    const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
    const delta = currentScroll - lastScrollY;

    if (currentScroll <= 0) {
      showRow();
      resetTracking(0);
      return;
    }

    const timeSinceLastToggle = Date.now() - lastToggleAt;

    if (timeSinceLastToggle < TOGGLE_DEBOUNCE_MS) {
      lastScrollY = currentScroll;
      return;
    }

    if (delta > 0) {
      downDistance += delta;
      upDistance = 0;

      if (!isHidden && downDistance >= SCROLL_THRESHOLD) hideRow();
    } else if (delta < 0) {
      upDistance += Math.abs(delta);
      downDistance = 0;

      if (isHidden && upDistance >= SCROLL_THRESHOLD) showRow();
    }

    lastScrollY = currentScroll;
  }

  function handleScroll() {
    if (ticking) return;

    ticking = true;
    raf(handleScrollFrame);
  }

  function handleMediaChange(event) {
    if (event && event.matches === false) {
      showRow();
    }

    resetTracking(window.pageYOffset || 0);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  if (typeof mobileMedia.addEventListener === 'function') mobileMedia.addEventListener('change', handleMediaChange); else if (typeof mobileMedia.addListener === 'function') {
    mobileMedia.addListener(handleMediaChange);
  }

  handleMediaChange(mobileMedia);
});
// End Section: FH mobile search row scroll hide/show

// Section: FH desktop navigation highlight & selection behaviour
fhOnReady(function () {
  const header = document.querySelector('[data-fh-header-root]');

  if (!header) return;

  const nav = header.querySelector('.fh-header__nav');
  const surface = nav ? nav.querySelector('[data-fh-desktop-nav-surface]') : null;
  const navList = surface ? surface.querySelector('.fh-header__nav-list') : null;

  if (!nav || !surface || !navList) return;

  const navItems = Array.prototype.slice.call(navList.querySelectorAll('.fh-header__nav-item'));

  if (navItems.length === 0) return;

  const desktopMedia = window.matchMedia('(min-width: 992px)');
  const raf =
    typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : function (callback) {
          return window.setTimeout(callback, 16);
        };
  const cancelRaf =
    typeof window.cancelAnimationFrame === 'function'
      ? window.cancelAnimationFrame.bind(window)
      : window.clearTimeout;

  let selectedItem = null;
  let currentOpenItem = null;
  let outsideHandlersBound = false;
  let highlightFrame = null;
  let pendingHighlightItem = null;

  function isDesktop() {
    return desktopMedia.matches;
  }

  function getLink(item) {
    if (!item) return null;

    const link = item.querySelector('.fh-header__nav-link');

    return link instanceof HTMLElement ? link : null;
  }

  function getDropdown(item) {
    if (!item) return null;

    const dropdown = item.querySelector('.fh-header__dropdown');

    return dropdown instanceof HTMLElement ? dropdown : null;
  }

  function setExpanded(item, expanded) {
    if (!item) return;

    const shouldExpand = !!expanded;

    item.classList.toggle('is-open', shouldExpand);

    const link = getLink(item);

    if (link) link.setAttribute('aria-expanded', shouldExpand ? 'true' : 'false');

    const dropdown = getDropdown(item);

    if (dropdown) dropdown.setAttribute('aria-hidden', shouldExpand ? 'false' : 'true');
  }

  function clearHighlight() {
    if (highlightFrame != null) {
      cancelRaf(highlightFrame);
      highlightFrame = null;
    }

    pendingHighlightItem = null;

    surface.style.setProperty('--fh-nav-highlight-opacity', '0');
    surface.style.setProperty('--fh-nav-highlight-width', '0px');
  }

  function applyHighlightForItem(item) {
    if (!isDesktop() || !item) {
      clearHighlight();
      return;
    }

    const link = getLink(item);

    if (!link) {
      clearHighlight();
      return;
    }

    const surfaceRect = surface.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    if (surfaceRect.width <= 0 || linkRect.width <= 0) {
      clearHighlight();
      return;
    }

    const horizontalPadding = 24;
    let width = linkRect.width + horizontalPadding;
    let offset = linkRect.left - surfaceRect.left - horizontalPadding / 2;
    const maxWidth = surfaceRect.width;

    if (offset < 0) {
      width += offset;
      offset = 0;
    }

    if (offset + width > maxWidth) {
      width = maxWidth - offset;
    }

    width = Math.max(0, width);

    surface.style.setProperty('--fh-nav-highlight-width', width.toFixed(2) + 'px');
    surface.style.setProperty('--fh-nav-highlight-x', offset.toFixed(2) + 'px');
    surface.style.setProperty('--fh-nav-highlight-opacity', '1');
  }

  function requestHighlight(item) {
    pendingHighlightItem = item;

    if (!isDesktop()) {
      clearHighlight();
      return;
    }

    if (highlightFrame != null) return;

    highlightFrame = raf(function () {
      highlightFrame = null;
      applyHighlightForItem(pendingHighlightItem);
    });
  }

  function openItem(item) {
    if (currentOpenItem === item) {
      requestHighlight(currentOpenItem || selectedItem || null);
      return;
    }

    if (currentOpenItem) setExpanded(currentOpenItem, false);

    currentOpenItem = item || null;

    if (currentOpenItem) setExpanded(currentOpenItem, true);

    requestHighlight(currentOpenItem || selectedItem || null);
  }

  function closeCurrentItem() {
    if (!currentOpenItem) return;

    setExpanded(currentOpenItem, false);
    currentOpenItem = null;
  }

  function collapseNav() {
    if (selectedItem) {
      const previousSelected = selectedItem;

      selectItem(null);

      return previousSelected;
    }

    if (currentOpenItem) {
      const previousOpen = currentOpenItem;

      closeCurrentItem();
      requestHighlight(null);

      return previousOpen;
    }

    return null;
  }

  function bindOutsideHandlers() {
    if (outsideHandlersBound) return;

    document.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    document.addEventListener('keydown', handleKeydown);
    outsideHandlersBound = true;
  }

  function unbindOutsideHandlers() {
    if (!outsideHandlersBound) return;

    document.removeEventListener('click', handleDocumentClick, true);
    window.removeEventListener('scroll', handleWindowScroll);
    document.removeEventListener('keydown', handleKeydown);
    outsideHandlersBound = false;
  }

  function selectItem(item) {
    if (selectedItem === item) return;

    if (selectedItem) selectedItem.classList.remove('is-selected');

    selectedItem = item || null;

    if (selectedItem) {
      selectedItem.classList.add('is-selected');
      nav.classList.add('fh-header__nav--locked');
      openItem(selectedItem);
      bindOutsideHandlers();
    } else {
      nav.classList.remove('fh-header__nav--locked');
      unbindOutsideHandlers();
      closeCurrentItem();
      requestHighlight(null);
    }
  }

  function handleDocumentClick(event) {
    if (!isDesktop()) return;

    if (nav.contains(event.target)) return;

    collapseNav();
  }

  function handleWindowScroll() {
    if (!isDesktop()) return;

    collapseNav();
  }

  function handleKeydown(event) {
    if (!isDesktop()) return;

    if (event.key === 'Escape' || event.key === 'Esc') {
      const focusSource = collapseNav();

      if (focusSource) {
        const link = getLink(focusSource);

        if (link && typeof link.focus === 'function') link.focus();
      }
    }
  }

  function handleMediaChange(event) {
    if (!event.matches) {
      if (selectedItem) selectedItem.classList.remove('is-selected');

      selectedItem = null;
      nav.classList.remove('fh-header__nav--locked');
      closeCurrentItem();
      unbindOutsideHandlers();
      clearHighlight();

      navItems.forEach(function (item) {
        setExpanded(item, false);
      });

      return;
    }

    navItems.forEach(function (item) {
      const dropdown = getDropdown(item);

      if (dropdown) dropdown.setAttribute('aria-hidden', item === currentOpenItem ? 'false' : 'true');
    });

    requestHighlight(selectedItem || currentOpenItem || null);
  }

  function handleResize() {
    if (!isDesktop()) return;

    if (currentOpenItem || selectedItem) requestHighlight(currentOpenItem || selectedItem);
  }

  navItems.forEach(function (item) {
    item.classList.remove('is-open');
    item.classList.remove('is-selected');

    const link = getLink(item);
    const dropdown = getDropdown(item);

    if (link) link.setAttribute('aria-expanded', 'false');
    if (dropdown) dropdown.setAttribute('aria-hidden', 'true');

    item.addEventListener('mouseenter', function () {
      if (!isDesktop()) return;

      if (selectedItem && selectedItem !== item) return;

      openItem(item);
    });

    if (link) {
      link.addEventListener('focus', function () {
        if (!isDesktop()) return;

        if (selectedItem && selectedItem !== item) return;

        openItem(item);
      });

      link.addEventListener('click', function (event) {
        if (!isDesktop()) return;

        if (event.button && event.button !== 0) return;

        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        if (selectedItem !== item) {
          event.preventDefault();
          selectItem(item);
        }
      });
    }
  });

  nav.addEventListener('mouseleave', function (event) {
    if (!isDesktop()) return;

    if (event && event.relatedTarget && nav.contains(event.relatedTarget)) return;

    if (selectedItem) {
      openItem(selectedItem);
      return;
    }

    closeCurrentItem();
    requestHighlight(null);
  });

  nav.addEventListener('focusout', function () {
    if (!isDesktop()) return;

    window.setTimeout(function () {
      if (nav.contains(document.activeElement)) return;

      if (selectedItem) {
        openItem(selectedItem);
      } else {
        closeCurrentItem();
        requestHighlight(null);
      }
    }, 0);
  });

  if (typeof desktopMedia.addEventListener === 'function') desktopMedia.addEventListener('change', handleMediaChange);
  else if (typeof desktopMedia.addListener === 'function') desktopMedia.addListener(handleMediaChange);

  window.addEventListener('resize', handleResize);

  handleMediaChange(desktopMedia);
});
// End Section: FH desktop navigation highlight & selection behaviour
