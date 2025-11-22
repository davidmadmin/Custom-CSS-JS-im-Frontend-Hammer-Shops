(function () {
  "use strict";

  var ADD_EVENT = "doofinder.cart.add";
  var SUCCESS_EVENT = "doofinder.cart.added";
  var ERROR_EVENT = "doofinder.cart.error";
  var BASKET_ENDPOINT = "/rest/io/basket/items";

  function normalizeQuantity(rawQuantity) {
    var parsed = parseInt(rawQuantity, 10);

    if (isNaN(parsed) || parsed <= 0) {
      return 1;
    }

    return parsed;
  }

  function normalizeVariationId(rawId) {
    var parsed = parseInt(rawId, 10);

    if (isNaN(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  function addToPlentyCart(variationId, quantity) {
    return fetch(BASKET_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
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
    var variationId = normalizeVariationId(detail.item_id || detail.variationId);
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
        emit(SUCCESS_EVENT, {
          variationId: variationId,
          quantity: quantity,
          response: payload,
        });
      })
      .catch(function (error) {
        emit(ERROR_EVENT, {
          variationId: variationId,
          quantity: quantity,
          error: error,
        });
      });
  }

  document.addEventListener(ADD_EVENT, handleDoofinderAdd);
})();
