# MwSt-Preisumschalter dauerhaft am Kundenkonto speichern

## Aktueller Stand im Frontend

- Das Toggle-Skript `FH - Javascript am Ende der Seite.js` liest und schreibt den Status ausschließlich im `sessionStorage` des Browsers (`fh:price-display:show-net-prices`).
- Beim Umschalten wird der Vuex-Basket-Store synchronisiert und `App.initialData.showNetPrices` gesetzt, damit Preise auf der Seite entsprechend gerendert werden.
- Ein Login oder Gerätewechsel setzt die Einstellung zurück, weil keine serverseitige Ablage existiert.

## Zielbild

- Die Präferenz soll als Teil der Kundendaten im Plenty-Backend gespeichert werden, damit sie nach Login, Gerätewechsel und Session-Ende automatisch wiederhergestellt wird.
- Beim Seitenaufbau (Hydration) muss `App.initialData.showNetPrices` direkt auf Basis der gespeicherten Kontoeinstellung gesetzt werden, damit Frontend & Store synchron starten.

## Technische Umsetzungsvorschläge

1. **Backend-API im eigenen Plugin bereitstellen**
   - Ein IO-Controller (z. B. `ShowNetPreferenceController`) stellt eine authentifizierte REST-Route wie `PUT /rest/io/customer/price-display` bereit.
   - Der Controller ermittelt den eingeloggten Kontakt (`ContactRepositoryContract::findContactById($contactId)`) und schreibt die Präferenz in ein freies Kontakt-Attribut, z. B. `ContactOptionType::OPTIONS` mit einem eindeutigen `typeId` oder ein freies Kundenfeld.
   - Optional kann eine `GET`-Route denselben Wert zurückliefern, falls der Wert separat nachgeladen werden soll.

2. **Kundendaten speichern**
   - Beim Speichern wird `ContactRepositoryContract::updateContact($contactId, ['options' => [...]])` bzw. das passende Repository genutzt, um die bestehende Option zu setzen oder anzulegen.
   - Der Wert sollte binär (`true`/`false`) oder als String (`net`/`gross`) gespeichert werden, damit spätere Auswertungen leicht möglich sind.

3. **Frontend-Anpassungen**
   - Nach erfolgreichem Umschalten ruft das Toggle-Skript die neue Route auf (`fetch('/rest/io/customer/price-display', { method: 'PUT', body: JSON.stringify({ showNetPrices: value }) })`).
   - Bei Seiteninitialisierung liest das Skript zuerst `App.initialData.showNetPrices`; fällt dieser `null` aus, sollte ein Fallback-Request auf die `GET`-Route erfolgen.
   - Der `sessionStorage`-Eintrag bleibt als Performance-Optimierung bestehen, damit Zwischenreloads ohne Server Roundtrip funktionieren.

4. **Hydration / Initial Data**
   - Damit der Wert bereits bei der Seitenauslieferung gesetzt ist, kann der Controller zusätzlich einen Service registrieren, der `AppServiceProvider::register` erweitert und den gespeicherten Wert in `AppServiceProvider::getTemplateData()` nachlädt (`App.initialData.showNetPrices = true/false`).

5. **Migration & Default**
   - Existierende Konten erhalten standardmäßig den aktuellen Shop-Default (brutto). Beim ersten Umschalten wird der neue Wert gespeichert.
   - Ein CLI-Skript oder Backend-Job kann Bestandskunden initialisieren, falls notwendig.

## Offene Punkte / Prüfungen

- **Datenschutz**: Prüfen, ob die Preisansicht als personenbezogenes Merkmal zu behandeln ist und entsprechend dokumentiert werden muss.
- **Kontaktklassen**: Falls der Shop bereits Kundengruppen-spezifische Netzanzeigen nutzt, muss das Mapping (Kontaktklasse vs. individueller Toggle) geklärt werden.
- **Fehlerfälle**: Das Frontend sollte bei fehlendem Login oder Serverfehlern den lokalen Toggle weiterhin erlauben, aber den Benutzer informieren, dass der Wert nicht gespeichert wurde.

