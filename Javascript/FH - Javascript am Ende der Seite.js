// Section: Global scripts for all pages

// Section: FH account menu toggle behaviour
document.addEventListener('DOMContentLoaded', function () {
  function resolveGreeting(defaultGreeting) {
    const hour = new Date().getHours();

    if (hour >= 0 && hour < 10) {
      return 'Guten Morgen,';
    }

    if (hour < 16) {
      return 'Guten Tag,';
    }

    if (hour < 24) {
      return 'Guten Abend,';
    }

    return defaultGreeting;
  }

  function applyGreeting(root) {
    const elements = (root || document).querySelectorAll('.fh-account-greeting');

    elements.forEach(function (element) {
      const defaultGreeting = element.getAttribute('data-default-greeting') || element.textContent || '';
      const nextGreeting = resolveGreeting(defaultGreeting);

      if (element.textContent !== nextGreeting) {
        element.textContent = nextGreeting;
      }
    });
  }

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

  if (!container) {
    return;
  }

  const toggleButton = container.querySelector('[data-fh-account-menu-toggle]');
  const menu = container.querySelector('[data-fh-account-menu]');

  if (!toggleButton || !menu) {
    return;
  }

  let isOpen = false;

  function openMenu() {
    if (isOpen) {
      return;
    }

    if (window.fhWishlistMenu && typeof window.fhWishlistMenu.close === 'function') {
      window.fhWishlistMenu.close();
    }

    menu.style.display = 'block';
    menu.setAttribute('aria-hidden', 'false');
    toggleButton.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeydown);
    isOpen = true;
  }

  function closeMenu() {
    if (!isOpen) {
      return;
    }

    menu.style.display = 'none';
    menu.setAttribute('aria-hidden', 'true');
    toggleButton.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleKeydown);
    isOpen = false;
  }

  function handleDocumentClick(event) {
    if (!container.contains(event.target)) {
      closeMenu();
    }
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

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.addEventListener('click', function (event) {
    const trigger = event.target.closest('[data-fh-login-trigger], [data-fh-registration-trigger], [data-fh-account-close]');

    if (trigger) {
      closeMenu();
    }
  });

  window.fhAccountMenu = window.fhAccountMenu || {};
  window.fhAccountMenu.close = closeMenu;
  window.fhAccountMenu.isOpen = function () {
    return isOpen;
  };
});
// End Section: FH account menu toggle behaviour

// Section: FH mobile navigation toggle
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('[data-fh-header-root]');

  if (!header) {
    return;
  }

  const menu = header.querySelector('[data-fh-mobile-menu]');
  const toggleButtons = header.querySelectorAll('[data-fh-mobile-menu-toggle]');

  if (!menu || toggleButtons.length === 0) {
    return;
  }

  const closeButtons = header.querySelectorAll('[data-fh-mobile-menu-close]');
  const focusableSelectors = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const desktopMedia = window.matchMedia('(min-width: 992px)');
  let isOpen = false;
  let previouslyFocusedElement = null;

  function setExpandedState(value) {
    const expandedValue = value ? 'true' : 'false';

    toggleButtons.forEach(function (button) {
      button.setAttribute('aria-expanded', expandedValue);
    });
  }

  function focusInitialElement() {
    const closeButton = menu.querySelector('[data-fh-mobile-menu-close]');

    if (closeButton instanceof HTMLElement) {
      closeButton.focus();
      return;
    }

    const firstLink = menu.querySelector('.fh-header__nav-link');

    if (firstLink instanceof HTMLElement) {
      firstLink.focus();
    }
  }

  function handleDocumentKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      closeMenu();
    }
  }

  function handleTrapFocus(event) {
    if (!isOpen || event.key !== 'Tab') {
      return;
    }

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

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

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

  function openMenu() {
    if (isOpen) {
      return;
    }

    previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    menu.classList.add('fh-header__nav--open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fh-mobile-menu-open');
    setExpandedState(true);
    document.addEventListener('keydown', handleDocumentKeydown);
    document.addEventListener('keydown', handleTrapFocus);
    focusInitialElement();
    isOpen = true;
  }

  function closeMenu(options) {
    const skipFocus = !!(options && options.skipFocus === true);

    menu.classList.remove('fh-header__nav--open');
    menu.setAttribute('aria-hidden', desktopMedia.matches ? 'false' : 'true');
    document.body.classList.remove('fh-mobile-menu-open');
    setExpandedState(false);

    if (!isOpen) {
      return;
    }

    document.removeEventListener('keydown', handleDocumentKeydown);
    document.removeEventListener('keydown', handleTrapFocus);
    isOpen = false;

    if (skipFocus) {
      previouslyFocusedElement = null;
      return;
    }

    const target = previouslyFocusedElement || toggleButtons[0];

    if (target instanceof HTMLElement) {
      target.focus();
    }

    previouslyFocusedElement = null;
  }

  toggleButtons.forEach(function (button) {
    button.setAttribute('aria-expanded', 'false');

    button.addEventListener('click', function (event) {
      event.preventDefault();

      if (isOpen) {
        closeMenu();
        return;
      }

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
      closeMenu();
    }
  });

  function handleBreakpointChange() {
    closeMenu({ skipFocus: true });
  }

  if (typeof desktopMedia.addEventListener === 'function') {
    desktopMedia.addEventListener('change', handleBreakpointChange);
  } else if (typeof desktopMedia.addListener === 'function') {
    desktopMedia.addListener(handleBreakpointChange);
  }

  closeMenu({ skipFocus: true });
});
// End Section: FH mobile navigation toggle

