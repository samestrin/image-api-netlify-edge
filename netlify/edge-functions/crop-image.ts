// file: netlify/edge-functions/crop-image.ts
import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import {
  ImageMagick,
  initialize,
} from "https://deno.land/x/imagemagick_deno/mod.ts";

await initialize();

export default async (request: Request) => {
  if (request.method === "POST") {
    try {
      const form = await multiParser(request);
      const fileData = form.files.file.content;
      const x = parseInt(form.fields.x);
      const y = parseInt(form.fields.y);
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

      const inputFile = await Deno.makeTempFile();
      await Deno.writeFile(inputFile, fileData);

      const outputFile = `${inputFile}_cropped.jpg`;
      await ImageMagick.convert([
        inputFile,
        "-crop",
        `${width}x${height}+${x}+${y}`,
        outputFile,
      ]);

      const cropped = await Deno.readFile(outputFile);
      await Deno.remove(inputFile);
      await Deno.remove(outputFile);

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
