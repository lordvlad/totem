# Totem

Deine Musik auf deinem Tiptoi.

Mit Totem kannst du deine eigenen Hörbücher erstellen, die du mit deinem tiptoi verwenden kannst. Es wird kein Konto oder keine Kreditkarte benötigt, auch keine Cloud. Alles bleibt auf deinem Computer.

Du benötigst zwei Dinge, damit dies funktioniert:

Eine Hörbuchdatei, die du auf deinem tiptoi speicherst.

Einen Ausdruck, der die visuellen Codes enthält, die der tiptoi verwendet, um die Audioinhalte abzuspielen.

Totem wird dir bei beidem helfen.

## Hörbuchdatei

Zuerst wähle einige Audio-Dateien aus. Dies können MP3-Dateien deiner Lieblings-Kinderlieder sein oder Aufnahmen, die du selbst gemacht hast. (Unterstützung für OGG-Dateien folgt in Kürze). Diese Dateien bleiben auf deinem Computer, nichts wird wirklich "hochgeladen". Du kannst Dateien mit der Schaltfläche "Audio auswählen" wählen oder einfach Dateien von deinem Desktop per Drag & Drop hinzufügen.

Du kannst den Album- und Liedtitel sowie den Künstler direkt in der Tabelle bearbeiten, nachdem du doppelt auf das entsprechende Feld geklickt hast. Änderungen werden sofort gespeichert. (Reihenfolgeänderung folgt in Kürze).

Speichere schließlich die Hörbuchdatei direkt auf deinem tiptoi (normalerweise wird der Stift als Speichermedium erkannt, ähnlich wie ein USB-Stick).

## Drucken

Konfiguriere ein Drucklayout. Derzeit kannst du aus drei Layouts mit einigen Anpassungsoptionen wählen. (Mehr Anpassungsmöglichkeiten folgen in Kürze). Klicke dann auf die Druck-Schaltfläche und stelle sicher, dass die Druckoptionen das Bild nicht skaliert oder verzerrt. Verwende einen Drucker, der 1200 dpi unterstützt (ein sehr guter 600-dpi-Drucker funktioniert möglicherweise auch).

### Die optimale OID-Pixelgröße finden

Verschiedene Drucker haben unterschiedliche Fähigkeiten, die OID-Codes genau zu reproduzieren. Um die optimale Pixelgröße für deinen Drucker zu finden:

1. Verwende die Schaltfläche **"Testseite drucken"** im Downloads-Bereich, um eine Testseite mit OID-Codes in verschiedenen Pixelgrößen (3-12 Pixel) zu drucken
2. Verwende die Schaltfläche **"Test-GME herunterladen"**, um eine Test-GME-Datei (Produkt-ID 950) herunterzuladen und kopiere sie auf deinen Tiptoi-Stift
3. Drucke die Testseite mit 100 % Skalierung (keine Skalierung oder Anpassung an die Seite)
4. Berühre jeden Code mit deinem Tiptoi-Stift, um zu sehen, welche Pixelgrößen funktionieren
5. Aktualisiere die Einstellung **"OID-Pixelgröße"** im Optionen-Bereich auf den Wert, der für deinen Drucker am besten funktioniert

Die Test-GME-Datei spielt einen einfachen Testton ab, wenn du einen der Codes auf der Testseite berührst. Wenn dein Stift einen Code nicht erkennt, versuche eine andere Pixelgröße.

## Andere Arbeiten

Der gesamte Dank für die harte Arbeit gebührt [tttool](https://github.com/entropia/tip-toi-reveng). Ich übersetze im Grunde nur alle Low-Level Dinge und füge ein paar zusätzliche Verbesserungen hinzu.

## Warum Totem

Bei allem Respekt vor tttool und den Autoren ist das Projekt für nicht technisch versierte Personen nicht sehr zugänglich. Es gibt andere Bemühungen, eine grafische Benutzeroberfläche für tttool bereitzustellen, aber auch diese sind in Bezug auf Benutzerfreundlichkeit etwas eingeschränkt.

Bei der Gestaltung von Totem habe ich die folgenden Einschränkungen festgelegt:

• Ich möchte keine Kosten für Hosting oder Speichernutzung haben.

• Ich möchte keine Benutzerdaten verarbeiten.

• Es soll keine Installation erforderlich sein.

Mit modernen Webtechnologien ist es möglich, all dies zu erfüllen.

## Wie funktioniert es

Totem läuft vollständig in deinem Browser - es gibt keinen Backend-Server, keinen Cloud-Speicher, und keine Daten verlassen jemals deinen Computer. So funktioniert es im Detail:

Wenn du Audiodateien hochlädst, verwendet Totem Web Workers (Hintergrund-Threads), um deine MP3-Dateien zu dekodieren und Metadaten wie Titel, Interpret und Album-Cover zu extrahieren. All dies geschieht lokal in deinem Browser.

Wenn du die Hörbuchdatei speicherst, erstellt Totem eine GME-Datei (Game Mode Electronics) - ein spezielles Binärformat, das Tiptoi-Geräte verstehen. Diese Datei enthält deine Audiodaten, die mit einem magischen Wert XOR-kodiert sind, zusammen mit einer Skript-Tabelle, die dem Tiptoi-Stift sagt, was er tun soll, wenn du verschiedene OID-Codes antippst.

Die visuellen Codes, die du ausdruckst, sind OID-Codes (Optical Identification) - einzigartige Punktmuster, die der Tiptoi-Stift erkennen kann. Jeder Code entspricht einer bestimmten Aktion in der GME-Datei, wie das Abspielen eines bestimmten Liedes oder das Stoppen der Wiedergabe.

Totem erzeugt diese Codes mit 1200 DPI als SVG-Grafiken, die gedruckt werden können. Wenn du einen Code mit deinem Tiptoi-Stift antippst, liest er das Muster, schaut das entsprechende Skript in der GME-Datei nach und spielt die Audiodatei ab.

Die gesamte rechenintensive Arbeit (Dekodierung von MP3s, Erstellung von GME-Dateien, Generierung von OID-Mustern) erfolgt in Web Workers, um die Benutzeroberfläche reaktionsfähig zu halten. Die gesamte Anwendung ist mit modernen Webtechnologien (React, Vite, TypeScript) erstellt und wird zu einer statischen Website kompiliert, die überall ausgeführt werden kann.

