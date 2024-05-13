// file: netlify/edge-functions/edge-detection.ts
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

      if (!fileData || !(fileData instanceof Uint8Array)) {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const inputFile = await Deno.makeTempFile();
      await Deno.writeFile(inputFile, fileData);

      const outputFile = `${inputFile}_edges.jpg`;

      await ImageMagick.read(inputFile, async (img) => {
        img.edge(1);
        await img.write(outputFile);
      });

      const edges = await Deno.readFile(outputFile);
      await Deno.remove(inputFile);
      await Deno.remove(outputFile);

      return new Response(edges, {
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

export const config = { path: "/api/edge-detection" };
