/**
 * File System Access API Fallback Utilities
 *
 * Browser Support (as of 2024):
 * - Chrome/Edge 86+: Full support
 * - Safari 15.2+: Full support
 * - Firefox: NOT supported (~3-4% market share)
 * - Older browsers: NOT supported (~2-3% market share)
 *
 * Total unsupported audience: ~6-8%
 * Source: caniuse.com/native-filesystem-api
 *
 * This module provides fallbacks for browsers that don't support the File System Access API:
 * - showSaveFilePicker() -> blob download via data URL
 * - showOpenFilePicker() -> regular file input element
 * - DataTransferItem.getAsFileSystemHandle() -> File API
 */

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "showSaveFilePicker" in window &&
    "showOpenFilePicker" in window
  );
}

/**
 * Check if drag-and-drop file system handle API is supported
 */
export function isDragDropFileSystemSupported(): boolean {
  return (
    typeof DataTransferItem !== "undefined" &&
    "getAsFileSystemHandle" in DataTransferItem.prototype
  );
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}

/**
 * Mock FileSystemFileHandle for fallback scenarios
 */
class FallbackFileHandle implements Partial<FileSystemFileHandle> {
  readonly kind = "file" as const;
  readonly name: string;
  private readonly file: File;

  constructor(file: File) {
    this.file = file;
    this.name = file.name;
  }

  async getFile(): Promise<File> {
    return await Promise.resolve(this.file);
  }
}

/**
 * Fallback for showSaveFilePicker using blob download
 * Returns a mock writable stream that downloads the file when closed
 */
export function showSavePickerFallback(options: SaveFilePickerOptions = {}): {
  createWritable: () => Promise<WritableStream>;
} {
  const chunks: Uint8Array[] = [];

  return {
    async createWritable() {
      const writableStream = new WritableStream<Uint8Array>({
        start() {
          // Initialize
        },
        write(chunk) {
          chunks.push(chunk);
        },
        close() {
          // Create blob and trigger download
          const blob = new Blob(chunks);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = options.suggestedName ?? "download";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        },
        abort(reason) {
          console.error("Stream aborted:", reason);
        },
      });

      return await Promise.resolve(writableStream);
    },
  };
}

interface OpenFilePickerOptions {
  multiple?: boolean;
  types?: FilePickerAcceptType[];
}

/**
 * Build accept attribute from file types
 */
// eslint-disable-next-line complexity -- this needs conditional logic for handling different types
function buildAcceptAttribute(types: FilePickerAcceptType[]): string {
  const acceptValues: string[] = [];
  for (const type of types) {
    if (type.accept == null) continue;

    for (const mimeType of Object.keys(type.accept)) {
      acceptValues.push(mimeType);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- accept values can be string or string[]
      const extensions = type.accept[mimeType as keyof typeof type.accept];
      if (Array.isArray(extensions)) {
        acceptValues.push(...extensions);
      } else if (typeof extensions === "string") {
        acceptValues.push(extensions);
      }
    }
  }
  return acceptValues.join(",");
}

/**
 * Fallback for showOpenFilePicker using file input element
 */
export async function showOpenPickerFallback(
  options: OpenFilePickerOptions = {},
): Promise<FileSystemFileHandle[]> {
  return await new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = options.multiple ?? false;

    // Set accept attribute from types
    if (options.types != null && options.types.length > 0) {
      input.accept = buildAcceptAttribute(options.types);
    }

    input.onchange = () => {
      if (input.files != null && input.files.length > 0) {
        const handles = Array.from(input.files).map(
          (file) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- FallbackFileHandle mimics FileSystemFileHandle
            new FallbackFileHandle(file) as unknown as FileSystemFileHandle,
        );
        resolve(handles);
      } else {
        reject(new Error("No files selected"));
      }
    };

    input.oncancel = () => {
      reject(new Error("File selection cancelled"));
    };

    input.click();
  });
}

/**
 * Fallback for DataTransferItem.getAsFileSystemHandle()
 * Extracts File objects instead of FileSystemFileHandle
 */
export function getFileFromDataTransferItem(
  item: DataTransferItem,
): FileSystemFileHandle | null {
  if (item.kind !== "file") {
    return null;
  }

  const file = item.getAsFile();
  if (file == null) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- FallbackFileHandle mimics FileSystemFileHandle
  return new FallbackFileHandle(file) as unknown as FileSystemFileHandle;
}

/**
 * Universal showSaveFilePicker with fallback
 */
export async function showSaveFilePicker(
  options: SaveFilePickerOptions = {},
): Promise<
  FileSystemFileHandle | { createWritable: () => Promise<WritableStream> }
> {
  if (isFileSystemAccessSupported()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-return -- types are compatible but differ in generic constraints
    return window.showSaveFilePicker(options as any) as any;
  }
  return await Promise.resolve(showSavePickerFallback(options));
}

/**
 * Universal showOpenFilePicker with fallback
 */
export async function showOpenFilePicker(
  options: OpenFilePickerOptions = {},
): Promise<FileSystemFileHandle[]> {
  if (isFileSystemAccessSupported()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-return -- types are compatible but differ in generic constraints
    return window.showOpenFilePicker(options as any) as any;
  }
  return await showOpenPickerFallback(options);
}

/**
 * Universal getAsFileSystemHandle with fallback
 */
export async function getAsFileSystemHandle(
  item: DataTransferItem,
): Promise<FileSystemFileHandle | null> {
  if (isDragDropFileSystemSupported()) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API returns FileSystemHandle, we know it's a file
    return await (item.getAsFileSystemHandle() as Promise<FileSystemFileHandle | null>);
  }
  return await Promise.resolve(getFileFromDataTransferItem(item));
}
