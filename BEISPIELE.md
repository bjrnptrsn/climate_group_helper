# Beispielkonfigurationen

Praxisnahe Szenarien, nach Komplexität geordnet. Jedes Beispiel beschreibt die Situation und listet dann **nur die relevanten Einstellungen** — alles andere bleibt beim Standardwert.

> Alle Beispiele ab der Advanced-Stufe erfordern **Erweiterte Funktionen: an**.

- [Basic](#basic) — kein Advanced-Modus nötig, funktioniert sofort
  - [1. Präzision der Zieltemperatur](#1-präzision-der-zieltemperatur)
  - [2. HVAC-Modus-Strategie: Auto](#2-hvac-modus-strategie-auto)
- [Advanced](#advanced) — die Konfigurationen, bei denen die meisten Nutzer landen, alle erfordern Erweiterte Funktionen: an
  - [3. Mehrraumhaus mit Wochenplan](#3-mehrraumhaus-mit-wochenplan)
  - [4. Einzelnes Thermostat mit Fenstersteuerung](#4-einzelnes-thermostat-mit-fenstersteuerung)
  - [5. Fenstersteuerung mit einem Rollladen (Cover)](#5-fenstersteuerung-mit-einem-rollladen-cover)
  - [6. Heizung ausschalten, wenn niemand zu Hause ist](#6-heizung-ausschalten-wenn-niemand-zu-hause-ist)
  - [7. Zuverlässiges externes Thermostat als Master](#7-zuverlässiges-externes-thermostat-als-master)
  - [8. Virtuelle Presets für einfache TRVs](#8-virtuelle-presets-für-einfache-trvs)
  - [9. Kalibrierung durch externen Sensor für TRVs](#9-kalibrierung-durch-externen-sensor-für-trvs)
  - [10. Better Thermostat / Versatile Thermostat + CGH](#10-better-thermostat--versatile-thermostat--cgh)
  - [11. Zeitplan mit temporären lokalen Überschreibungen](#11-zeitplan-mit-temporären-lokalen-überschreibungen)
  - [12. Saisonale Abschaltung per Zeitplan](#12-saisonale-abschaltung-per-zeitplan)
  - [13. Kalender-Bypass über einem Basis-Zeitplan](#13-kalender-bypass-über-einem-basis-zeitplan)
  - [14. Nachtabsenkung bei inaktivem Zeitplan](#14-nachtabsenkung-bei-inaktivem-zeitplan)
- [Edge Cases](#edge-cases) — gemischte Hardware, mehrere Einschränkungen, Grenzfälle aus echten Support-Anfragen
  - [15. Gemischt Heizkörper + Klimaanlage, ein Gerät pro Modus](#15-gemischt-heizkörper--klimaanlage-ein-gerät-pro-modus)
  - [16. Fußbodenheizung, die sich nicht ausschalten lässt](#16-fußbodenheizung-die-sich-nicht-ausschalten-lässt)
  - [17. Union-Gruppe mit Geräten außerhalb des Bereichs](#17-union-gruppe-mit-geräten-außerhalb-des-bereichs)
  - [18. Multi-Kopf-Klimasplit, nur gemeinsamer Modus](#18-multi-kopf-klimasplit-nur-gemeinsamer-modus)
  - [19. Verriegeltes Heizen/Kühlen über zwei Systeme](#19-verriegeltes-heizenkühlen-über-zwei-systeme)

---

## Basic

### 1. Präzision der Zieltemperatur

Zwei Heizkörper im selben Raum, zu einer Entität gruppiert. Einer akzeptiert nur ganzzahlige Sollwerte (1°-Schritte); der andere unterstützt Halbgrad-Schritte. Die Gruppe auf 21,3 °C zu setzen würde beim gröberen Gerät stillschweigend anders gerundet — oder abgelehnt.

**Entitäten:** `climate.living_room_trv1` (0,5°-Schritte), `climate.living_room_trv2` (nur 1°-Schritte)

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.living_room_trv1`, `climate.living_room_trv2` |
| Präzision | 1° |

**Ergebnis:** Jeder an Mitglieder gesendete Sollwert wird vor dem Versand auf ganze Grade gerundet — 21,3 °C wird für beide Geräte zu 21 °C, sodass der gröbere TRV immer einen Wert erhält, den er tatsächlich unterstützt, statt ihn stillschweigend zu klemmen oder abzulehnen.

> **Tipp:** Das funktioniert auch mit einem einzelnen Mitglied — CGH ist nicht nur für Gruppen.

---

### 2. HVAC-Modus-Strategie: Auto

Zwei Heizkörper zu einer Entität gruppiert, gesteuert von einer externen Automation (nicht CGHs eigener Fenstersteuerung), die die Gruppe ein- und ausschaltet und anhand des gemeldeten `hvac_mode` der Gruppe wissen muss, ob ihr Befehl vollständig angekommen ist, um ihn andernfalls erneut zu senden.

**Entitäten:** `climate.living_room_trv1`, `climate.living_room_trv2`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.living_room_trv1`, `climate.living_room_trv2` |
| HVAC-Modus-Strategie | Auto |

**Ergebnis:** `Auto` meldet den neuen Modus erst, sobald *jedes* Mitglied ihn tatsächlich erreicht hat — in beide Richtungen:
- **Ausschalten** (verhält sich wie **Normal**): Die Automation sendet `off` an die Gruppe. Die Gruppe zeigt weiterhin `heat`, bis *jedes* Mitglied tatsächlich ausgeschaltet hat; hinkt ein Heizkörper hinterher, ist das für die Automation das Signal, `off` erneut zu senden. Erst wenn alle aus sind, meldet die Gruppe `off`.
- **Einschalten** (verhält sich wie **Aus-Priorität**): Die Automation sendet `heat` an die Gruppe. Die Gruppe zeigt weiterhin `off`, bis *jedes* Mitglied tatsächlich `heat` erreicht hat; hinkt ein Heizkörper noch hinterher, ist das für die Automation das Signal, `heat` erneut zu senden. Erst wenn alle heizen, meldet die Gruppe `heat`.

---

## Advanced

### 3. Mehrraumhaus mit Wochenplan

Drei Räume, jeweils mit einem TRV, folgen demselben Wochenplan. Manuelle Anpassungen sollen gelten, bis der Zeitplan wieder übernimmt.

**Entitäten:** `climate.bedroom_trv`, `climate.living_room_trv`, `climate.kitchen_trv`, `schedule.house_weekly`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.bedroom_trv`, `climate.living_room_trv`, `climate.kitchen_trv` |
| Sync-Modus | Lock |
| Zeitplan-Entität | `schedule.house_weekly` |

**Zeitplan-Zeitblöcke (YAML in zusätzlichen Daten):**
```yaml
# Morgen (06:00–08:00)
hvac_mode: heat
temperature: 21.0

# Tag (08:00–17:00)
hvac_mode: heat
temperature: 19.5

# Abend (17:00–22:00)
hvac_mode: heat
temperature: 21.5

# Nacht (22:00–06:00)
hvac_mode: heat
temperature: 18.0
```

**Ergebnis:** Der Zeitplan steuert alle Räume. Eine manuelle Änderung wird respektiert, bis der nächste Zeitblock beginnt und wieder übernimmt.

---

### 4. Einzelnes Thermostat mit Fenstersteuerung

Ein Thermostat, aber die Heizung soll automatisch pausieren, während ein Fenster geöffnet ist — ganz ohne Gruppierung.

**Entitäten:** `climate.living_room_trv`, `binary_sensor.living_room_window`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.living_room_trv` |
| Fenstersteuerung | an |
| Raumsensor | `binary_sensor.living_room_window` |
| Fenster-Aktion | Ausschalten |

**Ergebnis:** Fenster öffnet → Heizung schaltet aus. Fenster schließt → vorheriger Zustand wird wiederhergestellt.

> **Tipp:** Das funktioniert auch mit einem einzelnen Mitglied — CGH ist nicht nur für Gruppen.

---

### 5. Fenstersteuerung mit einem Rollladen (Cover)

Gleiche Idee wie Beispiel 4, aber der "Fenstersensor" ist ein Rollladen, und statt komplett auszuschalten soll auf eine Frostschutztemperatur abgesenkt werden.

**Entitäten:** `climate.bedroom_trv`, `cover.bedroom_shutter`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.bedroom_trv` |
| Fenstersteuerung | an |
| Raumsensor | `cover.bedroom_shutter` |
| Fenster-Aktion | Temperatur setzen |
| Fenster-Temperatur | 16.0 |

**Ergebnis:** Rollladen offen/öffnend/schließend → gilt als "Fenster offen", Temperatur sinkt auf 16 °C. Rollladen geschlossen → Heizung wird wiederhergestellt. (Jeder Zustand außer vollständig `closed` gilt als offen.)

---

### 6. Heizung ausschalten, wenn niemand zu Hause ist

Spart automatisch Energie basierend auf Anwesenheit, ohne eine separate Automation zu schreiben.

**Entitäten:** `climate.living_room_trv`, `person.wife`, `person.husband`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.living_room_trv` |
| Anwesenheitssteuerung | an |
| Anwesenheits-Trigger | `person.wife`, `person.husband` |
| Abwesenheits-Aktion | Ausschalten |
| Abwesenheits-Verzögerung | 300 (Sekunden) |
| Rückkehr-Verzögerung | 60 (Sekunden) |

**Ergebnis:** Sobald *alle* Trigger-Entitäten für 5 Minuten "abwesend" melden, schaltet die Heizung aus. Sobald jemand zurückkehrt, wird nach einer 1-minütigen Bestätigungsverzögerung wiederhergestellt.

> **Variante:** Setze **Abwesenheits-Aktion: Abwesenheits-Offset** mit **Abwesenheits-Offset: -3.0** statt komplett auszuschalten — nützlich, wenn der Raum nicht vollständig auskühlen soll (z. B. ein Raum mit Pflanzen oder Haustieren).

---

### 7. Zuverlässiges externes Thermostat als Master

Günstige TRVs messen die Raumtemperatur schlecht. Lass ein präzises Gerät die Referenz sein und spiegele es auf die anderen.

**Entitäten:** `climate.generic_thermostat` (Master, externer Sensor), `climate.trv1`, `climate.trv2`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.generic_thermostat`, `climate.trv1`, `climate.trv2` |
| Master-Entität | `climate.generic_thermostat` |
| Sync-Modus | Master/Lock |

**Ergebnis:** Änderungen am Master werden an jedes Mitglied weitergegeben. Direkte Änderungen an `climate.trv1` oder `climate.trv2` werden zurückgesetzt.

---

### 8. Virtuelle Presets für einfache TRVs

Einfache TRVs unterstützen `preset_mode` überhaupt nicht — kein "Eco"/"Comfort"-Konzept, nur ein Sollwert. Gib ihnen virtuelle Presets, indem du die Preset-Auswahl über einen `generic_thermostat`-Master leitest.

**Entitäten:** `climate.generic_thermostat` (Master, feste Preset-Temperaturen), `climate.trv1`, `climate.trv2`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.generic_thermostat`, `climate.trv1`, `climate.trv2` |
| Master-Entität | `climate.generic_thermostat` |
| Sync-Modus | Master/Lock |

Konfiguriere die Away-/Home-Presets des `generic_thermostat` mit den gewünschten Temperaturen (z. B. Eco = 17 °C, Comfort = 21 °C).

**Ergebnis:** Die Auswahl eines Presets an der Gruppe ändert die Zieltemperatur des Masters entsprechend, die dann mit `climate.trv1` und `climate.trv2` synchronisiert wird — Geräte ohne native Preset-Unterstützung erhalten so einen funktionierenden Preset-Wähler.

---

### 9. Kalibrierung durch externen Sensor für TRVs

Der eingebaute Sensor eines TRVs sitzt direkt neben einem heißen Rohr und misst zu hoch. Korrigiere das mit einem echten Raumsensor.

**Entitäten:** `climate.living_room_trv`, `sensor.living_room_temperature`, `number.living_room_trv_calibration`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.living_room_trv` |
| Externe Sensoren | `sensor.living_room_temperature` |
| Kalibrierungsziel | `number.living_room_trv_calibration` |
| Kalibrierungsmodus | Offset |
| Kalibrierungs-Heartbeat | 5 (Minuten) |

**Ergebnis:** CGH berechnet den Offset zwischen der internen Messung des TRVs und dem externen Sensor, schreibt ihn in die Kalibrierungs-`number`-Entität und sendet ihn periodisch erneut, um Timeouts bei batteriebetriebenen Geräten zu vermeiden.

> Überspringe dies, wenn deine Geräte bereits von Better Thermostat oder Versatile Thermostat gehandhabt werden — siehe Beispiel 10.

---

### 10. Better Thermostat / Versatile Thermostat + CGH

Du nutzt bereits eine dedizierte Regelungs-Integration (Better Thermostat oder Versatile Thermostat) für gerätespezifische Algorithmen (MPC/PID/TPI) — jedes Gerät regelt sein eigenes Ventil/seinen eigenen Ausgang unabhängig. CGH muss (und sollte im Allgemeinen nicht) darüber einen gemeinsamen Sollwert erzwingen; seine Aufgabe ist die Orchestrierung, die jede Regelungs-Integration nicht selbst übernimmt: Zeitplan, Fenstersteuerung, Anwesenheit, eine kombinierte Übersichts-Entität.

**Variante A — unabhängige Räume, nur gemeinsame Orchestrierung (am häufigsten):**

Jeder Raum behält seinen eigenen Sollwert, vollständig verwaltet von seiner eigenen BT/VT-Instanz. CGH liefert nur das, was raumübergreifend geteilt wird.

**Entitäten:** `climate.bt_living_room_trv`, `climate.bt_bedroom_trv`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.bt_living_room_trv`, `climate.bt_bedroom_trv` |
| Sync-Modus | Deaktiviert |
| Zeitplan-Entität | `schedule.house_weekly` |
| Fenstersteuerung | an — hier zentralisieren statt pro Gerät zu konfigurieren |
| Kalibrierung | aus — die Regelungs-Integration übernimmt das |
| Externe Sensoren | aus — die Regelungs-Integration nutzt ihre eigenen |

**Ergebnis:** Jede BT/VT-Instanz regelt ihr eigenes Gerät weiterhin unabhängig. CGH überträgt nur den `hvac_mode`/`temperature`-Wert des Zeitplans an jeden Raum und übernimmt Fenster/Anwesenheit zentral — es versucht nie, Räume miteinander zu synchronisieren.

**Variante B — ein präzises BT/VT-Gerät führt einfache TRVs (Master/Lock):**

Ein Raum hat ein gut kalibriertes BT/VT-Gerät (guter externer Sensor, saubere Regelung) und einen oder mehrere einfache, ungeregelte TRVs anderswo, die einfach dessen Ziel folgen sollen, statt ihre eigene grobe geräteinterne Logik zu nutzen — die einfachen TRVs profitieren vom besseren Sensor des BT/VT-Geräts, ohne selbst BT/VT zu benötigen.

**Entitäten:** `climate.bt_living_room_trv` (Better Thermostat, externer Sensor), `climate.bedroom_trv`, `climate.hallway_trv` (einfache TRVs)

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.bt_living_room_trv`, `climate.bedroom_trv`, `climate.hallway_trv` |
| Master-Entität | `climate.bt_living_room_trv` |
| Sync-Modus | Master/Lock |

**Ergebnis:** Die BT/VT-Instanz regelt ihr eigenes Gerät weiterhin über ihren eigenen Algorithmus; ihre resultierende Zieltemperatur wird auch an `climate.bedroom_trv` und `climate.hallway_trv` übertragen, die sie direkt übernehmen. Manuelle Änderungen an den einfachen TRVs werden zurückgesetzt. Vermeide hier `Mirror`/`Mirror-Lock` — sie übernehmen *jede* Änderung von `hvac_mode`/Temperatur eines Mitglieds, als wäre sie beabsichtigte Nutzereingabe, und Versatile Thermostats eigene Fenster-/Sicherheits-/Leistungs-Manager können diese Attribute selbstständig ändern, was dann auf jedes andere Mitglied gespiegelt würde.

---

### 11. Zeitplan mit temporären lokalen Überschreibungen

Während bestimmter Zeitblöcke (z. B. ein "Comfort"-Zeitblock am Abend) sollen Bewohner die Temperatur anpassen können, ohne dass die Gruppe das sofort zurücksetzt — andere Zeitblöcke sollen aber strikt gesperrt bleiben.

**Entitäten:** `climate.bedroom_trv`, `schedule.bedroom_weekly`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.bedroom_trv` |
| Sync-Modus | Lock |
| Zeitplan-Entität | `schedule.bedroom_weekly` |

**Zeitplan-Zeitblöcke mit Meta-Keys:**
```yaml
# Comfort-Zeitblock — lokale Anpassungen erlaubt
preset_mode: comfort
sync_mode: disabled

# Boost-Zeitblock — erhöhter Sollwert, keine Sync-Einmischung
preset_mode: comfort
group_offset: 1.5
sync_mode: disabled
```

**Ergebnis:** Der Meta-Key `sync_mode: disabled` setzt die Lock-Durchsetzung vorübergehend nur für diesen Zeitblock aus — außerhalb davon hat der Zeitplan wieder die volle Kontrolle.

---

### 12. Saisonale Abschaltung per Zeitplan

Schaltet eine Gruppe für einen längeren Zeitraum (z. B. Sommer) aus und über ein Kalender-Ereignis automatisch wieder ein, statt den Hauptschalter von Hand umzulegen.

**Entitäten:** `climate.living_room_trv`, `schedule.house_weekly` (oder eine `calendar.*`-Entität)

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.living_room_trv` |
| Zeitplan-Entität | `schedule.house_weekly` |

**Zeitplan-Zeitblöcke mit dem `turn_off`-Meta-Key:**
```yaml
# Sommer-Zeitblock — Gruppe komplett sperren
turn_off: true

# Herbst-Zeitblock — Sperre wieder aufheben
turn_off: false
hvac_mode: heat
temperature: 20.0
```

**Ergebnis:** `turn_off: true` sperrt die Gruppe genau wie das Ausschalten des Hauptschalters — alle Mitglieder schalten aus und bleiben gesperrt. `turn_off` ist ein einmaliger Auslöser, kein an den Zeitblock gebundener Zustand: Er bleibt aktiv, bis ein späterer Zeitblock explizit erneut `turn_off: false` setzt — der Zeitblock, der die Abschaltung beenden soll, muss dies also explizit tun.

---

### 13. Kalender-Bypass über einem Basis-Zeitplan

Eine wöchentliche `schedule.*`-Entität steuert bereits das alltägliche Heizen. Zusätzlich soll ein gemeinsamer Haushalts-`calendar.*` (z. B. ein Google-Kalender, dem jeder Ereignisse hinzufügen kann) das vorübergehend überschreiben können — ein Gast über Nacht, ein Homeoffice-Tag, eine Feier — ohne den Basis-Zeitplan überhaupt anzufassen.

**Entitäten:** `climate.living_room_trv`, `schedule.house_weekly` (Basis), `calendar.household_overrides` (Bypass)

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.living_room_trv` |
| Zeitplan-Entität | `schedule.house_weekly` |
| Bypass-Entität | `calendar.household_overrides` |

**Basis-Zeitplan-Zeitblock (unverändert):**
```yaml
hvac_mode: heat
temperature: 19.5
```

**Kalender-Bypass-Ereignis** (Ereignis "Gästezimmer", 18:00–23:00, Beschreibungsfeld):
```yaml
hvac_mode: heat
temperature: 22.0
```

**Ergebnis:** Außerhalb des Kalender-Ereignisses folgt `climate.living_room_trv` dem Basis-Zeitplan (19,5 °C). Während das "Gästezimmer"-Ereignis aktiv ist, gewinnen dessen 22,0 °C — der Basis-Zeitplan läuft im Hintergrund weiter und wird automatisch wiederhergestellt, sobald das Ereignis endet, ohne dass der Wochenplan überhaupt angefasst werden muss.

> **Tipp — ungültiges YAML bricht immer im ungünstigsten Moment:** Das Beschreibungsfeld eines Kalender-Ereignisses darf *ausschließlich* gültiges YAML enthalten (siehe [LIESMICH § Verwendung einer Kalender-Entität](LIESMICH.md#verwendung-einer-kalender-entität)) — ein verirrtes Wort, ein fehlender Doppelpunkt oder eine falsche Einrückung führt dazu, dass CGH das Ereignis komplett und stillschweigend überspringt, und du bemerkst es erst, wenn der Zeitblock hätte starten sollen und nichts passiert ist. Tippe das YAML nicht jedes Mal freihändig in ein neues Ereignis: Behalte ein bekanntermaßen funktionierendes Ereignis als Vorlage und **kopiere oder dupliziere es** für jede neue Überschreibung (die meisten Kalender-Oberflächen unterstützen das Duplizieren eines Ereignisses), und ändere dann nur Zeiten und Werte — so vermeidest du, jedes Mal von Grund auf einen neuen Syntaxfehler einzuführen. Bist du dir bei einem neuen Block unsicher, füge ihn vor dem Speichern in einen lokalen Editor mit YAML-Syntaxprüfung ein (z. B. VS Code).

---

### 14. Nachtabsenkung bei inaktivem Zeitplan

`schedule.*`-Entitäten melden außerhalb der konfigurierten Zeitblöcke `off` ohne jegliche Zeitblock-Attribute. Statt einen lückenlosen 24/7-Zeitplan zu bauen (einen expliziten Niedrigtemperatur-Block für jede inaktive Stunde), definiere einen Fallback-Zustand, den die Gruppe anwendet, sobald kein Zeitblock aktiv ist.

**Entitäten:** `climate.living_room_trv`, `schedule.house_weekly`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.living_room_trv` |
| Zeitplan-Entität | `schedule.house_weekly` |
| Fallback bei inaktivem Zeitplan | siehe unten |

**Fallback bei inaktivem Zeitplan** (Options-Flow → Zeitplan-Bereich, YAML):
```yaml
temperature: 17.0
hvac_mode: heat
```

**Heiz-Zeitblock (z. B. 06:00–22:00):**
```yaml
hvac_mode: heat
temperature: 21.0
```

**Ergebnis:** Während des aktiven Zeitblocks wird der Raum auf 21 °C beheizt. Sobald der Zeitblock endet, wendet die Gruppe automatisch den Fallback an und senkt den Sollwert auf 17 °C — keine 24/7-Blöcke nötig.

> **Hinweis — die Gruppe vollständig ausschalten:** Für eine komplette Abschaltung außerhalb der aktiven Stunden verwende `hvac_mode: off` als Fallback, nicht den `turn_off`-Meta-Key. `turn_off: true` ist ein einmaliger Auslöser für die Hauptschalter-Sperre, die aktiv bleibt, bis ein Zeitblock sie explizit mit `turn_off: false` freigibt — im Fallback platziert, würde der nächste Heiz-Zeitblock blockiert bleiben.

**Den Fallback saisonal ändern, ohne den Options-Flow zu öffnen:** Rufe `climate_group_helper.set_schedule_fallback_payload` aus einer Automatisierung auf (z. B. ein jährlicher Sommer/Winter-Trigger), statt die Gruppe jedes Mal neu zu konfigurieren:
```yaml
service: climate_group_helper.set_schedule_fallback_payload
target:
  entity_id: climate.wohnzimmer
data:
  fallback_payload: |
    temperature: 19.0
    hvac_mode: heat
```
Die Änderung wirkt sofort (falls der Zeitblock gerade inaktiv ist). Aktiviere die Option **Per Dienst geänderte Werte beibehalten (Zeitplan)**, wenn sie auch einen Neustart überstehen soll. Rufe den Dienst erneut ohne bzw. mit leerem `fallback_payload:` auf, um zum konfigurierten Standardwert zurückzukehren.

---

## Edge Cases

### 15. Gemischt Heizkörper + Klimaanlage, ein Gerät pro Modus

Ein Raum hat einen reinen Heizkörper (Wiser) und eine Heiz-/Kühl-Klimaanlage (Daikin/Faikin). Die Klimaanlage darf **niemals** heizen, obwohl sie `heat` meldet — und jedes Gerät braucht je nach aktivem Modus eine andere Behandlung. (Basierend auf einem echten Bericht zu gemischter Hardware, GitHub #99.)

**Entitäten:** `climate.wiser_radiator` (nur heat/off), `climate.daikin_ac` (heat_cool/cool/heat/dry/fan_only/off)

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.wiser_radiator`, `climate.daikin_ac` |
| Feature-Strategie | Union |
| Aktion bei nicht unterstütztem HVAC-Modus | Aus |
| Sync-Modus | Deaktiviert |
| Mitglieder-Isolation | an |
| **Isolationsregel 1** | Trigger: HVAC-Modus `heat` → Isoliere `climate.daikin_ac` (HVAC-Modus setzen: `off`) |
| **Isolationsregel 2** | Trigger: HVAC-Modus `cool` → Isoliere `climate.wiser_radiator` (HVAC-Modus setzen: `off`) |

**Ergebnis:** Im Modus `heat` ist die Klimaanlage vollständig isoliert (aus, und ihre Presets/Lüfter/Schwenkfunktion fallen aus der Gruppe heraus). Im Modus `cool` wird der Heizkörper genauso isoliert — symmetrisches Verhalten auf beiden Seiten, kein Übergreifen zwischen den Modi. Dies erfordert **mehrere Isolationsregeln**, eine pro Geräte-/Trigger-Paar.

---

### 16. Fußbodenheizung, die sich nicht ausschalten lässt

Eine wasserbasierte Fußbodenheizung hat keinen `off`-Modus — sie unterstützt nur `heat`. Muss die Gruppe das Heizen stoppen (z. B. beim Umschalten auf Kühlen andernorts im Sommer), braucht der Fußbodenkreis statt eines echten `off`-Befehls einen sicheren Fallback. (Basierend auf GitHub #100.)

**Entitäten:** `climate.floor_heating` (nur heat, kein off), `climate.bedroom_ac` (heat/cool)

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.floor_heating`, `climate.bedroom_ac` |
| Feature-Strategie | Union |
| Mitglieder-Isolation | an |
| Isolationsregel 1 | Trigger: HVAC-Modus `cool`, `dry`, `fan_only` → Isoliere `climate.floor_heating` (Preset-Modus setzen: `building_protection`) |

**Ergebnis:** Das Umschalten der Gruppe auf `cool` isoliert die Fußbodenheizung in ein niedriges, sicheres Preset, statt ihr ein nicht unterstütztes `off` zu senden. Das Zurückschalten auf `heat` stellt sie wieder in der Gruppe her.

---

### 17. Union-Gruppe mit Geräten außerhalb des Bereichs

Mischung von Geräten mit unterschiedlichen Temperaturbereichen — ein TRV mit niedrigem Bereich und eine Klimaanlage mit höherem Minimum. Fällt das Ziel außerhalb des Bereichs eines Geräts, soll dieses Gerät ausgeschlossen statt auf einen unsinnigen Wert geklemmt werden.

**Entitäten:** `climate.trv` (Bereich 5–30 °C), `climate.ac` (Bereich 16–30 °C)

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.trv`, `climate.ac` |
| Feature-Strategie | Union |
| Aktion außerhalb des Bereichs | Aus |

**Ergebnis:** Ziel auf 14 °C gesetzt → die Klimaanlage kann das nicht erreichen (Min. 16 °C) und schaltet aus; der TRV heizt weiter. Ziel auf 22 °C gesetzt → beide liegen im Bereich und bleiben aktiv.

---

### 18. Multi-Kopf-Klimasplit, nur gemeinsamer Modus

Ein 4-Kopf-Klimasplit-System (z. B. Daikin über Faikin) benötigt, dass alle Köpfe denselben HVAC-Modus teilen, um korrekt zu funktionieren, aber jeder Raum braucht trotzdem seinen eigenen Sollwert und seine eigene Lüfterstufe. Vollständiges Mirror/Lock würde fälschlicherweise auch Temperatur und Lüfterstufe angleichen. (Basierend auf GitHub #36.)

**Entitäten:** `climate.head_living_room`, `climate.head_bedroom`, `climate.head_office`, `climate.head_kitchen`

| Einstellung | Wert |
|---|---|
| Mitglieder | alle vier Köpfe |
| Sync-Modus | Mirror |
| Sync-Attribute | nur `hvac_mode` |

**Ergebnis:** Das Ändern von `hvac_mode` an einem Kopf (z. B. Umschalten auf `cool`) spiegelt diesen Modus auf den Rest der Gruppe. Temperatur und Lüfterstufe sind *nicht* in `sync_attributes` enthalten, sodass jeder Kopf seinen eigenen, unabhängigen Sollwert behält — Mirror ignoriert nicht ausgewählte Attribute vollständig.

---

### 19. Verriegeltes Heizen/Kühlen über zwei Systeme

Ein HRV (Wärmerückgewinnungslüftung) mit heat/cool/auto fungiert als "Dirigent". Mehrere unabhängige Fußbodenheizungszonen müssen vollständig ausschalten, sobald der HRV kühlt, und wieder einschalten, wenn er heizt — reine Verriegelung, kein gemeinsamer Sollwert. (Basierend auf GitHub #66.)

**Entitäten:** `climate.hrv` (Master), `climate.floor_zone_1` … `climate.floor_zone_5`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.hrv`, `climate.floor_zone_1` … `climate.floor_zone_5` |
| Master-Entität | `climate.hrv` |
| Sync-Modus | Master/Lock |
| Feature-Strategie | Union |
| Aktion bei nicht unterstütztem HVAC-Modus | Aus |

**Ergebnis:** Der HRV steuert den `hvac_mode` der Gruppe. Wechselt er in `cool` (manuell oder über `auto`), werden die Fußbodenzonen — die `cool` nicht unterstützen — automatisch über die Union-Behandlung für nicht unterstützte Modi ausgeschaltet. Das Zurückschalten des HRV auf `heat` stellt sie wieder her.

---

## Tipps

- **Einfach anfangen:** Zuerst die grundlegende Gruppierung zum Laufen bringen (nur Mitglieder, keine weiteren Einstellungen), dann Funktionen nach und nach hinzufügen.
- **Erweiterte Funktionen:** In der Gruppenkonfiguration aktivieren, um alles jenseits der Basic-Stufe freizuschalten (Beispiele 3–18).
- **Sync-Modus:** Nutze `Lock`, wenn die Gruppe die alleinige Quelle der Wahrheit sein soll; nutze `Mirror`, wenn manuelle Mitgliedsänderungen übernommen werden sollen; nutze `Mirror/Lock`, wenn nur einige Attribute synchronisiert werden sollen (Beispiel 17).
- **Sperr-Priorität:** Hauptschalter > Fenstersteuerung > Anwesenheitssteuerung — sind mehrere gleichzeitig aktiv, wird nur die Aktion der höchstrangigen an Mitglieder gesendet.
- **Zeitplan + Boost:** Boost rangiert über dem Zeitplan. Zeitplan-Zeitblock-Änderungen laufen während eines Boosts weiterhin im Hintergrund.
- **Kalibrierung:** Nutze CGHs eigene Kalibrierung nur, wenn du nicht bereits Better Thermostat oder Versatile Thermostat verwendest — die haben ihre eigene (Beispiel 10).
- **Mehrere Isolationsregeln:** Wenn verschiedene Mitgliedsgeräte unterschiedlich auf denselben Trigger (oder ganz unterschiedliche Trigger) reagieren müssen, füge eine Isolationsregel pro Gerät hinzu — siehe Beispiele 14 und 15.
