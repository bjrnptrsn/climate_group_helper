# [Climate Group Helper](https://github.com/bjrnptrsn/climate_group_helper) für Home Assistant

<p align="center">
  <a href="https://github.com/bjrnptrsn/climate_group_helper"><img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/icon@2x.png" alt="Climate Group Helper for Home Assistant logo" width="160"/></a>
</p>

<p align="center">
  <a href="https://github.com/hacs/integration"><img src="https://img.shields.io/badge/HACS-Default-orange.svg" alt="HACS - Home Assistant Community Store"/></a>
  <a href="https://github.com/bjrnptrsn/climate_group_helper/releases"><img src="https://img.shields.io/github/v/release/bjrnptrsn/climate_group_helper" alt="Release"/></a>
</p>

<p align="center">
  <strong>Die erweiterte Logikschicht für deine Home-Assistant-Klimageräte.</strong><br>
  Synchronisiere, automatisiere und korrigiere deine Thermostate — ganz ohne YAML.
</p>

<p align="center">
  🔗 <b>Geräte gruppieren</b> zu einem virtuellen Controller.<br>
  🌡️ <b>Ungenaue Sensoren korrigieren</b> mit externer Kalibrierung.<br>
  🔄 <b>Auf manuelle Änderungen reagieren</b> mit Mirror-, Lock- oder Master-Sync-Modi.<br>
  🪟 <b>Offene Fenster erkennen</b>, um das Heizen automatisch zu pausieren.<br>
  👤 <b>Anwesenheit automatisieren</b> mit Abwesenheits-Offsets und Presets.<br>
  📅 <b>Zeitplan-Automatisierung</b> über Schedule- und Kalender-Entitäten.
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/configuration_simple.png" alt="Climate Group Helper Simple Configuration Options Overview" height="350"/>
</p>

---

## Warum es das gibt
Klimasteuerung in Home Assistant kann unübersichtlich werden: TRVs messen am Heizkörper die falsche Temperatur, native Gruppen haben keine Synchronisation, und komplexe Automationen sind schwer zu pflegen.

**Climate Group Helper fungiert als intelligente "Logikschicht"** für dein Zuhause. Er umhüllt deine vorhandenen Geräte mit einem einzigen Controller, der das "Wenn dies, dann das"-Verhalten automatisch für dich übernimmt.

> [!TIP]
> **Nicht nur für Gruppen!** Selbst wenn du nur **ein Thermostat** hast, kannst du diesen Helper nutzen, um Premium-Funktionen wie Fenstersteuerung und Sensor-Kalibrierung zu einfacher Hardware hinzuzufügen.

