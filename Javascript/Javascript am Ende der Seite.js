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
    searchInput.addEventListener("focus", function () {
      inputFocused = true;
      stopTyping();
      clearTimeout(inactivityTimer);
      if (!searchInput.value) {
        searchInput.placeholder = "Wonach suchst du?";
      }
      // Keine Animation starten während Fokus!
    });

    searchInput.addEventListener("input", function () {
      stopTyping();
      clearTimeout(inactivityTimer);
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

      // Nur einmal patchen, solange der Button lebt
      if (!weiterEinkaufenBtn.classList.contains("weiter-einkaufen-patched")) {
        // Button-Text und Arrow setzen (kein Spinner!)
        weiterEinkaufenBtn.innerHTML =
          '<i class="fa fa-arrow-left" aria-hidden="true" style="margin-right:8px"></i>Weiter einkaufen';

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

  // Section: Doofinder Add-to-Cart

  document.addEventListener("doofinder.cart.add", function (event) {
    const doofinderVariationId = event.detail.item_id; // Doofinder liefert die Variations-ID als 'item_id'
    const quantity = event.detail.amount || 1; // Standardmenge ist 1, falls nicht explizit in Doofinder angegeben

    // --- ANGEPASST AN IHREN SHOP (BASIEREND AUF DEM SCREENSHOT) ---
    // Die exakte URL, die Sie in den Entwicklertools gefunden haben
    const addUrl = "https://www.schrauben-hammer.de/rest/io/basket/item";

    // Die Payload-Daten, die Ihr Shop erwartet.
    // Es ist ein JSON-Objekt mit 'variationId' und 'quantity'.
    const requestBody = {
      variationId: parseInt(doofinderVariationId), // Konvertieren zu einer Ganzzahl
      quantity: parseInt(quantity), // Konvertieren zu einer Ganzzahl
    };
    // End Section: Anpassung

    fetch(addUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Wichtig: Wir senden JSON
        "X-Requested-With": "XMLHttpRequest", // Wird oft bei AJAX-Anfragen erwartet
      },
      body: JSON.stringify(requestBody), // Konvertiert unser JavaScript-Objekt in einen JSON-String
    })
      .then((response) => {
        if (!response.ok) {
          // Wenn der HTTP-Statuscode ein Fehler ist (z.B. 400, 500)
          return response
            .json()
            .then((errorData) => {
              throw new Error(
                `Fehler beim Hinzufügen zum Warenkorb: ${response.status} - ${errorData.message || response.statusText}`,
              );
            })
            .catch(() => {
              // Falls die Fehlerantwort kein JSON ist
              throw new Error(
                `Fehler beim Hinzufügen zum Warenkorb: ${response.status} - ${response.statusText}`,
              );
            });
        }
        return response.json(); // Oder response.text(), je nachdem, was Ihr Shop zurückgibt
      })
      .then((data) => {
        // Erfolg: Artikel wurde hinzugefügt
        console.log("Artikel erfolgreich zum Warenkorb hinzugefügt:", data);

        // Hier können Sie den Nutzer benachrichtigen oder den Mini-Warenkorb aktualisieren.
        // Plentymarkets Ceres aktualisiert in der Regel den Warenkorb-Counter automatisch,
        // wenn die API-Antwort korrekt ist. Eine sichtbare Erfolgsmeldung für den Benutzer ist aber gut.

        // Eine einfache Browser-Benachrichtigung für den Anfang:
        alert("Artikel erfolgreich zum Warenkorb hinzugefügt!");

        // Optional: Wenn Sie möchten, dass der Warenkorb-Counter sofort aktualisiert wird,
        // ohne dass die Seite neu geladen wird, können Sie versuchen, ein
        // 'updated::basket' oder ähnliches Event zu dispatchen, falls Ceres darauf hört.
        // Beispiel (muss getestet werden, ob Ceres darauf reagiert):
        // document.dispatchEvent(new CustomEvent('updated::basket', { detail: data }));
      })
      .catch((error) => {
        // Fehlerbehandlung
        console.error("Fehler beim Hinzufügen zum Warenkorb:", error);
        alert("Fehler beim Hinzufügen zum Warenkorb: " + error.message);
      });
  });

  // End Section: Doofinder Add-to-Cart
})();
