// FH Wishlist Enhancements

// Section: FH wish list flyout preview
fhOnReady(function () {
  const container = document.querySelector('[data-fh-wishlist-menu-container]');

  if (!container) return;

  const toggleButton = container.querySelector('[data-fh-wishlist-menu-toggle]');
  const menu = container.querySelector('[data-fh-wishlist-menu]');
  const list = container.querySelector('[data-fh-wishlist-menu-list]');
  const loadingIndicator = container.querySelector('[data-fh-wishlist-menu-loading]');
  const emptyState = container.querySelector('[data-fh-wishlist-menu-empty]');
  const errorState = container.querySelector('[data-fh-wishlist-menu-error]');

  if (!toggleButton || !menu || !list) return;

  let isOpen = false;
  let hasLoadedOnce = false;
  let hasSubscribedToStore = false;
  let wishListUpdateVersion = 0;
  const pendingWishListUpdateWaiters = [];
  const relevantWishListMutations = (function () {
    const baseMutationNames = [
      'setWishListItems',
      'removeWishListItem',
      'addWishListItemToIndex',
      'setWishListIds'
    ];

    return baseMutationNames.concat(baseMutationNames.map(function (name) {
      return 'wishList/' + name;
    }));
  })();

  function getVueStore() {
    if (window.vueApp && window.vueApp.$store) return window.vueApp.$store;

    if (window.ceresStore && typeof window.ceresStore.dispatch === 'function') return window.ceresStore;

    return null;
  }

  function getLocale() {
    if (window.App) {
      if (App.locale) return App.locale.replace('_', '-');

      if (App.defaultLanguage) return App.defaultLanguage.replace('_', '-');
    }

    return 'de-DE';
  }

  const formatPrice = (function () {
    let formatter = null;
    let formatterKey = '';

    return function (value) {
      const currency = (window.App && (App.activeCurrency || App.currency)) || 'EUR';
      const locale = getLocale();
      const key = locale + '::' + currency;

      if (!formatter || formatterKey !== key) {
        formatter = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        formatterKey = key;
      }

      const amount = typeof value === 'number' ? value : parseFloat(value);

      if (!isFinite(amount)) return formatter.format(0);

      return formatter.format(amount);
    };
  })();

  function resolveStoreAction(store, actionNames) {
    if (!store || !store._actions) return null;

    for (let index = 0; index < actionNames.length; index += 1) {
      const name = actionNames[index];

      if (store._actions[name]) return name;
    }

    return null;
  }

  function notifyWishListUpdated(items) {
    const normalizedItems = Array.isArray(items) ? items : [];
    hasLoadedOnce = true;
    wishListUpdateVersion += 1;
    updateList(normalizedItems);

    if (!pendingWishListUpdateWaiters.length) return;

    const currentVersion = wishListUpdateVersion;
    const waiters = pendingWishListUpdateWaiters.splice(0);

    waiters.forEach(function (waiter) {
      if (waiter.timeoutId) window.clearTimeout(waiter.timeoutId);

      try {
        waiter.resolve({ items: normalizedItems, version: currentVersion });
      } catch (error) {
        // Ignore errors thrown inside resolver handlers
      }
    });
  }

  function waitForNextWishListUpdate(timeoutMs) {
    const versionAtRegistration = wishListUpdateVersion;

    return new Promise(function (resolve, reject) {
      if (wishListUpdateVersion > versionAtRegistration) {
        resolve({
          version: wishListUpdateVersion
        });
        return;
      }

      const waiter = {
        resolve: resolve,
        reject: reject,
        timeoutId: null
      };

      if (typeof timeoutMs === 'number' && timeoutMs > 0) {
        waiter.timeoutId = window.setTimeout(function () {
          const index = pendingWishListUpdateWaiters.indexOf(waiter);

          if (index !== -1) pendingWishListUpdateWaiters.splice(index, 1);

          reject(new Error('timeout'));
        }, timeoutMs);
      }

      pendingWishListUpdateWaiters.push(waiter);
    });
  }

  function showLoading(isLoading) {
    if (loadingIndicator) loadingIndicator.style.display = isLoading ? 'block' : 'none';
  }

  function showEmptyState(isEmpty) {
    if (emptyState) emptyState.style.display = isEmpty ? 'block' : 'none';
  }

  function showError(message) {
    if (!errorState) return;

    if (message) {
      errorState.textContent = message;
      errorState.style.display = 'block';
    } else {
      errorState.style.display = 'none';
    }
  }

  function getItemUrl(item) {
    if (!item || !item.texts) return '#';

    const enableOldUrlPattern = window.App && App.config && App.config.global && App.config.global.enableOldUrlPattern;
    const trailingSlash = window.App && App.urlTrailingSlash;
    const defaultLanguage = window.App && App.defaultLanguage;

    let link = '';
    const urlPath = item.texts.urlPath || '';
    const includeLanguage = item.texts.lang && defaultLanguage && item.texts.lang !== defaultLanguage;

    if (!urlPath || urlPath.charAt(0) !== '/') link = '/';

    if (includeLanguage) link += item.texts.lang + '/';

    if (urlPath) link += urlPath;

    let suffix = '';

    if (enableOldUrlPattern) suffix = '/a-' + (item.item && item.item.id ? item.item.id : ''); else if (item.item && item.variation && item.item.id && item.variation.id) {
      suffix = '_' + item.item.id + '_' + item.variation.id;
    } else if (item.item && item.item.id) {
      suffix = '_' + item.item.id;
    }

    if (trailingSlash) {
      if (link.length > 1 && link.charAt(link.length - 1) === '/') link = link.substring(0, link.length - 1);
    }

    if (link.endsWith(suffix)) return trailingSlash ? link + '/' : link;

    return link + suffix + (trailingSlash ? '/' : '');
  }

  function getPrimaryImage(item) {
    const images = item && item.images ? item.images : null;

    if (!images) return null;

    const collection = Array.isArray(images.variation) && images.variation.length
      ? images.variation
      : (Array.isArray(images.all) ? images.all : []);

    if (!collection.length) return null;

    const sorted = collection.slice().sort(function (a, b) {
      const posA = typeof a.position === 'number' ? a.position : 0;
      const posB = typeof b.position === 'number' ? b.position : 0;
      return posA - posB;
    });

    const candidate = sorted[0] || collection[0];

    if (!candidate) return null;

    const url = candidate.urlPreview || candidate.urlMiddle || candidate.urlSecondPreview || candidate.url;
    const alt = (candidate.names && (candidate.names.alternate || candidate.names.name)) || '';

    return {
      url: url,
      alt: alt || (item && item.texts ? item.texts.name1 : '')
    };
  }

  function getRemoveWishListActionName(store) {
    return resolveStoreAction(store, ['wishList/removeWishListItem', 'removeWishListItem']);
  }

  function resolveWishlistShowNetPreference(override) {
    if (override === true || override === false) return override;

    if (typeof document !== 'undefined' && document.documentElement) {
      const attribute = document.documentElement.getAttribute('data-fh-show-net-prices');

      if (attribute === 'net') return true;
      if (attribute === 'gross') return false;
    }

    if (typeof window !== 'undefined' && window.App && window.App.initialData) {
      const initial = window.App.initialData;

      if (initial && initial.showNetPrices === true) return true;
      if (initial && initial.showNetPrices === false) return false;
    }

    return false;
  }

  function pickNumericCandidate(source, keys) {
    if (!source || typeof source !== 'object' || !Array.isArray(keys)) return null;

    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];

      if (!key) continue;

      const value = source[key];

      if (typeof value === 'number' && isFinite(value)) return value;
    }

    return null;
  }

  function getPrimaryPriceContainer(item) {
    if (!item || !item.prices) return null;

    const prices = item.prices;
    const preferred = [prices.specialOffer, prices.default];

    for (let idx = 0; idx < preferred.length; idx += 1) {
      const candidate = preferred[idx];

      if (candidate && typeof candidate === 'object') return candidate;
    }

    return null;
  }

  function pickUnitPriceValue(container, showNet) {
    if (!container || typeof container !== 'object') return null;

    const data = container.data && typeof container.data === 'object' ? container.data : null;
    const unitPrice = container.unitPrice && typeof container.unitPrice === 'object' ? container.unitPrice : null;
    const preferenceOrder = showNet ? ['unitPriceNet', 'unitPrice'] : ['unitPrice', 'unitPriceNet'];
    const extendedOrder = showNet ? preferenceOrder.concat(['net', 'value', 'gross']) : preferenceOrder.concat(['value', 'gross', 'net']);

    if (data) {
      const dataValue = pickNumericCandidate(data, preferenceOrder);

      if (dataValue !== null) return dataValue;
    }

    if (unitPrice) {
      const unitPriceValue = pickNumericCandidate(unitPrice, extendedOrder);

      if (unitPriceValue !== null) return unitPriceValue;
    }

    if (container.price && typeof container.price === 'object') {
      const priceValue = pickNumericCandidate(container.price, extendedOrder);

      if (priceValue !== null) return priceValue;
    }

    return null;
  }

  function getUnitPrice(item, showNetOverride) {
    if (!item || !item.prices) return 0;

    const showNet = resolveWishlistShowNetPreference(showNetOverride);
    const container = getPrimaryPriceContainer(item);
    const value = pickUnitPriceValue(container, showNet);

    if (typeof value === 'number' && isFinite(value)) return value;

    if (container && container.unitPrice && typeof container.unitPrice.value === 'number') return container.unitPrice.value;

    if (container && container.price && typeof container.price.value === 'number') return container.price.value;

    if (item.prices.default && item.prices.default.unitPrice && typeof item.prices.default.unitPrice.value === 'number') return item.prices.default.unitPrice.value;

    return 0;
  }

  function getQuantityDefaults(item) {
    const min = item && item.variation && item.variation.minimumOrderQuantity ? item.variation.minimumOrderQuantity : 1;
    const interval = item && item.variation && item.variation.intervalOrderQuantity ? item.variation.intervalOrderQuantity : 1;
    let quantity = Math.max(min, interval);

    if (quantity % interval !== 0) {
      const multiplier = Math.ceil(quantity / interval);
      quantity = multiplier * interval;
    }

    return {
      min: min,
      interval: interval,
      quantity: quantity,
      max: item && item.variation && item.variation.maximumOrderQuantity ? item.variation.maximumOrderQuantity : null
    };
  }

  function isSaleable(item) {
    if (!item || !item.filter) return true;

    if (Object.prototype.hasOwnProperty.call(item.filter, 'isSalable')) return !!item.filter.isSalable;

    return true;
  }

  function clearList() {
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
  }

  function updateWishlistPriceDisplays(showNetOverride) {
    if (!list) return;

    const showNet = resolveWishlistShowNetPreference(showNetOverride);

    const runUpdate = function () {
      const priceElements = list.querySelectorAll('[data-fh-wishlist-price]');

      priceElements.forEach(function (element) {
        if (!element || !element.__fhWishlistItem) return;

        const item = element.__fhWishlistItem;
        element.textContent = formatPrice(getUnitPrice(item, showNet));
      });

    };

    runUpdate();

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(runUpdate);
    }
  }

  function updateList(documents) {
    clearList();

    const items = Array.isArray(documents) ? documents : [];
    const showNet = resolveWishlistShowNetPreference();

    if (!items.length) { showEmptyState(true); return; }

    showEmptyState(false);

    items.forEach(function (documentItem) {
      const item = documentItem && documentItem.data ? documentItem.data : null;

      if (!item) return;

      const url = getItemUrl(item);
      const image = getPrimaryImage(item);
      const li = document.createElement('li');
      li.style.display = 'grid';
      li.style.gridTemplateColumns = '60px 1fr';
      li.style.columnGap = '12px';
      li.style.rowGap = '6px';
      li.style.alignItems = 'flex-start';
      li.style.padding = '8px 0';
      li.style.borderBottom = '1px solid #e2e8f0';

      const imageLink = document.createElement('a');
      imageLink.href = url;
      imageLink.style.display = 'block';
      imageLink.style.width = '60px';
      imageLink.style.height = '60px';
      imageLink.style.borderRadius = '10px';
      imageLink.style.overflow = 'hidden';
      imageLink.style.backgroundColor = 'var(--fh-color-light-blue)';
      imageLink.style.gridRow = '1 / span 3';
      imageLink.style.alignSelf = 'start';

      if (image && image.url) {
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.alt || '';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        imageLink.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.textContent = 'Kein Bild';
        placeholder.style.fontSize = '11px';
        placeholder.style.color = '#94a3b8';
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.style.width = '100%';
        placeholder.style.height = '100%';
        imageLink.appendChild(placeholder);
      }

      const details = document.createElement('div');
      details.style.display = 'flex';
      details.style.flexDirection = 'column';
      details.style.gap = '4px';
      details.style.minWidth = '0';
      details.style.gridColumn = '2 / 3';

      const nameLink = document.createElement('a');
      nameLink.href = url;
      nameLink.textContent = item && item.texts && item.texts.name1 ? item.texts.name1 : 'Artikel';
      nameLink.style.display = 'block';
      nameLink.style.fontSize = '13px';
      nameLink.style.fontWeight = '600';
      nameLink.style.color = 'var(--fh-color-navy-blue)';
      nameLink.style.textDecoration = 'none';
      nameLink.style.lineHeight = '1.35';
      nameLink.style.wordBreak = 'break-word';

      const headerRow = document.createElement('div');
      headerRow.style.display = 'flex';
      headerRow.style.alignItems = 'flex-start';
      headerRow.style.gap = '8px';

      const nameWrapper = document.createElement('div');
      nameWrapper.style.flex = '1';
      nameWrapper.style.minWidth = '0';
      nameWrapper.appendChild(nameLink);

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'btn btn-sm text-danger p-0';
      removeButton.style.display = 'inline-flex';
      removeButton.style.alignItems = 'center';
      removeButton.style.justifyContent = 'center';
      removeButton.style.width = '28px';
      removeButton.style.height = '28px';
      removeButton.style.border = '1px solid #f1f5f9';
      removeButton.style.borderRadius = '8px';
      removeButton.style.backgroundColor = '#ffffff';
      removeButton.style.color = '#dc2626';
      removeButton.style.flex = '0 0 auto';
      removeButton.style.transition = 'border-color 0.2s ease, background-color 0.2s ease';
      removeButton.setAttribute('aria-label', 'Artikel von der Merkliste entfernen');

      const removeIcon = document.createElement('i');
      removeIcon.className = 'fa fa-trash-o default-float';
      removeIcon.setAttribute('aria-hidden', 'true');
      removeButton.appendChild(removeIcon);

      headerRow.appendChild(nameWrapper);
      headerRow.appendChild(removeButton);

      const priceLine = document.createElement('div');
      priceLine.style.display = 'flex';
      priceLine.style.alignItems = 'baseline';
      priceLine.style.gap = '6px';
      priceLine.style.marginTop = '0';

      const priceValue = document.createElement('strong');
      priceValue.className = 'fh-wishlist-item-price';
      priceValue.setAttribute('data-fh-wishlist-price', 'unit');
      priceValue.__fhWishlistItem = item;
      priceValue.textContent = formatPrice(getUnitPrice(item, showNet));
      priceValue.style.whiteSpace = 'nowrap';

      priceLine.appendChild(priceValue);

      const actionRow = document.createElement('div');
      actionRow.style.display = 'flex';
      actionRow.style.alignItems = 'center';
      actionRow.style.gap = '10px';
      actionRow.style.flexWrap = 'nowrap';

      const addToCartButton = document.createElement('button');
      addToCartButton.type = 'button';
      addToCartButton.textContent = 'In den Warenkorb';
      addToCartButton.className = 'btn btn-primary btn-appearance';
      addToCartButton.style.flex = '1 1 auto';
      addToCartButton.style.minWidth = '0';
      addToCartButton.style.height = '34px';
      addToCartButton.style.padding = '0 12px';
      addToCartButton.style.fontSize = '12px';
      addToCartButton.style.fontWeight = '600';
      addToCartButton.style.borderRadius = '10px';
      addToCartButton.style.whiteSpace = 'nowrap';

      const quantityDefaults = getQuantityDefaults(item);
      let currentQuantity = quantityDefaults.quantity;

      const minQuantity = Math.max(quantityDefaults.min || quantityDefaults.interval || 1, quantityDefaults.interval || 1);
      const intervalQuantity = quantityDefaults.interval || 1;
      const maxQuantity = quantityDefaults.max && quantityDefaults.max > 0 ? quantityDefaults.max : null;

      function getDecimalPlaces(value) {
        if (typeof value !== 'number' || !isFinite(value)) return 0;

        const parts = value.toString().split('.');

        if (parts.length < 2) return 0;

        return parts[1].length;
      }

      const quantityPrecision = Math.min(6, Math.max(getDecimalPlaces(minQuantity), getDecimalPlaces(intervalQuantity)));

      const quantityWrapper = document.createElement('div');
      quantityWrapper.className = 'fh-wishlist-qty-wrapper';

      const qtyBox = document.createElement('div');
      qtyBox.className = 'qty-box fh-wishlist-qty-box';

      const decreaseButton = document.createElement('button');
      decreaseButton.type = 'button';
      decreaseButton.className = 'qty-btn fh-wishlist-qty-btn';
      decreaseButton.setAttribute('aria-label', 'Menge verringern');
      decreaseButton.setAttribute('data-testing', 'quantity-btn-decrease');
      decreaseButton.textContent = '−';

      const quantityInput = document.createElement('input');
      quantityInput.className = 'qty-input fh-wishlist-qty-input';
      quantityInput.type = 'text';
      quantityInput.setAttribute('aria-label', 'Menge wählen');
      quantityInput.setAttribute('inputmode', quantityPrecision > 0 ? 'decimal' : 'numeric');
      quantityInput.disabled = !isSaleable(item);

      const increaseButton = document.createElement('button');
      increaseButton.type = 'button';
      increaseButton.className = 'qty-btn fh-wishlist-qty-btn';
      increaseButton.setAttribute('aria-label', 'Menge erhöhen');
      increaseButton.setAttribute('data-testing', 'quantity-btn-increase');
      increaseButton.textContent = '+';

      const quantityControls = document.createElement('div');
      quantityControls.className = 'qty-controls fh-wishlist-qty-controls';

      function formatQuantityDisplay(value) {
        if (Number.isInteger(value)) return String(value);

        if (quantityPrecision > 0) {
          const fixed = value.toFixed(quantityPrecision);
          const trimmed = parseFloat(fixed).toString();
          return trimmed.replace('.', ',');
        }

        return value.toString().replace('.', ',');
      }

      function normalizeQuantity(value) {
        let numeric = typeof value === 'number' && isFinite(value)
          ? value
          : parseFloat(String(value).replace(',', '.'));

        if (!isFinite(numeric) || numeric <= 0) numeric = minQuantity;

        if (numeric < minQuantity) numeric = minQuantity;

        if (maxQuantity && numeric > maxQuantity) numeric = maxQuantity;

        const steps = Math.ceil((numeric - minQuantity) / intervalQuantity);
        const adjusted = minQuantity + Math.max(0, steps) * intervalQuantity;

        if (maxQuantity && adjusted > maxQuantity) {
          const maxSteps = Math.floor((maxQuantity - minQuantity) / intervalQuantity);
          const limited = maxSteps >= 0 ? minQuantity + maxSteps * intervalQuantity : minQuantity;
          return quantityPrecision > 0 ? parseFloat(limited.toFixed(quantityPrecision)) : limited;
        }

        return quantityPrecision > 0 ? parseFloat(adjusted.toFixed(quantityPrecision)) : adjusted;
      }

      function setButtonState(button, isDisabled) {
        button.disabled = isDisabled;

        if (isDisabled) button.classList.add('disabled'); else {
          button.classList.remove('disabled');
        }
      }

      function updateQuantity(newQuantity) {
        currentQuantity = newQuantity;
        quantityInput.value = formatQuantityDisplay(currentQuantity);

        const isAtMinimum = currentQuantity - intervalQuantity < minQuantity;
        const isAtMaximum = maxQuantity ? currentQuantity + intervalQuantity > maxQuantity : false;

        setButtonState(decreaseButton, isAtMinimum || !isSaleable(item));
        setButtonState(increaseButton, (isAtMaximum && !!maxQuantity) || !isSaleable(item));
      }

      increaseButton.addEventListener('click', function (event) {
        event.preventDefault();

        if (!isSaleable(item)) return;

        let candidate = currentQuantity + intervalQuantity;

        if (maxQuantity && candidate > maxQuantity) candidate = maxQuantity;

        updateQuantity(normalizeQuantity(candidate));
      });

      decreaseButton.addEventListener('click', function (event) {
        event.preventDefault();

        if (!isSaleable(item)) return;

        let candidate = currentQuantity - intervalQuantity;

        if (candidate < minQuantity) candidate = minQuantity;

        updateQuantity(normalizeQuantity(candidate));
      });

      quantityInput.addEventListener('change', function () {
        updateQuantity(normalizeQuantity(quantityInput.value));
      });

      quantityInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          quantityInput.blur();
        }
      });

      if (!isSaleable(item)) {
        addToCartButton.disabled = true;
        addToCartButton.textContent = 'Nicht verfügbar';
        addToCartButton.classList.add('disabled');
        setButtonState(decreaseButton, true);
        setButtonState(increaseButton, true);
      }

      addToCartButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (addToCartButton.disabled) return;

        const store = getVueStore();
        const actionName = resolveStoreAction(store, ['basket/addBasketItem', 'addBasketItem']);

        if (!store || !actionName) { window.location.href = url; return; }

        const variationId = item.variation && item.variation.id ? item.variation.id : null;

        if (!variationId) { window.location.href = url; return; }

        const originalText = addToCartButton.textContent;
        addToCartButton.disabled = true;
        addToCartButton.classList.add('disabled');
        addToCartButton.textContent = 'Wird hinzugefügt…';

        const payload = {
          variationId: variationId,
          quantity: currentQuantity
        };

        store.dispatch(actionName, payload)
          .then(function () {
            addToCartButton.textContent = 'Im Warenkorb';
            setTimeout(function () {
              addToCartButton.disabled = false;
              addToCartButton.classList.remove('disabled');
              addToCartButton.textContent = originalText;
            }, 1600);
          })
          .catch(function () {
            addToCartButton.textContent = 'Fehler';
            setTimeout(function () {
              addToCartButton.disabled = false;
              addToCartButton.classList.remove('disabled');
              addToCartButton.textContent = originalText;
            }, 2000);
          });
      });

      qtyBox.appendChild(quantityInput);
      quantityControls.appendChild(increaseButton);
      quantityControls.appendChild(decreaseButton);
      qtyBox.appendChild(quantityControls);
      quantityWrapper.appendChild(qtyBox);

      updateQuantity(normalizeQuantity(currentQuantity));

      removeButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        const store = getVueStore();
        const actionName = getRemoveWishListActionName(store);

        if (!store || !actionName) return;

        const variationId = item && item.variation && item.variation.id ? item.variation.id : null;

        if (!variationId) return;

        const stateItems = store.state && store.state.wishList && Array.isArray(store.state.wishList.wishListItems)
          ? store.state.wishList.wishListItems
          : [];
        const itemIndex = stateItems.findIndex(function (stateItem) {
          return stateItem && stateItem.id === documentItem.id;
        });

        const originalIconClass = removeIcon.className;
        removeButton.disabled = true;
        removeButton.classList.add('disabled');
        removeIcon.className = 'fa fa-spinner fa-spin default-float';
        removeButton.setAttribute('aria-busy', 'true');

        store.dispatch(actionName, {
          id: variationId,
          wishListItem: documentItem,
          index: itemIndex
        }).catch(function () {
          removeButton.disabled = false;
          removeButton.classList.remove('disabled');
          removeIcon.className = originalIconClass;
          removeButton.removeAttribute('aria-busy');
        }).then(function () {
          removeButton.removeAttribute('aria-busy');
        });
      });

      actionRow.appendChild(quantityWrapper);
      actionRow.appendChild(addToCartButton);

      details.appendChild(headerRow);
      details.appendChild(priceLine);

      details.appendChild(actionRow);

      li.appendChild(imageLink);
      li.appendChild(details);

      list.appendChild(li);
    });

    updateWishlistPriceDisplays(showNet);

    if (list.lastElementChild) list.lastElementChild.style.borderBottom = 'none';
  }

  function subscribeToWishList(store) {
    if (!store || typeof store.subscribe !== 'function' || hasSubscribedToStore) return;

    store.subscribe(function (mutation, state) {
      if (!mutation || !mutation.type) return;

      if (relevantWishListMutations.indexOf(mutation.type) === -1) return;

      const items = state && state.wishList && state.wishList.wishListItems ? state.wishList.wishListItems : [];
      notifyWishListUpdated(items);
    });

    hasSubscribedToStore = true;
  }

  function loadWishListItems() {
    return new Promise(function (resolve, reject) {
      const store = getVueStore();

      if (!store) {
        showLoading(false);
        showError('Merkliste konnte nicht geladen werden. Bitte versuchen Sie es erneut.');
        reject(new Error('wish-list-store-unavailable'));
        return;
      }

      const actionName = resolveStoreAction(store, ['wishList/initWishListItems', 'initWishListItems']);

      subscribeToWishList(store);

      showLoading(true);
      showError('');

      if (!actionName) {
        const items = store.state && store.state.wishList && store.state.wishList.wishListItems
          ? store.state.wishList.wishListItems
          : [];
        notifyWishListUpdated(items);
        showLoading(false);
        resolve(items);
        return;
      }

      store.dispatch(actionName)
        .then(function (result) {
          let documents = [];

          if (Array.isArray(result)) documents = result; else if (result && Array.isArray(result.documents)) {
            documents = result.documents;
          } else if (store.state && store.state.wishList && Array.isArray(store.state.wishList.wishListItems)) {
            documents = store.state.wishList.wishListItems;
          }

          notifyWishListUpdated(documents);
          showLoading(false);
          resolve(documents);
        })
        .catch(function (error) {
          showError('Merkliste konnte nicht geladen werden. Bitte versuchen Sie es erneut.');
          showLoading(false);
          reject(error);
        });
    });
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

  function openMenu() {
    if (isOpen) return;

    if (window.fhAccountMenu && typeof window.fhAccountMenu.close === 'function') window.fhAccountMenu.close();

    menu.style.display = 'block';
    menu.setAttribute('aria-hidden', 'false');
    toggleButton.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeydown);
    isOpen = true;
  }

  function openMenuWithOptions(options) {
    const config = options || {};
    const refresh = typeof config.refresh === 'boolean' ? config.refresh : !hasLoadedOnce;
    const delay = typeof config.delay === 'number' && config.delay > 0 ? config.delay : 0;
    const focusToggle = config.focusToggle === true;

    function finalizeOpen() {
      if (!isOpen) openMenu(); else if (focusToggle) {
        toggleButton.focus();
      }
    }

    function executeOpen() {
      if (refresh) {
        return loadWishListItems()
          .catch(function () {
            return null;
          })
          .then(function () {
            finalizeOpen();
          });
      }

      finalizeOpen();
      return Promise.resolve();
    }

    if (delay) {
      return new Promise(function (resolve) {
        window.setTimeout(function () {
          executeOpen().then(resolve).catch(resolve);
        }, delay);
      });
    }

    return executeOpen();
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

  toggleButton.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (isOpen) closeMenu(); else {
      openMenuWithOptions();
    }
  });

  menu.addEventListener('click', function (event) {
    event.stopPropagation();
  });

  document.addEventListener('click', function (event) {
    const wishlistButton = event.target.closest('.widget.widget-add-to-wish-list button, .widget.widget-add-to-wish-list .btn');

    if (!wishlistButton) return;

    const store = getVueStore();

    if (store) subscribeToWishList(store);

    if (!isOpen) {
      showLoading(true);
      openMenuWithOptions({ refresh: false });
    } else {
      showLoading(true);
    }

    const waitPromise = store
      ? waitForNextWishListUpdate(4000)
      : Promise.reject(new Error('wish-list-store-unavailable'));

    waitPromise
      .catch(function () {
        return null;
      })
      .then(function () {
        return loadWishListItems();
      })
      .then(function () {
        return openMenuWithOptions({ refresh: false });
      })
      .catch(function () {
        openMenuWithOptions({ refresh: true });
      });
  });

  window.fhWishlistMenu = window.fhWishlistMenu || {};
  window.fhWishlistMenu.close = closeMenu;
  window.fhWishlistMenu.isOpen = function () {
    return isOpen;
  };
  window.fhWishlistMenu.open = function (options) {
    return openMenuWithOptions(options || {});
  };
  window.fhWishlistMenu.refresh = function () {
    return loadWishListItems();
  };
  window.fhWishlistMenu.updatePrices = function (showNet) {
    updateWishlistPriceDisplays(showNet);
  };
});
// End Section: FH wish list flyout preview

