# Arbeitsanweisungen für Custom CSS/JS im Hammer Shop

Ich möchte den Header und Footer für die Hammer-Shops (FH und SH) auf Basis von plentyShop LTS komplett neu bauen. Bitte berücksichtige beim Arbeiten die folgenden Punkte:

## Bezug zu plentyShop LTS (Plugin »Ceres«)

* **Quell-Repository:** https://github.com/plentymarkets/plugin-ceres.git
* **Empfehlung:** Klone das Repository parallel zu diesem Projekt in das Verzeichnis `plentyshop-lts/`, damit Twig-, Vue- und SCSS-Strukturen schnell nachgeschlagen werden können.
* **Verknüpfung:** Alle Anpassungen in diesem Repo greifen in die bestehenden Ceres-Templates ein. Prüfe daher vor Änderungen, welche IDs, Klassen, Slots oder Komponenten Ceres bereits liefert, und stelle sicher, dass Custom CSS/JS sauber darauf aufsetzt.
* **Priorität:** Header- und Footer-Rebuilds haben Vorrang gegenüber sonstigen Styling-Hacks. Ergänzende Funktionen (Countdown, Progressbars etc.) dürfen nur eingefügt werden, wenn sie mit dem neuen Aufbau kompatibel sind.

## Technologiestack plentyShop LTS 5.0.78

Die folgende Übersicht fasst alle relevanten Versionen der offiziellen plentyShop-LTS-Plugins (Ceres & IO) in Release **5.0.78** zusammen und beschreibt, wofür sie genutzt werden.

### Core & Laufzeit

| Bereich | Komponente | Version | Nutzung & Umfang |
| --- | --- | --- | --- |
| Backend Runtime | PHP | `^7.3 \|\| ^8.0` | Mindestanforderung laut `plugin-io` für sämtliche Backend-Logik, Controller und Helper. |
| Plenty Plugin Platform | plentyShop LTS (Ceres) | `5.0.78` | Standard-Storefront mit Twig/Vue-Templates, Ressourcen und Übersetzungen. |
| Plenty Plugin Platform | IO-Plugin | `5.0.78` | Liefert Routing, Controller, Services und REST-Brücken für Ceres. |
| Node.js Engine | Node.js | `14` | Erforderlich laut `package.json` (Ceres) für Build- und Tooling-Aufgaben. |
| Paketmanager | npm | `6` (mit Node 14 gebündelt) | Installiert Frontend- und Build-Abhängigkeiten. |

### Frontend-Laufzeitbibliotheken (Ceres `package.json`)

| Layer | Bibliothek | Version | Einsatzgebiet |
| --- | --- | --- | --- |
| SPA-Komponenten | vue | `^2.6.12` | Reaktive Komponenten (Filter, Warenkorb, Checkout, Widgets). |
| SPA-Komponenten | vue-template-compiler | `^2.6.12` | Kompiliert Vue-SFCs während des Builds. |
| State Management | vuex | `^3.3.0` | Globale Statusverwaltung (Warenkorb, Login, Filter). |
| SSR/Lazy Hydration | vue-lazy-hydration | `^2.0.0-beta.4` | Verzögert Vue-Mounting für bessere Performance. |
| Listen-Rendering | vue-virtual-scroller | `^1.0.10` | Virtuelles Scrolling für lange Listen (z. B. Artikellisten). |
| UI-Framework | bootstrap | `4.4.1` | Grid-System, Utility-Klassen und Basis-UI für das gesamte Theme. |
| Legacy DOM | jquery | `^3.5.1` | Unterstützt ältere Widgets, DOM-Manipulation und jQuery-Plug-ins. |
| Tooltips/Dropdowns | popper.js | `^1.16.1` | Positions-Engine für Bootstrap-Komponenten. |
| Polyfills | core-js | `^3.6.5` | ECMAScript-Polyfills für ältere Browser. |
| Datum/Zeiten | dayjs | `^1.8.26` | Datumsformatierung in Frontend-Komponenten. |
| Feature Detection | detect-browser | `^4.8.0` | Browsererkennung für konditionales Verhalten. |
| Assets | flag-icon-css | `^2.9.0` | Flaggen-Icons für Sprach-/Länderauswahl. |
| Assets | font-awesome | `^4.6.3` | Icon-Schriften für UI-Elemente. |
| Slider | owl.carousel | `2.2.0` | Karussell für Produkt-Slider & Teaser. |
| Utilities | lodash | `^4.17.21` | Hilfsfunktionen (Debounce, Cloning, Collections). |
| MIME Handling | mime-types | `^2.1.35` | Typzuordnung in Upload-/Download-Flows. |
| Custom Events | custom-event-polyfill | `^1.0.0` | Polyfill für `CustomEvent` in älteren Browsern. |