// Section: FH Merkliste button enhancements
document.addEventListener('DOMContentLoaded', function () {
  const iconMarkup =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9a2 2 0 0 1 2 2v16l-6.5-3.5L4 21V5a2 2 0 0 1 2-2z"></path></svg>';

  function replaceWishlistWord(value) {
    if (typeof value !== 'string' || value.length === 0) {
      return value;
    }

    return value.replace(/Wunschliste|Merkzettel/gi, 'Merkliste');
  }

  function updateAttribute(target, attribute) {
    if (!target || !attribute) {
      return;
    }

    if (target.hasAttribute(attribute)) {
      const currentValue = target.getAttribute(attribute);
      const nextValue = replaceWishlistWord(currentValue);

      if (typeof nextValue === 'string' && nextValue.length > 0) {
        target.setAttribute(attribute, nextValue);
        return;
      }
    }

    if (attribute === 'aria-label' || attribute === 'title') {
      target.setAttribute(attribute, 'Merkliste');
    }
  }

  function enhanceButton(button) {
    if (!button || !(button instanceof HTMLElement)) {
      return;
    }

    button.classList.add('fh-wishlist-button');

    const existingCustomIcons = button.querySelectorAll('.fh-wishlist-button-icon');
    existingCustomIcons.forEach(function (icon) {
      icon.remove();
    });

    const defaultIcons = button.querySelectorAll('i[class*="fa"], i.fa');
    defaultIcons.forEach(function (icon) {
      icon.remove();
    });

    Array.from(button.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim().length > 0) {
        node.parentNode.removeChild(node);
      }
    });

    const iconWrapper = document.createElement('span');
    iconWrapper.className = 'fh-wishlist-button-icon';
    iconWrapper.setAttribute('aria-hidden', 'true');
    iconWrapper.innerHTML = iconMarkup;

    let labelWrapper = button.querySelector('.fh-wishlist-button-label');

    if (!labelWrapper) {
      labelWrapper = document.createElement('span');
      labelWrapper.className = 'fh-wishlist-button-label';
      button.appendChild(labelWrapper);
    }

    labelWrapper.textContent = 'Merkliste';

    button.insertBefore(iconWrapper, button.firstChild);

    updateAttribute(button, 'aria-label');
    updateAttribute(button, 'title');

    if (button.dataset) {
      if (button.dataset.originalTitle) {
        button.dataset.originalTitle = replaceWishlistWord(button.dataset.originalTitle) || 'Merkliste';
      }

      if (button.dataset.titleAdd) {
        button.dataset.titleAdd = replaceWishlistWord(button.dataset.titleAdd) || 'Merkliste';
      }

      if (button.dataset.titleRemove) {
        button.dataset.titleRemove = replaceWishlistWord(button.dataset.titleRemove) || 'Merkliste';
      }
    }

    const srOnlyElements = button.querySelectorAll('.sr-only, .visually-hidden');
    srOnlyElements.forEach(function (element) {
      element.textContent = replaceWishlistWord(element.textContent) || 'Merkliste';
    });
  }

  function enhanceWishlistButtons(root) {
    if (!root) {
      return;
    }

    if (root.nodeType === 1 && root.matches && root.matches('.widget.widget-add-to-wish-list button, .widget.widget-add-to-wish-list .btn')) {
      enhanceButton(root);
    }

    if (root.querySelectorAll) {
      const buttons = root.querySelectorAll('.widget.widget-add-to-wish-list button, .widget.widget-add-to-wish-list .btn');
      buttons.forEach(function (button) {
        enhanceButton(button);
      });
    }
  }

  enhanceWishlistButtons(document);

  if (document.body) {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) {
            return;
          }

          enhanceWishlistButtons(node);
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
});
// End Section: FH Merkliste button enhancements

