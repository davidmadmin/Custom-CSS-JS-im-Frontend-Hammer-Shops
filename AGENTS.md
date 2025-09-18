I want to built &amp; maintain an awesome Footer and Header in PlentyLTS with ChatGPT Codex from scratch for SH and FH both shops. I plan to do this with just HTML and inline CSS that do not itself include any scripts but rather utilize scripts that are already in use in the PlentyLTS system.

# plentyShop LTS Technology Stack (2025)

| Layer / Area        | Framework / Tool        | Version / Note                                               | Purpose                                                                 |
|---------------------|-------------------------|--------------------------------------------------------------|-------------------------------------------------------------------------|
| **Backend Runtime** | PHP                     | **PHP 8.0+** (earlier docs mention 7.3/7.4, but now PHP 8)   | Core server-side logic, plugin system                                   |
| **Templating**      | Twig                    | v2+                                                          | View layer templating, separating logic from design                     |
| **Frontend JS**     | Vue.js                  | v2.x (with migration paths to Vue 3 in roadmap)              | Reactive components (filters, dynamic cart, checkout interactivity)     |
| **Legacy JS**       | jQuery                  | 3.x                                                          | DOM manipulation, older widgets, backwards compatibility                |
| **CSS Preprocessor**| SASS (SCSS syntax)      | Latest (via node-sass / dart-sass)                           | Maintainable stylesheets                                                |
| **CSS Framework**   | Bootstrap               | 4.x                                                          | Responsive grid and UI components                                       |
| **Build System**    | Webpack                 | 4.x/5.x depending on plugin version                          | Bundling JS, compiling SASS → CSS, asset pipeline                       |
| **Package Manager** | Node.js + npm           | Node 14+ / npm 6+ (depending on plugin branch)                | Dependency and build tooling                                            |
| **E-Commerce Core** | PlentyONE Plugin System | PlentyShop LTS + IO Plugin                                   | Core shop functions (checkout, basket, account, search, etc.)           |
| **Data Layer**      | REST API (Plentymarkets)| JSON RESTful API                                             | Exposes data for products, orders, customers, stock                     |
| **SEO/Markup**      | Schema.org JSON-LD      | BreadcrumbList, Product schema                               | Structured data for search engines                                      |
| **Trust/Widgets**   | Trusted Shops / Others  | Third-party JS widgets                                       | Reviews, trust badges, legal compliance                                 |