### Build-, QA- und Test-Tooling (Ceres `devDependencies`)

| Tooling-Bereich | Paket | Version | Verwendung |
| --- | --- | --- | --- |
| Bundling | webpack | `^4.43.0` | Bündelt JS, kompiliert Assets (Client/Server/Styles). |
| Bundling | webpack-cli | `^3.3.11` | CLI für Webpack-Builds. |
| Bundling | webpack-fix-style-only-entries | `^0.3.1` | Entfernt leere JS-Dateien bei reinen Style-Entries. |
| Bundling | webpack-require-from | `^1.8.1` | Lädt Assets relativ zur Shop-Domain. |
| Transpilation | @babel/core | `^7.10.5` | ECMAScript-Transpilation. |
| Transpilation | @babel/preset-env | `^7.9.6` | Ziel-Browser-Matrix. |
| Transpilation | @babel/plugin-proposal-object-rest-spread | `^7.9.6` | Unterstützt moderne Syntax. |
| Transpilation | @babel/plugin-syntax-dynamic-import | `^7.8.3` | Ermöglicht dynamische Imports. |
| Loader | babel-loader | `^8.1.0` | Bindet Babel in Webpack ein. |
| Styles | sass | `^1.49.9` | Dart-Sass-Compiler für SCSS. |
| Styles | sass-loader | `^7.3.1` | Webpack-Loader für SCSS → CSS. |
| Styles | postcss | `^8.4.31` | Nachbearbeitung (Autoprefixing etc.). |
| Styles | postcss-loader | `^3.0.0` | Bindet PostCSS in Webpack ein. |
| Styles | postcss-scss | `^1.0.5` | SCSS-Syntax-Support in PostCSS. |
| Styles | autoprefixer | `^8.6.5` | Vendor-Prefixes für CSS. |
| Styles | mini-css-extract-plugin | `^0.8.2` | Extrahiert CSS in Dateien. |
| Styles | stylelint | `^14.16.1` | Linting für SCSS-Dateien. |
| Styles | stylelint-config-twbs-bootstrap | `^7.0.0` | Bootstrap-spezifische Stylelint-Regeln. |
| JS-Qualität | eslint | `^6.8.0` | JavaScript-Linting. |
| JS-Qualität | eslint-config-google | `^0.13.0` | Regelset für ESLint. |
| JS-Qualität | eslint-loader | `^2.2.1` | Integriert ESLint in Webpack. |
| JS-Qualität | babel-eslint | `^10.1.0` | Parser für ESLint & moderne Syntax. |
| Tools | copy-webpack-plugin | `^6.4.1` | Kopiert statische Assets. |
| Tools | expose-loader | `^0.7.5` | Exponiert Module global (z. B. jQuery). |
| Tools | glob | `^7.1.6` | Dateisuchen für Build-Skripte. |
| Tools | del | `^2.2.0` | Löscht Build-Ordner. |
| Tools | serialize-javascript | `^3.1.0` | Serialisiert Daten in Templates. |
| Tools | q | `^1.5.1` | Promise-Hilfsbibliothek in Tools. |
| Tools | esm | `^3.2.25` | ESM-Unterstützung für Node-Skripte. |
| Testing | cypress | `^8.5.0` | E2E-Tests für Checkout & Storefront. |
| Testing | cypress-file-upload | `^4.1.1` | File-Upload-Unterstützung in Tests. |
| Testing | moment-locales-webpack-plugin | `^1.2.0` | Optimiert Moment.js-Lokalisierungen (Altbestand). |

### Daten & Schnittstellen

* **REST-API-Dokumentation:** https://developers.plentymarkets.com/en-gb/plentymarkets-rest-api/index.html – Ziehe diese Quelle immer heran, wenn du Datenflüsse, Endpunkte oder Datenstrukturen verstehen oder erweitern musst. Für reine CSS- oder HTML-Änderungen ist ein Blick in die API-Dokumentation in der Regel nicht erforderlich.
* **IO-Plugin:** https://github.com/plentymarkets/plugin-io – Das IO-Plugin liefert wesentliche Shop-Funktionalitäten (Routing, Controller, Widgets). Prüfe vor komplexeren JS-Anpassungen, ob hier bereits passende Hooks oder Komponenten existieren. Bei kosmetischen Anpassungen kann dieses Nachschlagen entfallen.
* **plentyShop LTS / Ceres:** https://github.com/plentymarkets/plugin-ceres – Bleibt die maßgebliche Grundlage für Templates, Vue-Komponenten und Styles. Für tiefgreifende Layout- oder Logikänderungen ist der Abgleich Pflicht, während bei isolierten Style-Overrides ein kurzer Plausibilitätscheck genügt.

