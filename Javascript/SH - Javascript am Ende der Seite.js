// Section: Global scripts for all pages

// Section: Bestell-Versand Countdown Code
(function () {
  function getBerlinTime() {
    const now = new Date();
    const berlinParts = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const dateObj = {};
    berlinParts.forEach(({ type, value }) => {
      dateObj[type] = value;
    });
    return new Date(
      `${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}`,
    );
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
  function pad2(n) {
    return n < 10 ? "0" + n : n;
  }
  function pluralize(n, singular, plural) {
    return n === 1 ? singular : plural;
  }
  function formatTime(h, m, s, showSeconds, color) {
    let t = '<span style="font-weight:bold;color:' + color + ';">';
    if (h > 0) {
      t += h + " " + pluralize(h, "Stunde", "Stunden") + " ";
    }
    t += m + " " + pluralize(m, "Minute", "Minuten");
    if (showSeconds) t += " " + s + " " + pluralize(s, "Sekunde", "Sekunden");
    return t + "</span>";
  }
  var iconUrl =
    "https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/shipping_9288277.svg";
  var iconHtml =
    '<img src="' +
    iconUrl +
    '" alt="" style="height:2.6em;width:auto;vertical-align:middle;display:block;">';
  function waitForCountdownDiv() {
    var elem = document.getElementById("cutoff-countdown");
    if (!elem) return setTimeout(waitForCountdownDiv, 300);
    elem.style.display = "flex";
    elem.style.alignItems = "flex-start";
    elem.style.gap = "0.85em";
    elem.style.color = "rgb(108, 117, 125)";
    elem.style.setProperty("color", "rgb(108, 117, 125)", "important");
    var now = getBerlinTime();
    var day = now.getDay();
    var hour = now.getHours();
    var cutoff = new Date(now);
    cutoff.setHours(13, 0, 0, 0);
    var ms,
      h,
      m,
      s,
      color,
      targetDay,
      isTomorrow,
      dateLabel,
      showSeconds,
      zeitHtml;
    function getColor(hours) {
      if (hours < 1) return "#dc2626";
      if (hours < 3) return "#eab308";
      return "#13a10e";
    }
    if (isWorkday(now) && hour >= 1 && hour < 13) {
      ms = cutoff - now;
      h = Math.floor(ms / (1000 * 60 * 60));
      m = Math.floor((ms / (1000 * 60)) % 60);
      s = Math.floor((ms / 1000) % 60);
      showSeconds = h === 0;
      color = getColor(h);
      zeitHtml = formatTime(h, m, s, showSeconds, color);
      dateLabel = "heute";
    } else {
      var weekdays = [
        "Sonntag",
        "Montag",
        "Dienstag",
        "Mittwoch",
        "Donnerstag",
        "Freitag",
        "Samstag",
      ];
      var nextWorkday = getNextWorkday(now);
      var nextCutoff = new Date(nextWorkday);
      nextCutoff.setHours(13, 0, 0, 0);
      ms = nextCutoff - now;
      h = Math.floor(ms / (1000 * 60 * 60));
      m = Math.floor((ms / (1000 * 60)) % 60);
      s = Math.floor((ms / 1000) % 60);
      showSeconds = h === 0;
      color = getColor(h);
      zeitHtml = formatTime(h, m, s, showSeconds, color);
      var tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      var isTomorrow = tomorrow.toDateString() === nextWorkday.toDateString();
      var dayName = weekdays[nextWorkday.getDay()];
      var dayNum = pad2(nextWorkday.getDate());
      var monthNum = pad2(nextWorkday.getMonth() + 1);
      var datum = dayNum + "." + monthNum;
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
    var textHtml =
      '<div style="display:flex;flex-direction:column;justify-content:center;line-height:1.45;">' +
      '<span style="font-weight:600;">Bestellen Sie innerhalb ' +
      zeitHtml +
      ", damit Ihre Ware " +
      dateLabel +
      " unser Lager verlässt.   </span>" +
      "</div>";
    elem.innerHTML =
      '<div style="display:flex;align-items:center;">' +
      iconHtml +
      "</div>" +
      textHtml;
  }
  waitForCountdownDiv();
  setInterval(waitForCountdownDiv, 1000);
})();
// End Section: Bestell-Versand Countdown Code

// Section: Versand Icons ändern & einfügen (läuft auf ALLEN Seiten inkl. Checkout)
document.addEventListener("DOMContentLoaded", function () {
  const shippingIcons = {
    ShippingProfileID1331:
      "https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/DHLVersand_Icon_D1.png",
    ShippingProfileID1345:
      "https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/GO_Express_Versand_Icon_D1.1.png",
    ShippingProfileID1310:
      "https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/Selbstabholung_Lager_Versand_Icon_D1.1.png",
  };

  Object.entries(shippingIcons).forEach(([profileId, iconUrl]) => {
    const label = document.querySelector(`label[for="${profileId}"]`);
    if (label) {
      const iconContainer = label.querySelector(".icon");

      if (iconContainer) {
        // Bestehendes leeren
        iconContainer.innerHTML = "";

        // Neues Icon einfügen
        const img = document.createElement("img");
        img.src = iconUrl;
        img.alt = "Versandart Icon";
        img.className = "shipping-icon";
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
    bar.style.width = ratio * 100 + '%';
    if (total < THRESHOLD) {
      text.textContent = `Noch ${formatEuro(THRESHOLD - total)} bis zum Gratisversand`;
    } else {
      text.textContent = 'Gratisversand erreicht!';
    }
  }
    function toggleFreeShippingBar() {
      const bar = document.getElementById('free-shipping-bar');
      const pickup = document.getElementById('ShippingProfileID1310');
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

  // Section: Warenkorb Vorschau programmatisch öffnen
  (function () {
    const NATIVE_TOGGLE_SELECTORS = [
      '[data-testing="header-basket"]',
      '[data-trigger="basket-preview"]',
      '.basket-preview-toggle',
      'button[aria-controls="basket-preview"]'
    ];
    const CUSTOM_TRIGGER_SELECTOR = '#openCartPreviewBtn, [data-open-basket-preview], #openMiniCart';
    let hasWarnedMissingToggle = false;
    let pendingToggleObserver = null;

    function findNativeCartToggle() {
      for (const selector of NATIVE_TOGGLE_SELECTORS) {
        const element = document.querySelector(selector);
        if (element) {
          return element;
        }
      }
      return null;
    }

    function triggerNativeClick(element) {
      if (typeof element.click === 'function') {
        element.click();
      } else {
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    }

    function openBasketPreview(options) {
      const toggle = findNativeCartToggle();
      if (!toggle) {
        if (!options || options.silent !== true) {
          if (!hasWarnedMissingToggle) {
            console.warn('[HammerShops] Kein nativer Warenkorb-Trigger gefunden, um die Vorschau zu öffnen.');
            hasWarnedMissingToggle = true;
          }
        }
        return false;
      }

      triggerNativeClick(toggle);
      return true;
    }

    function waitForNativeToggleAndOpen() {
      if (pendingToggleObserver) {
        return;
      }

      const root = document.body || document.documentElement;
      if (!root) {
        return;
      }

      pendingToggleObserver = new MutationObserver((_, observer) => {
        if (openBasketPreview({ silent: true })) {
          observer.disconnect();
          pendingToggleObserver = null;
        }
      });

      pendingToggleObserver.observe(root, { childList: true, subtree: true });

      setTimeout(() => {
        if (pendingToggleObserver) {
          pendingToggleObserver.disconnect();
          pendingToggleObserver = null;
        }
      }, 10000);
    }

    function handleTriggerClick(event) {
      const trigger = event.target.closest(CUSTOM_TRIGGER_SELECTOR);
      if (!trigger || trigger.hasAttribute('disabled') || trigger.getAttribute('aria-disabled') === 'true') {
        return;
      }

      event.preventDefault();
      if (!openBasketPreview()) {
        waitForNativeToggleAndOpen();
      }
    }

    document.addEventListener('click', function (event) {
      if (!event.target || typeof event.target.closest !== 'function') {
        return;
      }
      handleTriggerClick(event);
    });

    function init() {
      const defaultButton = document.querySelector('#openCartPreviewBtn');
      if (defaultButton && !defaultButton.hasAttribute('data-open-basket-preview')) {
        defaultButton.setAttribute('data-open-basket-preview', '');
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    window.hmOpenBasketPreview = () => openBasketPreview();
    window.openCeresCartPreview = () => openBasketPreview();
  })();

  // End Section: Warenkorb Vorschau programmatisch öffnen

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
