import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import {
  ImageMagick,
  initialize,
  MagickImage,
  PixelCollection,
} from "https://deno.land/x/imagemagick_deno/mod.ts";

await initialize();

/**
 * Handles the image analysis request.
 *
 * @param request - The incoming HTTP request.
 * @returns The HTTP response with brightness and histogram data or an error message.
 * @throws Will throw an error if the request method is not POST or if processing fails.
 *
 * @example
 * // How to call the function.
 * fetch('/api/analyze-image', { method: 'POST', body: formData });
 */
export default async (request: Request) => {
  if (request.method === "POST") {
    try {
      const form = await multiParser(request);
      const fileData = form.files.file.content;

      if (!fileData || !(fileData instanceof Uint8Array)) {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const brightness = await getBrightness(fileData);
      const histogram = getHistogram(fileData);

      return new Response(JSON.stringify({ brightness, histogram }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
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

export const config = { path: "/api/analyze-image" };

/**
 * Calculates the brightness of an image.
 *
 * @param data - The image data as a Uint8Array.
 * @returns The average brightness of the image.
 * @throws Will throw an error if reading the image fails.
 *
 * @example
 * // How to use the function.
 * const brightness = await getBrightness(fileData);
 */
async function getBrightness(data: Uint8Array): Promise<number> {
  let brightness = 0;
  await ImageMagick.read(data, (image: MagickImage) => {
    const totalPixels = image.width * image.height;
    const pixels = new PixelCollection(image);
    let totalBrightness = 0;

    // Use getArea to retrieve all pixels at once
    const pixelData = pixels.getArea(0, 0, image.width, image.height);

    for (let i = 0; i < pixelData.length; i += 4) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];
      const pixelBrightness = (r + g + b) / 3;
      totalBrightness += pixelBrightness;
    }

    if (totalPixels > 0) {
      brightness = totalBrightness / totalPixels;
    }
  });

  return brightness;
}

/**
 * Generates the histogram of an image.
 *
 * @param data - The image data as a Uint8Array.
 * @returns An object representing the histogram of the image.
 * @throws Will throw an error if generating the histogram fails.
 *
 * @example
 * // How to use the function.
 * const histogram = getHistogram(fileData);
 */
function getHistogram(data: Uint8Array): Record<string, number> {
  const histogram: Record<string, number> = {};
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = `${r},${g},${b}`;
    if (!histogram[key]) {
      histogram[key] = 0;
    }
    histogram[key]++;
  }
  return histogram;
}
