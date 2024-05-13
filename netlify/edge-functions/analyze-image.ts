// file: netlify/edge-functions/analyze-image.ts
import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import {
  ImageMagick,
  initialize,
  MagickImage,
  PixelCollection,
} from "https://deno.land/x/imagemagick_deno/mod.ts";

await initialize();

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

// Helper function to get brightness using ImageMagick
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

  console.log(`Calculated Brightness: ${brightness}`);
  return brightness;
}

// Custom function to get histogram data
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
