(function () {
  "use strict";

  var ADD_EVENT = "doofinder.cart.add";
  var SUCCESS_EVENT = "doofinder.cart.added";
  var ERROR_EVENT = "doofinder.cart.error";
  var BASKET_ENDPOINT = "/rest/io/basket/items";

  function getVueStore() {
    if (window.vueApp && window.vueApp.$store) {
      return window.vueApp.$store;
    }

    if (
      window.ceresStore &&
      typeof window.ceresStore.dispatch === "function"
    ) {
      return window.ceresStore;
    }

    return null;
  }

  function resolveStoreAction(store, actionNames) {
    if (!store || !store._actions) {
      return null;
    }

    for (var index = 0; index < actionNames.length; index += 1) {
      var name = actionNames[index];

      if (store._actions[name]) {
        return name;
      }
    }

    return null;
  }

  function refreshBasketTotals(store) {
    var actionName =
      store &&
      resolveStoreAction(store, [
        "basket/updateBasket",
        "updateBasket",
        "basket/loadBasket",
        "loadBasket",
        "basket/getBasket",
        "getBasket",
      ]);

    if (!actionName) {
      return;
    }

    try {
      var result = store.dispatch(actionName);

      if (result && typeof result.catch === "function") {
        result.catch(function () {});
      }
    } catch (error) {
      /* Ignore dispatch errors to avoid breaking the UI. */
    }
  }

  function normalizeQuantity(rawQuantity) {
    var parsed = parseInt(rawQuantity, 10);

    if (isNaN(parsed) || parsed <= 0) {
      return 1;
    }

    return parsed;
  }

  function normalizeVariationId(detail) {
    var candidates = [
      detail && detail.variationId,
      detail && detail.variation_id,
      detail && detail.item_id,
      detail && detail.id,
      detail && detail.item && detail.item.variationId,
      detail && detail.item && detail.item.variation_id,
      detail && detail.item && detail.item.id,
    ];

    for (var i = 0; i < candidates.length; i++) {
      var parsed = parseInt(candidates[i], 10);

      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return null;
  }

  function addToPlentyCart(variationId, quantity) {
    var headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };

    if (
      window.plentyShopConfig &&
      window.plentyShopConfig.csrfToken
    ) {
      headers["X-CSRF-TOKEN"] = window.plentyShopConfig.csrfToken;
    }

    return fetch(BASKET_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: headers,
      body: JSON.stringify({
        variationId: variationId,
        quantity: quantity,
      }),
    }).then(function (response) {
      if (!response.ok) {
        throw response;
      }

      return response.json();
    });
  }

  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail: detail }));
  }

  function handleDoofinderAdd(event) {
    var detail = event && event.detail ? event.detail : {};
    var variationId = normalizeVariationId(detail);
    var quantity = normalizeQuantity(detail.amount || detail.quantity);

    if (!variationId) {
      emit(ERROR_EVENT, {
        message: "Missing or invalid variationId in Doofinder event",
        sourceEvent: detail,
      });
      return;
    }

    addToPlentyCart(variationId, quantity)
      .then(function (payload) {
        refreshBasketTotals(getVueStore());

        emit(SUCCESS_EVENT, {
          variationId: variationId,
          quantity: quantity,
          response: payload,
        });
      })
      .catch(function (error) {
        if (error && typeof error.text === "function") {
          error.text().then(function (message) {
            emit(ERROR_EVENT, {
              variationId: variationId,
              quantity: quantity,
              error: message,
            });
          });
          return;
        }

        emit(ERROR_EVENT, {
          variationId: variationId,
          quantity: quantity,
          error: error,
        });
      });
  }

  document.addEventListener(ADD_EVENT, handleDoofinderAdd);
})();
