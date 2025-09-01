### Makeshift solutions for our Shop Design

All included styling and functions should ideally eventually be created into
standalone plugins for Plentymarkets that then can be more resource efficient,
easier configurable and better to maintain than having all packed in a set of
text blocks to copy-paste.

### Features

#### Bestell-Versand Countdown
Shows how long customers can still order for same-day shipping. The timer
updates every second and appears wherever a `#cutoff-countdown` element exists.

#### Shipping option icons
Replaces the default icons for shipping profile radio buttons with custom
graphics. The icons are applied wherever the corresponding shipping profiles are rendered.

#### Free shipping progress bar
Displays a progress bar toward the €150 free-shipping threshold near the order
totals. Outside checkout it is always visible. During checkout (`/checkout`,
`/kaufabwicklung`, `/kasse`) the bar appears only when one of the country
`<select>` elements with an ID containing `shipping-country-select`,
`invoice-country-select`, or `country-id-select` has the value `1` (Germany).
Changing the selection to a different country hides the bar, and switching back
to Germany shows it again. To support additional country selectors, add the
relevant ID fragment to the `COUNTRY_SELECT_ID_FRAGMENTS` array in the
JavaScript. Selecting the self-pickup shipping profile hides the bar regardless
of country.

#### Animated search placeholder
Cycles through a set of suggestion texts in the search field placeholder when
the input is visible and unfocused. The animation stops while typing or when
the field is out of view.

#### “Weiter einkaufen” button in basket preview
Renames the cart overlay’s “Warenkorb” button to “Weiter einkaufen” with an
arrow icon. Clicking it closes the overlay instead of loading the cart page,
and the button stays enabled without showing a loading spinner.
