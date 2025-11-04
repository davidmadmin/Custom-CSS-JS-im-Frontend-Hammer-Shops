# Custom CSS & JS for Hammer Shops

Dieses Repository sammelt alle CSS- und JavaScript-Anpassungen, mit denen wir die Hammer-Shop-Instanzen auf Basis von [plentyShop LTS (Plugin »Ceres«)](https://github.com/plentymarkets/plugin-ceres.git) individualisieren. Die Anpassungen ergänzen bzw. ersetzen das Standardlayout – insbesondere Header und Footer – und liefern zusätzliche Funktionen, solange noch keine eigenständigen Plugins zur Verfügung stehen.

## Bezug zu plentyShop LTS

* **Technische Grundlage:** Alle Templates, Slots und Komponenten stammen aus dem Ceres-Plugin des plentyShop LTS-Projekts. Für neue Aufgaben müssen daher immer die Originaldateien und Twig-Strukturen aus `plentymarkets/plugin-ceres` berücksichtigt werden.
* **Empfohlener Workflow:**
  1. Repository clonen: `git clone https://github.com/plentymarkets/plugin-ceres.git plentyshop-lts`.
  2. In der lokalen Arbeitskopie dieses Projekts liegt das Subverzeichnis `plentyshop-lts/`, sodass Header- und Footer-Strukturen, Vue-Komponenten und SCSS-Dateien leicht nachgeschlagen werden können.
  3. Änderungen an diesem Repository müssen mit den jeweiligen Twig- und Vue-Komponenten aus Ceres abgeglichen werden, damit IDs, Klassen und Slots korrekt angesprochen werden.
* **Priorität:** Wenn Entscheidungen zwischen Inline-Anpassungen hier und nativen Ceres-Funktionen zu treffen sind, gilt: Header- und Footer-Neubauten haben Vorrang, danach greifen zusätzliche Styles oder Skripte.

## Technologie-Stack plentyShop LTS 5.0.78

Die Version **5.0.78** der offiziellen plentyShop-LTS-Plugins (Ceres & IO) bildet den Referenzstand für alle Arbeiten in diesem Repository. Die folgenden Tabellen listen sämtliche relevanten Komponenten, deren Version sowie Einsatz und Reichweite auf.

### Core & Laufzeit

| Bereich | Komponente | Version | Nutzung & Umfang |
| --- | --- | --- | --- |
| Backend Runtime | PHP | `^7.3 \|\| ^8.0` | Mindestanforderung laut `plugin-io`; betreibt Controller, Services und Logikschichten. |
| Plenty Plugin Platform | plentyShop LTS (Ceres) | `5.0.78` | Standard-Storefront inkl. Twig-/Vue-Templates, Assets und Übersetzungen. |
| Plenty Plugin Platform | IO-Plugin | `5.0.78` | Liefert Routing, Controller, REST-Brücken und Basisfunktionen für Ceres. |
| Node.js Engine | Node.js | `14` | Erforderlich laut `package.json` (Ceres) für Build-Skripte und Tooling. |
| Paketmanager | npm | `6` (Node 14) | Installiert/verwaltet alle Frontend-Abhängigkeiten und Build-Tools. |

### Frontend-Laufzeitbibliotheken (Ceres `package.json`)

| Layer | Bibliothek | Version | Einsatzgebiet |
| --- | --- | --- | --- |
| SPA-Komponenten | vue | `^2.6.12` | Reaktive UI-Komponenten in der Storefront (Filter, Warenkorb, Checkout). |
| SPA-Komponenten | vue-template-compiler | `^2.6.12` | Kompiliert Vue-Komponenten während des Builds. |
| State Management | vuex | `^3.3.0` | Globaler Zustand (Warenkorb, Kundendaten, Facetten). |
| SSR/Lazy Hydration | vue-lazy-hydration | `^2.0.0-beta.4` | Verzögert Vue-Mounting zur Performance-Optimierung. |
| Listen-Rendering | vue-virtual-scroller | `^1.0.10` | Virtuelle Listen für große Datenmengen (Produktlisten etc.). |
| UI-Framework | bootstrap | `4.4.1` | Grid, Utilities und Basis-Komponenten für das Theme. |
| Legacy DOM | jquery | `^3.5.1` | DOM-Manipulation & Legacy-Widgets, solange Vue-Migration noch läuft. |
| Tooltips/Dropdowns | popper.js | `^1.16.1` | Positions-Engine für Bootstrap-Elemente. |
| Polyfills | core-js | `^3.6.5` | ECMAScript-Polyfills für ältere Browser. |
| Datum/Zeiten | dayjs | `^1.8.26` | Datum-/Zeitformatierung für Frontend-Komponenten. |
| Feature Detection | detect-browser | `^4.8.0` | Browsererkennung zur Feature-Steuerung. |
| Assets | flag-icon-css | `^2.9.0` | Flaggen-Icons z. B. für Sprach-/Länderauswahl. |
| Assets | font-awesome | `^4.6.3` | Icon-Font für UI-Bausteine. |
| Slider | owl.carousel | `2.2.0` | Karussell für Teaser und Produkt-Slider. |
| Utilities | lodash | `^4.17.21` | Utility-Funktionen (Debounce, Clone, Collections). |
| MIME Handling | mime-types | `^2.1.35` | Typzuordnung für Upload-/Download-Flows. |
| Custom Events | custom-event-polyfill | `^1.0.0` | Polyfill für `CustomEvent` in nicht unterstützten Browsern. |

### Build-, QA- und Test-Tooling (Ceres `devDependencies`)

| Tooling-Bereich | Paket | Version | Verwendung |
| --- | --- | --- | --- |
| Bundling | webpack | `^4.43.0` | Bündelt Client-, Server- und Style-Assets. |
| Bundling | webpack-cli | `^3.3.11` | CLI für Webpack-Builds. |
| Bundling | webpack-fix-style-only-entries | `^0.3.1` | Entfernt leere JS-Outputs bei reinen Style-Entries. |
| Bundling | webpack-require-from | `^1.8.1` | Läd Assets relativ zum Shop-Host. |
| Transpilation | @babel/core | `^7.10.5` | ECMAScript-Transpilation. |
| Transpilation | @babel/preset-env | `^7.9.6` | Ziel-Browser-Definition für Babel. |
| Transpilation | @babel/plugin-proposal-object-rest-spread | `^7.9.6` | Aktiviert Objekt-Rest/Spread-Syntax. |
| Transpilation | @babel/plugin-syntax-dynamic-import | `^7.8.3` | Unterstützt dynamische Imports. |
| Loader | babel-loader | `^8.1.0` | Bindet Babel in Webpack ein. |
| Styles | sass | `^1.49.9` | Dart-Sass-Compiler für SCSS. |
| Styles | sass-loader | `^7.3.1` | Bindet Sass in Webpack ein. |
| Styles | postcss | `^8.4.31` | Post-Processing (z. B. Autoprefixing). |
| Styles | postcss-loader | `^3.0.0` | Verknüpft PostCSS mit Webpack. |
| Styles | postcss-scss | `^1.0.5` | SCSS-Syntax-Support für PostCSS. |
| Styles | autoprefixer | `^8.6.5` | Vendor-Prefixes für CSS-Ausgaben. |
| Styles | mini-css-extract-plugin | `^0.8.2` | Extrahiert CSS in eigene Dateien. |
| Styles | stylelint | `^14.16.1` | SCSS-Linting. |
| Styles | stylelint-config-twbs-bootstrap | `^7.0.0` | Bootstrap-spezifische Stylelint-Regeln. |
| JS-Qualität | eslint | `^6.8.0` | JavaScript-Linting. |
| JS-Qualität | eslint-config-google | `^0.13.0` | Vordefiniertes Regelset für ESLint. |
| JS-Qualität | eslint-loader | `^2.2.1` | Integriert ESLint in Webpack. |
| JS-Qualität | babel-eslint | `^10.1.0` | Parser für moderne JS-Syntax im Linter. |
| Tools | copy-webpack-plugin | `^6.4.1` | Kopiert statische Assets in den Build. |
| Tools | expose-loader | `^0.7.5` | Exponiert Module global (z. B. jQuery). |
| Tools | glob | `^7.1.6` | Dateisuchen in Build-Skripten. |
| Tools | del | `^2.2.0` | Löscht Build-Verzeichnisse. |
| Tools | serialize-javascript | `^3.1.0` | Serialisiert Daten in Templates. |
| Tools | q | `^1.5.1` | Promise-Utility in Node-Skripten. |
| Tools | esm | `^3.2.25` | ESM-Unterstützung für Node-Skripte. |
| Testing | cypress | `^8.5.0` | E2E-Tests der Storefront. |
| Testing | cypress-file-upload | `^4.1.1` | Upload-Unterstützung in Cypress-Tests. |
| Testing | moment-locales-webpack-plugin | `^1.2.0` | Reduziert Moment.js-Lokalisierungen (Altbestand). |

### Referenzen & Ressourcen

* **plentyShop LTS / Ceres:** https://github.com/plentymarkets/plugin-ceres – Maßgeblich für Layouts, Slots und Komponenten. Bei strukturellen Änderungen (neue Blöcke, erweiterte Vue-Logik etc.) ist ein Abgleich Pflicht; bei rein optischen Anpassungen genügt in der Regel das lokale Wissen über die bestehende Struktur.
* **IO-Plugin:** https://github.com/plentymarkets/plugin-io – Ergänzt das Frontend um Controller, Routing und Widgets. Ziehe die Doku bzw. den Code heran, wenn du neue Funktionen, Datenbindungen oder API-Aufrufe planst. Für reine CSS- oder HTML-Korrekturen muss das IO-Plugin meist nicht konsultiert werden.
* **Plentymarkets REST-API:** https://developers.plentymarkets.com/en-gb/plentymarkets-rest-api/index.html – Liefert Details zu allen Endpunkten, Datenstrukturen und Berechtigungen. Nutze sie, sobald du mit serverseitigen Daten arbeitest oder neue API-Calls hinzufügst. Bei Aufgaben ohne Backend-Bezug (z. B. Farbänderungen) kann dieser Schritt entfallen.

> **Faustregel:** Greife auf IO-Plugin, REST-API und Ceres-Quellen zu, sobald deine Arbeit über reine Styling-Overrides hinausgeht. Für schnelle Anpassungen an Farben, Abständen oder Schriftgrößen reicht meist ein Blick in die bestehende CSS- oder Template-Struktur dieses Repos.

## Arbeitsweise für Header- und Footer-Neubau

* Der Header und Footer werden in PlentyLTS vollständig neu aufgebaut. Verwende dieses Repository, um die benötigten HTML-Gerüste (innerhalb der zulässigen Content-Boxen), CSS-Overrides und unterstützenden JavaScript-Hooks vorzubereiten.
* Inline-CSS darf keine eigenen Skripte einbinden; dynamisches Verhalten wird über bestehende oder hier gepflegte JavaScript-Dateien gelöst.
* Achte darauf, dass Anpassungen für **SH** und **FH** Shops parallel gepflegt werden und konsistent mit den Ceres-Vorlagen sind.

## Ergänzende Features über Custom JS/CSS

Neben Header und Footer stellen wir temporäre Funktions-Erweiterungen bereit. Diese sollen später in dedizierte Plugins überführt werden, dienen aber aktuell als Referenzimplementierung.

### Bestell-Versand Countdown
Zeigt an, wie lange Bestellungen für den Versand am gleichen Tag aufgegeben werden können. Aktualisiert sich jede Sekunde und erscheint überall dort, wo ein Element mit der ID `cutoff-countdown` existiert. Berücksichtigt bundeseinheitliche Feiertage sowie die landesweit arbeitsfreien Tage in Nordrhein-Westfalen bei der Berechnung des nächsten Versandtags.

### Versandarten-Icons
Ersetzt die Standard-Icons der Versandprofile durch eigene Grafiken, sofern die entsprechenden Profile gerendert werden.

### Fortschrittsbalken für Gratisversand
Visualisiert den Fortschritt zur Versandkostenbefreiung ab 150 € Einkaufswert. Außerhalb der Kaufabwicklung immer sichtbar; im Checkout abhängig vom ausgewählten Land (aktuell Deutschland) und dem Versandprofil.

### Animierter Suchplatzhalter
Variiert den Platzhaltertext im Suchfeld, solange das Feld sichtbar, aber nicht fokussiert ist. Während der Eingabe oder wenn das Feld unsichtbar ist, pausiert die Animation.

### „Weiter einkaufen“-Button im Warenkorb-Overlay
Benennt die Schaltfläche „Warenkorb“ im Overlay um, ergänzt ein Pfeil-Icon und sorgt dafür, dass der Klick das Overlay schließt, statt auf die Warenkorbseite zu wechseln.

## Weiterer Fahrplan

* Bestehende Skripte dienen nur als Zwischenlösung – langfristig sollen daraus eigenständige, wartbare Plugins entstehen.
* Halte die Dokumentation aktuell, wenn neue Komponenten dazukommen oder bestehende Features durch Ceres-Updates ersetzt werden.

## Mitwirken

1. Lies die Hinweise in `AGENTS.md` vollständig.
2. Prüfe bei allen Änderungen, ob plentyShop LTS an der betreffenden Stelle bereits Funktionen oder Klassen liefert.
3. Ergänze Tests oder manuelle Prüfschritte im PR, insbesondere wenn Header/Footer betroffen sind.