> **Hinweis:** Nutze diese Ressourcen gezielt. Wenn du z. B. lediglich Farben, Abstände oder Schriftgrößen in einer bestehenden CSS-Datei änderst, reicht es, die lokale Struktur zu kennen. Erst wenn Backend-Daten, Komponenten oder Shop-Flows betroffen sind, sollten IO-Plugin und REST-API eingehend geprüft werden.

## Stil- und Strukturvorgaben

* Arbeite mit sauber dokumentierten HTML-Strukturen. Inline-CSS ist erlaubt, darf aber keine Skripte einbetten.
* JavaScript-Erweiterungen sollen bestehende Ceres-Hooks nutzen; vermeide doppelte Event-Listener, wenn Ceres bereits Funktionen liefert.
* Beachte, dass beide Shops (FH & SH) synchron angepasst werden müssen. Änderungen in einem Shop dürfen den anderen nicht beschädigen.
* Verwende für Shop-Verlinkungen immer relative Pfade (z. B. `/start` statt `https://www.fenster-hammer.de/start` oder `https://www.schraubenhammer.de/start`).
* Ersetze CDN-Hostnamen automatisch: sobald Du `//cdn02.plentymarkets.com/nteqnk1xxnkn` in FH-Dateien siehst oder von mir bekommst, wandelst Du ihn in `//bilder.fenster-hammer.de` um; in SH-Dateien in `//bilder.schrauben-hammer.de`. Behalte dabei Protokoll und Pfad bei, damit die Links first-party gehostet bleiben.
* Halte README und begleitende Dokumentation aktuell, wenn Du neue Features oder Abhängigkeiten ergänzt.
* Verwende für die direkte Anrede konsequent die Du-Form und schreibe Du/Dir/Dich/Dein usw. immer mit großem Anfangsbuchstaben – unabhängig von der Position im Satz.
* Behandle die Begriffe Wunschliste, Merkliste und wishlist als synonym. PlentyLTS nutzt intern „Wish-list“, doch in der Kundenkommunikation verwenden wir ausschließlich „Merkliste“.

## Commit Message Convention (Conventional Commits)

All commits MUST follow the Conventional Commits format:

<type>(optional scope): short, imperative description

Examples:
- feat(auth): add password reset flow
- fix: resolve checkout rounding error
- refactor(ui): simplify header component
- chore: update dependencies

### Allowed Types

Use ONLY the following types:

### feat
Introduce a new user-facing feature or capability.

Examples:
- feat: add wishlist support
- feat(search): implement fuzzy matching

---

### fix
Patch a bug or incorrect behavior.

Examples:
- fix: prevent crash on empty cart
- fix(api): handle null response

---

### docs
Documentation-only changes (README, comments, guides).

Examples:
- docs: update setup instructions
- docs(api): clarify authentication flow

---

### style
Formatting or stylistic changes that do NOT affect logic.
(whitespace, linting, prettier, formatting)

Examples:
- style: format files with prettier
- style(css): normalize spacing

---

### refactor
Code changes that neither fix a bug nor add a feature.
Behavior must remain the same; structure or clarity improves.

Examples:
- refactor: extract pricing logic into helper
- refactor(core): simplify state handling

---

### perf
Performance improvements without changing behavior.

Examples:
- perf: memoize expensive selectors
- perf(images): optimize loading strategy

---

### test
Add or modify tests only.

Examples:
- test: add unit tests for checkout
- test(auth): improve coverage

---

### build
Changes affecting build system or external dependencies.
(e.g., bundlers, compilers, package managers)

Examples:
- build: update vite config
- build: bump node version

---

### ci
Changes to CI/CD configuration or pipelines.

Examples:
- ci: adjust GitHub Actions workflow
- ci: add caching step

---

### chore
Maintenance or housekeeping tasks that don’t modify app behavior.
(updating deps, cleaning files, config tweaks)

Examples:
- chore: update npm dependencies
- chore: remove unused assets

---

### revert
Revert a previous commit.

Examples:
- revert: feat: add experimental checkout

---

### Rules

- Use present tense, imperative mood (“add”, not “added”).
- Keep the summary under ~72 characters.
- Do NOT capitalize the first letter of the description.
- Do NOT end the subject line with a period.
- Use scopes when helpful (e.g., auth, ui, api).
- Only ONE type per commit.

This standard enables automated changelogs, clearer history, and semantic versioning.
