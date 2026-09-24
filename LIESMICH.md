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
  🔄 <b>Auf manuelle Änderungen reagieren</b> mit Mirror-, Lock-, Master- oder „Nur übernehmen“-Sync-Modi.<br>
  🪟 <b>Offene Fenster erkennen</b>, um das Heizen automatisch zu pausieren.<br>
  👤 <b>Anwesenheit automatisieren</b> mit Abwesenheits-Offsets und -Temperaturen.<br>
  📅 <b>Zeitplan-Automatisierung</b> über Schedule- und Kalender-Entitäten.<br>
  🎯 <b>Eigene Presets festlegen</b>, die die ganze Gruppe auf einmal einstellen.<br>
  🔥 <b>Temperatur boosten</b> für eine Weile, danach automatisch zurück.<br>
  🚧 <b>Einzelne Geräte isolieren</b>, solange eine Bedingung zutrifft.<br>
  🧩 <b>Einen Heiz-/Kühlbereich ergänzen</b> für Einzel-Sollwert-Geräte mit der Bereichsvorlage.<br>
  ➕ <b>Die ganze Gruppe verschieben</b> mit einem einzigen Offset.
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
  - [Gruppen-Presets](#gruppen-presets)
  - [Mitglieder-Offsets](#mitglieder-offsets)
  - [Mitglieder-Isolation](#mitglieder-isolation)
  - [Mitglieder-Vorlage](#mitglieder-vorlage)
- [Beispiele](BEISPIELE.md)
- [Verwaltungs-Entitäten (Schalter & Regler)](#verwaltungs-entitäten-schalter--regler)
  - [Hauptschalter](#hauptschalter)
  - [Gruppen-Offset](#gruppen-offset)
- [Lovelace-Karte](#lovelace-karte)
- [Was die Gruppe über sich selbst berichtet](#was-die-gruppe-über-sich-selbst-berichtet)
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

Bestimme ein einzelnes Klima-Mitglied als **Referenzpunkt** oder **Anführer** der Gruppe. Er wird im Abschnitt **Mitglieder & Modi** festgelegt und erfordert den **Erweiterten Modus** — einmal gesetzt, schaltet er zusätzliche Optionen in mehreren Abschnitten frei (Sync-Modus, Fenstersteuerung sowie Temperatur-/Feuchtigkeits-Mittelung).

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
  | **Nur übernehmen** | Übernehmen ² | Ignorieren |

  - *¹ Mit aktiviertem **Respektiere Aus-Status der Mitglieder (Sync)**: Mitglieder, die manuell `aus` geschaltet wurden, werden in Ruhe gelassen — ihr `aus` wird weder gespiegelt noch zurückgesetzt.*
  - *² **Nur übernehmen** passt die Einstellungen der Gruppe an das geänderte Gerät an, gibt die Änderung aber nie an die anderen Mitglieder weiter. Ein `aus` geschaltetes Gerät schaltet die ganze Gruppe erst dann `aus`, wenn kein anderes Mitglied mehr läuft — unabhängig von der Option **Respektiere Aus-Status der Mitglieder (Sync)**.*

* **Sync-Attribute**

  Mit Sync-Attributen kannst du bestimmte Attribute wie `hvac_mode`, `temperature`, `preset_mode` für die Synchronisation auswählen. Die Bedeutung ausgewählter oder nicht ausgewählter Attribute hängt vom **Sync-Modus** ab:

  | Modus | Rolle der **Sync-Attribute** |
  |---|---|
  | **Mirror** | **ausgewählte** Attribute werden gespiegelt, **nicht ausgewählte** Attribute werden ignoriert. |
  | **Lock** | **ausgewählte** Attribute werden zurückgesetzt, **nicht ausgewählte** Attribute werden ignoriert. |
  | **Mirror/Lock** | **ausgewählte** Attribute werden gespiegelt, **nicht ausgewählte** Attribute werden zurückgesetzt. |
  | **Master/Lock** | **ausgewählte** Attribute werden von der **Master-Entität** gespiegelt, **nicht ausgewählte** Attribute werden ignoriert. Änderungen von Nicht-Master-Geräten werden immer zurückgesetzt. |
  | **Nur übernehmen** | **ausgewählte** Attribute werden in die Einstellungen der Gruppe übernommen, **nicht ausgewählte** Attribute werden ignoriert. An die anderen Mitglieder wird nichts gesendet. |

*  **Respektiere Aus-Status der Mitglieder (Sync):** Wenn ein Mitglied manuell `aus` geschaltet wird, spiegelt die Gruppe dieses `aus` weder auf andere, noch erzwingt sie es zurück — das Mitglied wird einfach in Ruhe gelassen. Die eine Ausnahme: Wenn es das *letzte* aktive Mitglied ist, akzeptiert die Gruppe das `aus`, und ihr eigenes Ziel wechselt ebenfalls auf `aus`.

### Fenstersteuerung

Schaltet die Heizung automatisch aus oder setzt eine Frostschutztemperatur, wenn Fenster oder Türen geöffnet werden, und stellt den vorherigen Zustand beim Schließen wieder her. Während Fenster geöffnet sind, werden manuelle Änderungen blockiert. Unterstützt Binärsensoren und Rollladen-/Fensterentitäten (Cover).

*   **Raum- + Zonensensoren:** Kombiniert einen schnell reagierenden Raumsensor mit einem langsam reagierenden Zonensensor (z. B. für eine ganze Etage). Der Raum ist Teil der Zone: Werden beide genutzt, **muss der Zonensensor den Raumsensor enthalten** (nimm den Raumsensor in die Zonen-Gruppe auf). Sonst gelten die eingestellten Verzögerungen nicht mehr.
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

*   **Aus-Zustand der Mitglieder respektieren (Anwesenheit):** Selbst ausgeschaltete Geräte bleiben in Ruhe — beim Verlassen, bei der Rückkehr oder in beiden Fällen, je nach Auswahl. Das gilt nicht bei der Abwesenheits-Aktion **Ausschalten**: dort hat die Gruppe die Geräte selbst ausgeschaltet und schaltet sie bei der Rückkehr alle wieder ein.

### Zeitplan-Automatisierung

Integriere native HA-`schedule`- oder `calendar`-Helfer, um deine Klimaeinstellungen pro Zeitblock zu automatisieren. Du kannst Temperatur und HVAC-Modus direkt in den Daten des Zeitplans festlegen, und die Gruppe handhabt Übergänge intelligent: Wenn eine Zeitplanänderung eintritt, während die **Fenstersteuerung** aktiv ist (z. B. die Heizung pausiert ist), wird das neue Ziel sofort angewendet, sobald alles geschlossen ist.

Zeitpläne können per Dienst live umgeschaltet werden (z. B. für "Urlaub"- oder "Gäste"-Modi). Wird der Dienst ohne Entität aufgerufen, setzt er auf den konfigurierten Standard zurück und wendet den aktuellen Zeitblock erneut an.

*   **Kalender-Unterstützung:** `calendar.*`-Entitäten funktionieren genauso wie `schedule.*`-Entitäten. Die Zeitblock-Daten werden aus dem **Beschreibungsfeld** jedes Ereignisses gelesen, im selben `key: value`-YAML-Format wie die zusätzlichen Zeitplan-Daten. Siehe [Zeitplan-Konfiguration & Meta-Keys](#zeitplan-konfiguration--meta-keys) für Details.
*   **Bypass-Ebene:** Eine zweite `schedule.*`- oder `calendar.*`-Entität kann als **Prioritätsebene** über deinem Haupt-Zeitplan fungieren. Ist ein Bypass-Zeitblock aktiv, überschreiben dessen Attribute den Haupt-Zeitblock (Bypass gewinnt bei Konflikten).
*   **Fallback bei inaktivem Zeitplan:** Ein optionaler Zustand (z. B. Nachtabsenkung oder Ausschalten), der außerhalb der aktiven Zeitblöcke für den Haupt-Zeitplan einspringt — lückenlose 24/7-Zeitpläne sind damit unnötig. Die Bypass-Ebene arbeitet unverändert weiter und überschreibt ihn, solange sie aktiv ist.
*   **Per Dienst geänderte Werte beibehalten (Zeitplan):** Stellt sicher, dass per Dienst geänderter Haupt-Zeitplan, Bypass-Entität und Fallback-Zustand einen Home-Assistant-Neustart überstehen. Wenn deaktiviert, kehrt die Gruppe nach einem Neustart immer zu ihren konfigurierten Standardwerten zurück.
*   **Respektiere Aus-Status der Mitglieder (Zeitplan):** Mitglieder, die manuell `aus` geschaltet wurden, werden bei geplanten Änderungen übersprungen — sie werden nicht zurück eingeschaltet.
*   **Manuelle Haltezeit:** Eine manuelle Anpassung (Temperaturänderung oder die Gruppe von Hand ein-/ausschalten) hält für eine konfigurierbare Dauer, danach übernimmt der Zeitplan wieder mit dem *dann* aktuellen Zeitblock. Eine Dauer von `0` deaktiviert die Haltezeit — der Zeitplan übernimmt sofort wieder. Setzt du den Zeitplan mit dem Reset-Dienst zurück, endet eine laufende Haltezeit vorzeitig.

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
| `window_mode` | `disabled` | `window_mode: disabled` | Pausiert die **Fenstersteuerung** für die Dauer des Zeitblocks — ein offenes Fenster schaltet die Heizung nicht mehr aus. Steht ein Fenster beim Start des Zeitblocks bereits offen, geht die Heizung wieder an. |
| `presence_mode` | `disabled`, `away` | `presence_mode: disabled` | Pausiert die **Anwesenheitssteuerung** für die Dauer des Zeitblocks. `disabled` lässt die Heizung laufen, unabhängig davon, was die Sensoren melden (Gäste, Vorheizen); `away` erzwingt für den gesamten Zeitblock das Abwesenheitsverhalten, ebenfalls unabhängig von den Sensoren (Urlaub). |
| `calibration_mode` | `disabled` | `calibration_mode: disabled` | Pausiert die **Kalibrierung** für die Dauer des Zeitblocks — es werden keine Kalibrierwerte an die Geräte geschrieben. Am Zeitblock-Ende wird der aktuelle Wert einmal geschrieben, damit die Geräte wieder aktuell sind. |
| `isolation_bypass` | `all`, eine Regelnummer oder eine Liste davon | `isolation_bypass: 2` | Pausiert die genannten Regeln der **Mitglieder-Isolation** für die Dauer des Zeitblocks, sodass deren Geräte mitheizen. Die Regeln sind nach ihrer Position in den Einstellungen nummeriert (1–4); `all` pausiert alle Regeln. Ein Gerät, das von zwei Regeln erfasst wird, bleibt aus, solange die nicht pausierte Regel weiterhin greift. |

Die letzten vier Schlüssel **pausieren** eine Funktion, sie schalten nie eine ein.
Eine in den Einstellungen ausgeschaltete Funktion hat nichts laufen, was ein
Zeitblock übernehmen könnte — deshalb ist `disabled` der einzige Wert, den sie
akzeptieren, abgesehen von `away`, das das Abwesenheitsverhalten erzwingt statt
etwas zu erschaffen. Endet ein Zeitblock, werden die Sensoren frisch gelesen und
übernehmen wieder in beide Richtungen: ein weiterhin offenes Fenster schaltet die
Heizung erneut aus, ein weiterhin leerer Raum startet das Abwesenheitsverhalten.

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

#### Fallback bei inaktivem Zeitplan

Konfiguriere einen optionalen Fallback-Zustand in YAML unter den Einstellungen der Gruppe (**Zeitplan-Automatisierung** > **Fallback-Zustand bei inaktivem Haupt-Zeitplan / Kalender (YAML)**). Dieser Zustand wird automatisch angewendet, wenn der Zeitplan aus ist oder kein Kalenderereignis aktiv ist — ganz ohne lückenlose 24/7-Zeitpläne. Er verwendet dasselbe Format wie ein Zeitblock.

**Beispiel (Fallback bei inaktivem Zeitplan — z. B. Nachtabsenkung):**
```yaml
hvac_mode: heat
temperature: 17.0
```

Um die Gruppe außerhalb der aktiven Zeitblöcke abzuschalten, setze hier `hvac_mode: off` — nicht den `turn_off`-Meta-Key. Nur ein ausdrückliches `turn_off: false` löst diese Sperre wieder, und auf den Fallback folgt kein Zeitblock, der das tun könnte — der nächste Heiz-Zeitblock bliebe blockiert.

### Gruppen-Presets

Definiere eigene benannte Presets für die Gruppe — z. B. `eco`, `guest` oder `ventilate` — jedes davon einer Reihe von Climate-Attributen (Solltemperatur, HVAC-Modus, Lüfterstufe, Schwenkmodus) in YAML zugeordnet. Wählst du eines dieser Presets aus, werden seine Attribute sofort auf die Gruppe und alle Mitglieder angewendet — genauso, als würdest du die Temperatur oder den HVAC-Modus direkt ändern. Das ist eine schlanke Alternative zum Master-Preset-Muster für Gruppen, die keine eigene Master-Entität benötigen.

**Beispiel (Gruppen-Presets Konfiguration):**
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

*   **Hat Vorrang vor Geräte-Presets:** Teilt sich ein Gruppen-Preset einen Namen mit einem Preset, das ein Mitgliedsgerät nativ anbietet (z. B. beide heißen `eco`, wie oben), wird die eigene Definition der Gruppe verwendet — die Version des Geräts wird nie gesendet. Die Einstellungsseite warnt dich in diesem Fall, damit du eines der beiden umbenennen kannst.
*   **Verlässt die Gruppe, sobald du abweichst:** Änderst du ein Attribut, das das aktive Preset festlegt — an der Gruppe, per Zeitplan oder direkt an einem Mitglied unter Mirror-Sync — kehrt die Gruppe in ihren normalen, presetlosen Zustand zurück. Änderst du ein Attribut, das das Preset nicht berührt, bleibt es aktiv.

**Presets können auch Automatikfunktionen pausieren.** Ein Preset darf dieselben Pausier-Schlüssel tragen wie ein Zeitblock (`window_mode`, `presence_mode`, `calibration_mode`, `isolation_bypass` sowie `sync_mode`, `sync_attributes` und `group_offset` — siehe die Meta-Schlüssel-Tabelle weiter oben). Sie gelten, solange das Preset ausgewählt ist, und werden beim Verlassen wieder aufgehoben:

```yaml
party:
  temperature: 21.5
  window_mode: disabled     # die Terrassentür darf offen stehen
  presence_mode: disabled   # die Heizung bleibt an, unabhängig von den Sensoren
wellness:
  temperature: 23.0
  isolation_bypass: 2       # das Gerät der zweiten Isolationsregel darf mitheizen
```

*   **Ein Preset darf auch nur aus Pausier-Schlüsseln bestehen** — ein „Lüften"-Preset, das ausschließlich verhindert, dass die Fenstersteuerung die Heizung abschaltet, ist eine gültige Definition.
*   **Wollen ein Zeitblock und ein Preset dasselbe, gewinnt das Preset**, und der Wert des Zeitblocks kommt zurück, sobald du das Preset verlässt. Das gilt in beide Richtungen: Endet der Zeitblock, hebt das nicht auf, was das Preset angefordert hat.
*   **`turn_off` ist der einzige Schlüssel, den Presets nicht nutzen können** — Presets setzen Temperaturen und Modi; der Hauptschalter bleibt dir und dem Zeitplan vorbehalten.

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

#### Bereichsvorlage

Übersetzt ausgehende `heat_cool`-Bereichsbefehle in Einzel-Sollwert-Befehle für Mitglieder, deren HA-Integration nur ein einzelnes `temperature`-Attribut bereitstellt, obwohl das zugrunde liegende Gerät physisch automatischen Wechsel unterstützt. Die Gruppe stellt `target_temp_low` und `target_temp_high` bereit; jedes umhüllte Mitglied erhält basierend auf der aktuellen Raumtemperatur einen physischen Einzel-Sollwert-Befehl:

*   Temperatur **unter** `target_temp_low` → sendet `heat` + unteren Sollwert
*   Temperatur **über** `target_temp_high` → sendet `cool` + oberen Sollwert
*   Temperatur **innerhalb** des Bandes → sendet die konfigurierte **Totzonen-Aktion**

*   **Totzonen-Aktion:** Was zu tun ist, wenn sich der Raum bereits innerhalb des Zielbandes befindet: **Keine** (Standard), **Ausschalten** oder **Nur Lüfter**.
*   **Im Totband entfeuchten:** Wenn aktiviert, schaltet die Gruppe Geräte im Temperatur-Totband automatisch auf **Trocknen** (oder **Nur Lüfter**), wenn die aktuelle Luftfeuchtigkeit die Zielfeuchtigkeit überschreitet. Aktivierung erfolgt sofort; eine Schmitt-Trigger-Hysterese und eine konfigurierbare Deaktivierungsverzögerung verhindern schnelles Takten. Temperatur-Heizen und -Kühlen haben immer Vorrang, sobald der Raum das Totband verlässt. Ein Feuchtigkeitswert ist Voraussetzung — entweder von einem Mitglied, das ihn meldet, oder von einem der Gruppe hinzugefügten Feuchtigkeitssensor; ohne ihn bietet die Gruppe keine einstellbare Zielfeuchtigkeit an.
*   **Automatische Mitgliedserkennung:** Alle Mitglieder, die `heat_cool` **nicht** nativ melden, werden automatisch erfasst — keine manuelle Auswahl nötig. Mitglieder mit nativer `heat_cool`-Unterstützung bleiben unverändert. Dies ermöglicht auch den `heat_cool`-Modus für Gruppen, die ausschließlich aus reinen Heiz- und Kühlgeräten bestehen, ganz ohne natives `heat_cool`-Gerät.
*   **Erfasste Geräte folgen der Gruppe:** Ein von Hand geänderter Modus oder Sollwert an einem erfassten Gerät wird auf das zurückgesetzt, was der Bereich verlangt, unabhängig vom Sync-Modus — um ihn zu ändern, änderst du den Bereich der Gruppe.

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

## Lovelace-Karte

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/card_demo.png" alt="Climate-Group-Helper-Karte neben ihrem Editor" width="700"/>
</p>

Die Integration bringt eine eigene Dashboard-Karte mit. Füge sie wie jede andere
Karte hinzu — sie erscheint im Karten-Picker als **Climate Group Helper Card**
und braucht weder einen zusätzlichen Resource-Eintrag noch ein separates
Repository.

*   **Steuert** die üblichen Klimaeinstellungen: Modus, Temperatur, Luftfeuchte, Preset, Lüfter und Schwenk.
*   **Zeigt**, was Climate Group Helper gerade tut: den aktiven Blocker und seit wann, Boost- und Hold-Countdowns, die Mitglieder sowie isolierte oder außerhalb des Bereichs liegende Geräte. Das ist reine Anzeige — Hauptschalter, Offset und Boost bedienst du über die eigenen Entitäten der Gruppe und die Dienste.
*   **Badges** leuchten, solange eine Funktion eingreift, und werden grau, solange ein Zeitblock oder ein Preset sie pausiert; der größere Mitglieder-Punkt ist das Master-Gerät.
*   **Der Demo-Modus** füllt die Karte mit erfundenen Daten, damit du ohne Einrichtung siehst, was sie alles anzeigen kann.

## Was die Gruppe über sich selbst berichtet

Über die üblichen Klimawerte hinaus veröffentlicht die Gruppe ihren eigenen Zustand als Attribute — was sie gerade beabsichtigt, warum sie handelt oder eben nicht, und wie ihre Geräte dastehen. Du findest sie im Dialog „Mehr Details" unter **Attribute**, kannst sie auf einem Dashboard anzeigen oder in einer Automatisierung abfragen.

Die meisten erklären sich selbst. Diese hier sind es wert, sie zu kennen:

### Welche Geräte auseinanderlaufen

Zwei Heizkörper im Wohnzimmer, einer auf 21°, der andere auf 23°: Die Gruppe zeigt als Zieltemperatur den Durchschnitt, und dieser Zahl sieht man nicht an, dass die Geräte auseinandergelaufen sind. Genau das listet `member_divergence` auf — je Einstellung, welches Gerät auf welchem Wert steht:

```yaml
member_divergence:
  temperature:
    climate.wohnzimmer_links: 21.0
    climate.wohnzimmer_rechts: 23.0
```

Sind sich alle einig, ist es leer. Zwei Details machen es verlässlich:

*   **Isolierte und offline Geräte bleiben außen vor.** Ein isoliertes Gerät soll abweichen — würde es mitzählen, meldete die Gruppe eine Abweichung, solange die Isolation dauert.
*   **Mitglieder-Offsets werden berücksichtigt.** Sind Offsets konfiguriert, wird auf der logischen Einstellung verglichen, während die aufgeführten Werte die tatsächlichen der Geräte bleiben. Zwei Thermostate mit +1 und −1 gelten deshalb als einig — dieser Unterschied ist ja genau der gewünschte.

### Warum die Gruppe nicht das tut, was du erwartest

*   **`blocking_sources`** — vorhanden, sobald etwas die Gruppe zurückhält, samt Angabe wodurch: `window`, `presence`, `switch`. Solange dort etwas steht, erreichen Befehle die Geräte nicht. Blockiert nichts, fehlt das Attribut.
*   **`blocking_reason`** — von allem, was dort steht, das, was gerade den Ausschlag gibt, und seit wann (`source` und `since`): Der Hauptschalter geht einem Fenster vor, ein Fenster der Anwesenheitssteuerung. Nach einem Neustart von Home Assistant zählt die Zeit ab dem Neustart. Blockiert nichts, fehlt das Attribut.
*   **`main_switch_entity_id`** — der Hauptschalter der Gruppe, damit ein Dashboard oder eine Automation ihn findet, ohne seinen Namen raten zu müssen. Nur im erweiterten Modus.
*   **`isolated_members`** — Geräte, die eine Isolationsregel gerade ausschließt. Sie behalten ihren eigenen Zustand und bleiben aus den Werten der Gruppe heraus.
*   **`oob_members`** — Geräte, die dem letzten Ziel nicht folgen konnten, weil es außerhalb ihres eigenen Temperaturbereichs liegt.
*   **`master_entity_id`** — welches Gerät gerade als Master-Entität der Gruppe festgelegt ist. Nur vorhanden, wenn eine konfiguriert ist.
*   **`master_fallback_active`** — die konfigurierte Master-Entität ist nicht verfügbar und die Gruppe rechnet ohne sie.

### Was die Gruppe vorhat und woher es kam

*   **`target_state`** — die Einstellungen, die die Gruppe für ihre Geräte vorhält. Genau dorthin wird zurückgestellt, wenn ein Fenster schließt oder eine Isolation endet; übersteht Neustarts.
*   **`last_source`, `last_entity`, `last_changed`** — was den Zielzustand zuletzt geändert hat: ein Zeitplan, ein direkter Befehl, ein Gerät unter Mirror-Sync — und wann.
*   **`last_active_hvac_mode`** — der letzte Modus außer `off`. Damit werden Geräte geweckt, wenn ein Boost auf einer ausgeschalteten Gruppe startet.
*   **`active_member_count` / `total_member_count`** — wie viele Geräte tatsächlich laufen, von wie vielen konfigurierten.

### Was gerade in Kraft ist

Alles in dieser Gruppe außer `enabled_features` setzt den erweiterten Modus voraus — ohne ihn gibt es diese Funktionen nicht und damit auch ihre Attribute nicht.

*   **`enabled_features`** — welche Funktionen überhaupt konfiguriert sind (`window`, `presence`, `schedule`, `sync`, `isolation`, `range_template`, `calibration`, `master`), damit ein Dashboard „aus" von „nicht eingerichtet" unterscheiden kann.
*   **`effective_sync_mode` / `effective_sync_attributes`** — die Sync-Einstellungen, die *jetzt gerade* gelten, inklusive einer vorübergehenden Übersteuerung durch Zeitplan-Slot oder Preset — nicht zwingend das, was die Einstellungsseite zeigt.
*   **`config_overrides`** — die Pausen-Schlüssel, die ein Slot oder Preset gerade anwendet.
*   **`active_schedule_slot_title`** — der Titel des laufenden Kalendereintrags, wenn ein Kalender den Zeitplan steuert.
*   **`active_virtual_preset`** — das aktive Gruppen-Preset, falls eines gewählt ist.
*   **`boost_temperature` / `boost_until`** — Sollwert und Endzeit eines laufenden Boosts.
*   **`schedule_hold_until`** — wann eine manuelle Änderung aufhört zu halten und der Zeitplan wieder übernimmt. Fehlt, wenn nichts hält.

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
| **Sync-Modus** | Was zu tun ist, wenn ein Mitglied außerhalb der Gruppe geändert wird. **Deaktiviert**: alles ignorieren. **Mirror**: Änderungen spiegeln. **Lock**: Änderungen zurücksetzen. **Mirror/Lock**: ausgewählte Attribute spiegeln, nicht ausgewählte zurücksetzen. **Master/Lock** *(erfordert Master-Entität)*: nur Änderungen der **Master-Entität** spiegeln, Änderungen von Nicht-Master-Entitäten zurücksetzen. **Nur übernehmen**: die Gruppe an das geänderte Gerät anpassen, ohne die anderen anzufassen. |
| **Sync-Attribute** | Auf welche Attribute der Modus wirkt. Bei **Mirror**: nur ausgewählte Attribute werden gespiegelt, nicht ausgewählt = keine Aktion. Bei **Lock**: nur ausgewählte Attribute werden zurückgesetzt, nicht ausgewählt = keine Aktion. Bei **Mirror/Lock**: ausgewählte Attribute werden gespiegelt, nicht ausgewählte zurückgesetzt. Bei **Master/Lock**: nur die Attribute der Master-Entität werden gespiegelt, nicht ausgewählt = keine Aktion. Bei **Nur übernehmen**: nur ausgewählte Attribute werden in die Gruppe übernommen, nicht ausgewählt = keine Aktion. |
| **Respektiere Aus-Status der Mitglieder (Sync)** | Mitglieder, die manuell `aus` geschaltet wurden, werden in Ruhe gelassen. Ihr `aus`-Zustand wird weder auf andere gespiegelt noch auf das Gruppenziel zurückgesetzt. Ausnahme: Ist es das letzte aktive Mitglied, wechselt die Gruppe selbst auf `aus` (Last Man Standing). Direkte Gruppenbefehle erreichen unabhängig von dieser Einstellung immer alle Mitglieder. |

### Fenstersteuerung

| Option | Beschreibung |
|--------|-------------|
| **Fenster-Aktion** | **Ausschalten** (Standard) oder **Temperatur setzen**. Nützlich für Frostschutz. |
| **Manuelle Änderungen übernehmen** | **Aus** (alle blockieren), **Alle** (passives Tracking für alle Mitglieder) oder **Nur Master** *(erfordert Master-Entität)*. |
| **Fenster-Temperatur** | Zieltemperatur, die bei Aktion "Temperatur setzen" gesetzt wird. |
| **Raumsensor** | (Optional) Binärsensor (Fenster/Tür) oder Cover-Entität für schnelle Reaktion. Cover gelten als "offen", solange sie nicht vollständig geschlossen sind. |
| **Zonensensor** | (Optional) Binärsensor oder Cover-Entität für langsame Reaktion (z. B. Wohnung oder Etage). Muss den Raumsensor enthalten, wenn beide genutzt werden. |
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
| **Aus-Zustand der Mitglieder respektieren (Anwesenheit)** | Lässt ausgeschaltete Geräte in Ruhe — **Deaktiviert** (Standard), **Beim Verlassen**, **Bei der Rückkehr** oder **Beim Verlassen und bei der Rückkehr**. Gilt nicht bei der Abwesenheits-Aktion **Ausschalten**, da die Gruppe die Geräte dort selbst ausgeschaltet hat. Anders als bei der Sync- und Zeitplan-Variante dieser Option greift sie auch, wenn *alle* Geräte aus sind. |

### Zeitplan-Automatisierung

| Option | Beschreibung |
|--------|-------------|
| **Zeitplan-Entität** | Eine Home-Assistant-`schedule.*`- oder `calendar.*`-Entität zur Steuerung der Gruppe. |
| **Fallback-Zustand bei inaktivem Haupt-Zeitplan / Kalender (YAML)** | *(Optional)* Zustand, der außerhalb der aktiven Zeitblöcke für den Haupt-Zeitplan einspringt (z. B. Nachtabsenkung oder vollständiges Ausschalten). Die Bypass-Ebene überschreibt ihn, solange sie aktiv ist. |
| **Bypass-Entität** | *(Optional)* Eine zweite `schedule.*`- oder `calendar.*`-Entität, die als Prioritätsebene fungiert. Ist ein Bypass-Zeitblock aktiv, überschreibt er den Haupt-Zeitplan. |
| **Respektiere Aus-Status der Mitglieder (Zeitplan)** | Mitglieder, die manuell `aus` geschaltet wurden, werden bei geplanten Änderungen übersprungen — sie werden nicht zurück eingeschaltet. Direkte Gruppenbefehle erreichen unabhängig von dieser Einstellung immer alle Mitglieder. |
| **Per Dienst geänderte Werte beibehalten (Zeitplan)** | Behält Haupt-Zeitplan, Bypass-Entität und Fallback-Zustand über Neustarts hinweg bei, wenn sie über einen Dienst geändert wurden. Ohne diese Option kehrt die Gruppe nach einem Neustart immer zu ihren konfigurierten Standardwerten zurück. |
| **Manuelle Haltezeit** | Wie lange eine manuelle Anpassung (Temperatur oder die Gruppe von Hand ein-/ausschalten) hält, bevor der Zeitplan mit dem dann aktuellen Zeitblock wieder übernimmt. `0` deaktiviert die Haltezeit. |

### Gruppen-Presets

| Option | Beschreibung |
|--------|-------------|
| **Gruppen-Presets (YAML)** | Definiert benannte Presets für die Gruppe als YAML-Mapping, jedes mit einer eigenen Reihe von Climate-Attributen (z. B. `eco:` mit `temperature: 18.0` und `hvac_mode: heat`). Die Auswahl eines Presets wendet seine Attribute auf die Gruppe und alle Mitglieder an. Stimmt ein Name mit einem Preset überein, das ein Mitgliedsgerät bereits nativ anbietet, warnt die Einstellungsseite und die eigene Definition der Gruppe wird verwendet. |
| **Per Dienst geänderte Werte beibehalten (Presets)** | Behält per Dienst angelegte oder geänderte Presets nach einem Neustart bei. Andernfalls werden sie auf die konfigurierten Presets zurückgesetzt. |

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
| **Bereichsvorlage aktivieren** | Aktiviert automatische `heat_cool`-Bereichssteuerung für alle Mitglieder, die `heat_cool` nicht nativ melden. Keine manuelle Auswahl nötig — die Gruppe erkennt geeignete Mitglieder automatisch. |
| **Totzonen-Aktion** | Was zu tun ist, wenn die Raumtemperatur bereits innerhalb des Zielbandes liegt (zwischen unterem und oberem Sollwert). **Keine** (Standard — kein Moduswechsel; ein Gerät, das weiter heizt oder kühlt, wird auf dem passenden Sollwert gehalten: Heizen auf dem unteren, Kühlen auf dem oberen), **Ausschalten** oder **Nur Lüfter**. |
| **Im Totband entfeuchten** | Schaltet im Temperatur-Totband automatisch auf Entfeuchtung oder Luftzirkulation um, wenn die Raumfeuchtigkeit die Zielfeuchtigkeit überschreitet. Setzt einen Feuchtigkeitswert von einem Mitglied oder einem Feuchtigkeitssensor voraus. |
| **Feuchtigkeits-Aktion** | Physische Aktion bei Überschreitung des Feuchtigkeitsschwellwerts im Totband: **Trocknen** (Standard) oder **Nur Lüfter**. |
| **Feuchtigkeits-Hysterese** | Symmetrisches Hystereseband um die Zielfeuchtigkeit zur Vermeidung schnellen Taktens (Standard: 3,0%). |
| **Deaktivierungsverzögerung** | Verzögerung, bevor die Feuchtigkeits-Aktion nach Unterschreiten des Schwellwerts wieder beendet wird (Standard: 0s). Aktivierung erfolgt sofort — wie beim Verlassen des Temperaturbandes wird das Reagieren auf zu hohe Feuchtigkeit nicht künstlich verzögert. |

### Erweiterte Einstellungen

Wenn das gleichzeitige Ansteuern der ganzen Gruppe dein Netzwerk oder deine
Bridge überlastet — ein bekanntes Problem bei IR-Blastern und manchen
Zigbee-Koordinatoren, wenn mehrere Geräte im selben Moment angesprochen
werden — stelle eine **Verzögerung zwischen Mitglieder-Befehlen** ein, um die
Befehle zeitlich zu strecken, statt sie alle gleichzeitig zu senden.

| Option | Beschreibung |
|--------|-------------|
| **Entprellungs-Verzögerung** | Wartezeit vor dem Senden von Befehlen. Höhere Werte verhindern 'Schnellfeuer'-Befehle beim Verschieben von Reglern, fühlen sich aber langsamer an (Standard: 0,3s). |
| **Wiederholungsversuche** | Anzahl der Wiederholungen bei fehlgeschlagenem Befehl. |
| **Wiederholungs-Verzögerung** | Zeit zwischen Wiederholungen (z. B. 1,0s). |
| **Erzwungene Wiederholung** | Sendet Befehle immer an alle Mitglieder, auch wenn sie bereits den Zielzustand melden. Nützlich für IR-basierte Klimaanlagen oder andere Geräte, die ihren Zustand nach Erhalt eines Befehls möglicherweise nicht zuverlässig aktualisieren. |
| **Verzögerung zwischen Mitglieder-Befehlen** | Pause zwischen Befehlen an einzelne Mitglieder, statt sie alle gleichzeitig zu senden. Hilft, wenn das gleichzeitige Ansteuern mehrerer Geräte dein Netzwerk oder deine Bridge überlastet — ein bekanntes Problem bei IR-Blastern und manchen Zigbee-Koordinatoren (Standard: 0s, deaktiviert). |
| **UI-Schonfrist** | Dauer (Sekunden), für die die Gruppe den befohlenen Wert sofort nach einer UI-Aktion anzeigt, bevor langsame Mitgliedsgeräte ihren Zustand zurückmelden. Verhindert visuelles Flackern im Dashboard. Gilt für alle Attribute: HVAC-Modus, Temperatur, Luftfeuchtigkeit, Lüfter-/Preset-/Schwenk-Modi. |
| **Smart-Sensoren anzeigen** | Erstellt zusätzliche Temperatur- und Feuchtigkeits-Sensor-Entitäten, die den aktuellen aggregierten Zustand der Gruppe widerspiegeln (nützlich für Verlaufsgraphen und Dashboards). |
| **Mitgliederliste bereitstellen** | Fügt das Attribut `entity_id` mit der Liste aller Mitglieds-Entitäts-IDs hinzu, sodass Home Assistants More-Info-Dialog die native Mitgliederliste anzeigt (ermöglicht außerdem `expand()`-Templates). |
| **Konfigurations-Sensor anzeigen** | Erstellt eine diagnostische Konfigurations-Sensor-Entität (`sensor.*_configuration`), die einen portablen JSON-Schnappschuss aller Gruppeneinstellungen unter dem Attribut `settings_json` enthält. |
| **Alle Sektionen standardmäßig aufklappen** | Hält standardmäßig alle Konfigurationsabschnitte im Optionsdialog aufgeklappt. |

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

Wird dieser Dienst **ohne** Entität aufgerufen, kehrt die Gruppe zu ihrem konfigurierten Zeitplan zurück (eine zuvor über diesen Dienst gesetzte Entität wird dabei verworfen) und der aktuelle Zeitblock wird erneut angewendet. Um andere temporäre Überschreibungen wie Boost oder Offset zurückzusetzen, wird der Dienst `climate_group_helper.reset` verwendet.

**Beispiel:**
```yaml
service: climate_group_helper.set_schedule_entity
target:
  entity_id: climate.my_group
data:
  schedule_entity: schedule.guest_mode
```

### `climate_group_helper.reset`

Setzt temporäre Überschreibungen und den Runtime-Zustand auf die konfigurierten Standardwerte zurück. Nützlich, um temporäre Automatisierungszustände zu beenden oder eine Gruppe auf ihren Standard zurückzubringen.

**Dienst-Felder:**

| Feld | Erforderlich | Beschreibung |
|-------|----------|-------------|
| `everything` | Nein | Setzt alle folgenden Bereiche auf einmal zurück. Die einzelnen Felder werden dann ignoriert. |
| `boost` | Nein | Bricht einen aktiven Boost ab und stellt den Zielzustand wieder her. |
| `offset` | Nein | Setzt den globalen Temperatur-Offset der Gruppe auf 0.0 zurück. |
| `schedule` | Nein | Setzt die aktive Zeitplan-Entität auf den konfigurierten Standardzeitplan zurück und beendet eine manuelle Haltezeit, sodass der aktuelle Zeitblock sofort gilt. |
| `bypass` | Nein | Setzt die aktive Bypass-Entität auf den konfigurierten Standard zurück und nimmt Bypass-Anpassungen zurück. |
| `fallback` | Nein | Setzt den Fallback-Payload des Zeitplans auf den konfigurierten Standard zurück. |
| `presets` | Nein | Löscht zur Laufzeit erstellte Voreinstellungen und stellt konfigurierte Voreinstellungen wieder her. |

Setze mindestens einen Bereich auf `true` oder nutze `everything: true`, um alles zurückzusetzen. Ein Aufruf ohne jede Auswahl wird abgelehnt.

**Beispiel — Alles zurücksetzen:**
```yaml
service: climate_group_helper.reset
target:
  entity_id: climate.my_group
data:
  everything: true
```

**Beispiel — Nur Boost und Offset zurücksetzen:**
```yaml
service: climate_group_helper.reset
target:
  entity_id: climate.my_group
data:
  boost: true
  offset: true
```

### `climate_group_helper.set_schedule_bypass_entity`

Ändert die aktive Bypass-Zeitplan-Entität einer Gruppe zur Laufzeit dynamisch. Der Bypass-Zeitplan fungiert als Prioritätsebene, die den Haupt-Zeitplan überschreibt. Während ein Bypass aktiv ist, verfolgt die Gruppe den Haupt-Zeitplan weiterhin im Hintergrund; endet der Bypass, wird der aktuell gültige Haupt-Zustand wiederhergestellt (Attribute, die nur der Bypass geändert hat, fallen auf ihre Werte vor dem Bypass zurück). Mit aktivierter Option **Per Dienst geänderte Werte beibehalten (Zeitplan)** übersteht die hier gesetzte Entität einen Neustart.

**Dienst-Felder:**

| Feld | Erforderlich | Beschreibung |
|-------|----------|-------------|
| `schedule_bypass_entity` | Nein | Die Entitäts-ID des neuen Bypass-Zeitplans oder -Kalenders (z. B. `schedule.*` oder `calendar.*`). Wenn weggelassen, kehrt die Gruppe zu ihrer konfigurierten Standard-Bypass-Zeitplan-Entität zurück. |

**Beispiel:**
```yaml
service: climate_group_helper.set_schedule_bypass_entity
target:
  entity_id: climate.my_group
data:
  schedule_bypass_entity: calendar.holiday_schedule
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

### `climate_group_helper.set_group_preset`

Erstellt, aktualisiert oder entfernt virtuelle Gruppen-Presets zur Laufzeit, ohne die Gruppeneinstellungen öffnen zu müssen. Nützlich für dynamische Automatisierungen, temporäre Gäste-Modi oder Party-Sollwerte. Wenn „Per Dienst geänderte Werte beibehalten (Presets)“ aktiviert ist, bleiben über diesen Dienst angelegte oder geänderte Presets auch nach einem Home Assistant Neustart erhalten.

Aktualisierst du genau das Preset, das gerade auf der Gruppe ausgewählt ist, werden dessen neue Werte sofort angewendet. Bei jedem anderen Preset ändert sich nur die hinterlegte Definition.

**Dienst-Felder:**

| Feld | Erforderlich | Beschreibung |
|-------|----------|-------------|
| `payload` | Nein | Die Gruppen-Presets im selben YAML- oder Mapping-Format wie in den Gruppeneinstellungen (z. B. `party:` mit `temperature: 23.0`). Wird ein einzelnes Preset auf leer oder `null` gesetzt, wird nur dieses Preset entfernt. Wird `payload` weggelassen oder leer übergeben, werden alle Runtime-Presets entfernt (und auf die konfigurierten Presets zurückgesetzt). |

**Beispiel — Presets hinzufügen oder aktualisieren:**
```yaml
service: climate_group_helper.set_group_preset
target:
  entity_id: climate.my_group
data:
  payload: |
    party:
      temperature: 23.5
      hvac_mode: heat
    guest:
      temperature: 21.0
```

**Beispiel — Einzelnes Preset entfernen:**
```yaml
service: climate_group_helper.set_group_preset
target:
  entity_id: climate.my_group
data:
  payload:
    party: null
```

### `climate_group_helper.apply_config`

Wendet eine portable JSON-Konfiguration auf eine Gruppe an. Nützlich, um Logikeinstellungen zwischen Gruppen zu kopieren oder eine Sicherung von einem Konfigurationssensor wiederherzustellen.

**Dienst-Felder:**

| Feld | Erforderlich | Beschreibung |
|-------|----------|-------------|
| `settings` | **Ja** | Ein JSON-Objekt mit der Konfiguration. Quelle: Attribut `settings_json` eines Konfigurationssensors. |
| `include_member_list` | Nein | Wenn `true`, überschreibt die Mitgliederliste, die Master-Entität, die Heiz-/Kühl-Rollenzuweisung pro Gerät und die Mitgliederlisten der Isolationsregeln. Standard: `false`. |
| `include_entity_selectors` | Nein | Wenn `true`, überschreibt verknüpfte Sensoren, Offsets pro Mitglied und die Isolationssensoren. Standard: `false`. |

Standardmäßig werden nur Logikeinstellungen übertragen (Sync-Modi, Fenstersteuerung, Zeitpläne usw.). Setze die beiden Einschluss-Flags auf `true`, wenn du auch die Mitgliederliste, deren verknüpfte Sensoren und die Isolationsregeln (einschließlich ihrer Mitgliederlisten und Sensoren) kopieren möchtest. Der Gruppenname bleibt immer erhalten.

> [!IMPORTANT]
> **Neuladeverhalten:** Der Aufruf dieses Dienstes löst ein vollständiges Neuladen der Gruppen-Entität aus. Alle aktiven, nicht persistierten Timer (z. B. Boost, Fenster-Verzögerungen) werden sofort zurückgesetzt. Dies ist dasselbe Verhalten wie bei Änderungen über die UI.

> [!TIP]
> **Öffne danach die Einstellungen der Gruppe und speichere einmal.** Der Dienst übernimmt, was du ihm übergibst; der Einstellungsdialog prüft zusätzlich, ob die Kombination sinnvoll ist, und weist auf alles hin, was noch korrigiert werden muss.

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
