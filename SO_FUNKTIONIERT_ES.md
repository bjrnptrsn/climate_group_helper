# So funktioniert Climate Group Helper

Die [LIESMICH](LIESMICH.md) erklärt jede Funktion für sich. Diese Seite zeigt, wie sie zusammenspielen: wer entscheidet, was deine Geräte tun, was Vorrang hat, und warum die Gruppe manchmal etwas anderes anzeigt, als du eingestellt hast.

## Inhalt

- [Die Grundidee: Ziel und Wirklichkeit](#die-grundidee-ziel-und-wirklichkeit)
- [Wer den Zielzustand setzt](#wer-den-zielzustand-setzt)
- [Was vorübergehend Vorrang hat](#was-vorübergehend-vorrang-hat)
- [Wie der Zielzustand bei den Geräten ankommt](#wie-der-zielzustand-bei-den-geräten-ankommt)
- [Wenn jemand ein Gerät direkt ändert](#wenn-jemand-ein-gerät-direkt-ändert)
- [Was die Gruppe anzeigt](#was-die-gruppe-anzeigt)

---

## Die Grundidee: Ziel und Wirklichkeit

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/how_it_works_overview_de.svg" alt="Der Zielzustand der Gruppe erreicht die Geräte über die vorübergehenden Regeln; die Geräte speisen die Gruppenanzeige; Änderungen an einem Gerät gehen über den Sync-Modus zurück in den Zielzustand" width="700"/>
</p>

Alles in Climate Group Helper baut auf einer Sache auf: dem **Zielzustand der Gruppe**. Er beschreibt, was deine Geräte tun sollen: Modus, Temperatur, Preset und so weiter.

- **Der Zielzustand ändert sich nur gezielt:** wenn du etwas einstellst, ein Zeitblock beginnt, du ein Preset wählst oder der Sync-Modus eine Änderung an einem Gerät übernimmt. Sonst fasst ihn nichts an, und er übersteht Home-Assistant-Neustarts.
- **Vorübergehende Regeln stehen zwischen Zielzustand und Geräten.** Ein offenes Fenster, ein leeres Zuhause, der Hauptschalter oder ein Boost bestimmen, was die Geräte *im Moment* bekommen. Den Zielzustand ändern sie nie. Endet eine Regel, schickt die Gruppe den Zielzustand wieder.
- **Die Anzeige der Gruppe zeigt die Wirklichkeit.** Temperatur und Modus werden aus dem berechnet, was die Geräte tatsächlich melden. Tun die Geräte eine Weile etwas anderes als der Zielzustand, siehst du das dort.

Den Zielzustand selbst kannst du jederzeit nachsehen: Er steht im Attribut `target_state` im Detaildialog der Gruppe unter **Attribute**.

---

## Wer den Zielzustand setzt

| Quelle | Wie sie den Zielzustand ändert |
|---|---|
| **Du** | Über das Dashboard, Sprachassistenten, Automationen oder Skripte: alles, was die Gruppen-Entität steuert. |
| **Gruppen-Presets** | Ein gewähltes Preset setzt alle seine Einstellungen auf einmal. Änderst du danach eine davon, verlässt die Gruppe das Preset. |
| **Zeitplan** | Jeder neue Zeitblock schreibt seine Einstellungen. Ein Bypass-Zeitblock überschreibt den Haupt-Zeitplan, solange er läuft, und der Fallback springt ein, wenn kein Haupt-Zeitblock aktiv ist. |
| **Ein direkt geändertes Gerät** | Nur mit einem Sync-Modus, der Änderungen übernimmt (Mirror, Mirror/Lock, Master/Lock für das Master-Gerät, Nur übernehmen). Siehe [unten](#wenn-jemand-ein-gerät-direkt-ändert). |

**Die letzte Änderung gewinnt.** Der Zeitplan meldet sich allerdings zurück: beim nächsten Zeitblock oder, wenn eine **Manuelle Haltezeit** eingestellt ist, sobald sie abgelaufen ist.

---

## Was vorübergehend Vorrang hat

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/how_it_works_priority_de.svg" alt="Vorrang von oben nach unten: Hauptschalter aus, Fenster offen, niemand zu Hause, Boost, Zielzustand der Gruppe. Isolierte Geräte stehen daneben." width="700"/>
</p>

Von oben nach unten entscheidet die erste Regel, die zutrifft, was die Geräte bekommen:

| Regel | Was die Geräte bekommen | Änderungen am Zielzustand währenddessen | Wenn sie endet |
|---|---|---|---|
| **Hauptschalter aus** | Aus, und zwar alle. | Werden zurückgehalten. | Der Zielzustand wird wieder geschickt. |
| **Fenster offen** | Aus, oder die Zieltemperatur bei offenem Fenster. | Werden zurückgehalten, außer **Manuelle Änderungen übernehmen** lässt sie für später durch — das gilt nur, solange das Fenster die einzige aktive Regel ist. | Der Zielzustand wird wieder geschickt. |
| **Niemand zu Hause** | Die Abwesenheits-Aktion: aus, ein Versatz, eine feste Temperatur oder ein Preset. | Werden zurückgehalten. | Der Zielzustand wird wieder geschickt. |
| **Boost** | Die Boost-Temperatur, so lange wie angefordert. | Ein direkter Befehl an die Gruppe beendet den Boost, ebenso ein `aus` am Gerät, wenn der Sync-Modus dieses `aus` ohnehin übernehmen würde. Andere Geräteänderungen werden während eines Boosts ignoriert. | Der Zielzustand wird wieder geschickt, einschließlich des Zeitblocks, der dann gerade aktiv ist. |

Die ersten drei sind **Sperren**. Ein paar Dinge solltest du über sie wissen:

- **Sie werden durchgesetzt, nicht nur ausgelöst.** Ein Gerät, das abweicht, wird auf das zurückgesetzt, was die Sperre verlangt — bei **Ausschalten** ist das „aus“, bei **Temperatur setzen** die Fenster-Temperatur.
- **Der Zeitplan läuft im Hintergrund weiter.** Ein Wechsel des Zeitblocks während einer Sperre aktualisiert den Zielzustand. Die Geräte bekommen ihn, sobald die Sperre endet.
- **Die Gruppe auszuschalten kommt immer durch.**
- **Endet eine Sperre, während eine andere noch aktiv ist,** übernimmt die andere, und der Zielzustand wartet, bis alle vorbei sind.
- **Ein Boost startet nicht während einer Sperre**, und eine beginnende Sperre beendet einen laufenden Boost.

**Isolierte Geräte** sind ein eigener Fall. Solange ihre Isolationsregel gilt, bleiben sie ganz außen vor: nicht in den Messwerten, nicht bei den Befehlen, nicht bei Fenster- und Anwesenheitssteuerung. Nur der Hauptschalter erreicht sie noch. Endet die Regel, gehören sie wieder zur Gruppe.

---

## Wie der Zielzustand bei den Geräten ankommt

<p align="center">
  <img src="https://raw.githubusercontent.com/bjrnptrsn/climate_group_helper/main/assets/how_it_works_command_path_de.svg" alt="Der Zielzustand von 21 °C wird durch einen Gruppen-Offset von +2 erhöht und durch einen Mitglieder-Offset von −1 für das Schlafzimmer gesenkt, gegen die Grenzen des Geräts geprüft, und das Thermostat im Schlafzimmer bekommt 22 °C" width="700"/>
</p>

Der Zielzustand ist für die ganze Gruppe gleich. Auf dem Weg zu jedem Gerät wird er für dieses Gerät angepasst:

- **Gruppen-Offset** verschiebt alle Geräte nach oben oder unten, ohne den Zielzustand darunter zu ändern. Während einer Sperre oder eines Boosts ist er pausiert. Auf das, was du selbst an der Gruppe einstellst, wirkt er nicht: Diese Befehle kommen genau so an, und wer an der Gruppe eine Temperatur setzt, setzt den Gruppen-Offset auf 0 zurück.
- **Mitglieder-Offsets** verschieben einzelne Geräte, z. B. ein Schlafzimmer, das immer ein Grad kühler laufen soll.
- **Gerätegrenzen** *(nur Union)*: Ein Gerät, das die Temperatur nicht erreichen kann, wird ausgeschaltet oder auf seinen nächsten Grenzwert gesetzt (**Aktion außerhalb des Bereichs**). Ein Gerät, das den Modus nicht unterstützt, bleibt, wie es ist, oder wird ausgeschaltet (**Aktion bei nicht unterstütztem HVAC-Modus**).
- **Mitglieder-Vorlage** macht aus einem Heiz-/Kühlbereich einfaches Heizen oder Kühlen, für Geräte mit nur einem Sollwert.
- **Min. Temp bei „Aus“** schickt beim Ausschalten die niedrigste Temperatur des Geräts, für Ventile, die nicht vollständig schließen.

Welche Geräte einen Befehl bekommen:

- **Befehle, die du der Gruppe gibst,** gehen an jedes Gerät, das sie unterstützt.
- **Automatische Befehle** (Zeitplan, Sync-Modus) gehen nur an die Geräte, die vom Zielzustand abweichen. **Wiederholung erzwingen** schickt sie trotzdem an alle, für Geräte, die ihren Zustand nicht zuverlässig melden.
- **Verzögerung zwischen Mitglieder-Befehlen** verteilt die Befehle zeitlich, statt sie alle auf einmal zu senden.

---

## Wenn jemand ein Gerät direkt ändert

Wer ein Gerät direkt an ihm selbst oder in seiner eigenen App ändert, geht an der Gruppe vorbei. Was dann passiert, hängt vom **Sync-Modus** ab, und bei den meisten Modi davon, ob die Einstellung unter den **Sync-Attributen** ausgewählt ist:

| Sync-Modus | Die Änderung am Gerät… |
|---|---|
| **Deaktiviert** | bleibt, bis die Gruppe das nächste Mal ihren Zielzustand schickt. |
| **Mirror** | wird zum neuen Zielzustand und an die anderen Geräte weitergegeben. |
| **Lock** | wird auf den Zielzustand zurückgesetzt. |
| **Mirror/Lock** | wird für ausgewählte Einstellungen zum Zielzustand und für die übrigen zurückgesetzt. |
| **Master/Lock** | wird am Master-Gerät zum Zielzustand und an allen anderen zurückgesetzt (für die ausgewählten Einstellungen). |
| **Nur übernehmen** | wird zum neuen Zielzustand, aber die anderen Geräte bleiben, wie sie sind. |

Die vollständige Tabelle, auch mit dem, was bei nicht ausgewählten Einstellungen passiert, steht in der LIESMICH unter [Sync-Modi](LIESMICH.md#erweiterte-sync-modi).

Einige Fälle folgen nicht dem Sync-Modus:

- **Während einer Sperre** entscheidet die Sperre: Das Gerät wird auf das zurückgesetzt, was die Sperre verlangt (siehe oben).
- **Isolierte Geräte** bleiben in Ruhe.
- **Von der Mitglieder-Vorlage erfasste Geräte** folgen immer dem Bereich der Gruppe.
- **Mit Respektiere Aus-Status der Mitglieder (Sync)** bleibt ein Gerät, das du ausschaltest, aus, und sein „aus“ wird nicht an die anderen weitergegeben. Ist es das letzte Gerät, das noch läuft, schaltet sich die ganze Gruppe aus.
- **Kurz nachdem die Gruppe diesem Gerät einen Befehl geschickt hat,** übernimmt sie eine Änderung, die du innerhalb von etwa fünf Sekunden direkt am Gerät machst, nicht. Home Assistant wertet die Meldungen des Geräts so lange als Antwort auf diesen Befehl; ein Wert, der vom soeben gesendeten abweicht, wird deshalb ignoriert, und die Gruppe behält ihren eigenen. Brauchst du deinen Wert, warte ein paar Sekunden und stelle ihn erneut ein.
- **Eine Temperatur, die du an einem ausgeschalteten Gerät einstellst,** wird bei manchen Geräten ignoriert: Im Aus zeigen sie denselben Wert wie die Gruppe, die erste Änderung lässt sich deshalb nicht vom Ausschalten selbst unterscheiden. Schalte das Gerät zuerst ein und stelle die Temperatur danach ein.

---

## Was die Gruppe anzeigt

Die Gruppen-Entität zeigt, **was die Geräte tun**, nicht was die Gruppe will:

- **Aktuelle Temperatur und Luftfeuchtigkeit** kommen von deinen externen Sensoren oder werden aus den Geräten berechnet (Mittelwert, Median, Minimum oder Maximum).
- **Zieltemperatur** wird genauso aus den Sollwerten der Geräte berechnet oder mit **Master-Zieltemperatur verwenden** (bzw. **Master-Zielfeuchtigkeit verwenden**) vom Master-Gerät übernommen. Mit **Mitglieds-Offset korrigieren** (standardmäßig an) werden die Mitglieder-Offsets vorher herausgerechnet, damit ein Schlafzimmer, das ein Grad kühler läuft, den Wert nicht nach unten zieht.
- **Modus** wird aus den Modi der Geräte so zusammengefasst, wie es die **HVAC-Modus-Strategie** festlegt.

Deshalb kann die Anzeige von dem abweichen, was du eingestellt hast: Hat ein offenes Fenster die Heizung ausgeschaltet, zeigt die Gruppe „aus“, obwohl ihr Zielzustand weiterhin Heizen auf 21 °C ist. Direkt nach einer Änderung zeigt die Gruppe kurz deinen Wert (**UI-Schonfrist**), bevor sie auf die Meldungen der Geräte umschaltet.

**Externe Sensoren** arbeiten unabhängig vom Zielzustand: Sie liefern die Raumtemperatur, und mit eingerichteter Kalibrierung schreibt die Gruppe diesen Wert zurück in deine Thermostate.

Was die Gruppe gerade tut und warum, siehst du in den [Attributen, die die Gruppe meldet](LIESMICH.md#was-die-gruppe-über-sich-selbst-berichtet), oder im Statusbereich der [Lovelace-Karte](LIESMICH.md#lovelace-karte).
