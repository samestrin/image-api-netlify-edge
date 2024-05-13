// file: netlify/edge-functions/crop-image.ts
import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import {
  ImageMagick,
  initialize,
  MagickImage,
  MagickGeometry,
} from "https://deno.land/x/imagemagick_deno/mod.ts";

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
          const geometry = new MagickGeometry(width, height, x, y);
          image.crop(geometry);
          return await image.write((data: Uint8Array) => data);
        }
      );

      return new Response(cropped, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
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
