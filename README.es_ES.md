# Totem

tus archivos en tu tiptoi

Con Totem, puedes crear tus propios audiolibros para usar con tu tiptoi. No se requiere cuenta ni tarjeta de crédito, tampoco nube. Todo permanece en tu computadora.

Necesitas dos cosas para que esto funcione:

1. Un archivo de audiolibro que pongas en tu tiptoi

2. Una impresión, que contiene los códigos visuales que el tiptoi usa para reproducir realmente el audio

Totem te ayudará a obtener ambos.

## Archivo de audiolibro

Primero, elige algunos archivos de audio. Estos pueden ser archivos mp3 de tus canciones infantiles favoritas o pueden ser grabaciones hechas por ti. (Soporte para archivos ogg próximamente). Estos archivos permanecerán en tu computadora, nada se "sube" realmente a ninguna parte. Puedes elegir archivos usando el botón "elegir audio", o simplemente puedes arrastrar y soltar archivos desde tu escritorio.

Puedes editar el título del álbum y la canción así como el artista directamente en la tabla después de un doble clic en el campo respectivo. Los cambios se guardan instantáneamente. (Reordenación de elementos próximamente).

Finalmente, guarda el archivo de audiolibro directamente en tu tiptoi (generalmente, el lápiz es reconocido como un medio de almacenamiento, como una memoria USB).

## Imprimir

Configura un diseño de impresión. Ahora mismo puedes elegir entre tres diseños con algunas opciones de personalización. (Más personalización próximamente). Luego, presiona el botón de imprimir y asegúrate de que las opciones de impresión no escalen o distorsionen la imagen de ninguna manera. Usa una impresora que maneje 1200 dpi (una impresora muy buena de 600 dpi también podría funcionar).

### Encontrar el tamaño de píxel OID óptimo

Diferentes impresoras tienen diferentes capacidades para reproducir los códigos OID con precisión. Para ayudarte a encontrar el tamaño de píxel óptimo para tu impresora:

1. Usa el botón **"Imprimir página de prueba"** en la sección de Descargas para imprimir una página de prueba con códigos OID en diferentes tamaños de píxel (3-12 píxeles)
2. Usa el botón **"Descargar GME de prueba"** para descargar un archivo GME de prueba (ID de producto 950) y cópialo a tu lápiz tiptoi
3. Imprime la página de prueba al 100% de escala (sin escala o ajuste a la página)
4. Toca cada código con tu lápiz tiptoi para ver qué tamaños de píxel funcionan
5. Actualiza la configuración **"Tamaño de píxel OID"** en el panel de Opciones al valor que funcione mejor para tu impresora

El archivo GME de prueba reproducirá un sonido de prueba simple cuando toques cualquiera de los códigos en la página de prueba. Si tu lápiz no reconoce un código, prueba con otro tamaño de píxel.

## Trabajo previo

Todo el crédito por el trabajo pesado va a [tttool](https://github.com/entropia/tip-toi-reveng). Realmente solo estoy traduciendo todas las cosas de bajo nivel y agregando algunos toques adicionales.

## Por qué Totem

Con todo el respeto a tttool y los autores, el proyecto no es muy accesible para personas no técnicas. Hay otros esfuerzos para proporcionar una interfaz gráfica para tttool, pero también son un poco limitados en términos de facilidad de uso.

Al diseñar Totem, establecí las siguientes restricciones:

• No quiero pagar por alojamiento o almacenamiento

• No quiero manejar datos de usuario

• No se requiere instalación

Usando tecnologías web modernas, es posible satisfacer todo lo anterior.

## Cómo funciona

Totem se ejecuta completamente en tu navegador - no hay servidor backend, no hay almacenamiento en la nube, y ningún dato sale nunca de tu computadora. Esto es lo que sucede bajo el capó:

Cuando subes archivos de audio, Totem usa Web Workers (hilos en segundo plano) para decodificar tus archivos MP3 y extraer metadatos como título, artista y portada del álbum. Todo esto sucede localmente en tu navegador.

Cuando guardas el archivo de audiolibro, Totem construye un archivo GME (Game Mode Electronics) - un formato binario especial que los dispositivos Tiptoi entienden. Este archivo contiene tus datos de audio codificados XOR con un valor mágico, junto con una tabla de scripts que le dice al lápiz Tiptoi qué hacer cuando tocas diferentes códigos OID.

Los códigos visuales que imprimes son códigos OID (Optical Identification) - patrones de puntos únicos que el lápiz Tiptoi puede reconocer. Cada código corresponde a una acción específica en el archivo GME, como reproducir una canción en particular o detener la reproducción.

Totem genera estos códigos a 1200 DPI como gráficos SVG que se pueden imprimir. Cuando tocas un código con tu lápiz Tiptoi, lee el patrón, busca el script correspondiente en el archivo GME y reproduce el audio.

Todo el cálculo intensivo (decodificación de MP3, construcción de archivos GME, generación de patrones OID) ocurre en Web Workers para mantener la interfaz receptiva. Toda la aplicación está construida con tecnologías web modernas (React, Vite, TypeScript) y se compila en un sitio estático que puede ejecutarse en cualquier lugar.
