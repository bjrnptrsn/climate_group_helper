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
  - [8. Presets für einfache TRVs](#8-presets-für-einfache-trvs)
  - [9. Presets über ein Master-Thermostat](#9-presets-über-ein-master-thermostat)
  - [10. Sollwerte über einen Dashboard-Schieberegler](#10-sollwerte-über-einen-dashboard-schieberegler)
  - [11. Zeitplan als Ein/Aus, Schieberegler für die Temperaturen](#11-zeitplan-als-einaus-schieberegler-für-die-temperaturen)
  - [12. Kalibrierung durch externen Sensor für TRVs](#12-kalibrierung-durch-externen-sensor-für-trvs)
  - [13. Better Thermostat / Versatile Thermostat + CGH](#13-better-thermostat--versatile-thermostat--cgh)
  - [14. Zeitplan mit temporären lokalen Überschreibungen](#14-zeitplan-mit-temporären-lokalen-überschreibungen)
  - [15. Saisonale Abschaltung per Zeitplan](#15-saisonale-abschaltung-per-zeitplan)
  - [16. Automatikfunktionen für einen Zeitblock pausieren](#16-automatikfunktionen-für-einen-zeitblock-pausieren)
  - [17. Kalender-Bypass über einem Haupt-Zeitplan](#17-kalender-bypass-über-einem-haupt-zeitplan)
  - [18. Nachtabsenkung bei inaktivem Zeitplan](#18-nachtabsenkung-bei-inaktivem-zeitplan)
- [Edge Cases](#edge-cases) — gemischte Hardware, mehrere Einschränkungen, Grenzfälle aus echten Support-Anfragen
  - [19. Gemischt Heizkörper + Klimaanlage, ein Gerät pro Modus](#19-gemischt-heizkörper--klimaanlage-ein-gerät-pro-modus)
  - [20. Fußbodenheizung, die sich nicht ausschalten lässt](#20-fußbodenheizung-die-sich-nicht-ausschalten-lässt)
  - [21. Union-Gruppe mit Geräten außerhalb des Bereichs](#21-union-gruppe-mit-geräten-außerhalb-des-bereichs)
  - [22. Multi-Kopf-Klimasplit, nur gemeinsamer Modus](#22-multi-kopf-klimasplit-nur-gemeinsamer-modus)
  - [23. Verriegeltes Heizen/Kühlen über zwei Systeme](#23-verriegeltes-heizenkühlen-über-zwei-systeme)
  - [24. Mitbekommen, wenn ein Gerät Befehle verschluckt](#24-mitbekommen-wenn-ein-gerät-befehle-verschluckt)
  - [25. Heizen/Kühlen für Thermostate mit nur einem Sollwert](#25-heizenkühlen-für-thermostate-mit-nur-einem-sollwert)
  - [26. Entfeuchten, während der Raum auf Temperatur ist](#26-entfeuchten-während-der-raum-auf-temperatur-ist)
  - [27. IR-gesteuerte Klimaanlagen, die die Bridge überlasten](#27-ir-gesteuerte-klimaanlagen-die-die-bridge-überlasten)

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

> **Variante:** Setze **Abwesenheits-Aktion: Abwesenheits-Offset** mit **Abwesenheits-Offset: -3.0** statt komplett auszuschalten — nützlich, wenn der Raum nicht vollständig auskühlen soll (z. B. ein Raum mit Pflanzen oder Haustieren). Bei dieser Aktion sorgt **Aus-Zustand der Mitglieder respektieren (Anwesenheit)** zusätzlich dafür, dass ein selbst ausgeschalteter Heizkörper bei der Rückkehr nicht wieder angeht.

> **Variante — Gruppen-Preset als Abwesenheits-Aktion:** Wenn du Gruppen-Presets definiert hast (Beispiel 8), kannst du auch **Abwesenheits-Aktion: Abwesenheits-Preset** wählen und eines deiner Gruppen-Presets (z. B. `eco`) aktivieren lassen, sobald niemand zu Hause ist.

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

### 8. Presets für einfache TRVs

Einfache TRVs unterstützen Presets überhaupt nicht — kein "Eco"/"Comfort"-Konzept, nur ein Sollwert. Definiere die Presets stattdessen an der Gruppe. Keine Hilfs-Entität, kein bestimmter Sync-Modus nötig.

**Entitäten:** `climate.trv1`, `climate.trv2`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.trv1`, `climate.trv2` |
| Gruppen-Presets | siehe unten |

```yaml
eco:
  temperature: 17.0
  hvac_mode: heat
comfort:
  temperature: 21.0
  hvac_mode: heat
ventilate:
  hvac_mode: off
```

**Ergebnis:** Der Preset-Wähler der Gruppe zeigt `comfort`, `eco` und `ventilate`. Die Auswahl eines Presets wendet dessen Einstellungen auf beide TRVs gleichzeitig an. Ein Preset setzt nur die Werte, die es auch aufführt — `ventilate` oben ändert den Modus und lässt den Sollwert unangetastet.

Änderst du etwas, das das aktive Preset festlegt (hier: die Temperatur), kehrt die Gruppe in ihren normalen, presetlosen Zustand zurück — angezeigtes Preset und tatsächliche Werte laufen so nie auseinander. Änderst du etwas, das es nicht festlegt, bleibt das Preset ausgewählt.

Benennst du ein Gruppen-Preset genauso wie eines, das ein Mitgliedsgerät bereits anbietet (z. B. beide heißen `eco`), gewinnt die eigene Definition der Gruppe — die Version des Geräts wird nie gesendet. Die Einstellungsseite warnt dich beim Speichern, damit du eines von beiden umbenennen kannst, falls das nicht beabsichtigt war.

> **Tipp:** Presets lassen sich auch zur Laufzeit aus einer Automation heraus erstellen, aktualisieren oder löschen — siehe Beispiel 10.

---

### 9. Presets über ein Master-Thermostat

Gleiches Ziel wie Beispiel 8, aber die Preset-Temperaturen liegen in einem separaten `generic_thermostat` statt in den Gruppeneinstellungen. Lohnt sich, wenn Automationen sie dort bereits auslesen oder wenn der Master zugleich als zuverlässiger externer Sensor dient (Beispiel 7).

**Entitäten:** `climate.generic_thermostat` (Master, feste Preset-Temperaturen), `climate.trv1`, `climate.trv2`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.generic_thermostat`, `climate.trv1`, `climate.trv2` |
| Master-Entität | `climate.generic_thermostat` |
| Sync-Modus | Master/Lock |

Konfiguriere die Away-/Home-Presets des `generic_thermostat` mit den gewünschten Temperaturen (z. B. Eco = 17 °C, Comfort = 21 °C).

**Ergebnis:** Die Auswahl eines Presets an der Gruppe ändert die Zieltemperatur des Masters entsprechend, die dann mit `climate.trv1` und `climate.trv2` synchronisiert wird.

---

### 10. Sollwerte über einen Dashboard-Schieberegler

Halte die Temperaturen in einem Preset und lass sie von einer Automation schreiben — so können die Werte aus beliebigen Quellen in Home Assistant kommen: ein `input_number` auf dem Dashboard, ein berechneter Sensor, eine Preisprognose. Die Gruppeneinstellungen bleiben unangetastet.

**Entitäten:** die Gruppe sowie `input_number.comfort_temperature` als Schieberegler

```yaml
alias: "Komfort-Temperatur mit Klimagruppe synchronisieren"
trigger:
  - platform: state
    entity_id: input_number.comfort_temperature
  - platform: homeassistant
    event: start
action:
  - service: climate_group_helper.set_group_preset
    target:
      entity_id: climate.living_room_group
    data:
      payload:
        comfort:
          temperature: "{{ states('input_number.comfort_temperature') | float }}"
          hvac_mode: heat
```

**Ergebnis:** Das Verschieben des Reglers aktualisiert das Preset `comfort`. Ist genau dieses Preset gerade auf der Gruppe ausgewählt, wird die neue Temperatur sofort angewendet; andernfalls greift sie, sobald das Preset das nächste Mal gewählt wird. Der `homeassistant.start`-Trigger gleicht nach einem Neustart ab, falls der Regler bewegt wurde, während Home Assistant aus war.

Aktiviere **Per Dienst geänderte Werte beibehalten (Presets)**, damit die Werte einen Neustart auch von sich aus überstehen.

> **Tipp:** Zeitplan-Slots können ein Preset über seinen Namen anfordern, statt selbst Temperaturen zu tragen — siehe Beispiel 11 für diese Kombination.

---

### 11. Zeitplan als Ein/Aus, Schieberegler für die Temperaturen

Der Zeitplan bestimmt das *Wann*, zwei Schieberegler das *Wie warm*. Der Zeitplan selbst enthält überhaupt keine Temperaturen — sein Zeitblock fordert ein Preset über den Namen an, ebenso der Fallback für die Stunden außerhalb. Zum Ändern der Sollwerte genügt es, einen Regler zu verschieben; der Zeitplan wird nie wieder angefasst.

**Entitäten:** `climate.living_room_trv`, `schedule.house_weekly`, `input_number.eco_temp`, `input_number.comfort_temp`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.living_room_trv` |
| Zeitplan-Entität | `schedule.house_weekly` |
| Fallback bei inaktivem Zeitplan | siehe unten |
| Per Dienst geänderte Werte beibehalten (Presets) | an |

**Heiz-Zeitblock (z. B. 06:00–22:00):**
```yaml
preset_mode: comfort
```

**Fallback bei inaktivem Zeitplan** (Options-Flow → Zeitplan-Bereich, YAML):
```yaml
preset_mode: eco
```

**Automation — beide Presets mit den Reglern synchron halten:**
```yaml
alias: "Heiztemperaturen mit Klimagruppe synchronisieren"
trigger:
  - platform: state
    entity_id:
      - input_number.eco_temp
      - input_number.comfort_temp
  - platform: homeassistant
    event: start
action:
  - service: climate_group_helper.set_group_preset
    target:
      entity_id: climate.living_room_group
    data:
      payload:
        eco:
          temperature: "{{ states('input_number.eco_temp') | float }}"
          hvac_mode: heat
        comfort:
          temperature: "{{ states('input_number.comfort_temp') | float }}"
          hvac_mode: heat
```

**Ergebnis:** Während des Zeitblocks läuft die Gruppe im Preset `comfort`, außerhalb im Preset `eco`. Das Verschieben eines Reglers aktualisiert dessen Preset — ist genau dieses gerade aktiv, zieht die Gruppe sofort nach.

> **Tipp:** Das ersetzt den verbreiteten Aufbau mit lückenlosem 24/7-Zeitplan, bei dem jede Stunde ihren eigenen Block mit eigener Temperatur braucht. Hier markiert der Zeitplan nur die Heizstunden, und es gibt genau zwei Temperaturen zu pflegen — beide auf dem Dashboard.

---

### 12. Kalibrierung durch externen Sensor für TRVs

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

> Überspringe dies, wenn deine Geräte bereits von Better Thermostat oder Versatile Thermostat gehandhabt werden — siehe Beispiel 13.

---

### 13. Better Thermostat / Versatile Thermostat + CGH

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

### 14. Zeitplan mit temporären lokalen Überschreibungen

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

### 15. Saisonale Abschaltung per Zeitplan

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

### 16. Automatikfunktionen für einen Zeitblock pausieren

Manche Situationen brauchen eine Schutzfunktion vorübergehend aus dem Weg: eine
Feier mit offener Terrassentür, Gäste in einem Raum, den der Anwesenheitssensor
als leer meldet, oder ein Handtuchheizkörper, der am Wellness-Abend mitlaufen
soll, obwohl eine Regel ihn ausgeschaltet hält.

**Entitäten:** `climate.wohnzimmer_trv`, `calendar.haus_termine`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.wohnzimmer_trv` |
| Zeitplan-Entität | `calendar.haus_termine` |

**Beschreibungen der Kalendereinträge:**
```yaml
# "Feier" — die Terrassentür darf offen stehen, der Raum gilt als belegt
temperature: 21.5
window_mode: disabled
presence_mode: disabled

# "Urlaub" — Abwesenheitsverhalten erzwingen, unabhängig von den Sensoren
presence_mode: away

# "Wellness-Abend" — das Gerät der zweiten Isolationsregel darf mitheizen
temperature: 23.0
isolation_bypass: 2

# "Durchlüften" — keine Kalibrierwerte mehr an die Heizkörper schreiben
calibration_mode: disabled
```

**Ergebnis:** Jeder Schlüssel pausiert seine Funktion für die Dauer des Termins,
und der Ausgangszustand spielt keine Rolle: Steht die Tür beim Beginn der Feier
bereits offen, geht die Heizung wieder an. Endet der Termin, werden die Sensoren
frisch gelesen und übernehmen wieder — steht die Tür weiterhin offen, geht die
Heizung erneut aus; ist der Raum weiterhin leer, startet das
Abwesenheitsverhalten.

Zwei Details sind wichtig:

- **Diese Schlüssel pausieren eine Funktion nur, sie schalten nie eine ein.** Eine
  in den Einstellungen ausgeschaltete Funktion hat nichts laufen, was ein Zeitplan
  übernehmen könnte — deshalb wird nur `disabled` akzeptiert, bei der Anwesenheit
  zusätzlich `away`, das für die Dauer des Termins das Abwesenheitsverhalten
  erzwingt.
- **Isolationsregeln werden über ihre Position in den Einstellungen angesprochen** —
  `1` bis `4`, in der Reihenfolge, in der die Regeln dort erscheinen.
  `isolation_bypass: all` pausiert alle Regeln, eine Liste wie `[1, 3]` mehrere.
  Ein Gerät, das von zwei Regeln erfasst wird, bleibt aus, solange die *nicht*
  pausierte Regel weiterhin greift.

---

### 17. Kalender-Bypass über einem Haupt-Zeitplan

Eine wöchentliche `schedule.*`-Entität steuert bereits das alltägliche Heizen. Zusätzlich soll ein gemeinsamer Haushalts-`calendar.*` (z. B. ein Google-Kalender, dem jeder Ereignisse hinzufügen kann) das vorübergehend überschreiben können — ein Gast über Nacht, ein Homeoffice-Tag, eine Feier — ohne den Haupt-Zeitplan überhaupt anzufassen.

**Entitäten:** `climate.living_room_trv`, `schedule.house_weekly` (Haupt), `calendar.household_overrides` (Bypass)

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.living_room_trv` |
| Zeitplan-Entität | `schedule.house_weekly` |
| Bypass-Entität | `calendar.household_overrides` |

**Haupt-Zeitplan-Zeitblock (unverändert):**
```yaml
hvac_mode: heat
temperature: 19.5
```

**Kalender-Bypass-Ereignis** (Ereignis "Gästezimmer", 18:00–23:00, Beschreibungsfeld):
```yaml
hvac_mode: heat
temperature: 22.0
```

**Ergebnis:** Außerhalb des Kalender-Ereignisses folgt `climate.living_room_trv` dem Haupt-Zeitplan (19,5 °C). Während das "Gästezimmer"-Ereignis aktiv ist, gewinnen dessen 22,0 °C — der Haupt-Zeitplan läuft im Hintergrund weiter und wird automatisch wiederhergestellt, sobald das Ereignis endet, ohne dass der Wochenplan überhaupt angefasst werden muss.

> **Tipp — ungültiges YAML bricht immer im ungünstigsten Moment:** Das Beschreibungsfeld eines Kalender-Ereignisses darf *ausschließlich* gültiges YAML enthalten (siehe [LIESMICH § Verwendung einer Kalender-Entität](LIESMICH.md#verwendung-einer-kalender-entität)) — ein verirrtes Wort, ein fehlender Doppelpunkt oder eine falsche Einrückung führt dazu, dass CGH das Ereignis komplett und stillschweigend überspringt, und du bemerkst es erst, wenn der Zeitblock hätte starten sollen und nichts passiert ist. Tippe das YAML nicht jedes Mal freihändig in ein neues Ereignis: Behalte ein bekanntermaßen funktionierendes Ereignis als Vorlage und **kopiere oder dupliziere es** für jede neue Überschreibung (die meisten Kalender-Oberflächen unterstützen das Duplizieren eines Ereignisses), und ändere dann nur Zeiten und Werte — so vermeidest du, jedes Mal von Grund auf einen neuen Syntaxfehler einzuführen. Bist du dir bei einem neuen Block unsicher, füge ihn vor dem Speichern in einen lokalen Editor mit YAML-Syntaxprüfung ein (z. B. VS Code).

---

### 18. Nachtabsenkung bei inaktivem Zeitplan

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

### 19. Gemischt Heizkörper + Klimaanlage, ein Gerät pro Modus

Ein Raum hat einen reinen Heizkörper (Wiser) und eine Heiz-/Kühl-Klimaanlage (Daikin/Faikin). Die Klimaanlage darf **niemals** heizen, obwohl sie `heat` meldet — und jedes Gerät braucht je nach aktivem Modus eine andere Behandlung. (Basierend auf einem echten Szenario mit gemischter Hardware.)

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

### 20. Fußbodenheizung, die sich nicht ausschalten lässt

Eine wasserbasierte Fußbodenheizung hat keinen `off`-Modus — sie unterstützt nur `heat`. Muss die Gruppe das Heizen stoppen (z. B. beim Umschalten auf Kühlen andernorts im Sommer), braucht der Fußbodenkreis statt eines echten `off`-Befehls einen sicheren Fallback. (Basierend auf einem realen Fußbodenheizungs-Setup.)

**Entitäten:** `climate.floor_heating` (nur heat, kein off), `climate.bedroom_ac` (heat/cool)

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.floor_heating`, `climate.bedroom_ac` |
| Feature-Strategie | Union |
| Mitglieder-Isolation | an |
| Isolationsregel 1 | Trigger: HVAC-Modus `cool`, `dry`, `fan_only` → Isoliere `climate.floor_heating` (Preset-Modus setzen: `building_protection`) |

**Ergebnis:** Das Umschalten der Gruppe auf `cool` isoliert die Fußbodenheizung in ein niedriges, sicheres Preset, statt ihr ein nicht unterstütztes `off` zu senden. Das Zurückschalten auf `heat` stellt sie wieder in der Gruppe her.

---

### 21. Union-Gruppe mit Geräten außerhalb des Bereichs

Mischung von Geräten mit unterschiedlichen Temperaturbereichen — ein TRV mit niedrigem Bereich und eine Klimaanlage mit höherem Minimum. Fällt das Ziel außerhalb des Bereichs eines Geräts, soll dieses Gerät ausgeschlossen statt auf einen unsinnigen Wert geklemmt werden.

**Entitäten:** `climate.trv` (Bereich 5–30 °C), `climate.ac` (Bereich 16–30 °C)

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.trv`, `climate.ac` |
| Feature-Strategie | Union |
| Aktion außerhalb des Bereichs | Aus |

**Ergebnis:** Ziel auf 14 °C gesetzt → die Klimaanlage kann das nicht erreichen (Min. 16 °C) und schaltet aus; der TRV heizt weiter. Ziel auf 22 °C gesetzt → beide liegen im Bereich und bleiben aktiv.

---

### 22. Multi-Kopf-Klimasplit, nur gemeinsamer Modus

Ein 4-Kopf-Klimasplit-System (z. B. Daikin über Faikin) benötigt, dass alle Köpfe denselben HVAC-Modus teilen, um korrekt zu funktionieren, aber jeder Raum braucht trotzdem seinen eigenen Sollwert und seine eigene Lüfterstufe. Vollständiges Mirror/Lock würde fälschlicherweise auch Temperatur und Lüfterstufe angleichen. (Basierend auf einem realen Multi-Kopf-Setup.)

**Entitäten:** `climate.head_living_room`, `climate.head_bedroom`, `climate.head_office`, `climate.head_kitchen`

| Einstellung | Wert |
|---|---|
| Mitglieder | alle vier Köpfe |
| Sync-Modus | Mirror |
| Sync-Attribute | nur `hvac_mode` |

**Ergebnis:** Das Ändern von `hvac_mode` an einem Kopf (z. B. Umschalten auf `cool`) spiegelt diesen Modus auf den Rest der Gruppe. Temperatur und Lüfterstufe sind *nicht* in `sync_attributes` enthalten, sodass jeder Kopf seinen eigenen, unabhängigen Sollwert behält — Mirror ignoriert nicht ausgewählte Attribute vollständig.

---

### 23. Verriegeltes Heizen/Kühlen über zwei Systeme

Ein HRV (Wärmerückgewinnungslüftung) mit heat/cool/auto fungiert als "Dirigent". Mehrere unabhängige Fußbodenheizungszonen müssen vollständig ausschalten, sobald der HRV kühlt, und wieder einschalten, wenn er heizt — reine Verriegelung, kein gemeinsamer Sollwert. (Basierend auf einem realen Mehrsystem-Setup.)

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

### 24. Mitbekommen, wenn ein Gerät Befehle verschluckt

Batteriebetriebene Thermostate verpassen gelegentlich einen Befehl — die Gruppe sendet 21°, das Gerät bleibt auf 23°, und niemand merkt es. Die Gruppe erkennt das bereits und führt es unter `member_divergence` auf; hier wird eine Benachrichtigung daraus.

**Entitäten:** eine beliebige Gruppe mit mindestens zwei Mitgliedern, z. B. `climate.wohnzimmer`

Die Verzögerung ist der eigentliche Kniff: Eine kurze Abweichung ist normal — Befehle gehen nacheinander raus, Geräte melden sich in ihrem eigenen Tempo zurück, und ein Zeitplan-Slot braucht einen Moment, bis er alle erreicht. Nur eine Abweichung, die *bleibt*, ist eine Meldung wert.

```yaml
automation:
  - alias: "Heizung: Geräte laufen auseinander"
    trigger:
      - platform: template
        value_template: >
          {{ state_attr('climate.wohnzimmer', 'member_divergence') | count > 0 }}
        for: "00:15:00"
    action:
      - service: notify.persistent_notification
        data:
          title: "Heizung Wohnzimmer"
          message: >
            {% set d = state_attr('climate.wohnzimmer', 'member_divergence') %}
            {% for setting, devices in d.items() %}
            {{ setting }}: {% for entity, value in devices.items() -%}
            {{ entity }} = {{ value }}{{ ", " if not loop.last }}
            {%- endfor %}
            {% endfor %}
```

**Ergebnis:** Stehen die Geräte eine Viertelstunde später immer noch unterschiedlich, bekommst du eine Meldung mit Einstellung, Geräten und Werten — z. B. `temperature: climate.wohnzimmer_links = 21.0, climate.wohnzimmer_rechts = 23.0`.

Zwei Fälle lösen bewusst *nicht* aus: ein isoliertes Gerät (es soll ja abweichen und bleibt aus dem Attribut heraus) und Geräte mit konfigurierten Mitglieder-Offsets (sie werden auf der logischen Einstellung verglichen, ein gewolltes +1/−1 gilt also als einig).

> Als Dashboard-Variante derselben Idee: eine Bedingungs-Karte, die nur erscheint, solange `member_divergence` nicht leer ist — bei einer einigen Gruppe zeigt sie gar nichts.

### 25. Heizen/Kühlen für Thermostate mit nur einem Sollwert

Manche Thermostate (z.B. Honeywell Lyric T5) beherrschen physisch eine automatische Umschaltung, ihre Integration gibt aber nur eine einzelne Zieltemperatur nach außen — die Gruppe erbt das und kann nie einen Bereich anbieten. Die Bereichs-Vorlage erzeugt `heat_cool`, indem sie den physischen Modus jedes Geräts anhand von dessen eigener Ist-Temperatur gegen das vorgegebene Band umschaltet. (Basierend auf einem realen Setup mit Einzel-Sollwert-Thermostaten.)

**Entitäten:** `climate.lyric_wohnzimmer`, `climate.lyric_schlafzimmer` (beide heat/cool/off, nur ein Sollwert)

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.lyric_wohnzimmer`, `climate.lyric_schlafzimmer` |
| Bereichs-Vorlage aktivieren | an |
| Totzonen-Aktion | Nur Lüfter |

**Ergebnis:** Die Gruppe bietet `heat_cool` mit unterem und oberem Sollwert an, obwohl kein Mitglied Bereichsunterstützung meldet. Unterhalb des Bandes bekommt ein Gerät `heat` mit dem unteren Sollwert, oberhalb `cool` mit dem oberen, innerhalb die Totzonen-Aktion. Die Mitglieder werden automatisch erkannt — wer `heat_cool` bereits nativ meldet, bleibt unangetastet.

**Die Totzonen-Aktion "Keine"** sendet innerhalb des Bandes keinen Befehl und belässt jedes Gerät auf dem zuletzt erhaltenen Sollwert. Sinnvoll für Geräte, die sich selbst regeln; "Ausschalten" oder "Nur Lüfter" nutzen, wenn die Gruppe sie aktiv ruhigstellen soll.

---

### 26. Entfeuchten, während der Raum auf Temperatur ist

Eine von der Bereichs-Vorlage erfasste Klimaanlage läuft innerhalb des Bandes auf Nur Lüfter — an schwülen Tagen bleibt der Raum dabei temperaturmäßig angenehm und trotzdem klamm. Die Gruppe kann stattdessen auf Trocknen umschalten, sobald die Feuchtigkeit über dem Zielwert liegt, ohne die Temperaturregelung aufzugeben.

**Entitäten:** `climate.schlafzimmer_ac` (heat/cool/dry/fan_only/off, ein Sollwert), `sensor.schlafzimmer_feuchtigkeit`

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.schlafzimmer_ac` |
| Externe Feuchtigkeitssensoren | `sensor.schlafzimmer_feuchtigkeit` |
| Bereichs-Vorlage aktivieren | an |
| Totzonen-Aktion | Nur Lüfter |
| Im Totband entfeuchten | an |
| Feuchtigkeits-Aktion | Trocknen |
| Feuchtigkeits-Hysterese | 3,0 % |
| Deaktivierungsverzögerung | 600 s |

**Ergebnis:** Innerhalb des Temperaturbandes läuft die Klimaanlage auf Nur Lüfter, solange die Feuchtigkeit im Soll ist, und wechselt auf Trocknen, sobald sie die Zielfeuchtigkeit überschreitet. Das Verlassen des Bandes hat immer Vorrang — Heizen und Kühlen gehen dem Entfeuchten vor. Die Verzögerung verhindert, dass Duschen oder ein Topf Nudeln das Gerät sofort wieder zurückschalten.

Ein Feuchtigkeitswert ist Voraussetzung: entweder ein Sensor wie oben oder ein Mitglied, das ihn meldet. Ohne ihn bietet die Gruppe keine Zielfeuchtigkeit an und die Option bleibt wirkungslos. Geräte ohne Trocknen-Modus fallen auf die Totzonen-Aktion zurück, und bei zugewiesenen Heiz-/Kühlrollen zählt Trocknen als Kühlen — ein reines Heizgerät bekommt es nie.

---

### 27. IR-gesteuerte Klimaanlagen, die die Bridge überlasten

Drei IR-gesteuerte Klimaanlagen, alle über denselben IR-Blaster angesteuert. Wird die Gruppe eingeschaltet, gehen alle drei Befehle im selben Moment raus, was den Blaster gelegentlich überfordert und einen der Befehle verschluckt.

**Entitäten:** `climate.schlafzimmer_ac`, `climate.buero_ac`, `climate.gaestezimmer_ac` (alle über einen IR-Blaster)

| Einstellung | Wert |
|---|---|
| Mitglieder | `climate.schlafzimmer_ac`, `climate.buero_ac`, `climate.gaestezimmer_ac` |
| Verzögerung zwischen Mitglieder-Befehlen | 0,3 s |

**Ergebnis:** Statt dass alle drei Befehle gleichzeitig feuern, erhält jedes Mitglied seinen Befehl etwa 0,3 Sekunden nach dem vorherigen — der Blaster bekommt so Zeit, jedes Signal sauber zu senden. Dieselbe Option hilft auch bei Zigbee-Koordinatoren, die Schwierigkeiten haben, wenn mehrere Geräte im selben Moment angesprochen werden.

---

## Tipps

- **Einfach anfangen:** Zuerst die grundlegende Gruppierung zum Laufen bringen (nur Mitglieder, keine weiteren Einstellungen), dann Funktionen nach und nach hinzufügen.
- **Erweiterte Funktionen:** In der Gruppenkonfiguration aktivieren, um alles jenseits der Basic-Stufe freizuschalten — jedes Beispiel nach dem Basic-Abschnitt benötigt sie.
- **Sync-Modus:** Nutze `Lock`, wenn die Gruppe die alleinige Quelle der Wahrheit sein soll; nutze `Mirror`, wenn manuelle Mitgliedsänderungen übernommen und an alle gespiegelt werden sollen; nutze `Adopt Only` (bzw. *Nur übernehmen*), wenn Änderungen an einem Mitglied das Gruppenziel anpassen sollen, ohne die anderen Geräte anzusteuern; nutze `Mirror/Lock`, wenn nur einige Attribute synchronisiert werden sollen (Beispiel 22).
- **Sperr-Priorität:** Hauptschalter > Fenstersteuerung > Anwesenheitssteuerung — sind mehrere gleichzeitig aktiv, wird nur die Aktion der höchstrangigen an Mitglieder gesendet.
- **Zeitplan + Boost:** Boost rangiert über dem Zeitplan. Zeitplan-Zeitblock-Änderungen laufen während eines Boosts weiterhin im Hintergrund.
- **Kalibrierung:** Nutze CGHs eigene Kalibrierung nur, wenn du nicht bereits Better Thermostat oder Versatile Thermostat verwendest — die haben ihre eigene (Beispiel 13).
- **Mehrere Isolationsregeln:** Wenn verschiedene Mitgliedsgeräte unterschiedlich auf denselben Trigger (oder ganz unterschiedliche Trigger) reagieren müssen, füge eine Isolationsregel pro Gerät hinzu — siehe Beispiele 14 und 15.
