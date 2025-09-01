### Makeshift solutions for our Shop Design

All included styling and functions should ideally eventually be created into standalone plugins for Plentymarkets that then can be more resource effiencent, easier configurable and better to maintain then having all pack in a set of text blocks to copy-paste.

### Free shipping progress bar

The progress bar for free shipping is only shown when the selected shipping country is Germany (value `1`).
To keep the script maintainable, the country select elements are located with attribute selectors such as
`select[id*="shipping-country-select"]` and `select[id*="country-id-select"]`. These match any element whose `id`
contains those fragments, so the code continues to work even when shop updates change the numeric suffixes of the IDs.
