// file: netlify/edge-functions/image-dimensions.ts
import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";

export default async (request: Request) => {
  if (request.method === "POST") {
    try {
      // Parse the multipart/form-data from the request
      const form = await multiParser(request);

      const fileData = form.files.file.content;

      if (!fileData || !(fileData instanceof Uint8Array)) {
        return new Response(
          JSON.stringify({ error: "No file uploaded or invalid file type" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const filename = form.files.file.filename || "";
      const contentType = form.files.file.contentType;

      let dimensions;
      switch (contentType) {
        case "image/jpeg":
          dimensions = getJpegDimensions(fileData);
          break;
        case "image/png":
          dimensions = getPngDimensions(fileData);
          break;
        case "image/gif":
          dimensions = getGifDimensions(fileData);
          break;
        case "image/bmp":
          dimensions = getBmpDimensions(fileData);
          break;
        case "image/tiff":
          dimensions = getTiffDimensions(fileData);
          break;
        case "image/svg+xml":
          dimensions = getSvgDimensions(fileData);
          break;
        default:
          throw new Error("Unsupported image format");
      }

      return new Response(JSON.stringify({ filename, dimensions }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }
  return new Response("Method Not Allowed", { status: 405 });
};

function getJpegDimensions(data: Uint8Array): {
  width: number;
  height: number;
} {
  let position = 2; // Skip the initial 0xFFD8 marker
  while (position < data.length) {
    if (data[position] !== 0xff) {
      throw new Error("Invalid JPEG file");
    }
    position++;
    const marker = data[position];
    position++;
    if (marker === 0xda) {
      // Start of Stream (SOS) marker, end of header info
      throw new Error(
        "Reached the image data section without finding dimensions"
      );
    }
    const chunkLength = (data[position] << 8) + data[position + 1];
    position += 2;
    if (marker === 0xc0 || marker === 0xc2) {
      // Start of Frame markers
      const height = (data[position + 3] << 8) + data[position + 4];
      const width = (data[position + 5] << 8) + data[position + 6];
      return { width, height };
    }
    position += chunkLength - 2;
  }
  throw new Error("No size information found in JPEG");
}

function getPngDimensions(data: Uint8Array): { width: number; height: number } {
  if (
    data[0] !== 0x89 ||
    data[1] !== 0x50 ||
    data[2] !== 0x4e ||
    data[3] !== 0x47
  ) {
    throw new Error("Invalid PNG file");
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const width = view.getUint32(16); // 16 is the offset for the width in the IHDR chunk
  const height = view.getUint32(20); // 20 is the offset for the height in the IHDR chunk
  return { width, height };
}

function getGifDimensions(data: Uint8Array): { width: number; height: number } {
  if (data[0] !== 0x47 || data[1] !== 0x49 || data[2] !== 0x46) {
    throw new Error("Invalid GIF file");
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const width = view.getUint16(6, true); // 6 is the offset for the width, true for little-endian
  const height = view.getUint16(8, true); // 8 is the offset for the height, true for little-endian
  return { width, height };
}

function getBmpDimensions(data: Uint8Array): { width: number; height: number } {
  const view = new DataView(data.buffer);
  const width = view.getInt32(18, true); // Little endian
  const height = view.getInt32(22, true); // Little endian
  return { width, height };
}

function getTiffDimensions(data: Uint8Array): {
  width: number;
  height: number;
} {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const isLittleEndian = view.getUint16(0, false) === 0x4949; // 'II' for Intel (little-endian)

  // Read the offset to the first IFD (Image File Directory)
  const firstIfdOffset = view.getUint32(4, isLittleEndian);

  // Move to the first IFD and read the number of entries it contains
  const numEntries = view.getUint16(firstIfdOffset, isLittleEndian);

  let width = 0;
  let height = 0;

  // Iterate over each entry in the IFD
  for (let i = 0; i < numEntries; i++) {
    const entryOffset = firstIfdOffset + 2 + i * 12; // Each entry is 12 bytes
    const tag = view.getUint16(entryOffset, isLittleEndian);
    const type = view.getUint16(entryOffset + 2, isLittleEndian);
    const count = view.getUint32(entryOffset + 4, isLittleEndian);
    const valueOffset = entryOffset + 8;

    // Check if the value fits in 4 bytes, if so, it's stored in the offset field
    let actualValueOffset = view.getUint32(valueOffset, isLittleEndian);
    if (type === 3 && count === 1) {
      // Type 3 is SHORT, and if count is 1, value fits in 4 bytes
      actualValueOffset = valueOffset; // The value is actually here, not at some other offset
    }

    if (tag === 256) {
      // Width tag
      width = view.getUint32(actualValueOffset, isLittleEndian);
    } else if (tag === 257) {
      // Height tag
      height = view.getUint32(actualValueOffset, isLittleEndian);
    }
  }

  if (width === 0 || height === 0) {
    throw new Error("Width or Height not found in TIFF tags");
  }

  return { width, height };
}

function getSvgDimensions(data: Uint8Array): { width: number; height: number } {
  const decoder = new TextDecoder("utf-8");
  const svgContent = decoder.decode(data);
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, "image/svg+xml");
  const svgElement = doc.documentElement;
  const width = parseFloat(svgElement.getAttribute("width") || "0");
  const height = parseFloat(svgElement.getAttribute("height") || "0");
  return { width, height };
}

export const config = { path: "/api/image-dimensions" };