// Section: FH wish list button enhancer
fhOnReady(function () {
  const wishlistHeartSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9a2 2 0 0 1 2 2v16l-6.5-3.5L4 21V5a2 2 0 0 1 2-2z"></path></svg>';
  const addTooltipText = 'Zur Merkliste hinzufügen';
  const removeTooltipText = 'Von der Merkliste entfernen';
  const attributeNames = ['title', 'data-original-title', 'aria-label', 'data-title-add', 'data-title-remove'];
  const stateAttributeNames = ['aria-pressed', 'class', 'data-mode', 'data-added', 'data-in-wish-list'];
  const observerAttributeNames = attributeNames.concat(stateAttributeNames);

  function normalizeTooltipValue(value) {
    if (!value) return value;

    let normalized = value.replace(/wunschliste/gi, 'Merkliste');

    if (/entfern/i.test(normalized)) return removeTooltipText;

    if (/hinzuf[üu]g/i.test(normalized)) return addTooltipText;

    return normalized;
  }

  function ensureWishlistMarkup(button) {
    if (!button) return;

    const legacyIcons = button.querySelectorAll('i');

    legacyIcons.forEach(function (icon) {
      if (!icon || !(icon.classList && icon.classList.contains('fa'))) return;

      if (icon.parentNode) icon.parentNode.removeChild(icon);
    });

    let iconWrapper = button.querySelector('.fh-wishlist-button-icon');

    if (!iconWrapper) {
      iconWrapper = document.createElement('span');
      iconWrapper.className = 'fh-wishlist-button-icon';
      button.insertBefore(iconWrapper, button.firstChild);
    }

    if (iconWrapper.innerHTML !== wishlistHeartSvg) iconWrapper.innerHTML = wishlistHeartSvg;

    let labelWrapper = button.querySelector('.fh-wishlist-button-label');

    if (!labelWrapper) {
      labelWrapper = document.createElement('span');
      labelWrapper.className = 'fh-wishlist-button-label';
      button.appendChild(labelWrapper);
    }

    labelWrapper.textContent = 'Merkliste';

    if (iconWrapper.nextSibling !== labelWrapper) button.insertBefore(labelWrapper, iconWrapper.nextSibling);

    Array.from(button.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) node.parentNode.removeChild(node);
    });

    Array.from(button.children).forEach(function (child) {
      if (child === iconWrapper || child === labelWrapper) return;

      const className = typeof child.className === 'string' ? child.className : '';

      if (/(^|\s)(sr-only|visually-hidden)(\s|$)/i.test(className)) return;

      if (child.getAttribute && child.getAttribute('aria-hidden') === 'true') return;

      if (child.closest('.fh-wishlist-button-icon') || child.closest('.fh-wishlist-button-label')) return;

      child.parentNode.removeChild(child);
    });
  }

  function normalizeWishlistAttributes(button) {
    attributeNames.forEach(function (name) {
      const value = button.getAttribute(name);

      if (typeof value === 'string' && value.length) {
        const normalized = normalizeTooltipValue(value);

        if (normalized !== value) button.setAttribute(name, normalized);
      }
    });

    if (button.getAttribute('data-title-add') !== addTooltipText) button.setAttribute('data-title-add', addTooltipText);

    if (button.getAttribute('data-title-remove') !== removeTooltipText) button.setAttribute('data-title-remove', removeTooltipText);
  }

  function updateWishlistButtonState(button) {
    if (!button) return;

    const stateAttributes = ['title', 'data-original-title', 'aria-label'];
    const hasRemoveText = stateAttributes.some(function (name) {
      const value = button.getAttribute(name);

      return typeof value === 'string' && value.trim() === removeTooltipText;
    });

    const dataMode = (button.getAttribute('data-mode') || '').toLowerCase();
    const dataAdded = (button.getAttribute('data-added') || button.getAttribute('data-in-wish-list') || '').toLowerCase();
    const ariaPressed = button.getAttribute('aria-pressed') === 'true';

    const isActive =
      hasRemoveText ||
      ariaPressed ||
      dataMode === 'remove' ||
      dataAdded === 'true' ||
      button.classList.contains('is-active') ||
      button.classList.contains('is-wish-list-item') ||
      button.classList.contains('is-wish-list') ||
      button.classList.contains('added-to-wish-list');

    button.classList.toggle('fh-wishlist-button--active', isActive);

    const iconWrapper = button.querySelector('.fh-wishlist-button-icon');

    if (iconWrapper) iconWrapper.classList.toggle('fh-wishlist-button-icon--active', isActive);
  }

  function enhanceWishlistButton(button, options) {
    const fromObserver = options && options.fromObserver;

    if (!fromObserver && button.getAttribute('data-fh-wishlist-enhanced') === 'true') return;

    ensureWishlistMarkup(button);
    normalizeWishlistAttributes(button);
    updateWishlistButtonState(button);
    button.setAttribute('data-fh-wishlist-enhanced', 'true');
  }

  function observeWishlistButton(button) {
    if (button.__fhWishlistObserver) return;

    const observer = new MutationObserver(function () {
      enhanceWishlistButton(button, { fromObserver: true });
    });

    observer.observe(button, {
      childList: true,
      subtree: false,
      attributes: true,
      attributeFilter: observerAttributeNames
    });

    button.__fhWishlistObserver = observer;
  }

  function initWishlistButtons(root) {
    const buttons = (root || document).querySelectorAll('.widget.widget-add-to-wish-list .btn');

    buttons.forEach(function (button) {
      enhanceWishlistButton(button);
      observeWishlistButton(button);
    });
  }

  initWishlistButtons(document);

  const body = document.body;

  if (body) {
    const rootObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
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
// End Section: FH wish list button enhancer
