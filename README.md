# Totem

your files on your tiptoi

With totem, you can build your own audio books to use with your tiptoi. No account or credit card required, no cloud either. Everything stays on your computer.

You need two things for this to work:

1. An audio book file you put on your tiptoi

2. A printout, which contains the visual codes the tiptoi uses to actually play the audio

Totem will help you get both.

## Audio book file

First, choose some audio files. These can be mp3 files of your favorite children's songs or can be recordings made by you. (Support for ogg files coming soon). These files will stay on your computer, nothing is really "uploaded" anywhere. You can choose files using the "choose audio" button, or you can simply drag-n-drop files from your desktop.

You can edit the album and song title as well as the artist directly in the table after a double-click on the respective field. Changes are saved instantly. (Item reordering coming soon).

Finally, save the audio book file directly to your tiptoi (usually, the pen is recognized as a storage media, just like a USB stick).

## Print

Configure a print layout. Right now you can choose from three layouts with a few customization options. (More customization soon). Then, hit the print button and make sure that the print options do not scale or skew the image in any way. Use a printer that manages 1200dpi (a very good 600dpi printer might also work).

### Finding the optimal OID pixel size

Different printers have different capabilities for reproducing the OID codes accurately. To help you find the optimal pixel size setting for your printer:

1. Use the **"Print Test Page"** button in the Downloads section to print a test page with OID codes at different pixel sizes (3-12 pixels)
2. Use the **"Download Test GME"** button to download a test GME file (Product ID 950) and copy it to your tiptoi pen
3. Print the test page at 100% scale (no scaling or fitting to page)
4. Touch each code with your tiptoi pen to see which pixel sizes work
5. Update the **"OID Pixel Size"** setting in the Options panel to the value that works best for your printer

The test GME file will play a simple test sound when you touch any of the codes on the test page. If your pen doesn't recognize a code, try another pixel size.

## Prior art

All credit for the heavy lifting goes to [tttool](https://github.com/entropia/tip-toi-reveng). I'm really only translating all the low-level stuff and adding a few sprinkles on top.

## Why totem

With all due respect to tttool and the authors, the project is not very accessible to non-technical people. There are other endeavors to provide a graphical user interface for tttool, but they too are a bit limited in terms of ease of use.

Designing totem, I set the following constraints:

• I don't want to pay for hosting or storage

• I don't want to handle user data

• No installation required

Using modern web technologies, it's possible to satisfy all of the above.

## How does it work

Totem runs entirely in your browser - there's no backend server, no cloud storage, and no data ever leaves your computer. Here's what happens under the hood:

When you upload audio files, Totem uses Web Workers (background threads) to decode your MP3 files and extract metadata like title, artist, and album art. All of this happens locally in your browser.

When you save the audiobook file, Totem builds a GME (Game Mode Electronics) file - a special binary format that Tiptoi devices understand. This file contains your audio data XOR-encoded with a magic value, along with a script table that tells the Tiptoi pen what to do when you tap different OID codes.

The visual codes you print are OID (Optical Identification) codes - unique dot patterns that the Tiptoi pen can recognize. Each code corresponds to a specific action in the GME file, like playing a particular song or stopping playback.

Totem generates these codes at 1200 DPI as SVG graphics that can be printed. When you tap a code with your Tiptoi pen, it reads the pattern, looks up the corresponding script in the GME file, and plays the audio.

All the heavy computation (decoding MP3s, building GME files, generating OID patterns) happens in Web Workers to keep the interface responsive. The entire application is built with modern web technologies (React, Vite, TypeScript) and compiles to a static site that can run anywhere.

