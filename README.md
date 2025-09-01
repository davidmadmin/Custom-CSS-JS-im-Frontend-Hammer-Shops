### Makeshift solutions for our Shop Design

All included styling and functions should ideally eventually be created into standalone plugins for Plentymarkets that then can be more resource effiencent, easier configurable and better to maintain then having all pack in a set of text blocks to copy-paste.

### Free shipping progress bar
The progress bar for free shipping is now displayed only when the selected
country is Germany (value `1`). The script watches every `<select>` element
whose ID contains `shipping-country-select` or `country-id-select`. If any of
these selects has a value other than `1`, the bar is hidden. To support new
country selectors, simply add the ID fragment to the `COUNTRY_SELECT_PATTERNS`
array inside the JavaScript files.
