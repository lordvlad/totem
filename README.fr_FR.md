# Totem

vos fichiers sur votre tiptoi

Avec Totem, vous pouvez créer vos propres livres audio à utiliser avec votre tiptoi. Aucun compte ni carte de crédit requis, pas de cloud non plus. Tout reste sur votre ordinateur.

Vous avez besoin de deux choses pour que cela fonctionne :

1. Un fichier de livre audio que vous mettez sur votre tiptoi

2. Une impression, qui contient les codes visuels que le tiptoi utilise pour lire réellement l'audio

Totem vous aidera à obtenir les deux.

## Fichier de livre audio

Tout d'abord, choisissez quelques fichiers audio. Il peut s'agir de fichiers mp3 de vos chansons préférées pour enfants ou d'enregistrements que vous avez réalisés. (Support des fichiers ogg à venir prochainement). Ces fichiers resteront sur votre ordinateur, rien n'est vraiment "téléchargé" nulle part. Vous pouvez choisir des fichiers en utilisant le bouton "choisir audio", ou vous pouvez simplement glisser-déposer des fichiers depuis votre bureau.

Vous pouvez modifier le titre de l'album et de la chanson ainsi que l'artiste directement dans le tableau après un double-clic sur le champ respectif. Les modifications sont enregistrées instantanément. (Réorganisation des éléments à venir prochainement).

Enfin, enregistrez le fichier de livre audio directement sur votre tiptoi (généralement, le stylo est reconnu comme un support de stockage, tout comme une clé USB).

## Imprimer

Configurez une mise en page d'impression. Pour le moment, vous pouvez choisir parmi trois mises en page avec quelques options de personnalisation. (Plus de personnalisation à venir prochainement). Ensuite, appuyez sur le bouton d'impression et assurez-vous que les options d'impression ne mettent pas à l'échelle ou ne déforment pas l'image de quelque manière que ce soit. Utilisez une imprimante qui gère 1200 dpi (une très bonne imprimante 600 dpi pourrait également fonctionner).

### Trouver la taille de pixel OID optimale

Différentes imprimantes ont différentes capacités pour reproduire les codes OID avec précision. Pour vous aider à trouver la taille de pixel optimale pour votre imprimante :

1. Utilisez le bouton **"Imprimer la page de test"** dans la section Téléchargements pour imprimer une page de test avec des codes OID à différentes tailles de pixels (3-12 pixels)
2. Utilisez le bouton **"Télécharger le GME de test"** pour télécharger un fichier GME de test (ID produit 950) et copiez-le sur votre stylo tiptoi
3. Imprimez la page de test à 100% d'échelle (sans mise à l'échelle ni ajustement à la page)
4. Touchez chaque code avec votre stylo tiptoi pour voir quelles tailles de pixels fonctionnent
5. Mettez à jour le paramètre **"Taille de pixel OID"** dans le panneau Options avec la valeur qui fonctionne le mieux pour votre imprimante

Le fichier GME de test jouera un son de test simple lorsque vous toucherez l'un des codes sur la page de test. Si votre stylo ne reconnaît pas un code, essayez une autre taille de pixel.

## Travaux antérieurs

Tout le crédit pour le gros du travail revient à [tttool](https://github.com/entropia/tip-toi-reveng). Je ne fais vraiment que traduire toutes les choses de bas niveau et ajouter quelques améliorations supplémentaires.

## Pourquoi Totem

Avec tout le respect dû à tttool et aux auteurs, le projet n'est pas très accessible aux personnes non techniques. Il existe d'autres efforts pour fournir une interface graphique pour tttool, mais ils sont également un peu limités en termes de facilité d'utilisation.

En concevant Totem, j'ai fixé les contraintes suivantes :

• Je ne veux pas payer pour l'hébergement ou le stockage

• Je ne veux pas gérer les données des utilisateurs

• Aucune installation requise

En utilisant les technologies web modernes, il est possible de satisfaire tout ce qui précède.

## Comment ça marche

Totem fonctionne entièrement dans votre navigateur - il n'y a pas de serveur backend, pas de stockage cloud, et aucune donnée ne quitte jamais votre ordinateur. Voici ce qui se passe sous le capot :

Lorsque vous téléchargez des fichiers audio, Totem utilise des Web Workers (threads en arrière-plan) pour décoder vos fichiers MP3 et extraire les métadonnées telles que le titre, l'artiste et la pochette de l'album. Tout cela se passe localement dans votre navigateur.

Lorsque vous enregistrez le fichier de livre audio, Totem construit un fichier GME (Game Mode Electronics) - un format binaire spécial que les appareils Tiptoi comprennent. Ce fichier contient vos données audio encodées XOR avec une valeur magique, ainsi qu'une table de scripts qui indique au stylo Tiptoi quoi faire lorsque vous tapez différents codes OID.

Les codes visuels que vous imprimez sont des codes OID (Optical Identification) - des motifs de points uniques que le stylo Tiptoi peut reconnaître. Chaque code correspond à une action spécifique dans le fichier GME, comme la lecture d'une chanson particulière ou l'arrêt de la lecture.

Totem génère ces codes à 1200 DPI sous forme de graphiques SVG pouvant être imprimés. Lorsque vous tapez un code avec votre stylo Tiptoi, il lit le motif, recherche le script correspondant dans le fichier GME et lit l'audio.

Tous les calculs intensifs (décodage des MP3, construction des fichiers GME, génération des motifs OID) se produisent dans des Web Workers pour garder l'interface réactive. L'ensemble de l'application est construit avec des technologies web modernes (React, Vite, TypeScript) et se compile en un site statique pouvant fonctionner n'importe où.
