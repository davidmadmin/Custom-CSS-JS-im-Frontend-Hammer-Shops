(function () {
    if (typeof window === "undefined") {
        return;
    }

    var pathname = window.location && window.location.pathname;
    if (!(pathname && pathname.indexOf("/my-account") === 0)) {
        return;
    }

    var TRACKING_BASE = "https://www.schrauben-hammer.de/sendungsverfolgung-sh?tracking-code=";

    function extractTrackingCode(link) {
        var dataValue = link.dataset && (link.dataset.trackingCode || link.dataset.tracking || link.dataset.code);
        if (dataValue) {
            return dataValue.trim();
        }

        var href = link.getAttribute("href") || "";
        var match = href.match(/([A-Z0-9]{8,})/i);
        return match ? match[1] : "";
    }

    function extractOrderNumber(container) {
        var idElements = container.querySelectorAll("[id]");
        for (var i = 0; i < idElements.length; i++) {
            var idMatch = idElements[i].id.match(/_(\d{4,})$/);
            if (idMatch) {
                return idMatch[1];
            }
        }

        var textMatch = (container.textContent || "").match(/#?(\d{5,})/);
        return textMatch ? textMatch[1] : "";
    }

    function extractRecipientZip(container) {
        var addressLists = container.querySelectorAll(".address-list");
        if (addressLists.length > 0) {
            for (var i = 0; i < addressLists.length; i++) {
                var zipMatch = addressLists[i].textContent.match(/\b\d{5}\b/);
                if (zipMatch) {
                    return zipMatch[0];
                }
            }
        }

        var fallback = (container.textContent || "").match(/\b\d{5}\b/);
        return fallback ? fallback[0] : "";
    }

    function buildTrackingUrl(trackingCode, zipCode, orderNumber) {
        var parts = ["de", trackingCode, zipCode, orderNumber].map(function (value) {
            return encodeURIComponent(value || "");
        });
        return TRACKING_BASE + parts.join("~");
    }

    function updateTrackingLinks(root) {
        var links = (root || document).querySelectorAll("a");
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            if (link.dataset && link.dataset.customTrackingPatched === "true") {
                continue;
            }

            var label = (link.textContent || "").trim();
            if (!/sendungsverfolgung/i.test(label)) {
                continue;
            }

            var orderContainer = link.closest(".collapse") || link.closest(".card") || document;
            var trackingCode = extractTrackingCode(link);
            var orderNumber = extractOrderNumber(orderContainer);
            var zipCode = extractRecipientZip(orderContainer);

            if (!trackingCode || !orderNumber || !zipCode) {
                continue;
            }

            link.href = buildTrackingUrl(trackingCode, zipCode, orderNumber);
            link.target = "_blank";
            link.rel = "noopener";
            link.dataset.customTrackingPatched = "true";
        }
    }

    updateTrackingLinks(document);

    var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var mutation = mutations[i];
            for (var j = 0; j < mutation.addedNodes.length; j++) {
                var node = mutation.addedNodes[j];
                if (node.nodeType === 1) {
                    updateTrackingLinks(node);
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
