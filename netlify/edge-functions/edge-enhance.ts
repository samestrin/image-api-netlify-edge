import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import {
  ImageMagick,
  initialize,
  MagickImage,
  MagickFormat,
  EvaluateOperator,
  Channels,
} from "https://deno.land/x/imagemagick_deno@0.0.26/mod.ts";

await initialize();

export default async (request: Request) => {
  if (request.method === "POST") {
    try {
      const form = await multiParser(request);

      const fileData = form.files.file.content;
      if (!fileData || !(fileData instanceof Uint8Array)) {
        return new Response(JSON.stringify({ error: "Invalid file data" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const processedImage = await ImageMagick.read(
        fileData,
        async (image: MagickImage) => {
          // Apply evaluate method to enhance edges
          image.evaluate(Channels.All, EvaluateOperator.Pow, 1.5);

          const data = await image.write(
            MagickFormat.Png,
            (data: Uint8Array) => data
          );

          return data;
        }
      );

      if (!processedImage || processedImage.length === 0) {
        return new Response(
          JSON.stringify({ error: "Failed to process image" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(processedImage, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Length": processedImage.length.toString(),
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

export const config = { path: "/api/edge-enhance" };
