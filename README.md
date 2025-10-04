# Custom CSS & JS for Hammer Shops

Dieses Repository sammelt alle CSS- und JavaScript-Anpassungen, mit denen wir die Hammer-Shop-Instanzen auf Basis von [plentyShop LTS (Plugin »Ceres«)](https://github.com/plentymarkets/plugin-ceres.git) individualisieren. Die Anpassungen ergänzen bzw. ersetzen das Standardlayout – insbesondere Header und Footer – und liefern zusätzliche Funktionen, solange noch keine eigenständigen Plugins zur Verfügung stehen.

## Bezug zu plentyShop LTS

* **Technische Grundlage:** Alle Templates, Slots und Komponenten stammen aus dem Ceres-Plugin des plentyShop LTS-Projekts. Für neue Aufgaben müssen daher immer die Originaldateien und Twig-Strukturen aus `plentymarkets/plugin-ceres` berücksichtigt werden.
* **Empfohlener Workflow:**
  1. Repository clonen: `git clone https://github.com/plentymarkets/plugin-ceres.git plentyshop-lts`.
  2. In der lokalen Arbeitskopie dieses Projekts liegt das Subverzeichnis `plentyshop-lts/`, sodass Header- und Footer-Strukturen, Vue-Komponenten und SCSS-Dateien leicht nachgeschlagen werden können.
  3. Änderungen an diesem Repository müssen mit den jeweiligen Twig- und Vue-Komponenten aus Ceres abgeglichen werden, damit IDs, Klassen und Slots korrekt angesprochen werden.
* **Priorität:** Wenn Entscheidungen zwischen Inline-Anpassungen hier und nativen Ceres-Funktionen zu treffen sind, gilt: Header- und Footer-Neubauten haben Vorrang, danach greifen zusätzliche Styles oder Skripte.

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
