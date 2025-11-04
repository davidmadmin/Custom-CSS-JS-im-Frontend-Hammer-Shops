# FH JavaScript Modules

Register these scripts with the Custom CSS/JS plugin in the listed order. `fh-core.js` defines the shared helpers used by downstream modules.

| File | Purpose |
| --- | --- |
| `fh-core.js` | Provides the `fhOnReady` helper and other global utilities required by the feature modules. |
| `fh-header-navigation.js` | Controls the account greeting, header stickiness, desktop & mobile navigation toggles, and scroll-based interactions. |
| `fh-wishlist.js` | Powers the wishlist flyout preview and ensures wishlist buttons toggle the state consistently. |
| `fh-basket.js` | Locks focus inside the basket preview, cleans stale Vue attributes, and rewrites the continue-shopping CTA. |
| `fh-auth.js` | Preloads login/register Vue components before the authentication modals open. |
| `fh-shipping-countdown.js` | Implements the delivery countdown timer logic. |
| `fh-shipping-icons.js` | Replaces the default shipping icons with the branded variants across the storefront. |
| `fh-free-shipping.js` | Updates the free-shipping progress bar thresholds and messaging. |
| `fh-search.js` | Animates search placeholder suggestions and hides the Trusted Shops badge while the overlay is active. |
