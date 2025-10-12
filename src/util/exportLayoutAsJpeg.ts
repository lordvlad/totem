export interface PhotoSize {
  name: string;
  widthCm: number;
  heightCm: number;
}

export const PHOTO_SIZES: PhotoSize[] = [
  { name: "12.7 × 8.9 cm", widthCm: 12.7, heightCm: 8.9 },
  { name: "15.2 × 10.2 cm", widthCm: 15.2, heightCm: 10.2 },
  { name: "16.9 × 11.4 cm", widthCm: 16.9, heightCm: 11.4 },
  { name: "17.8 × 12.7 cm", widthCm: 17.8, heightCm: 12.7 },
];

const DPI = 1200;
const CM_TO_INCH = 1 / 2.54;

function cmToPixels(cm: number): number {
  return Math.round(cm * CM_TO_INCH * DPI);
}

interface SvgToCanvasParams {
  svg: SVGSVGElement;
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

async function svgToCanvas(params: SvgToCanvasParams): Promise<void> {
  const { svg, canvas, x, y, scaleX, scaleY } = params;
  const svgClone = svg.cloneNode(true);
  if (!(svgClone instanceof SVGSVGElement)) {
    return;
  }

  const svgString = new XMLSerializer().serializeToString(svgClone);
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load SVG at position ${x},${y}`));
    };
    img.src = url;
  });

  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("Failed to get canvas context");
  }

  ctx.drawImage(img, x, y, img.width * scaleX, img.height * scaleY);
}

export async function exportLayoutAsJpeg(
  element: HTMLElement,
  photoSize: PhotoSize,
  fileName: string,
): Promise<void> {
  const widthPx = cmToPixels(photoSize.widthCm);
  const heightPx = cmToPixels(photoSize.heightCm);

  const containerRect = element.getBoundingClientRect();
  const scaleX = widthPx / containerRect.width;
  const scaleY = heightPx / containerRect.height;

  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("Failed to get canvas context");
  }

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, widthPx, heightPx);

  const svgElements = element.querySelectorAll("svg");

  await Promise.all(
    Array.from(svgElements).map(async (svg) => {
      const rect = svg.getBoundingClientRect();
      const x = (rect.left - containerRect.left) * scaleX;
      const y = (rect.top - containerRect.top) * scaleY;
      await svgToCanvas({ svg, canvas, x, y, scaleX, scaleY });
    }),
  );

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          reject(new Error("Failed to create JPEG blob"));
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        resolve();
      },
      "image/jpeg",
      0.95,
    );
  });
}
