# Arbeitsanweisungen für Custom CSS/JS im Hammer Shop

Ich möchte den Header und Footer für die Hammer-Shops (FH und SH) auf Basis von plentyShop LTS komplett neu bauen. Bitte berücksichtige beim Arbeiten die folgenden Punkte:

## Bezug zu plentyShop LTS (Plugin »Ceres«)

* **Quell-Repository:** https://github.com/plentymarkets/plugin-ceres.git
* **Empfehlung:** Klone das Repository parallel zu diesem Projekt in das Verzeichnis `plentyshop-lts/`, damit Twig-, Vue- und SCSS-Strukturen schnell nachgeschlagen werden können.
* **Verknüpfung:** Alle Anpassungen in diesem Repo greifen in die bestehenden Ceres-Templates ein. Prüfe daher vor Änderungen, welche IDs, Klassen, Slots oder Komponenten Ceres bereits liefert, und stelle sicher, dass Custom CSS/JS sauber darauf aufsetzt.
* **Priorität:** Header- und Footer-Rebuilds haben Vorrang gegenüber sonstigen Styling-Hacks. Ergänzende Funktionen (Countdown, Progressbars etc.) dürfen nur eingefügt werden, wenn sie mit dem neuen Aufbau kompatibel sind.

## Technologiestack plentyShop LTS (2025)

| Layer / Area        | Framework / Tool        | Version / Note                                               | Purpose                                                   |
|---------------------|-------------------------|--------------------------------------------------------------|-----------------------------------------------------------|
| **Backend Runtime** | PHP                     | **PHP 8.0+** (frühere Docs 7.3/7.4, mittlerweile PHP 8)      | Core server-side logic, Plugin-System                      |
| **Templating**      | Twig                    | v2+                                                          | View-Layer, trennt Logik und Design                        |
| **Frontend JS**     | Vue.js                  | v2.x (Migration zu Vue 3 vorbereitet)                        | Reaktive Komponenten (Filter, Warenkorb, Checkout)         |
| **Legacy JS**       | jQuery                  | 3.x                                                          | DOM-Manipulation, ältere Widgets                           |
| **CSS Preprocessor**| SASS (SCSS Syntax)      | Aktuell (node-sass / dart-sass)                              | Pflegeleichte Stylesheets                                  |
| **CSS Framework**   | Bootstrap               | 4.x                                                          | Responsives Grid und UI-Komponenten                        |
| **Build System**    | Webpack                 | 4.x/5.x je nach Plugin-Version                               | Bündelt JS, kompiliert SASS → CSS, Asset-Pipeline          |
| **Package Manager** | Node.js + npm           | Node 14+ / npm 6+ (versionsabhängig)                          | Dependency- & Build-Tooling                                |
| **E-Commerce Core** | PlentyONE Plugin System | plentyShop LTS + IO Plugin                                   | Shop-Funktionen (Checkout, Warenkorb, Suche, etc.)         |
| **Data Layer**      | REST API (Plentymarkets)| JSON-basierte REST-API                                       | Stellt Produkt-, Kunden-, Bestelldaten bereit              |
| **SEO/Markup**      | Schema.org JSON-LD      | BreadcrumbList, Product Schema                               | Strukturierte Daten für Suchmaschinen                      |
| **Trust/Widgets**   | Trusted Shops u. a.     | Drittanbieter-JS                                             | Reviews, Trustbadges, Rechtliches                          |

## Stil- und Strukturvorgaben

* Arbeite mit sauber dokumentierten HTML-Strukturen. Inline-CSS ist erlaubt, darf aber keine Skripte einbetten.
* JavaScript-Erweiterungen sollen bestehende Ceres-Hooks nutzen; vermeide doppelte Event-Listener, wenn Ceres bereits Funktionen liefert.
* Beachte, dass beide Shops (FH & SH) synchron angepasst werden müssen. Änderungen in einem Shop dürfen den anderen nicht beschädigen.
* Halte README und begleitende Dokumentation aktuell, wenn du neue Features oder Abhängigkeiten ergänzt.
