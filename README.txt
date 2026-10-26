MEINE FAHRTEN v0.4 – iPhone-Web-App

Zum Testen auf iPhone: Der gesamte Inhalt dieses Ordners muss unverändert auf einer HTTPS-Website liegen. Eine Datei in iPhone „Dateien“ zu öffnen reicht nicht.

Einfacher Veröffentlichungsweg (z.B. GitHub Pages):
1. Leeres PUBLIC GitHub-Repository erstellen. NUR die hier enthaltenen App-Dateien hochladen, KEINE Datensicherung oder Kundendaten.
2. In GitHub Settings > Pages als Quelle „Deploy from a branch“ einstellen, Branch main / (root) auswählen.
3. Die angezeigte HTTPS-Adresse in Safari auf dem iPhone öffnen.
4. In Safari Teilen > Zum Home-Bildschirm hinzufügen.
5. App über das neue Symbol starten, ein Fahrzeug anlegen, Fahrt speichern und Probe-Backup unter „Mehr“ herunterladen.

DATENSCHUTZ / GRENZEN:
- Kein Konto, keine Cloud-Datenbank; Fahrt- und Fahrzeugdaten liegen ausschließlich im Browser des jeweiligen Geräts (localStorage).
- Code und ggf. die URL sind bei einem öffentlichen GitHub-Pages-Repository öffentlich, daher KEINE persönlichen Fahrtdaten oder Sicherungsdateien hochladen.
- Keine automatische Synchronisierung von Mac-Dateien, Mac-Browser oder altem iPhone! Vor Gerätewechsel Export/Import der JSON-Sicherung verwenden.
- Ohne Sicherung gehen Daten bei Löschen der Website-Daten, Geräteverlust oder Browserproblemen verloren. Datensicherung regelmäßig durchführen.
- Safari kann Browser-Spracherkennung ablehnen. Auf dem iPhone stattdessen in das Diktierfeld tippen, Mikrofon der Apple-Tastatur nutzen und „Text in Fahrt übernehmen“ wählen.
- Kein Google Maps Routing in dieser Version; die 50%-Anzeige ist nur bei passenden Tachoständen möglich.
- Die App ist keine automatisch finanzamtskonforme Fahrtenbuchlösung.

Version 1.0: Nicht unterstützte Browser-Mikrofontaste entfernt. iPhone-Diktierfeld bleibt.

Version 1.3: Button "Route in Google Maps prüfen" in der Fahrterfassung. Benötigt Internet, öffnet die Route extern und erfasst keine Kilometer automatisch.

VERSION 1.6
- Quartalsweise Sicherungserinnerung (90 Tage nach bestätigter Sicherung).
- Nach Download Sicherung in Dateien prüfen und in der App bestätigen; Browser kann erfolgreiche Ablage nicht selbst feststellen.
- Druckbare Jahresübersicht unter Auswertung. Mehrfache Bürofahrt pro Tag wird nicht mehrfach berechnet; Sonderfälle prüfen lassen.
- Startseite Sprachaufnahme über Apple-Tastatur bleibt erhalten.

VERSION 1.7 – NUR DATENSICHERHEIT
- Unter Mehr: Sicherungsdatei prüfen, ohne Daten zu importieren oder zu überschreiben. Zeigt Stückzahlen an.
- Vor einem Import: Datenvorschau und zusätzliche Sicherungsdatei der bisher gespeicherten Daten; Import nur nach Bestätigung, dass diese Datei wirklich gespeichert wurde.
- Nach einem erkannten Versionswechsel erscheint ein Hinweis zur Datensicherung (soweit die vorherige UI-Versionsmarkierung existiert).
- Weiterhin keine automatische Cloud- oder Hintergrundsicherung. Bitte Sicherungen außerhalb des iPhones aufbewahren.
- Die Dateiprüfung stellt die Lesbarkeit/Grundstruktur fest, nicht die inhaltliche Richtigkeit jeder Fahrt.
