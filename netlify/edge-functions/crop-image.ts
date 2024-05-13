import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import {
  ImageMagick,
  initialize,
  MagickImage,
  MagickGeometry,
  MagickFormat,
} from "https://deno.land/x/imagemagick_deno@0.0.26/mod.ts";

await initialize();

export default async (request: Request) => {
  if (request.method === "POST") {
    try {
      const form = await multiParser(request);

      const fileData = form.files.file.content;
      const x = parseInt(form.fields.x) || 0;
      const y = parseInt(form.fields.y) || 0;
      const width = parseInt(form.fields.width);
      const height = parseInt(form.fields.height);

      if (
        !fileData ||
        !(fileData instanceof Uint8Array) ||
        isNaN(x) ||
        isNaN(y) ||
        isNaN(width) ||
        isNaN(height)
      ) {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const cropped = await ImageMagick.read(
        fileData,
        async (image: MagickImage) => {
          // Ensure the cropping area does not exceed the original image dimensions
          const cropWidth = Math.min(width, image.width - x);
          const cropHeight = Math.min(height, image.height - y);

          if (cropWidth <= 0 || cropHeight <= 0) {
            throw new Error("Invalid cropping dimensions");
          }

          const geometry = new MagickGeometry(x, y, cropWidth, cropHeight);

          image.crop(geometry);

          const data = await image.write(
            MagickFormat.Png,
            (data: Uint8Array) => data
          );

          return data;
        }
      );

      if (!cropped || cropped.length === 0) {
        return new Response(JSON.stringify({ error: "Failed cropping" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(cropped, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Length": cropped.length.toString(),
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

export const config = { path: "/api/crop-image" };
