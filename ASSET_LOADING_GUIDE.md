# Custom CSS/JS Module Loading Guide

This project now ships feature-scoped CSS and JavaScript bundles so you can compose the Custom CSS/JS plugin configuration per storefront. Upload the files to your CDN and register them in the order below.

## File layout overview

```
assets/
  fh/
    css/   # Feature-specific FH stylesheets
    js/    # Feature-specific FH scripts
  sh/
    css/   # Feature-specific SH stylesheets
    js/    # Feature-specific SH scripts
FH - Stylesheets [FALLBACK].css
SH - Stylesheets [FALLBACK].css
Javascript/
  FH - Javascript am Ende der Seite [FALLBACK].js
  SH - Javascript am Ende der Seite [FALLBACK].js
```

The `assets/*` directories contain the new modular bundles. The renamed `[FALLBACK]` files keep the original monolithic overrides in case you need to revert quickly.

## Loading order

Always load the `core` bundle for each shop first—these files define shared variables and helpers that the other modules rely on.

### FH stylesheets

1. `fh-core.css`
2. Add additional FH CSS bundles as required (e.g., `fh-header-navigation.css`, `fh-product-listing.css`, `fh-checkout-cart.css`, ...).

### FH scripts

1. `fh-core.js`
2. `fh-header-navigation.js`
3. Load any other FH feature scripts in the order listed within `assets/fh/js/README.md` to maintain existing dependencies (`fh-wishlist.js`, `fh-basket.js`, `fh-auth.js`, `fh-shipping-countdown.js`, `fh-shipping-icons.js`, `fh-free-shipping.js`, `fh-search.js`).

### SH stylesheets

1. `sh-core.css`
2. Include the feature-specific SH CSS bundles that you need (`sh-product-listing.css`, `sh-checkout-cart.css`, etc.).

### SH scripts

1. `sh-core.js` (reserved slot for shared helpers; keep it first for future additions)
2. Add the remaining SH feature scripts (`sh-shipping-countdown.js`, `sh-shipping-icons.js`, `sh-free-shipping.js`).

## Choosing bundles

Consult the README inside each folder (`assets/fh/css`, `assets/fh/js`, `assets/sh/css`, `assets/sh/js`) for a short description of what each module covers. This lets you upload only the bundles that match the storefront areas you plan to customize.

## Maintenance tips

- When you add new feature overrides, prefer creating a new module alongside the existing ones rather than expanding the fallback files.
- Keep both FH and SH variants aligned—if you add a new FH module, evaluate whether an SH counterpart is necessary.
- Document any new dependencies in the appropriate folder README and update this guide if the recommended load order changes.
