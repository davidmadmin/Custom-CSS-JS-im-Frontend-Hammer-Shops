# Kundenstammdaten im "Mein Konto"-Bereich anpassen

## Status quo in Ceres

- In `MyAccountView.twig` wird innerhalb des `<my-account>`-Wrappers die Vue-Komponente `<account-settings>` eingebunden. Die Komponente erhält als Prop das komplette `userObject`, das über `services.customer.getContact()` geladen wird. Damit stehen Vorname, Nachname, Anrede sowie sämtliche weiteren Kontaktfelder grundsätzlich im Frontend zur Verfügung, werden im Standard-Template aber nicht zur Bearbeitung angeboten.
- Das Standard-Template `AccountSettings.twig` rendert ausschließlich Buttons für die Änderung der E-Mail-Adresse und des Passworts. In `AccountSettings.js` werden daher nur die Endpunkte `/rest/io/customer/mail` und `/rest/io/customer/password` angesprochen – es existiert kein UI-Flow für `firstName`, `lastName` oder `formOfAddress`.

## Vorgehen: Eigenes Formular für Anrede, Vor- und Nachnamen ergänzen

1. **Twig-Override einrichten**: Lege im eigenen Plugin ein Template-Override für `Ceres::MyAccount.Components.AccountSettings` oder erweitere `MyAccountView.twig`, indem du unterhalb der vorhandenen `<account-settings>`-Komponente einen eigenen Slot einfügst. Beispiel:
   ```twig
   {% parent %}
   <customer-name-settings
       :initial-contact="{{ services.customer.getContact() | json_encode }}">
   </customer-name-settings>
   ```
2. **Vue-Komponente anlegen**: Registriere eine neue Komponente `customer-name-settings`. Sie sollte lokale Datenfelder für `formOfAddress`, `firstName` und `lastName` aus `initialContact` befüllen und per Formular editierbar machen. Nutze dabei bestehende UI-Bausteine wie `salutation-select`, um konsistente Dropdowns für die Anrede zu erhalten.
3. **REST-Route zum Aktualisieren**: Hinterlege in der Komponente einen `save`-Handler, der ein Payload ähnlich `{
       formOfAddress: this.formOfAddress,
       firstName: this.firstName,
       lastName: this.lastName
   }` vorbereitet und via `ApiService.put` an eine eigene Route sendet (z. B. `/rest/io/customer/contact-data`).
4. **Serverseitige Aktualisierung**: Implementiere im eigenen Plugin eine Controller-Methode, die über `ContactRepositoryContract::updateContact(contactId, data)` die Felder `formOfAddress`, `firstName` und `lastName` des eingeloggten Kontakts überschreibt. Prüfe vor dem Update, ob der Request authentifiziert ist und die Pflichtfelder gesetzt sind.
5. **Feedback & Store aktualisieren**: Gib nach erfolgreichem Update eine Erfolgsmeldung zurück und löse im Frontend ein Refresh des Vuex-Store-Moduls `user` aus (z. B. über den bereits bestehenden Action-Dispatcher `user/initUserData`), damit Header & andere Komponenten sofort die aktualisierten Stammdaten anzeigen.

## Hinweise

- Achte auf Validierungen (z. B. Mindestlängen) und auf die Konventionen für Anredewerte (`male`, `female`, `company`), damit Plenty die Eingaben akzeptiert.
- Wenn zusätzlich Telefonnummern oder Klassen gewechselt werden sollen, erweitere das Payload um die entsprechenden Felder (`classId`, `options`) und mappe diese auf `ContactOption`-Strukturen, bevor du `updateContact()` aufrufst.
- Teste den kompletten Flow im Staging-System: Formular ausfüllen → Request prüfen → Kontakt im Backend kontrollieren → erneuten Login testen.
