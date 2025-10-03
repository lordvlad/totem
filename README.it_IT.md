# Totem

i tuoi file sul tuo tiptoi

Con Totem, puoi creare i tuoi audiolibri da usare con il tuo tiptoi. Non è richiesto alcun account o carta di credito, nemmeno il cloud. Tutto rimane sul tuo computer.

Hai bisogno di due cose perché funzioni:

1. Un file audiolibro da mettere sul tuo tiptoi

2. Una stampa, che contiene i codici visivi che il tiptoi usa per riprodurre effettivamente l'audio

Totem ti aiuterà ad ottenere entrambi.

## File audiolibro

Prima di tutto, scegli alcuni file audio. Questi possono essere file mp3 delle tue canzoni preferite per bambini o possono essere registrazioni fatte da te. (Supporto per i file ogg in arrivo). Questi file rimarranno sul tuo computer, nulla viene realmente "caricato" da nessuna parte. Puoi scegliere i file usando il pulsante "scegli audio", oppure puoi semplicemente trascinare e rilasciare i file dal tuo desktop.

Puoi modificare il titolo dell'album e della canzone così come l'artista direttamente nella tabella dopo un doppio clic sul rispettivo campo. Le modifiche vengono salvate istantaneamente. (Riordino degli elementi in arrivo).

Infine, salva il file audiolibro direttamente sul tuo tiptoi (di solito, la penna viene riconosciuta come supporto di archiviazione, proprio come una chiavetta USB).

## Stampa

Configura un layout di stampa. Al momento puoi scegliere tra tre layout con alcune opzioni di personalizzazione. (Maggiore personalizzazione in arrivo). Quindi, premi il pulsante di stampa e assicurati che le opzioni di stampa non ridimensionino o distorcano l'immagine in alcun modo. Usa una stampante che gestisce 1200 dpi (una stampante molto buona da 600 dpi potrebbe funzionare anche).

## Lavori precedenti

Tutto il merito per il lavoro pesante va a [tttool](https://github.com/entropia/tip-toi-reveng). Sto davvero solo traducendo tutte le cose di basso livello e aggiungendo qualche abbellimento in più.

## Perché Totem

Con tutto il rispetto per tttool e gli autori, il progetto non è molto accessibile alle persone non tecniche. Ci sono altri tentativi di fornire un'interfaccia grafica per tttool, ma anche questi sono un po' limitati in termini di facilità d'uso.

Progettando Totem, ho impostato i seguenti vincoli:

• Non voglio pagare per hosting o archiviazione

• Non voglio gestire i dati degli utenti

• Nessuna installazione richiesta

Utilizzando le moderne tecnologie web, è possibile soddisfare tutto quanto sopra.

## Come funziona

Totem funziona interamente nel tuo browser - non c'è alcun server backend, nessun cloud storage, e nessun dato lascia mai il tuo computer. Ecco cosa succede sotto il cofano:

Quando carichi file audio, Totem utilizza Web Workers (thread in background) per decodificare i tuoi file MP3 ed estrarre metadati come titolo, artista e copertina dell'album. Tutto questo avviene localmente nel tuo browser.

Quando salvi il file audiolibro, Totem costruisce un file GME (Game Mode Electronics) - un formato binario speciale che i dispositivi Tiptoi comprendono. Questo file contiene i tuoi dati audio codificati XOR con un valore magico, insieme a una tabella di script che dice alla penna Tiptoi cosa fare quando tocchi diversi codici OID.

I codici visivi che stampi sono codici OID (Optical Identification) - modelli di punti unici che la penna Tiptoi può riconoscere. Ogni codice corrisponde a un'azione specifica nel file GME, come riprodurre una canzone particolare o fermare la riproduzione.

Totem genera questi codici a 1200 DPI come grafici SVG che possono essere stampati. Quando tocchi un codice con la tua penna Tiptoi, legge il modello, cerca lo script corrispondente nel file GME e riproduce l'audio.

Tutto il calcolo intensivo (decodifica degli MP3, costruzione dei file GME, generazione dei modelli OID) avviene nei Web Workers per mantenere l'interfaccia reattiva. L'intera applicazione è costruita con moderne tecnologie web (React, Vite, TypeScript) e si compila in un sito statico che può funzionare ovunque.