> [!TIP]
> **Funktioniert mit anderen Integrationen!** CGH funktioniert mit jeder `climate.*`-Entität — auch mit denen von [Better Thermostat](https://github.com/KartoffelToby/better_thermostat) oder [Versatile Thermostat](https://github.com/jmcollin78/versatile_thermostat). Lass sie die Regelung pro Gerät übernehmen (MPC, PID, TPI), während CGH die raumübergreifende Logik orchestriert. Siehe [BEISPIELE.md](BEISPIELE.md) für Einrichtungsbeispiele.

## Schnellstart

| Schritt | Aktion |
| :--- | :--- |
| **1. Installieren** | Über **HACS** hinzufügen und Home Assistant neu starten. |
| **2. Hinzufügen** | Gehe zu *Einstellungen → Geräte & Dienste → Helfer → Helfer erstellen*. |
| **3. Einrichten** | Gib deiner Gruppe einen Namen und wähle deine Thermostate (TRVs, Klimaanlagen, Heizungen — beliebig gemischt). |
| **4. Fertig!** | Du hast jetzt eine einzige Entität, die alles steuert. <br> *Tipp: Aktiviere **Erweiterte Funktionen** in den Optionen, um alle Features freizuschalten.* |

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/helper_selection.png" alt="Select Climate Group Helper in Home Assistant" width="400"/>
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/setup_flow.png" alt="Configure Climate Group Helper" width="400"/>
</p>

---

## Inhaltsverzeichnis

- [Kernkonzept](#kernkonzept-die-einheitliche-grundlage)
  - [Einfacher Modus](#einfacher-modus-kernfunktionen)
- [Erweiterte Funktionen](#power-user-erweiterte-funktionen)
  - [Master-Entität](#master-entität)
  - [Externe Sensoren](#externe-sensoren)
  - [Geräte-Kalibrierung](#geräte-kalibrierung)
  - [Sync-Modi](#erweiterte-sync-modi)
  - [Fenstersteuerung](#fenstersteuerung)
  - [Anwesenheitssteuerung](#anwesenheitssteuerung)
  - [Zeitplan-Automatisierung](#zeitplan-automatisierung)
    - [Zeitplan-Meta-Keys](#zeitplan-konfiguration--meta-keys)
  - [Mitglieder-Offsets](#mitglieder-offsets)
  - [Mitglieder-Isolation](#mitglieder-isolation)
  - [Mitglieder-Vorlage](#mitglieder-vorlage)
- [Beispiele](BEISPIELE.md)
- [Verwaltungs-Entitäten (Schalter & Regler)](#verwaltungs-entitäten-schalter--regler)
  - [Hauptschalter](#hauptschalter)
  - [Gruppen-Offset](#gruppen-offset)
- [Konfigurationsoptionen](#konfigurationsoptionen)
- [Dienste](#dienste)
- [Sicherung & Migration](#sicherung--migration)
- [Installation](#installation)
- [Einrichtung](#einrichtung)
- [Fehlerbehebung](#fehlerbehebung)

## Kernkonzept: Die einheitliche Grundlage

Der Climate Group Helper bietet eine robuste "Single Source of Truth" für deine Klimageräte. Er erstellt eine einheitliche Verwaltungsschicht, die dafür sorgt, dass deine Geräte als ein zusammenhängendes System zusammenarbeiten und gleichzeitig präzise Raumzustände liefern.

### Einfacher Modus (Kernfunktionen)

Diese Funktionen sind standardmäßig aktiv und bieten ein optimiertes "Plug & Play"-Erlebnis:

*   **Einheitliche Steuerung:** Ändere Einstellungen an der Gruppe, und alle Mitgliedsgeräte passen sich an. Kein Verwalten mehrerer Thermostate mehr einzeln.
*   **Intelligente Zustands-Aggregation:** Die Gruppe berechnet den **Durchschnitt** der Mitgliedswerte, um den tatsächlichen Raumzustand darzustellen (Mittelwert, Median, Minimum oder Maximum).
*   **HVAC-Strategie:** Intelligente Logik zur Bestimmung des Gruppenzustands (Normal, Aus-Priorität oder Auto).
*   **Präzision & Rundung:** Zieltemperaturen auf gerätekompatible Schritte runden (0,5° oder 1°), um Kompatibilität mit jeder Hardware sicherzustellen.

---

## Power User: Erweiterte Funktionen

Schöpfe das volle Potenzial deines Klimasystems aus. Diese speziellen Funktionen werden durch Umschalten von **Erweiterte Funktionen** in der Gruppenkonfiguration aktiviert. Ein Zurückschalten in den einfachen Modus blendet diese Optionen aus und versetzt die Funktionen in den **Ruhezustand** — sie stoppen funktional, aber deine Konfiguration bleibt erhalten und wird beim Zurückschalten sofort wiederhergestellt.

> [!NOTE]
> **Neue Gruppen starten im einfachen Modus.** Bestehende Gruppen, die aus früheren Versionen aktualisiert wurden, behalten **Erweiterte Funktionen** automatisch aktiviert, damit nichts kaputtgeht.

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/configuration_advanced.png" alt="Climate Group Helper Advanced Configuration Options Overview" width="400"/>
</p>

### Master-Entität

Bestimme ein einzelnes Klima-Mitglied als **Referenzpunkt** oder **Anführer** der Gruppe. Dies ist das Erste, was du im Einrichtungsassistenten konfigurierst — und sobald es gesetzt ist, schaltet es zusätzliche Optionen in jedem folgenden Schritt frei (Sync-Modus, Fenstersteuerung sowie Temperatur-/Feuchtigkeits-Mittelung).

*   **Zentralisierte Zielanzeige:** Zeigt die Zieleinstellungen des Masters (Temperatur, Luftfeuchtigkeit) als angezeigtes Ziel der Gruppe an, statt berechneter Durchschnitte über alle Mitglieder. Dies betrifft nur die Anzeige des Gruppenzustands — es steuert oder synchronisiert keine Mitglieder (nutze dafür **Sync-Modus: Master/Lock**).
*   **Hierarchische Synchronisation (Master/Lock):** Aktiviert einen "Folge dem Anführer"-Sync-Modus. Änderungen am Master werden an alle Mitglieder gespiegelt; manuelle Änderungen an anderen Mitgliedern werden automatisch zurückgesetzt.
*   **Intelligente Fenstersteuerung:** Wenn aktiviert, aktualisieren nur manuelle Anpassungen am Master den Zielzustand, während Fenster geöffnet sind. Änderungen an anderen Geräten bleiben ignoriert.

### Externe Sensoren

Nutze **mehrere externe Sensoren** für Temperatur und Luftfeuchtigkeit, um Mitgliedswerte zu überschreiben, und schreibe die Werte optional zurück in TRV-Kalibrierungsziele.

### Geräte-Kalibrierung

Schreibe den externen Sensorwert zurück in deine TRVs, um deren interne Temperaturmessung zu korrigieren.

*   **Modi:** Absolut (Standard), Offset (Delta-Berechnung) und Skaliert (x100 für Danfoss Ally).
*   **Heartbeat:** Sendet den Kalibrierungswert periodisch erneut, um Sensor-Timeouts bei Zigbee-Geräten zu vermeiden.
*   **Aus-Mitglieder ignorieren:** Verhindert das Senden von Kalibrierungs-Updates an TRVs, die aktuell `aus` sind, und schont so den Akku bei drahtlosen Geräten.

### Erweiterte Sync-Modi

Steuert, was passiert, wenn ein Mitgliedsgerät direkt geändert wird (z. B. über seine eigene App oder physische Tasten) — nicht wenn du die Gruppe selbst steuerst.

* **Sync-Modi**

  Das Verhalten jedes Modus hängt davon ab, ob das geänderte Attribut unter **Sync-Attribute** ausgewählt ist oder nicht. Betrachte die beiden Spalten als zwei unabhängige Regeln, die der Modus anwendet:

  | Sync-Modus | Attribut ausgewählt | Attribut nicht ausgewählt |
  |---|---|---|
  | **Deaktiviert** | Ignorieren | Ignorieren |
  | **Mirror** | Spiegeln ¹ | Ignorieren |
  | **Lock** | Zurücksetzen ¹ | Ignorieren |
  | **Mirror/Lock** | Spiegeln ¹ | Zurücksetzen ¹ |
  | **Master/Lock** | Master: Spiegeln · Nicht-Master: Zurücksetzen ¹ | Ignorieren |

  - *¹ Mit aktiviertem **Respektiere Aus-Status der Mitglieder (Sync)**: Mitglieder, die manuell `aus` geschaltet wurden, werden in Ruhe gelassen — ihr `aus` wird weder gespiegelt noch zurückgesetzt.*

* **Sync-Attribute**

  Mit Sync-Attributen kannst du bestimmte Attribute wie `hvac_mode`, `temperature`, `preset_mode` für die Synchronisation auswählen. Die Bedeutung ausgewählter oder nicht ausgewählter Attribute hängt vom **Sync-Modus** ab:

  | Modus | Rolle der **Sync-Attribute** |
  |---|---|
  | **Mirror** | **ausgewählte** Attribute werden gespiegelt, **nicht ausgewählte** Attribute werden ignoriert. |
  | **Lock** | **ausgewählte** Attribute werden zurückgesetzt, **nicht ausgewählte** Attribute werden ignoriert. |
  | **Mirror/Lock** | **ausgewählte** Attribute werden gespiegelt, **nicht ausgewählte** Attribute werden zurückgesetzt. |
  | **Master/Lock** | **ausgewählte** Attribute werden von der **Master-Entität** gespiegelt, **nicht ausgewählte** Attribute werden ignoriert. Änderungen von Nicht-Master-Geräten werden immer zurückgesetzt. |

*  **Respektiere Aus-Status der Mitglieder (Sync):** Wenn ein Mitglied manuell `aus` geschaltet wird, spiegelt die Gruppe dieses `aus` weder auf andere, noch erzwingt sie es zurück — das Mitglied wird einfach in Ruhe gelassen. Die eine Ausnahme: Wenn es das *letzte* aktive Mitglied ist, akzeptiert die Gruppe das `aus`, und ihr eigenes Ziel wechselt ebenfalls auf `aus`.

### Fenstersteuerung

Schaltet die Heizung automatisch aus oder setzt eine Frostschutztemperatur, wenn Fenster oder Türen geöffnet werden, und stellt den vorherigen Zustand beim Schließen wieder her. Während Fenster geöffnet sind, werden manuelle Änderungen blockiert. Unterstützt Binärsensoren und Rollladen-/Fensterentitäten (Cover).

*   **Raum- + Zonensensoren:** Unterstützt schnell reagierende Raumsensoren gegenüber langsam reagierenden Zonensensoren (z. B. für ganze Etagen). Der Raum wird als Teil der Zone verstanden: Sobald der Raumsensor "offen" meldet, muss die Zone ebenfalls als offen gelten.
*   **Konfigurierbare Verzögerungen:** Lege eigene Reaktionszeiten für Öffnen und Schließen fest.
*   **Fenster-Aktion:** Wähle zwischen vollständigem `aus` oder einem konfigurierbaren Temperatur-Sollwert.
*   **Manuelle Änderungen übernehmen:** Optional passives Tracking erlauben:
    *   **Aus:** Alle manuellen Änderungen werden blockiert und verworfen.
    *   **Alle:** Jede manuelle Änderung aktualisiert den Zielzustand. Wird angewendet, wenn die Fenster schließen.
    *   **Nur Master:** *(Erfordert Master-Entität)* Nur Änderungen am Master aktualisieren den Zielzustand.

### Anwesenheitssteuerung

Verwaltet Klimaeinstellungen basierend auf Raumanwesenheit. Wähle einen oder mehrere Trigger (Binärsensor, Geräte-Tracker oder Person), optional beschränkt auf bestimmte **Zonen** (z. B. um nur auszulösen, wenn sich jemand tatsächlich "zu Hause" befindet). Konfiguriere Verzögerungen und Fallback-Aktionen für den Fall, dass der Raum leer wird. Die Gruppe gilt als belegt, wenn **irgendein** Sensor Anwesenheit meldet.

*   **Ausschalten:** Mitglieder werden `aus` geschaltet, während Abwesenheit erkannt wird (Standard).
*   **Abwesenheits-Offset:** Die Zieltemperatur wird um einen festen Offset reduziert (z. B. −2 °C). Der Offset wird relativ zur *aktuellen Zieltemperatur* der Gruppe angewendet. Ändert sich ein Zeitplan während der Abwesenheit, wird der Offset automatisch auf den neuen geplanten Wert erneut angewendet.
*   **Abwesenheits-Temperatur:** Mitglieder werden auf eine feste absolute Temperatur gesetzt.
*   **Abwesenheits-Preset:** Ein Preset-Modus wird an Mitglieder gesendet, die ihn unterstützen.

Kehrt die Anwesenheit zurück, stellt die Gruppe alle Mitglieder auf den aktuellen Zielzustand wieder her. Prioritätsreihenfolge: Der **Hauptschalter** gewinnt immer gegen die **Fenstersteuerung**, die wiederum immer gegen die **Anwesenheitssteuerung** gewinnt.

### Zeitplan-Automatisierung

Integriere native HA-`schedule`- oder `calendar`-Helfer, um deine Klimaeinstellungen pro Zeitblock zu automatisieren. Du kannst Temperatur und HVAC-Modus direkt in den Daten des Zeitplans festlegen, und die Gruppe handhabt Übergänge intelligent: Wenn eine Zeitplanänderung eintritt, während die **Fenstersteuerung** aktiv ist (z. B. die Heizung pausiert ist), wird das neue Ziel sofort angewendet, sobald alles geschlossen ist.

Zeitpläne können per Dienst live umgeschaltet werden (z. B. für "Urlaub"- oder "Gäste"-Modi). Wird der Dienst ohne Entität aufgerufen, setzt er auf den konfigurierten Standard zurück und wendet den aktuellen Zeitblock erneut an.

*   **Kalender-Unterstützung:** `calendar.*`-Entitäten funktionieren genauso wie `schedule.*`-Entitäten. Die Zeitblock-Daten werden aus dem **Beschreibungsfeld** jedes Ereignisses gelesen, im selben `key: value`-YAML-Format wie die zusätzlichen Zeitplan-Daten. Siehe [Zeitplan-Konfiguration & Meta-Keys](#zeitplan-konfiguration--meta-keys) für Details.
*   **Bypass-Ebene:** Eine zweite `schedule.*`- oder `calendar.*`-Entität kann als **Prioritätsebene** über deinem Basis-Zeitplan fungieren. Ist ein Bypass-Zeitblock aktiv, überschreiben dessen Attribute den Basis-Zeitblock (Bypass gewinnt bei Konflikten).
*   **Fallback bei inaktivem Zeitplan:** Ein optionaler Zustand (z. B. Nachtabsenkung oder Ausschalten), der außerhalb der aktiven Zeitblöcke für den Basis-Zeitplan einspringt — lückenlose 24/7-Zeitpläne sind damit unnötig. Die Bypass-Ebene arbeitet unverändert weiter und überschreibt ihn, solange sie aktiv ist.
*   **Manuelle Überschreibungen:** Manuelle Anpassungen gelten einfach bis zum nächsten geplanten Zeitblock, der dann wieder übernimmt. Kein Timer zu konfigurieren.
*   **Per Dienst geänderte Werte beibehalten (Zeitplan):** Stellt sicher, dass per Dienst geänderter Basis-Zeitplan, Bypass-Entität und Fallback-Zustand einen Home-Assistant-Neustart überstehen. Wenn deaktiviert, kehrt die Gruppe nach einem Neustart immer zu ihren konfigurierten Standardwerten zurück.
*   **Respektiere Aus-Status der Mitglieder (Zeitplan):** Mitglieder, die manuell `aus` geschaltet wurden, werden bei geplanten Änderungen übersprungen — sie werden nicht zurück eingeschaltet.

> **Hinweis — Ausschalten außerhalb aktiver Zeitblöcke:** Um die Gruppe in der inaktiven Phase abzuschalten, setze `hvac_mode: off` im Fallback. Verwende hier **nicht** den `turn_off`-Meta-Key — er ist ein einmaliger Auslöser für die Hauptschalter-Sperre, die aktiv bleibt, bis ein Zeitblock sie explizit mit `turn_off: false` freigibt. Ein `turn_off: true` im Fallback würde also den nächsten Heiz-Zeitblock blockiert lassen.

### Zeitplan-Konfiguration & Meta-Keys

#### Verwendung eines Zeitplan-Helfers

1. Erstelle einen **Zeitplan-Helfer** in Home Assistant (Einstellungen > Geräte & Dienste > Helfer).
2. Öffne den Zeitplan und füge deine Zeitblöcke hinzu.
3. **Wichtig:** Jeder Zeitblock benötigt **zusätzliche Daten**, um der Gruppe mitzuteilen, was zu tun ist.
   - Klicke auf einen Zeitblock, um ihn zu bearbeiten.
   - Klappe **Erweiterte Einstellungen** aus.
   - Trage den gewünschten Zustand in das Feld **Zusätzliche Daten** ein.

**Beispiel (Zusätzliche Daten für einen einzelnen Zeitblock):**
```yaml
hvac_mode: heat
temperature: 21.5
```

#### Verwendung einer Kalender-Entität

Jede `calendar.*`-Entität funktioniert — auch Kalender, die über Integrationen wie Google Calendar, Apple Calendar oder Nextcloud importiert wurden. Die Zeitblock-Daten werden aus dem **Beschreibungsfeld** jedes Ereignisses gelesen.

> [!IMPORTANT]
> Das **Beschreibungsfeld** darf **ausschließlich** gültiges YAML enthalten. Jeder andere Text (z. B. eine reine Textbeschreibung des Ereignisses) führt dazu, dass das Ereignis übersprungen wird. Halte das Beschreibungsfeld ausschließlich für die Zeitblock-Daten frei.

**Beispiel (Kalender-Ereignisbeschreibung):**
```yaml
hvac_mode: heat
temperature: 21.5
```

Du kannst jedes Klima-Attribut oder jeden Meta-Key sowohl in Zeitplan- als auch in Kalender-Zeitblöcken verwenden — das Format ist identisch.

Du kannst Attribute weglassen, die du nicht brauchst — verwende z. B. nur `hvac_mode: off` für einen Zeitblock, der die Heizung ausschaltet.

**Unterstützte Klima-Attribute:**

| Attribut | Beispielwert | Hinweise |
|---|---|---|
| `hvac_mode` | `heat`, `cool`, `off` | Abhängig von deinen Geräten |
| `temperature` | `21.5` | Einzelner Sollwert |
| `target_temp_low` | `19.0` | Untere Grenze (Doppel-Sollwert) |
| `target_temp_high` | `24.0` | Obere Grenze (Doppel-Sollwert) |
| `humidity` | `50` | Ziel-Luftfeuchtigkeit (%) |
| `preset_mode` | `eco`, `comfort` | Geräteabhängig |
| `fan_mode` | `auto`, `high` | Geräteabhängig |
| `swing_mode` | `on`, `off` | Geräteabhängig |
| `swing_horizontal_mode` | `on`, `off` | Geräteabhängig |

**Zeitplan-Meta-Keys** — diese steuern die Gruppe selbst statt ihre Mitglieder und sind für die gesamte Dauer des Zeitblocks aktiv:

| Key | Mögliche Werte | Beispiel | Effekt |
|---|---|---|---|
| `group_offset` | Float −5,0 … 5,0 | `group_offset: 1.5` | Setzt vorübergehend den **Gruppen-Offset** für die Dauer des Zeitblocks. Bewegst du den Offset-Regler manuell, während dieser Zeitblock aktiv ist, übernimmt dein Wert die Kontrolle und das Zurücksetzen am Zeitblock-Ende wird übersprungen. |
| `sync_mode` | `disabled`, `lock`, `mirror`, `master_lock` | `sync_mode: disabled` | Überschreibt vorübergehend den konfigurierten **Sync-Modus** für die Dauer des Zeitblocks. Nützlich für Zeitblöcke, in denen Mitglieder in Ruhe gelassen werden sollen (z. B. ein "Schlaf"-Zeitblock, in dem manuelle Anpassungen erlaubt sind). |
| `sync_attributes` | Beliebige Teilmenge von: `hvac_mode`, `temperature`, `target_temp_low`, `target_temp_high`, `humidity`, `fan_mode`, `preset_mode`, `swing_mode`, `swing_horizontal_mode` | `sync_attributes: [hvac_mode]` | Überschreibt vorübergehend, welche **Sync-Attribute** für die Dauer des Zeitblocks synchronisiert werden. Nützlich für Zeitblöcke, in denen nur der Modus synchronisiert, aber die Temperatur den Mitgliedern selbst überlassen werden soll. Wird bei Zeitblock-Ende auf die konfigurierten Sync-Attribute zurückgesetzt. |
| `turn_off` | `true` / `false` | `turn_off: true` | Expliziter Zwei-Zustands-Auslöser: `true` schaltet alle Mitglieder aus (entspricht dem Ausschalten des **Hauptschalters**). `false` stellt alle Mitglieder wieder her (entspricht dem Wiedereinschalten des **Hauptschalters**). Ein Zeitblock ohne `turn_off` hat keine Auswirkung auf den aktuellen Zustand. Der Hauptschalter und dieser Meta-Key sind gleichwertige, austauschbare Steuerungen für dieselbe Sperre — wer zuletzt handelt, gewinnt. Du kannst also den Hauptschalter jederzeit in der UI wieder einschalten, auch während ein `turn_off: true`-Zeitblock aktiv ist, und ein späterer `turn_off: false`-Zeitblock löst ebenso eine Sperre, die du manuell über den Hauptschalter gesetzt hast. |
| `presence` | `away` | `presence: away` | Aktiviert vorübergehend die **Anwesenheits-Überschreibung** (Abwesenheitsmodus) für die Dauer des Zeitblocks. Sind Anwesenheitssensoren konfiguriert, wird die Sperre am Zeitblock-Ende nur aufgehoben, wenn keine physische Abwesenheit erkannt wird (Zeitblock-Abwesenheit gewinnt während ihres Zeitblocks; Sensor-Abwesenheit übernimmt am Zeitblock-Ende, falls Bewohner weiterhin abwesend sind). Boost-Befehle werden während der Zeitblock-Abwesenheit abgelehnt, und Fenstersteuerungs-Aktionen haben Vorrang. |

**Beispiel — Nacht-Zeitblock, der alles ausschaltet:**
```yaml
turn_off: true
```

**Beispiel — Komfort-Zeitblock, der alle Räume um 1,5 °C über den Preset-Sollwert anhebt und lokale Anpassungen erlaubt:**
```yaml
preset_mode: comfort
group_offset: 1.5
sync_mode: disabled
```
Die Gruppe läuft normalerweise im Lock-Modus. Während dieses Zeitblocks erlaubt `sync_mode: disabled` den Bewohnern, ihr eigenes Gerät anzupassen, ohne zurückgesetzt zu werden — nützlich, wenn Komfortpräferenzen variieren.

### Mitglieder-Offsets

Wende dauerhafte individuelle Offsets (±20 °C) auf jedes Gruppenmitglied an, um physische Raumunterschiede auszugleichen. Die Gruppe berücksichtigt diese Offsets intelligent bei Mittelung und Synchronisation: Ist die Gruppe z. B. auf 21 °C gesetzt, erhält ein Schlafzimmer mit −1 °C-Offset 20 °C, während das Wohnzimmer (+0,5 °C) 21,5 °C erhält. Deine logische Einstellung bleibt konsistent bei 21 °C über alle Gruppenoberflächen hinweg.

*   **Mitglieder-Offset korrigieren:** Zieht Mitglieder-Offsets vor der Mittelung ab, um den logischen Sollwert des Raums anstelle des rohen physischen Durchschnitts anzuzeigen.

### Mitglieder-Isolation

Isoliere bestimmte Mitglieder vorübergehend von der Gruppe mithilfe von Sensoren oder Zustandsauslösern. Während die Isolation aktiv ist, werden diese Geräte von allen Gruppenberechnungen und der Synchronisation ausgeschlossen — als wären sie keine Mitglieder der Gruppe. Mindestens ein Mitglied muss immer aktiv bleiben, damit die Gruppe betriebsbereit bleibt.

Du kannst **bis zu 4 unabhängige Isolationsregeln** pro Gruppe definieren, jede mit eigenem Auslöser, Mitgliederliste, Verzögerungen und Isolationsaktion — nützlich für Räume mit gemischten Gerätetypen. Ein Raum mit sowohl einem Heizkörper (nur Heizen) als auch einer Klimaanlage (Heizen/Kühlen) kann z. B. eine Regel nutzen, um die Klimaanlage zu isolieren, wenn die Gruppe auf `heat` wechselt, und eine zweite Regel, um den Heizkörper zu isolieren, wenn sie auf `cool` wechselt. Die **Isolationsaktion** jeder Regel steuert, welcher Befehl an das Mitglied gesendet wird, wenn die Isolation aktiviert — entweder ein HVAC-Modus (Standard: `off`) oder ein Preset-Modus für Geräte, die einen bestimmten Standby-Zustand benötigen.

*   **Binärsensor:** Isolation aktiviert sich, wenn ein Binärsensor (z. B. Vorhangsensor, Belegungs-Helfer) auf `on` wechselt.
*   **HVAC-Modus:** Isolation aktiviert sich, wenn der Zielmodus der Gruppe mit einer konfigurierten Menge übereinstimmt (z. B. Heizkörper isolieren, wenn auf `cool` gewechselt wird).
*   **Mitglied aus:** Isoliert einzelne Mitglieder automatisch, wenn sie manuell `aus` geschaltet werden. Die Wiederherstellung erfolgt, sobald das Gerät wieder `ein` geschaltet wird.
*   **Konfigurierbare Verzögerungen:** Lege eigene Reaktionszeiten für Aktivierung und Wiederherstellung fest (nur bei Sensor- und HVAC-Modus-Auslösern).
*   **Isolationsaktion:** Wähle, welcher Befehl gesendet wird, wenn ein Mitglied isoliert wird. Standard ist `hvac_mode: off`. Für Geräte ohne echten Aus-Modus (z. B. KNX-Fußbodenheizung) verwende stattdessen `preset_mode`, um ein sicheres Standby-Preset zu setzen (z. B. `building_protection`).

### Mitglieder-Vorlage

Eine **Mitglieder-Vorlage** umhüllt einzelne Gruppenmitglieder mit einem virtuellen Fähigkeitsprofil, das sich von dem unterscheidet, was ihre Home-Assistant-Integration nativ meldet. Aus Sicht der Gruppe — und aller darauf aufbauenden Funktionen (Sync-Modus, Zeitplan, Kalibrierung usw.) — sieht und verhält sich das umhüllte Mitglied wie ein Gerät mit einem anderen Funktionsumfang. Das physische Gerät selbst bleibt unberührt.

#### Bereichs-Vorlage

Übersetzt ausgehende `heat_cool`-Bereichsbefehle in Einzel-Sollwert-Befehle für Mitglieder, deren HA-Integration nur ein einzelnes `temperature`-Attribut bereitstellt, obwohl das zugrunde liegende Gerät physisch automatischen Wechsel unterstützt. Die Gruppe stellt `target_temp_low` und `target_temp_high` bereit; jedes umhüllte Mitglied erhält basierend auf der aktuellen Raumtemperatur einen physischen Einzel-Sollwert-Befehl:

*   Temperatur **unter** `target_temp_low` → sendet `heat` + unteren Sollwert
*   Temperatur **über** `target_temp_high` → sendet `cool` + oberen Sollwert
*   Temperatur **innerhalb** des Bandes → sendet die konfigurierte **Totzonen-Aktion**

*   **Totzonen-Aktion:** Was zu tun ist, wenn sich der Raum bereits innerhalb des Zielbandes befindet: **Keine** (Standard), **Ausschalten** oder **Nur Lüfter**.
*   **Automatische Mitgliedserkennung:** Alle Mitglieder, die `heat_cool` **nicht** nativ melden, werden automatisch erfasst — keine manuelle Auswahl nötig. Mitglieder mit nativer `heat_cool`-Unterstützung bleiben unverändert. Dies ermöglicht auch den `heat_cool`-Modus für Gruppen, die ausschließlich aus reinen Heiz- und Kühlgeräten bestehen, ganz ohne natives `heat_cool`-Gerät.

## Verwaltungs-Entitäten (Schalter & Regler)

Neben der Haupt-Klima-Entität erstellt die Integration zusätzliche Helfer-Entitäten, die direkte Steuerungspunkte für deine Dashboards und Automationen bieten.

### Hauptschalter

Eine dedizierte `switch`-Entität fungiert als **zentraler Ein-/Aus-Schalter** für die gesamte Gruppe. Nützlich für die Sommermonate, längere Abwesenheiten oder jede Situation, in der du die Gruppe komplett deaktivieren möchtest, ohne deine Zeitpläne oder Zieleinstellungen anzufassen. Während der Schalter `aus` ist, werden alle manuellen und automatisierten Befehle blockiert.

*   **Schalter AUS:** Schaltet sofort alle Mitglieder `aus` und bricht einen aktiven Boost ab. Die Gruppe bleibt blockiert, bis der Schalter wieder eingeschaltet wird.
*   **Schalter EIN:** Hebt die Sperre auf und stellt alle Mitglieder auf den aktuellen Zielzustand der Gruppe wieder her.

### Gruppen-Offset

Eine dedizierte `number`-Entität erlaubt dir, eine globale Temperaturverschiebung (±5,0 °C) auf alle Gruppenmitglieder anzuwenden. Nutze sie, um das Komfortniveau des Raums vorübergehend anzupassen, ohne deinen zugrunde liegenden Zeitplan oder deine Zieleinstellungen zu ändern. Der Offset wirkt als nicht-destruktive Ebene: Ein Offset von +1,5 °C verschiebt einen morgendlichen Sollwert von 20 °C auf 21,5 °C und folgt automatisch einem Zeitplan-Übergang auf 23,5 °C am Abend.

*   **Automatisches Zurücksetzen:** Wird eine Temperatur direkt an der Gruppe gesetzt (über UI oder Dienst), wird der Offset automatisch auf `0` zurückgesetzt.
*   **Persistenz:** Der Offset-Wert übersteht Home-Assistant-Neustarts.

## Konfigurationsoptionen

### Mitglieder & Gruppenverhalten

| Option | Beschreibung |
|--------|-------------|
| **Master-Entität** | Bestimmt ein Mitglied als Anführer der Gruppe. Aktiviert den Master/Lock-Sync-Modus, master-bewusste Fenster-Erkennung und zentralisierte Temperatur-/Feuchtigkeits-Zielanzeige. |
| **HVAC-Modus-Strategie** | Wie die Gruppe ihren kombinierten Modus meldet. Siehe Tabelle unten. |
| **Feature-Strategie** | Welche Funktionen die Gruppe bereitstellt. Siehe Tabelle unten. |
| **Aktion außerhalb des Bereichs** | *(Nur Union)* Was zu tun ist, wenn eine Zieltemperatur außerhalb des Bereichs eines Mitglieds liegt. |
| **Aktion bei nicht unterstütztem HVAC-Modus** | *(Nur Union)* Was mit Mitgliedern zu tun ist, die den angeforderten Modus nicht unterstützen. |

### HVAC-Modus-Strategie

| Strategie | Verhalten |
|----------|----------|
| **Normal** | Gruppe zeigt den häufigsten Modus. Nur `aus`, wenn alle aus sind. |
| **Aus-Priorität** | Gruppe zeigt `aus`, wenn *irgendein* Gerät aus ist. |
| **Auto** | Basierend auf dem Zielmodus der Gruppe: Verhält sich wie **Normal**, während das Ziel `aus` ist (Gruppe zeigt erst `aus`, wenn jedes Mitglied aus ist), und wie **Aus-Priorität**, während das Ziel ein aktiver Modus ist (Gruppe zeigt diesen Modus erst, wenn jedes Mitglied `aus` verlassen hat). Nützlich für externe Automationen, die den gemeldeten Modus der Gruppe brauchen, um zu bestätigen, dass ein Befehl bei jedem Mitglied vollständig angekommen ist, bevor er als abgeschlossen gilt. |

### Feature-Strategie

| Strategie | Verhalten |
|----------|----------|
| **Schnittmenge** | Funktionen (z. B. Lüfter), die von *allen* Geräten unterstützt werden. Sicherer Modus. Der Temperaturbereich ist das schmalste gemeinsame Fenster über alle Mitglieder. |
| **Union** | Funktionen, die von *irgendeinem* Gerät unterstützt werden. Der Temperaturbereich umfasst den vollen Bereich über alle Mitglieder (breitestes Min/Max). Fällt eine Zieltemperatur außerhalb des von einem Mitglied unterstützten Bereichs, greift die konfigurierte **Aktion außerhalb des Bereichs**. |

### Aktion außerhalb des Bereichs *(nur Union)*

| Aktion | Verhalten |
|--------|-------------|
| **Aus (Standard)** | Mitglied wird `aus` geschaltet, wenn die Zieltemperatur außerhalb seines unterstützten Bereichs liegt. Wird automatisch wiederhergestellt, sobald das Ziel wieder im Bereich liegt. |
| **Klemmen** | Mitglied wird auf seinen nächstgelegenen unterstützten Grenzwert gesetzt (`min_temp` oder `max_temp`). |

### Aktion bei nicht unterstütztem Modus *(nur Union)*

| Aktion | Verhalten |
|--------|-------------|
| **Ignorieren (Standard)** | Mitglied bleibt in seinem aktuellen Modus, wenn es den Zielmodus nicht unterstützt. |
| **Aus** | Mitglied wird `aus` geschaltet, wenn es den Zielmodus nicht unterstützt (z. B. Klimaanlage beim Heizen). |

### Temperatur- & Feuchtigkeitseinstellungen

| Option | Beschreibung |
|--------|-------------|
| **Externe Sensoren** | Wähle einen oder mehrere Sensoren, um Mitgliedswerte zu überschreiben. |
| **Master-Temperatur/-Feuchtigkeit verwenden** | *(Erfordert Master-Entität)* Zeigt den Zielwert des Masters als Ziel der Gruppe an, statt des Mitglieder-Durchschnitts. Fällt auf Mittelung zurück, wenn der Master nicht verfügbar ist. Nur für die Anzeige — diese Option steuert oder synchronisiert keine Mitglieder (nutze dafür **Sync-Modus: Master/Lock**). |
| **Mittelungsmethode** | Mittelwert, Median, Minimum oder Maximum — getrennt für aktuelle und Zielwerte. |
| **Präzision** | Rundet an Geräte gesendete Zielwerte (z. B. 0,5° oder 1°). |
| **Kalibrierungsziele** | Schreibt die berechnete Temperatur in Number-Entitäten. Unterstützt die Modi **Absolut** (Standard), **Offset** (Delta) und **Skaliert** (x100). |
| **Kalibrierungs-Heartbeat** | Sendet Kalibrierungswerte periodisch erneut (in Minuten). Hilft, Timeouts bei Geräten zu vermeiden, die häufige Updates erwarten. |
| **Aus-Mitglieder ignorieren** | Verhindert das Senden von Kalibrierungs-Updates an aktuell `aus` geschaltete Geräte und schont so den Akku bei drahtlosen Sensoren und TRVs. |
| **Aus-Mitglieder ausschließen** | Schließt aktuell `aus` geschaltete Mitglieder von Temperaturberechnungen aus (sowohl aktuell als auch Ziel). Verhindert, dass ein kalter, ausgeschalteter Heizkörper den angezeigten Durchschnitt nach unten zieht. |
| **Geräte-Zuordnung** | Verknüpft externe Sensoren automatisch mit internen TRV-Sensoren über das HA-Geräteregister (für präzise Offset-Berechnung). |
| **Min. Temperatur bei Aus** | Erzwingt eine Mindesttemperatur (z. B. 5 °C), selbst wenn die Gruppe `aus` ist. Stellt sicher, dass Ventile für den Frostschutz vollständig schließen (essentiell für TRVs, die im `aus`-Modus nicht vollständig schließen). |

### Sync-Modus

| Option | Beschreibung |
|--------|-------------|
| **Sync-Modus** | Was zu tun ist, wenn ein Mitglied außerhalb der Gruppe geändert wird. **Deaktiviert**: alles ignorieren. **Mirror**: Änderungen spiegeln. **Lock**: Änderungen zurücksetzen. **Mirror/Lock**: ausgewählte Attribute spiegeln, nicht ausgewählte zurücksetzen. **Master/Lock** *(erfordert Master-Entität)*: nur Änderungen der **Master-Entität** spiegeln, Änderungen von Nicht-Master-Entitäten zurücksetzen. |
| **Sync-Attribute** | Auf welche Attribute der Modus wirkt. Bei **Mirror**: nur ausgewählte Attribute werden gespiegelt, nicht ausgewählt = keine Aktion. Bei **Lock**: nur ausgewählte Attribute werden zurückgesetzt, nicht ausgewählt = keine Aktion. Bei **Mirror/Lock**: ausgewählte Attribute werden gespiegelt, nicht ausgewählte zurückgesetzt. Bei **Master/Lock**: nur die Attribute der Master-Entität werden gespiegelt, nicht ausgewählt = keine Aktion. |
| **Respektiere Aus-Status der Mitglieder (Sync)** | Mitglieder, die manuell `aus` geschaltet wurden, werden in Ruhe gelassen. Ihr `aus`-Zustand wird weder auf andere gespiegelt noch auf das Gruppenziel zurückgesetzt. Ausnahme: Ist es das letzte aktive Mitglied, wechselt die Gruppe selbst auf `aus` (Last Man Standing). Direkte Gruppenbefehle erreichen unabhängig von dieser Einstellung immer alle Mitglieder. |

### Fenstersteuerung

| Option | Beschreibung |
|--------|-------------|
| **Fenster-Aktion** | **Ausschalten** (Standard) oder **Temperatur setzen**. Nützlich für Frostschutz. |
| **Manuelle Änderungen übernehmen** | **Aus** (alle blockieren), **Alle** (passives Tracking für alle Mitglieder) oder **Nur Master** *(erfordert Master-Entität)*. |
| **Fenster-Temperatur** | Zieltemperatur, die bei Aktion "Temperatur setzen" gesetzt wird. |
| **Raumsensor** | (Optional) Binärsensor (Fenster/Tür) oder Cover-Entität für schnelle Reaktion. Cover gelten als "offen", solange sie nicht vollständig geschlossen sind. |
| **Zonensensor** | (Optional) Binärsensor oder Cover-Entität für langsame Reaktion (z. B. Wohnung oder Etage). |
| **Raum-/Zonen-Verzögerung** | Zeit bis zum Ausschalten der Heizung (Standard: 15s / 5min). |
| **Schließ-Verzögerung** | Zeit bis zur Wiederherstellung der Heizung nach dem Schließen der Fenster (Standard: 30s). |

### Anwesenheitssteuerung

| Option | Beschreibung |
|--------|-------------|
| **Anwesenheitssteuerungs-Modus** | **Deaktiviert** (Standard) oder **Aktiviert**. |
| **Anwesenheits-Trigger** | Eine oder mehrere Entitäten, die Raumanwesenheit melden (binary_sensor, device_tracker oder person). Jeder `on`- oder `home`-Zustand gilt als anwesend; `not_home` und `away` gelten als abwesend. Die Gruppe gilt als belegt, wenn **irgendein** Sensor Anwesenheit meldet. |
| **Anwesenheits-Zone** | *(Optional)* Eine oder mehrere `zone`-Entitäten. Ist konfiguriert, zählt ein person/device_tracker-Sensor nur als anwesend, wenn er sich in einer der ausgewählten Zonen befindet. Leer lassen, um jeden Nicht-Away-Zustand als anwesend zu behandeln. |
| **Abwesenheits-Aktion** | Die Fallback-Aktion bei erkannter Abwesenheit: **Ausschalten**, **Abwesenheits-Offset**, **Abwesenheits-Temperatur** oder **Abwesenheits-Preset**. |
| **Abwesenheits-Offset** | *(Aktion Abwesenheits-Offset)* Offset vom aktuellen Ziel bei Abwesenheit (z. B. `−2,0 °C` oder `+2,0 °C`). |
| **Abwesenheits-Temperatur** | *(Aktion Abwesenheits-Temperatur)* Feste Temperatur, die bei Abwesenheit gesetzt wird. |
| **Abwesenheits-Preset** | *(Aktion Abwesenheits-Preset)* Preset-Modus, der bei Abwesenheit aktiviert wird. |
| **Abwesenheits-Verzögerung** | Wartezeit (Sekunden) nach Meldung der Abwesenheit durch den Sensor, bevor der Abwesenheitsmodus aktiviert wird. |
| **Rückkehr-Verzögerung** | Wartezeit (Sekunden) nach Meldung der Anwesenheit durch den Sensor, bevor wiederhergestellt wird. |

### Zeitplan-Automatisierung

| Option | Beschreibung |
|--------|-------------|
| **Zeitplan-Entität** | Eine Home-Assistant-`schedule.*`- oder `calendar.*`-Entität zur Steuerung der Gruppe. |
| **Fallback-Zustand bei inaktivem Basis-Zeitplan / Kalender (YAML)** | *(Optional)* Zustand, der außerhalb der aktiven Zeitblöcke für den Basis-Zeitplan einspringt (z. B. Nachtabsenkung oder vollständiges Ausschalten). Die Bypass-Ebene überschreibt ihn, solange sie aktiv ist. |
| **Bypass-Entität** | *(Optional)* Eine zweite `schedule.*`- oder `calendar.*`-Entität, die als Prioritätsebene fungiert. Ist ein Bypass-Zeitblock aktiv, überschreibt er den Basis-Zeitplan. |
| **Respektiere Aus-Status der Mitglieder (Zeitplan)** | Mitglieder, die manuell `aus` geschaltet wurden, werden bei geplanten Änderungen übersprungen — sie werden nicht zurück eingeschaltet. Direkte Gruppenbefehle erreichen unabhängig von dieser Einstellung immer alle Mitglieder. |
| **Per Dienst geänderte Werte beibehalten (Zeitplan)** | Behält Basis-Zeitplan, Bypass-Entität und Fallback-Zustand über Neustarts hinweg bei, wenn sie über einen Dienst geändert wurden. Ohne diese Option kehrt die Gruppe nach einem Neustart immer zu ihren konfigurierten Standardwerten zurück. |

### Mitglieder-Offsets

| Option | Beschreibung |
|--------|-------------|
| **Offset pro Mitglied** | Wendet individuelle Temperaturverschiebungen (±20 °C, 0,5 °C-Schritte) an, damit bestimmte Mitglieder proportional wärmer oder kühler laufen als der Zielsollwert der Gruppe. |
| **Mitglieder-Offset korrigieren (Standard)** | Zieht Mitglieder-Offsets vor der Mittelung ab, um den logischen Sollwert des Raums anstelle des rohen physischen Durchschnitts anzuzeigen. |

### Mitglieder-Isolation

| Option | Beschreibung |
|--------|-------------|
| **Anzahl der Regeln** | Wie viele unabhängige Isolationsregeln konfiguriert werden (1–4). Jede Regel hat ihren eigenen Auslöser, Mitglieder, Verzögerungen und Aktion. Nach einer Änderung speichern, um zusätzliche Regelabschnitte ein- oder auszublenden. |
| **Zu isolierende Entitäten** | Welche Gruppenmitglieder diese Regel isoliert. |
| **Auslösertyp** | **Binärsensor** (aktiviert, wenn Sensor EIN ist), **HVAC-Modus** (aktiviert, wenn Gruppenmodus übereinstimmt) oder **Mitglied aus** (isoliert jedes Mitglied einzeln, wenn es manuell ausgeschaltet wird). |
| **Isolationssensor** | *(Sensor-Auslöser)* Binärsensor, der die Isolation auslöst, wenn aktiv. |
| **HVAC-Modus-Auslöser** | *(HVAC-Modus-Auslöser)* Die Gruppenmodi, die die Isolation aktivieren. |
| **Aktivierungs-Verzögerung** | Wartezeit nach Aktivierung des Auslösers, bevor Mitglieder isoliert werden. |
| **Wiederherstellungs-Verzögerung** | Wartezeit nach Deaktivierung des Auslösers, bevor Mitglieder wiederhergestellt werden. |
| **Isolationsaktion** | Was an das Mitglied gesendet wird, wenn die Isolation aktiviert: **HVAC-Modus setzen** (Standard: `off`) oder **Preset-Modus setzen** (z. B. `building_protection` für Fußbodenheizung ohne echten Aus-Modus). |
| **HVAC-Modus** | *(Aktion HVAC-Modus)* Der HVAC-Modus, der beim isolierten Mitglied gesetzt wird (Standard: `off`). |
| **Preset-Modus** | *(Aktion Preset-Modus)* Das Preset, das beim isolierten Mitglied gesetzt wird. Fällt auf `hvac_mode: off` zurück, wenn das Preset vom Gerät nicht unterstützt wird. |

### Mitglieder-Vorlage

| Option | Beschreibung |
|--------|-------------|
| **Bereichs-Vorlage aktivieren** | Aktiviert automatische `heat_cool`-Bereichssteuerung für alle Mitglieder, die `heat_cool` nicht nativ melden. Keine manuelle Auswahl nötig — die Gruppe erkennt geeignete Mitglieder automatisch. |
| **Totzonen-Aktion** | Was zu tun ist, wenn die Raumtemperatur bereits innerhalb des Zielbandes liegt (zwischen `target_temp_low` und `target_temp_high`). **Keine** (Standard — kein Befehl, das Gerät regelt sich selbst auf den bereits erhaltenen Sollwert), **Ausschalten** oder **Nur Lüfter**. |

### Erweiterte Einstellungen

| Option | Beschreibung |
|--------|-------------|
| **Entprellungs-Verzögerung** | Wartezeit vor dem Senden von Befehlen. Höhere Werte verhindern 'Schnellfeuer'-Befehle beim Verschieben von Reglern, fühlen sich aber langsamer an (Standard: 0,5s). |
| **Erzwungene Wiederholung** | Sendet Befehle immer an alle Mitglieder, auch wenn sie bereits den Zielzustand melden. Nützlich für IR-basierte Klimaanlagen oder andere Geräte, die ihren Zustand nach Erhalt eines Befehls möglicherweise nicht zuverlässig aktualisieren. |
| **Wiederholungsversuche** | Anzahl der Wiederholungen bei fehlgeschlagenem Befehl. |
| **Wiederholungs-Verzögerung** | Zeit zwischen Wiederholungen (z. B. 1,0s). |
| **Gestaffelte Befehlsverzögerung** | Wartezeit zwischen einzelnen Befehlen an Gruppenmitglieder (0–2s, Standard: 0). Staffelung verhindert Funküberlastung in großen Zigbee-/Matter-Netzwerken. Gilt auch für Kalibrierungs-Schreibvorgänge. |
| **UI-Schonfrist** | Dauer (Sekunden), für die die Gruppe den befohlenen Wert sofort nach einer UI-Aktion anzeigt, bevor langsame Mitgliedsgeräte ihren Zustand zurückmelden. Verhindert visuelles Flackern im Dashboard. Gilt für alle Attribute: HVAC-Modus, Temperatur, Luftfeuchtigkeit, Lüfter-/Preset-/Schwenk-Modi. |
| **Smart-Sensoren anzeigen** | Erstellt zusätzliche Temperatur- und Feuchtigkeits-Sensor-Entitäten, die den aktuellen aggregierten Zustand der Gruppe widerspiegeln (nützlich für Verlaufsgraphen und Dashboards). |
| **Mitgliederliste anzeigen** | Fügt das `member_entities`-Attribut mit der Liste aller Mitglieds-Entitäts-IDs zur Climate-Group-Helper-Entität hinzu (ermöglicht die Nutzung von `expand()`-Templates). |
| **Konfigurations-Sensor anzeigen** | Erstellt eine diagnostische Konfigurations-Sensor-Entität (`sensor.*_configuration`), die einen portablen JSON-Schnappschuss aller Gruppeneinstellungen unter dem Attribut `settings_json` enthält. |

## Dienste

### `climate_group_helper.boost`

Setzt die Gruppe vorübergehend für eine feste Dauer auf eine Zieltemperatur. Läuft der Timer ab, stellt sich die Gruppe automatisch auf den aktiven Zeitplan-Zeitblock (falls konfiguriert) oder ihren vorherigen Zielzustand zurück.

**Dienst-Felder:**

| Feld | Erforderlich | Beschreibung |
|-------|----------|-------------|
| `temperature` | Nein* | Absolute Zieltemperatur während des Boosts (z. B. `24.0`). |
| `temperature_offset` | Nein* | Relativer Offset, der zur aktuellen Zieltemperatur addiert wird (z. B. `+3.0` oder `−2.0`). |
| `duration` | **Ja** | Dauer in Minuten (Minimum 1). |

*\*Entweder `temperature` oder `temperature_offset` muss angegeben werden.*

Manuelle Änderungen (direkte Gruppenbefehle oder Mirror-Übernahmen) brechen den Boost sofort ab. Lock-Durchsetzung nicht. Der Boost wird ignoriert, während eine Gruppensperre (wie ein offenes Fenster) aktiv ist. Ein Boost rangiert **über** dem Zeitplan und der Bypass-Ebene: Zeitplan-Zeitblock-Änderungen und Bypass-Aktivierungen laufen im Hintergrund weiter, ohne die geboostete Temperatur anzufassen, und alles wird erneut angewendet, sobald der Boost endet. Schaltet der Zeitplan die Gruppe während eines Boosts aus, hält der Boost die Mitglieder in ihrem letzten aktiven Modus am Laufen.

**Beispiel (absolut):**
```yaml
service: climate_group_helper.boost
target:
  entity_id: climate.my_group
data:
  temperature: 24.0
  duration: 30
```

**Beispiel (Offset):**
```yaml
service: climate_group_helper.boost
target:
  entity_id: climate.my_group
data:
  temperature_offset: 3.0
  duration: 30
```

### `climate_group_helper.set_schedule_entity`

Ändert die aktive Zeitplan-Entität einer Gruppe dynamisch. Mit aktivierter Option **Per Dienst geänderte Werte beibehalten (Zeitplan)** übersteht die hier gesetzte Entität einen Neustart.

**Dienst-Felder:**

| Feld | Erforderlich | Beschreibung |
|-------|----------|-------------|
| `schedule_entity` | Nein | Die Entitäts-ID des neuen Zeitplans oder Kalenders (z. B. `schedule.*` oder `calendar.*`). Wenn weggelassen, kehrt die Gruppe zu ihrer konfigurierten Standard-Zeitplan-Entität zurück. |

Wird dieser Dienst ohne Entität aufgerufen, wird ein aktiver Boost abgebrochen und der aktuelle Zeitplan-Zeitblock sofort erneut angewendet.

**Beispiel:**
```yaml
service: climate_group_helper.set_schedule_entity
target:
  entity_id: climate.my_group
data:
  schedule_entity: schedule.guest_mode
```

### `climate_group_helper.set_schedule_bypass_entity`

Ändert die aktive Bypass-Zeitplan-Entität einer Gruppe zur Laufzeit dynamisch. Der Bypass-Zeitplan fungiert als Prioritätsebene, die den Basis-Zeitplan überschreibt. Während ein Bypass aktiv ist, verfolgt die Gruppe den Basis-Zeitplan weiterhin im Hintergrund; endet der Bypass, wird der aktuell gültige Basis-Zustand wiederhergestellt (Attribute, die nur der Bypass geändert hat, fallen auf ihre Werte vor dem Bypass zurück). Mit aktivierter Option **Per Dienst geänderte Werte beibehalten (Zeitplan)** übersteht die hier gesetzte Entität einen Neustart.

**Dienst-Felder:**

| Feld | Erforderlich | Beschreibung |
|-------|----------|-------------|
| `schedule_entity` | Nein | Die Entitäts-ID des neuen Bypass-Zeitplans oder -Kalenders (z. B. `schedule.*` oder `calendar.*`). Wenn weggelassen, kehrt die Gruppe zu ihrer konfigurierten Standard-Bypass-Zeitplan-Entität zurück. |

**Beispiel:**
```yaml
service: climate_group_helper.set_schedule_bypass_entity
target:
  entity_id: climate.my_group
data:
  schedule_entity: calendar.holiday_schedule
```

Wird dieser Dienst ohne Entität aufgerufen, wird der Bypass-Zeitplan gelöscht und der aktuelle Zeitplan-Zeitblock sofort erneut angewendet.

### `climate_group_helper.set_schedule_fallback_payload`

Setzt oder löscht den Fallback-Zustand, der angewendet wird, wenn der Zeitplan inaktiv ist (siehe „Fallback bei inaktivem Zeitplan" oben), zur Laufzeit — ohne die Gruppeneinstellungen zu bearbeiten. Nützlich für saisonale Sollwert-Änderungen oder Automatisierungen. Mit aktivierter Option „Per Dienst geänderte Werte beibehalten (Zeitplan)" bleibt der gesetzte Fallback-Zustand auch nach einem Neustart erhalten.

**Dienst-Felder:**

| Feld | Erforderlich | Beschreibung |
|-------|----------|-------------|
| `fallback_payload` | Nein | Der neue Fallback-Zustand im gleichen YAML-Format wie die Einstellung „Fallback bei inaktivem Zeitplan" (z. B. `temperature: 17.0`, `hvac_mode: heat`). Wenn weggelassen oder leer, kehrt die Gruppe zu ihrem konfigurierten Fallback-Zustand zurück. |

**Beispiel:**
```yaml
service: climate_group_helper.set_schedule_fallback_payload
target:
  entity_id: climate.my_group
data:
  fallback_payload: |
    temperature: 19.0
    hvac_mode: heat
```

### `climate_group_helper.apply_config`

Wendet eine portable JSON-Konfiguration auf eine Gruppe an. Nützlich, um Logikeinstellungen zwischen Gruppen zu kopieren oder eine Sicherung von einem Konfigurationssensor wiederherzustellen.

**Dienst-Felder:**

| Feld | Erforderlich | Beschreibung |
|-------|----------|-------------|
| `settings` | **Ja** | Ein JSON-Objekt mit der Konfiguration. Quelle: Attribut `settings_json` eines Konfigurationssensors. |
| `include_member_list` | **Ja** | Wenn `true`, überschreibt die Mitgliederliste, die Master-Entität und die Heiz-/Kühl-Rollenzuweisung pro Gerät. |
| `include_entity_selectors` | **Ja** | Wenn `true`, überschreibt verknüpfte Sensoren und Offsets pro Mitglied. |

Standardmäßig werden nur Logikeinstellungen übertragen (Sync-Modi, Fenstersteuerung, Zeitpläne usw.). Setze die beiden Einschluss-Flags auf `true`, wenn du auch die Mitgliederliste und deren verknüpfte Sensoren kopieren möchtest. Der Gruppenname bleibt immer erhalten.

> [!IMPORTANT]
> **Neuladeverhalten:** Der Aufruf dieses Dienstes löst ein vollständiges Neuladen der Gruppen-Entität aus. Alle aktiven, nicht persistierten Timer (z. B. Boost, Fenster-Verzögerungen) werden sofort zurückgesetzt. Dies ist dasselbe Verhalten wie bei Änderungen über die UI.

## Sicherung & Migration

Die Integration bietet eingebaute Möglichkeiten, deine Logikeinstellungen zu sichern, wiederherzustellen und zu klonen.

*   **Konfigurations-Sensor:** Aktiviere **Konfigurations-Sensor anzeigen** (Erweiterte Einstellungen), um eine diagnostische `sensor`-Entität zu erstellen. Ihr Attribut `settings_json` enthält einen portablen Schnappschuss aller Logikeinstellungen.
*   **Diagnose-Download:** Klicke direkt im Panel **Geräteinfo** (oder über das ⋮-Menü der Integration) auf **Diagnose herunterladen**.

**Beispiel — Einstellungen von einer Gruppe in eine andere kopieren:**
1. Aktiviere den Konfigurationssensor an der **Quell**-Gruppe.
2. Rufe den Dienst `apply_config` an der **Ziel**-Gruppe auf:

```yaml
service: climate_group_helper.apply_config
target:
  entity_id: climate.bedroom_group
data:
  settings: "{{ state_attr('sensor.living_room_group_configuration', 'settings_json') }}"
  include_member_list: false
  include_entity_selectors: false
```

## Installation

### Über HACS (Empfohlen)
1. Öffne **HACS**.
2. Suche nach **Climate Group Helper**.
3. Klicke auf **Herunterladen**
4. **Home Assistant neu starten**.

### Manuell
1. Lade das [neueste Release](https://github.com/bjrnptrsn/climate_group_helper/releases) herunter.
2. Kopiere `custom_components/climate_group_helper` in deinen `custom_components`-Ordner.
3. **Home Assistant neu starten**.

## Einrichtung

1. Gehe zu **Einstellungen** > **Geräte & Dienste** > **Helfer**.
2. Klicke auf **+ Helfer erstellen** > **Climate Group Helper**.
3. Folge dem Konfigurationsdialog, um deine Entitäten hinzuzufügen.

**Um alle Funktionen freizuschalten:** Öffne das **Konfiguration**-Menü der Gruppe und aktiviere **Erweiterter Modus** in den allgemeinen Einstellungen. Dies zeigt alle kategoriespezifischen Optionen an.

## Fehlerbehebung

### Probleme nach einem Update?
Falls du nach einem Update seltsames Verhalten bemerkst (z. B. Einstellungen werden nicht gespeichert), versuche zuerst, Home Assistant neu zu starten. Ein Neuerstellen der Gruppe löst in der Regel verbleibende migrationsbedingte Probleme.

### Debug-Protokollierung

#### Option 1: Über die UI (Sofort)
1. Gehe zu **Einstellungen** > **Geräte & Dienste** > **Geräte**.
2. Suche nach deiner **Climate Group** und klicke darauf.
3. Klicke im Panel **Geräteinfo** auf den Link **Climate Group Helper** (neben dem Symbol).
4. Klicke auf der Integrationsseite auf das **⋮-Menü** (oben rechts) und wähle **Debug-Protokollierung aktivieren**.
5. Reproduziere das Problem und deaktiviere dann die Protokollierung. Die Datei wird automatisch heruntergeladen.
   *(Hinweis: Bei startbedingten Problemen HA nach dem Aktivieren der Protokollierung neu starten.)*

#### Option 2: Über YAML (Manuell)
Füge dies zu deiner `configuration.yaml` hinzu (erfordert Neustart):

```yaml
logger:
  default: info
  logs:
    custom_components.climate_group_helper: debug
```

#### Log teilen
Idealerweise teilst du die vollständige Log-Datei. Möchtest du keine unbeteiligten Daten teilen, kannst du sie auf nur die Einträge der Integration reduzieren:

```bash
grep 'climate_group_helper' home-assistant.log > cgh.log
```

## Mitwirken

Einen Fehler gefunden oder eine Idee? [Erstelle ein Issue](https://github.com/bjrnptrsn/climate_group_helper/issues) auf GitHub.

## Lizenz

MIT-Lizenz
