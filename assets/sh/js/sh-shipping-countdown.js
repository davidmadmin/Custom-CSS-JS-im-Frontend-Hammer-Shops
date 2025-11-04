// SH Shipping Countdown

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
  function pad2(n) {
    return n < 10 ? "0" + n : n;
  }

  function shOnReady(callback) {
    if (typeof callback !== "function") return;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }

    callback();
  }

  var holidayCache = {};

  function formatDateKey(date) {
    return (
      date.getFullYear() +
      "-" +
      pad2(date.getMonth() + 1) +
      "-" +
      pad2(date.getDate())
    );
  }

  function calculateEasterSunday(year) {
    var a = year % 19;
    var b = Math.floor(year / 100);
    var c = year % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31);
    var day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  function addDays(date, days) {
    var copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function getHolidaySet(year) {
    if (holidayCache[year]) return holidayCache[year];

    var holidays = new Set();
    function add(date) {
      holidays.add(formatDateKey(date));
    }

    [
      [0, 1],   // Neujahr
      [4, 1],   // Tag der Arbeit
      [9, 3],   // Tag der Deutschen Einheit
      [11, 25], // 1. Weihnachtsfeiertag
      [11, 26], // 2. Weihnachtsfeiertag
    ].forEach(function (parts) {
      add(new Date(year, parts[0], parts[1]));
    });

    var easterSunday = calculateEasterSunday(year);
    [
      -2, // Karfreitag
      1,  // Ostermontag
      39, // Christi Himmelfahrt
      50, // Pfingstmontag
      60  // Fronleichnam (NRW)
    ].forEach(function (offset) {
      add(addDays(easterSunday, offset));
    });

    add(new Date(year, 10, 1)); // Allerheiligen (NRW)

    holidayCache[year] = holidays;
    return holidays;
  }

  function isHoliday(date) {
    var set = getHolidaySet(date.getFullYear());
    return set.has(formatDateKey(date));
  }

  function isWorkday(date) {
    var day = date.getDay();
    if (day === 0 || day === 6) return false;
    if (isHoliday(date)) return false;
    return true;
  }

  function getNextWorkday(date) {
    var next = new Date(date);
    do {
      next.setDate(next.getDate() + 1);
    } while (!isWorkday(next));
    return next;
  }
  function pluralize(n, singular, plural) {
    return n === 1 ? singular : plural;
  }
  function formatTime(h, m, s, showSeconds, color) {
    let t = '<span style="font-weight:bold;color:' + color + ';">';
    if (h >= 24) {
      const days = Math.floor(h / 24);
      const remainingHours = h % 24;
      t += days + " " + pluralize(days, "Tag", "Tage");
      if (remainingHours > 0) {
        t += " " + remainingHours + " " + pluralize(remainingHours, "Stunde", "Stunden");
      } else if (m > 0) {
        t += " " + m + " " + pluralize(m, "Minute", "Minuten");
      }
    } else {
      if (h > 0) {
        t += h + " " + pluralize(h, "Stunde", "Stunden") + " ";
      }
      t += m + " " + pluralize(m, "Minute", "Minuten");
      if (showSeconds) t += " " + s + " " + pluralize(s, "Sekunde", "Sekunden");
    }
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
    var ms, h, m, s, color, dateLabel, showSeconds, zeitHtml;
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
      var startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      var startOfNext = new Date(nextWorkday);
      startOfNext.setHours(0, 0, 0, 0);
      var diffDays = Math.round((startOfNext - startOfToday) / (1000 * 60 * 60 * 24));
      var tomorrow = new Date(startOfToday);
      tomorrow.setDate(startOfToday.getDate() + 1);
      var isTomorrow = startOfNext.getTime() === tomorrow.getTime();
      var dayName = weekdays[nextWorkday.getDay()];
      var dayNum = pad2(nextWorkday.getDate());
      var monthNum = pad2(nextWorkday.getMonth() + 1);
      var datum = dayNum + "." + monthNum;
      if (isTomorrow) {
        dateLabel = "Morgen, " + dayName + " den " + datum;
      } else if (diffDays === 2) {
        dateLabel = "Übermorgen, " + dayName + " den " + datum;
      } else if (diffDays > 2 && dayName === "Montag") {
        dateLabel = "nächsten Montag, den " + datum;
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
