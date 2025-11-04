// FH Basket Preview Enhancements

// Section: Restrict focus to the basket preview while it is open
fhOnReady(function () {
  const body = document.body;

  if (!body) return;

  const focusableSelector = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]'
  ].join(',');

  function isInsideBasket(element) {
    return !!(element.closest('.fh-basket-preview') || element.closest('.sh-basket-preview') || element.closest('.basket-preview'));
  }

  function restoreElement(element) {
    if (!element || !element.hasAttribute('data-fh-basket-tab-restore')) return;

    const previous = element.getAttribute('data-fh-basket-tab-restore');
    element.removeAttribute('data-fh-basket-tab-restore');

    if (previous) element.setAttribute('tabindex', previous); else element.removeAttribute('tabindex');
  }

  let lastKnownState = null;

  function updateFocusState() {
    const basketOpen = body.classList.contains('basket-open');

    if (basketOpen === lastKnownState) return;
    lastKnownState = basketOpen;

    const elements = document.querySelectorAll(focusableSelector);

    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];

      if (!element) continue;

      if (basketOpen && !isInsideBasket(element)) {
        if (!element.hasAttribute('data-fh-basket-tab-restore')) {
          const existing = element.getAttribute('tabindex');
          element.setAttribute('data-fh-basket-tab-restore', existing === null ? '' : existing);
        }

        element.setAttribute('tabindex', '-1');
      } else if (!basketOpen && element.hasAttribute('data-fh-basket-tab-restore')) {
        restoreElement(element);
      }
    }
  }

  const observer = new MutationObserver(function (mutations) {
    for (let index = 0; index < mutations.length; index += 1) {
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

    const storedElements = document.querySelectorAll('[data-fh-basket-tab-restore]');

    for (let index = 0; index < storedElements.length; index += 1) {
      restoreElement(storedElements[index]);
    }
  });
});
// End Section: Restrict focus to the basket preview while it is open

// Section: Basket preview attribute cleanup
fhOnReady(function () {
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
    if (!text) return false;

    const normalized = normalizeLabel(text);

    if (!normalized) return false;

    return attributeKeywords.some(function (keyword) {
      return normalized.startsWith(keyword) || normalized.includes(' ' + keyword);
    });
  }

  function hideAttributeNode(node) {
    if (!node || node.nodeType !== 1) return;

    if (node.dataset && node.dataset.fhAttributeHidden === 'true') return;

    node.style.display = 'none';

    if (node.dataset) node.dataset.fhAttributeHidden = 'true';

    const tagName = node.tagName ? node.tagName.toLowerCase() : '';

    if (tagName === 'dt') {
      const dd = node.nextElementSibling;

      if (dd && dd.tagName && dd.tagName.toLowerCase() === 'dd') hideAttributeNode(dd);
    } else if (tagName === 'dd') {
      const prev = node.previousElementSibling;

      if (prev && prev.tagName && prev.tagName.toLowerCase() === 'dt') hideAttributeNode(prev);
    }
  }

  function suppressAttributeContainer(node) {
    if (!node) return;

    const container = node.closest('li, tr, div, dd, dt') || node;
    hideAttributeNode(container);
  }

  function pruneAttributePairs(item) {
    if (!item || item.nodeType !== 1) return;

    const dtNodes = item.querySelectorAll('dt');

    dtNodes.forEach(function (dt) {
      if (shouldHideLabel(dt.textContent || '')) hideAttributeNode(dt);
    });

    const explicitLabelNodes = item.querySelectorAll(labelSelectors.join(', '));

    explicitLabelNodes.forEach(function (labelNode) {
      if (shouldHideLabel(labelNode.textContent || '')) suppressAttributeContainer(labelNode);
    });

    const fallbackNodes = item.querySelectorAll('li, div, span, dd');

    fallbackNodes.forEach(function (node) {
      if (!node || (node.dataset && node.dataset.fhAttributeChecked === 'true')) return;

      if (!node.closest('.basket-preview-item, [data-basket-item]')) return;

      if (node.dataset) node.dataset.fhAttributeChecked = 'true';

      if (node.children && node.children.length > 1 && !node.matches('dd')) return;

      const text = node.textContent || '';
      const separatorIndex = text.indexOf(':');

      if (separatorIndex === -1) return;

      const label = text.slice(0, separatorIndex);

      if (shouldHideLabel(label)) suppressAttributeContainer(node);
    });
  }

  function prunePreview(previewRoot) {
    if (!previewRoot || previewRoot.nodeType !== 1) return;

    const items = previewRoot.querySelectorAll('.basket-preview-item, [data-basket-item]');

    if (items.length) items.forEach(pruneAttributePairs); else if (previewRoot.matches('.basket-preview-item, [data-basket-item]')) {
      pruneAttributePairs(previewRoot);
    }
  }

  function bindPreview(previewRoot) {
    if (!previewRoot || previewRoot.nodeType !== 1) return;

    if (previewRoot.dataset && previewRoot.dataset.fhAttributeObserver === 'true') { prunePreview(previewRoot); return; }

    if (previewRoot.dataset) previewRoot.dataset.fhAttributeObserver = 'true';

    prunePreview(previewRoot);

    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (!mutation) return;

        mutation.addedNodes.forEach(function (node) {
          if (!(node instanceof HTMLElement)) return;

          if (node.matches('.basket-preview-item, [data-basket-item]')) pruneAttributePairs(node); else {
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
    if (!weiterEinkaufenBtn.querySelector('i.fa-arrow-left')) weiterEinkaufenBtn.innerHTML = '<i class="fa fa-arrow-left" aria-hidden="true" style="margin-right:8px"></i>Weiter einkaufen';

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

fhOnReady(function () {
  observer.observe(document.body, { childList: true, subtree: true });
  patchBasketButton();
});


// End Section: Warenkorbvorschau "Warenkorb" zu "Weiter einkaufen" Funktion

})();