// Section: FH wish list flyout preview
document.addEventListener('DOMContentLoaded', function () {
  const container = document.querySelector('[data-fh-wishlist-menu-container]');

  if (!container) {
    return;
  }

  const toggleButton = container.querySelector('[data-fh-wishlist-menu-toggle]');
  const menu = container.querySelector('[data-fh-wishlist-menu]');
  const list = container.querySelector('[data-fh-wishlist-menu-list]');
  const loadingIndicator = container.querySelector('[data-fh-wishlist-menu-loading]');
  const emptyState = container.querySelector('[data-fh-wishlist-menu-empty]');
  const errorState = container.querySelector('[data-fh-wishlist-menu-error]');

  if (!toggleButton || !menu || !list) {
    return;
  }

  let isOpen = false;
  let hasLoadedOnce = false;
  let hasSubscribedToStore = false;
  let wishListUpdateVersion = 0;
  const pendingWishListUpdateWaiters = [];

  function getVueStore() {
    if (window.vueApp && window.vueApp.$store) {
      return window.vueApp.$store;
    }

    if (window.ceresStore && typeof window.ceresStore.dispatch === 'function') {
      return window.ceresStore;
    }

    return null;
  }

  function getLocale() {
    if (window.App) {
      if (App.locale) {
        return App.locale.replace('_', '-');
      }

      if (App.defaultLanguage) {
        return App.defaultLanguage.replace('_', '-');
      }
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

      if (!isFinite(amount)) {
        return formatter.format(0);
      }

      return formatter.format(amount);
    };
  })();

  function getWishListActionName(store) {
    if (!store || !store._actions) {
      return null;
    }

    if (store._actions['wishList/initWishListItems']) {
      return 'wishList/initWishListItems';
    }

    if (store._actions.initWishListItems) {
      return 'initWishListItems';
    }

    return null;
  }

  function getBasketActionName(store) {
    if (!store || !store._actions) {
      return null;
    }

    if (store._actions['basket/addBasketItem']) {
      return 'basket/addBasketItem';
    }

    if (store._actions.addBasketItem) {
      return 'addBasketItem';
    }

    return null;
  }

  function notifyWishListUpdated(items) {
    const normalizedItems = Array.isArray(items) ? items : [];
    hasLoadedOnce = true;
    wishListUpdateVersion += 1;
    updateList(normalizedItems);

    if (!pendingWishListUpdateWaiters.length) {
      return;
    }

    const currentVersion = wishListUpdateVersion;

    for (let index = pendingWishListUpdateWaiters.length - 1; index >= 0; index--) {
      const waiter = pendingWishListUpdateWaiters[index];

      if (currentVersion > waiter.version) {
        pendingWishListUpdateWaiters.splice(index, 1);

        if (waiter.timeoutId) {
          window.clearTimeout(waiter.timeoutId);
        }

        try {
          waiter.resolve({
            items: normalizedItems,
            version: currentVersion
          });
        } catch (error) {
          // Ignore errors thrown inside resolver handlers
        }
      }
    }
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
        version: versionAtRegistration,
        resolve: resolve,
        reject: reject,
        timeoutId: null
      };

      if (typeof timeoutMs === 'number' && timeoutMs > 0) {
        waiter.timeoutId = window.setTimeout(function () {
          const index = pendingWishListUpdateWaiters.indexOf(waiter);

          if (index !== -1) {
            pendingWishListUpdateWaiters.splice(index, 1);
          }

          reject(new Error('timeout'));
        }, timeoutMs);
      }

      pendingWishListUpdateWaiters.push(waiter);
    });
  }

  function showLoading(isLoading) {
    if (loadingIndicator) {
      loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
  }

  function showEmptyState(isEmpty) {
    if (emptyState) {
      emptyState.style.display = isEmpty ? 'block' : 'none';
    }
  }

  function showError(message) {
    if (!errorState) {
      return;
    }

    if (message) {
      errorState.textContent = message;
      errorState.style.display = 'block';
    } else {
      errorState.style.display = 'none';
    }
  }

  function getItemUrl(item) {
    if (!item || !item.texts) {
      return '#';
    }

    const enableOldUrlPattern = window.App && App.config && App.config.global && App.config.global.enableOldUrlPattern;
    const trailingSlash = window.App && App.urlTrailingSlash;
    const defaultLanguage = window.App && App.defaultLanguage;

    let link = '';
    const urlPath = item.texts.urlPath || '';
    const includeLanguage = item.texts.lang && defaultLanguage && item.texts.lang !== defaultLanguage;

    if (!urlPath || urlPath.charAt(0) !== '/') {
      link = '/';
    }

    if (includeLanguage) {
      link += item.texts.lang + '/';
    }

    if (urlPath) {
      link += urlPath;
    }

    let suffix = '';

    if (enableOldUrlPattern) {
      suffix = '/a-' + (item.item && item.item.id ? item.item.id : '');
    } else if (item.item && item.variation && item.item.id && item.variation.id) {
      suffix = '_' + item.item.id + '_' + item.variation.id;
    } else if (item.item && item.item.id) {
      suffix = '_' + item.item.id;
    }

    if (trailingSlash) {
      if (link.length > 1 && link.charAt(link.length - 1) === '/') {
        link = link.substring(0, link.length - 1);
      }
    }

    if (link.endsWith(suffix)) {
      return trailingSlash ? link + '/' : link;
    }

    return link + suffix + (trailingSlash ? '/' : '');
  }

  function getPrimaryImage(item) {
    const images = item && item.images ? item.images : null;

    if (!images) {
      return null;
    }

    const collection = Array.isArray(images.variation) && images.variation.length
      ? images.variation
      : (Array.isArray(images.all) ? images.all : []);

    if (!collection.length) {
      return null;
    }

    const sorted = collection.slice().sort(function (a, b) {
      const posA = typeof a.position === 'number' ? a.position : 0;
      const posB = typeof b.position === 'number' ? b.position : 0;
      return posA - posB;
    });

    const candidate = sorted[0] || collection[0];

    if (!candidate) {
      return null;
    }

    const url = candidate.urlPreview || candidate.urlMiddle || candidate.urlSecondPreview || candidate.url;
    const alt = (candidate.names && (candidate.names.alternate || candidate.names.name)) || '';

    return {
      url: url,
      alt: alt || (item && item.texts ? item.texts.name1 : '')
    };
  }

  function getBasePrice(item) {
    if (!item || !item.prices) {
      return '';
    }

    if (item.prices.specialOffer && item.prices.specialOffer.basePrice) {
      const basePrice = item.prices.specialOffer.basePrice;

      if (typeof basePrice === 'string') {
        const normalized = basePrice.replace(/\s+/g, '').toLowerCase();

        if (normalized === 'n/a') {
          return '';
        }
      }

      return basePrice;
    }

    if (item.prices.default && item.prices.default.basePrice) {
      const basePrice = item.prices.default.basePrice;

      if (typeof basePrice === 'string') {
        const normalized = basePrice.replace(/\s+/g, '').toLowerCase();

        if (normalized === 'n/a') {
          return '';
        }
      }

      return basePrice;
    }

    return '';
  }

  function getRemoveWishListActionName(store) {
    if (!store || !store._actions) {
      return null;
    }

    if (store._actions['wishList/removeWishListItem']) {
      return 'wishList/removeWishListItem';
    }

    if (store._actions.removeWishListItem) {
      return 'removeWishListItem';
    }

    return null;
  }

  function getUnitPrice(item) {
    if (!item || !item.prices) {
      return 0;
    }

    if (item.prices.specialOffer && item.prices.specialOffer.unitPrice && typeof item.prices.specialOffer.unitPrice.value !== 'undefined') {
      return item.prices.specialOffer.unitPrice.value;
    }

    if (item.prices.default && item.prices.default.unitPrice && typeof item.prices.default.unitPrice.value !== 'undefined') {
      return item.prices.default.unitPrice.value;
    }

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
    if (!item || !item.filter) {
      return true;
    }

    if (Object.prototype.hasOwnProperty.call(item.filter, 'isSalable')) {
      return !!item.filter.isSalable;
    }

    return true;
  }

  function clearList() {
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
  }

  function updateList(documents) {
    clearList();

    const items = Array.isArray(documents) ? documents : [];

    if (!items.length) {
      showEmptyState(true);
      return;
    }

    showEmptyState(false);

    items.forEach(function (documentItem) {
      const item = documentItem && documentItem.data ? documentItem.data : null;

      if (!item) {
        return;
      }

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
      imageLink.style.backgroundColor = '#f8fafc';
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
      nameLink.style.color = '#1f2937';
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
      priceValue.textContent = formatPrice(getUnitPrice(item));
      priceValue.style.fontSize = '13px';
      priceValue.style.color = '#1f2937';
      priceValue.style.whiteSpace = 'nowrap';

      priceLine.appendChild(priceValue);

      const basePriceText = getBasePrice(item);

      if (basePriceText) {
        const basePrice = document.createElement('span');
        basePrice.textContent = basePriceText;
        basePrice.style.fontSize = '12px';
        basePrice.style.color = '#64748b';
        basePrice.style.whiteSpace = 'nowrap';
        priceLine.appendChild(basePrice);
      }

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
        if (typeof value !== 'number' || !isFinite(value)) {
          return 0;
        }

        const parts = value.toString().split('.');

        if (parts.length < 2) {
          return 0;
        }

        return parts[1].length;
      }

      const quantityPrecision = Math.min(6, Math.max(getDecimalPlaces(minQuantity), getDecimalPlaces(intervalQuantity)));

      const quantityWrapper = document.createElement('div');
      quantityWrapper.style.display = 'flex';
      quantityWrapper.style.alignItems = 'center';
      quantityWrapper.style.gap = '6px';
      quantityWrapper.style.flex = '0 0 auto';

      const qtyBox = document.createElement('div');
      qtyBox.className = 'qty-box d-flex h-100';
      qtyBox.style.maxWidth = '88px';
      qtyBox.style.height = '34px';
      qtyBox.style.border = '1px solid #d8e2ef';
      qtyBox.style.borderRadius = '10px';
      qtyBox.style.backgroundColor = '#f8fafc';
      qtyBox.style.overflow = 'hidden';

      const quantityInput = document.createElement('input');
      quantityInput.className = 'qty-input text-center';
      quantityInput.type = 'text';
      quantityInput.setAttribute('aria-label', 'Menge wählen');
      quantityInput.disabled = !isSaleable(item);
      quantityInput.style.height = '34px';
      quantityInput.style.width = '48px';
      quantityInput.style.border = 'none';
      quantityInput.style.background = 'transparent';
      quantityInput.style.fontSize = '13px';
      quantityInput.style.padding = '0';
      quantityInput.style.color = '#0f172a';
      quantityInput.style.textAlign = 'center';

      const qtyButtonContainer = document.createElement('div');
      qtyButtonContainer.className = 'qty-btn-container d-flex flex-column';
      qtyButtonContainer.style.width = '26px';
      qtyButtonContainer.style.gap = '2px';
      qtyButtonContainer.style.height = '100%';
      qtyButtonContainer.style.padding = '2px';

      const increaseButton = document.createElement('button');
      increaseButton.type = 'button';
      increaseButton.className = 'btn qty-btn flex-fill d-flex justify-content-center p-0 btn-appearance';
      increaseButton.style.height = 'calc(50% - 1px)';
      increaseButton.style.fontSize = '12px';
      increaseButton.style.border = 'none';
      increaseButton.style.backgroundColor = 'transparent';
      increaseButton.style.color = '#0f172a';

      const increaseIcon = document.createElement('i');
      increaseIcon.className = 'fa fa-plus default-float';
      increaseIcon.setAttribute('aria-hidden', 'true');
      increaseButton.appendChild(increaseIcon);

      const decreaseButton = document.createElement('button');
      decreaseButton.type = 'button';
      decreaseButton.className = 'btn qty-btn flex-fill d-flex justify-content-center p-0 btn-appearance';
      decreaseButton.style.height = 'calc(50% - 1px)';
      decreaseButton.style.fontSize = '12px';
      decreaseButton.style.border = 'none';
      decreaseButton.style.backgroundColor = 'transparent';
      decreaseButton.style.color = '#0f172a';

      const decreaseIcon = document.createElement('i');
      decreaseIcon.className = 'fa fa-minus default-float';
      decreaseIcon.setAttribute('aria-hidden', 'true');
      decreaseButton.appendChild(decreaseIcon);

      function formatQuantityDisplay(value) {
        if (Number.isInteger(value)) {
          return String(value);
        }

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

        if (!isFinite(numeric) || numeric <= 0) {
          numeric = minQuantity;
        }

        if (numeric < minQuantity) {
          numeric = minQuantity;
        }

        if (maxQuantity && numeric > maxQuantity) {
          numeric = maxQuantity;
        }

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

        if (isDisabled) {
          button.classList.add('disabled');
        } else {
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

        if (!isSaleable(item)) {
          return;
        }

        let candidate = currentQuantity + intervalQuantity;

        if (maxQuantity && candidate > maxQuantity) {
          candidate = maxQuantity;
        }

        updateQuantity(normalizeQuantity(candidate));
      });

      decreaseButton.addEventListener('click', function (event) {
        event.preventDefault();

        if (!isSaleable(item)) {
          return;
        }

        let candidate = currentQuantity - intervalQuantity;

        if (candidate < minQuantity) {
          candidate = minQuantity;
        }

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

        if (addToCartButton.disabled) {
          return;
        }

        const store = getVueStore();
        const actionName = getBasketActionName(store);

        if (!store || !actionName) {
          window.location.href = url;
          return;
        }

        const variationId = item.variation && item.variation.id ? item.variation.id : null;

        if (!variationId) {
          window.location.href = url;
          return;
        }

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

      qtyButtonContainer.appendChild(increaseButton);
      qtyButtonContainer.appendChild(decreaseButton);
      qtyBox.appendChild(quantityInput);
      qtyBox.appendChild(qtyButtonContainer);
      quantityWrapper.appendChild(qtyBox);

      updateQuantity(normalizeQuantity(currentQuantity));

      removeButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        const store = getVueStore();
        const actionName = getRemoveWishListActionName(store);

        if (!store || !actionName) {
          return;
        }

        const variationId = item && item.variation && item.variation.id ? item.variation.id : null;

        if (!variationId) {
          return;
        }

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

    if (list.lastElementChild) {
      list.lastElementChild.style.borderBottom = 'none';
    }
  }

  function subscribeToWishList(store) {
    if (!store || typeof store.subscribe !== 'function' || hasSubscribedToStore) {
      return;
    }

    store.subscribe(function (mutation, state) {
      if (!mutation || !mutation.type) {
        return;
      }

      const relevantMutations = [
        'setWishListItems',
        'removeWishListItem',
        'addWishListItemToIndex',
        'setWishListIds'
      ];

      if (relevantMutations.indexOf(mutation.type) === -1) {
        return;
      }

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

      const actionName = getWishListActionName(store);

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

          if (Array.isArray(result)) {
            documents = result;
          } else if (result && Array.isArray(result.documents)) {
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
    if (!container.contains(event.target)) {
      closeMenu();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      closeMenu();
      toggleButton.focus();
    }
  }

  function openMenu() {
    if (isOpen) {
      return;
    }

    if (window.fhAccountMenu && typeof window.fhAccountMenu.close === 'function') {
      window.fhAccountMenu.close();
    }

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
      if (!isOpen) {
        openMenu();
      } else if (focusToggle) {
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
    if (!isOpen) {
      return;
    }

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

    if (isOpen) {
      closeMenu();
    } else {
      openMenuWithOptions();
    }
  });

  menu.addEventListener('click', function (event) {
    event.stopPropagation();
  });

  document.addEventListener('click', function (event) {
    const wishlistButton = event.target.closest('.widget.widget-add-to-wish-list button, .widget.widget-add-to-wish-list .btn');

    if (!wishlistButton) {
      return;
    }

    const store = getVueStore();

    if (store) {
      subscribeToWishList(store);
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
});
// End Section: FH wish list flyout preview

// Section: Basket preview attribute cleanup
document.addEventListener('DOMContentLoaded', function () {
  const attributeKeywords = ['inhalt', 'abmess', 'länge', 'laenge', 'breite', 'höhe', 'hoehe'];
  const previewSelectors = ['.basket-preview', '.basket-preview-list', '.basket-preview-items'];
  const labelSelectors = [
    '[class*="attribute-name" i]',
    '[class*="property-name" i]',
    '[class*="characteristic-name" i]',
    '[data-attribute-name]',
    '[data-property-name]'
  ];

  function normalizeLabel(text) {
    return text
      .replace(/[\/:|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function shouldHideLabel(text) {
    if (!text) {
      return false;
    }

    const normalized = normalizeLabel(text);

    if (!normalized) {
      return false;
    }

    return attributeKeywords.some(function (keyword) {
      return normalized.startsWith(keyword) || normalized.includes(' ' + keyword);
    });
  }

  function hideAttributeNode(node) {
    if (!node || node.nodeType !== 1) {
      return;
    }

    if (node.dataset && node.dataset.fhAttributeHidden === 'true') {
      return;
    }

    node.style.display = 'none';

    if (node.dataset) {
      node.dataset.fhAttributeHidden = 'true';
    }

    const tagName = node.tagName ? node.tagName.toLowerCase() : '';

    if (tagName === 'dt') {
      const dd = node.nextElementSibling;

      if (dd && dd.tagName && dd.tagName.toLowerCase() === 'dd') {
        hideAttributeNode(dd);
      }
    } else if (tagName === 'dd') {
      const prev = node.previousElementSibling;

      if (prev && prev.tagName && prev.tagName.toLowerCase() === 'dt') {
        hideAttributeNode(prev);
      }
    }
  }

  function suppressAttributeContainer(node) {
    if (!node) {
      return;
    }

    const container = node.closest('li, tr, div, dd, dt') || node;
    hideAttributeNode(container);
  }

  function pruneAttributePairs(item) {
    if (!item || item.nodeType !== 1) {
      return;
    }

    const dtNodes = item.querySelectorAll('dt');

    dtNodes.forEach(function (dt) {
      if (shouldHideLabel(dt.textContent || '')) {
        hideAttributeNode(dt);
      }
    });

    const explicitLabelNodes = item.querySelectorAll(labelSelectors.join(', '));

    explicitLabelNodes.forEach(function (labelNode) {
      if (shouldHideLabel(labelNode.textContent || '')) {
        suppressAttributeContainer(labelNode);
      }
    });

    const fallbackNodes = item.querySelectorAll('li, div, span, dd');

    fallbackNodes.forEach(function (node) {
      if (!node || (node.dataset && node.dataset.fhAttributeChecked === 'true')) {
        return;
      }

      if (!node.closest('.basket-preview-item, [data-basket-item]')) {
        return;
      }

      if (node.dataset) {
        node.dataset.fhAttributeChecked = 'true';
      }

      if (node.children && node.children.length > 1 && !node.matches('dd')) {
        return;
      }

      const text = node.textContent || '';
      const separatorIndex = text.indexOf(':');

      if (separatorIndex === -1) {
        return;
      }

      const label = text.slice(0, separatorIndex);

      if (shouldHideLabel(label)) {
        suppressAttributeContainer(node);
      }
    });
  }

  function prunePreview(previewRoot) {
    if (!previewRoot || previewRoot.nodeType !== 1) {
      return;
    }

    const items = previewRoot.querySelectorAll('.basket-preview-item, [data-basket-item]');

    if (items.length) {
      items.forEach(pruneAttributePairs);
    } else if (previewRoot.matches('.basket-preview-item, [data-basket-item]')) {
      pruneAttributePairs(previewRoot);
    }
  }

  function bindPreview(previewRoot) {
    if (!previewRoot || previewRoot.nodeType !== 1) {
      return;
    }

    if (previewRoot.dataset && previewRoot.dataset.fhAttributeObserver === 'true') {
      prunePreview(previewRoot);
      return;
    }

    if (previewRoot.dataset) {
      previewRoot.dataset.fhAttributeObserver = 'true';
    }

    prunePreview(previewRoot);

    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (!mutation) {
          return;
        }

        mutation.addedNodes.forEach(function (node) {
          if (!(node instanceof HTMLElement)) {
            return;
          }

          if (node.matches('.basket-preview-item, [data-basket-item]')) {
            pruneAttributePairs(node);
          } else {
            prunePreview(node);
          }
        });
      });

      prunePreview(previewRoot);
    });

    observer.observe(previewRoot, { childList: true, subtree: true });
  }

  function scanForPreview() {
    previewSelectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(bindPreview);
    });
  }

  const bodyObserver = new MutationObserver(function () {
    scanForPreview();
  });

  bodyObserver.observe(document.body, { childList: true, subtree: true });
  scanForPreview();
});
// End Section: Basket preview attribute cleanup

// Section: Ensure auth modals load their Vue components before opening
document.addEventListener('DOMContentLoaded', function () {
  function getVueStore() {
    if (window.vueApp && window.vueApp.$store) {
      return window.vueApp.$store;
    }

    if (window.ceresStore && typeof window.ceresStore.dispatch === 'function') {
      return window.ceresStore;
    }

    return null;
  }

  function loadLazyComponent(componentName) {
    const store = getVueStore();

    if (!store || typeof store.dispatch !== 'function') {
      return;
    }

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

// Section: Bestell-Versand Countdown Code
(function(){
  function getBerlinTime() {
    const now = new Date();
    const berlinParts = new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(now);
    const dateObj = {};
    berlinParts.forEach(({type, value}) => { dateObj[type] = value; });
    return new Date(`${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}`);
  }
  function isWorkday(date) {
    var day = date.getDay();
    return day >= 1 && day <= 5;
  }
  function getNextWorkday(date) {
    var next = new Date(date);
    do {
      next.setDate(next.getDate() + 1);
    } while (!isWorkday(next));
    return next;
  }
  function pad2(n){ return n < 10 ? '0'+n : n; }
  function pluralize(n, singular, plural) {
    return (n === 1) ? singular : plural;
  }
  function formatTime(h, m, s, showSeconds, color) {
    let t = '<span style="font-weight:bold;color:' + color + ';">';
    if(h > 0) {
      t += h + ' ' + pluralize(h, 'Stunde', 'Stunden') + ' ';
    }
    t += m + ' ' + pluralize(m, 'Minute', 'Minuten');
    if(showSeconds) t += ' ' + s + ' ' + pluralize(s, 'Sekunde', 'Sekunden');
    return t + '</span>';
  }
  var iconUrl = "https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/shipping_9288277.svg";
  var iconHtml = '<img src="' + iconUrl + '" alt="" style="height:2.6em;width:auto;vertical-align:middle;display:block;">';
  function waitForCountdownDiv(){
    var elem = document.getElementById('cutoff-countdown');
    if (!elem) return setTimeout(waitForCountdownDiv, 300);
    elem.style.display = "flex";
    elem.style.alignItems = "flex-start";
    elem.style.gap = "0.85em";
    elem.style.color = "rgb(108, 117, 125)";
    elem.style.setProperty('color', 'rgb(108, 117, 125)', 'important');
    var now = getBerlinTime();
    var day = now.getDay();
    var hour = now.getHours();
    var cutoff = new Date(now);
    cutoff.setHours(13, 0, 0, 0);
    var ms, h, m, s, color, targetDay, isTomorrow, dateLabel, showSeconds, zeitHtml;
    function getColor(hours){
      if (hours < 1) return "#dc2626";
      if (hours < 3) return "#eab308";
      return "#13a10e";
    }
    if (isWorkday(now) && hour >= 1 && hour < 13) {
      ms = cutoff - now;
      h = Math.floor(ms / (1000 * 60 * 60));
      m = Math.floor((ms / (1000 * 60)) % 60);
      s = Math.floor((ms / 1000) % 60);
      showSeconds = (h === 0);
      color = getColor(h);
      zeitHtml = formatTime(h, m, s, showSeconds, color);
      dateLabel = "heute";
    } else {
      var weekdays = [ "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag" ];
      var nextWorkday = getNextWorkday(now);
      var nextCutoff = new Date(nextWorkday);
      nextCutoff.setHours(13, 0, 0, 0);
      ms = nextCutoff - now;
      h = Math.floor(ms / (1000 * 60 * 60));
      m = Math.floor((ms / (1000 * 60)) % 60);
      s = Math.floor((ms / 1000) % 60);
      showSeconds = (h === 0);
      color = getColor(h);
      zeitHtml = formatTime(h, m, s, showSeconds, color);
      var tomorrow = new Date(now); tomorrow.setDate(now.getDate()+1);
      var isTomorrow = tomorrow.toDateString() === nextWorkday.toDateString();
      var dayName = weekdays[nextWorkday.getDay()];
      var dayNum = pad2(nextWorkday.getDate());
      var monthNum = pad2(nextWorkday.getMonth()+1);
      var datum = dayNum + '.' + monthNum;
      if (day === 5 && hour >= 13) {
        dateLabel = "nächsten Montag, den " + datum;
      } else if (day === 6) {
        dateLabel = "nächsten Montag, den " + datum;
      } else if (day === 0) {
        dateLabel = "Morgen, Montag den " + datum;
      } else if (isTomorrow) {
        dateLabel = "Morgen, " + dayName + " den " + datum;
      } else {
        dateLabel = dayName + " den " + datum;
      }
    }
    var textHtml = '<div style="display:flex;flex-direction:column;justify-content:center;line-height:1.45;">' +
     '<span style="font-weight:600;">Bestellen Sie innerhalb ' + zeitHtml + ', damit Ihre Ware ' + dateLabel + ' unser Lager verlässt.   </span>' +
  '</div>';
    elem.innerHTML = 
      '<div style="display:flex;align-items:center;">' +
        iconHtml +
      '</div>' +
      textHtml;
  }
  waitForCountdownDiv();
  setInterval(waitForCountdownDiv, 1000);
})();
// End Section: Bestell-Versand Countdown Code

// Section: Versand Icons ändern & einfügen (läuft auf ALLEN Seiten inkl. Checkout)
document.addEventListener('DOMContentLoaded', function () {
  const shippingIcons = {
    'ShippingProfileID1531': 'https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/DHLVersand_Icon_D1.png',
    'ShippingProfileID1545': 'https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/GO_Express_Versand_Icon_D1.1.png',
    'ShippingProfileID1510': 'https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/Selbstabholung_Lager_Versand_Icon_D1.1.png'
  };

  Object.entries(shippingIcons).forEach(([profileId, iconUrl]) => {
    const label = document.querySelector(`label[for="${profileId}"]`);
    if (label) {
      const iconContainer = label.querySelector('.icon');

      if (iconContainer) {
        // Bestehendes leeren
        iconContainer.innerHTML = '';

        // Neues Icon einfügen
        const img = document.createElement('img');
        img.src = iconUrl;
        img.alt = 'Versandart Icon';
        img.className = 'shipping-icon';
        iconContainer.appendChild(img);
      }
    }
  });
});
// End Section: Versand Icons ändern & einfügen

// Section: Gratisversand Fortschritt Balken
document.addEventListener('DOMContentLoaded', function () {
  const THRESHOLD = 150;

  const COUNTRY_SELECT_ID_FRAGMENTS = [
    'shipping-country-select',
    'invoice-country-select',
    'country-id-select'
  ];

  function isGermanySelected() {
    return COUNTRY_SELECT_ID_FRAGMENTS.some((fragment) => {
      const select = document.querySelector(`select[id*="${fragment}"]`);
      return select && select.value === '1';
    });
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
    return (styles.getPropertyValue('--primary') ||
            styles.getPropertyValue('--color-primary') ||
            styles.getPropertyValue('--bs-primary') ||
            '#31a5f0').trim();
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
    wrapper.style.marginTop = '0px';
    wrapper.style.marginBottom = '30px';

    const text = document.createElement('div');
    text.style.fontSize = '0.9rem';
    text.style.fontWeight = '600';
    text.style.marginBottom = '0.5rem';
    wrapper.appendChild(text);

    const bg = document.createElement('div');
    bg.style.width = '100%';
    bg.style.height = '8px';
    bg.style.background = '#e0e0e0';
    bg.style.borderRadius = '4px';
    bg.style.overflow = 'hidden';
    wrapper.appendChild(bg);

    const bar = document.createElement('div');
    bar.style.height = '100%';
    bar.style.width = '0%';
    bar.style.background = primaryColor;
    bar.style.transition = 'width 0.3s ease';
    bg.appendChild(bar);

    return { wrapper, bar, text };
  }

  function update(bar, text) {
    const total = parseEuro(document.querySelector('dd[data-testing="item-sum"]'));
    const ratio = Math.min(total / THRESHOLD, 1);
    bar.style.width = (ratio * 100) + '%';
    if (total < THRESHOLD) {
      text.textContent = `Noch ${formatEuro(THRESHOLD - total)} bis zum Gratisversand`;
    } else {
      text.textContent = 'Gratisversand erreicht!';
    }
  }

  function toggleFreeShippingBar() {
    const bar = document.getElementById('free-shipping-bar');
    const pickup = document.getElementById('ShippingProfileID1510');
    if (!bar) return;
    const path = window.location.pathname;
    const total = parseEuro(document.querySelector('dd[data-testing="item-sum"]'));
    const hide =
      (pickup && pickup.checked) ||
      (isCheckoutPage() && !isGermanySelected()) ||
      (path.includes('/bestellbestaetigung') && total < THRESHOLD);
    bar.style.display = hide ? 'none' : '';
  }

  const observer = new MutationObserver(() => {
    const totals = document.querySelector('.cmp-totals');
    if (totals && !document.getElementById('free-shipping-bar')) {
      const { wrapper, bar, text } = createBar('free-shipping-bar');
      totals.parentNode.insertBefore(wrapper, totals);
      update(bar, text);
      setInterval(() => update(bar, text), 1000);
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

(function() {
  var path = window.location.pathname;
  // Bei folgenden Pfaden abbrechen:
  if (path.includes("/checkout") || path.includes("/kaufabwicklung") || path.includes("/kasse")) {
    return;
  }

  // -- Anfang des restlichen Codes --
  
// Section: Animierte Suchplatzhalter Vorschläge

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.querySelector('input.search-input');
  if (!searchInput) return;

  const clearButton = document.querySelector('[data-search-clear]');
  const toggleClearButton = () => {
    if (!clearButton) return;
    clearButton.style.display = searchInput.value ? 'flex' : 'none';
  };

  if (clearButton) {
    clearButton.addEventListener('click', function (event) {
      event.preventDefault();
      searchInput.value = '';
      searchInput.focus();
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      toggleClearButton();
    });

    searchInput.addEventListener('input', toggleClearButton);
    searchInput.addEventListener('focus', toggleClearButton);
    searchInput.addEventListener('blur', toggleClearButton);

    toggleClearButton();
  }

  let inputFocused = false;

  // CSS-based device detection
  function getDeviceType() {
    return getComputedStyle(document.body, '::after').content.replace(/"/g, '');
  }

  function getPrefix() {
    return getDeviceType() === "mobile" ? "Suche: " : "Häufig gesucht: ";
  }

  let prefix = getPrefix();

  const allWords = [
    "\"Profilzylinder\"",
    "\"Sichtschutzstreifen PVC\"",
    "\"Terrassenschrauben\"",
    "\"Klebebänder\"",
    "\"Fenstersicherungen\"",
    "\"FH Schlösser\"",
    "\"Dichtungsprofile\"",
    "\"Garagentorschlösser\"",
    "\"Edelstahl Bits\"",
    "\"Fensterleisten\"",
    "\"Fenstergriffe\"",
    "\"Aluminium Türdrücker\"",
    "\"Fenstergriffe\"",
    "\"Zahlenschlösser\"",
    "\"Wera Werkzeug\""
  ];

  let currentSet = [];
  let currentWord = 0;
  let currentChar = 0;
  let isDeleting = false;
  let typingTimer;
  let animationActive = false;
  let inactivityTimer;

  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  function getRandomWords(count = 5) {
    return shuffle([...allWords]).slice(0, count);
  }

  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
  }

  function type() {
    if (!animationActive || !isInViewport(searchInput) || inputFocused) return;

    const fullWord = currentSet[currentWord];
    const currentText = fullWord.substring(0, currentChar);
    searchInput.placeholder = prefix + currentText;

    if (!isDeleting && currentChar < fullWord.length) {
      currentChar++;
      typingTimer = setTimeout(type, 100);
    } else if (!isDeleting && currentChar === fullWord.length) {
      isDeleting = true;
      typingTimer = setTimeout(type, 2000);
    } else if (isDeleting && currentChar > 0) {
      currentChar--;
      typingTimer = setTimeout(type, 50);
    } else {
      isDeleting = false;
      currentWord++;
      if (currentWord >= currentSet.length) {
        currentSet = getRandomWords(5);
        currentWord = 0;
      }
      currentChar = 0;
      typingTimer = setTimeout(type, 500);
    }
  }

  function startTyping() {
    if (!animationActive && !inputFocused) {
      prefix = getPrefix();
      currentSet = getRandomWords(5);
      currentWord = 0;
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
      if (!inputFocused) {
        startTyping();
      }
    }, 10000);
  }

  // --- Fokus- und Input-Logik ---
  searchInput.addEventListener("focus", function () {
    inputFocused = true;
    stopTyping();
    if (!searchInput.value) {
      searchInput.placeholder = "Wonach suchst du?";
    }
    // Keine Animation starten während Fokus!
  });

  searchInput.addEventListener("input", function () {
    stopTyping();
    if (!searchInput.value) {
      searchInput.placeholder = "Wonach suchst du?";
    }
    // Keine Animation starten während Fokus!
  });

  searchInput.addEventListener("blur", function () {
    inputFocused = false;
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



// Section: Warenkorbvorschau "Warenkorb" zu "Weiter einkaufen" Funktion

function patchBasketButton() {
  var weiterEinkaufenBtn = document.querySelector('.basket-preview-footer .btn-outline-primary.btn-block');
  var closeBtn = document.querySelector('.basket-preview-header .close');
  if (weiterEinkaufenBtn && closeBtn) {
    // Button entsperren
    weiterEinkaufenBtn.removeAttribute('disabled');
    weiterEinkaufenBtn.disabled = false;
    weiterEinkaufenBtn.classList.remove('disabled', 'is-loading', 'loading', 'plenty-loader');

    // Entferne gezielt alle Spinner-i-Tags im Button (FontAwesome Spinner)
    weiterEinkaufenBtn.querySelectorAll('i.fa-spin, i.fa-circle-o-notch').forEach(function(spinner) {
      spinner.remove();
    });

    // Button-Text und Custom-Icon setzen, falls Icon fehlt (ohne Spinner!)
    if (!weiterEinkaufenBtn.querySelector('i.fa-arrow-left')) {
      weiterEinkaufenBtn.innerHTML = '<i class="fa fa-arrow-left" aria-hidden="true" style="margin-right:8px"></i>Weiter einkaufen';
    }

    if (!weiterEinkaufenBtn.classList.contains('weiter-einkaufen-patched')) {
      weiterEinkaufenBtn.addEventListener('click', function(e) {
        e.preventDefault();
        // Spinner sofort entfernen!
        weiterEinkaufenBtn.querySelectorAll('i.fa-spin, i.fa-circle-o-notch').forEach(function(spinner) {
          spinner.remove();
        });
        // Button aktiv halten
        weiterEinkaufenBtn.removeAttribute('disabled');
        weiterEinkaufenBtn.disabled = false;
        weiterEinkaufenBtn.classList.remove('disabled', 'is-loading', 'loading', 'plenty-loader');
        // Overlay schließen
        closeBtn.click();
        // Sicherheitshalber Spinner nach kurzem Delay nochmal entfernen
        setTimeout(function() {
          weiterEinkaufenBtn.querySelectorAll('i.fa-spin, i.fa-circle-o-notch').forEach(function(spinner) {
            spinner.remove();
          });
          weiterEinkaufenBtn.removeAttribute('disabled');
          weiterEinkaufenBtn.disabled = false;
          weiterEinkaufenBtn.classList.remove('disabled', 'is-loading', 'loading', 'plenty-loader');
        }, 80);
      });
      weiterEinkaufenBtn.classList.add('weiter-einkaufen-patched');
    }
  }
}

var observer = new MutationObserver(function(mutationsList, observer) {
  patchBasketButton();
});

document.addEventListener("DOMContentLoaded", function() {
  observer.observe(document.body, { childList: true, subtree: true });
  patchBasketButton();
});


// End Section: Warenkorbvorschau "Warenkorb" zu "Weiter einkaufen" Funktion

})();
