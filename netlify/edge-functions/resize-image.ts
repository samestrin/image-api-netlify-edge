import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import {
  ImageMagick,
  initialize,
  MagickImage,
  MagickFormat,
  MagickGeometry,
} from "https://deno.land/x/imagemagick_deno@0.0.26/mod.ts";

await initialize();

export default async (request: Request) => {
  if (request.method === "POST") {
    try {
      const form = await multiParser(request);

      const fileData = form.files.file.content;
      const width = parseInt(form.fields.width);
      const height = parseInt(form.fields.height);

      if (
        !fileData ||
        !(fileData instanceof Uint8Array) ||
        (isNaN(width) && isNaN(height))
      ) {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const resizedImage = await ImageMagick.read(
        fileData,
        async (image: MagickImage) => {
          let newWidth = width;
          let newHeight = height;

          if (!isNaN(width) && isNaN(height)) {
            // Only width is provided, calculate height to maintain aspect ratio
            newHeight = Math.round((image.height / image.width) * width);
          } else if (isNaN(width) && !isNaN(height)) {
            // Only height is provided, calculate width to maintain aspect ratio
            newWidth = Math.round((image.width / image.height) * height);
          }
          console.log(newWidth, newHeight);
          const geometry = new MagickGeometry(newWidth, newHeight);
          image.resize(geometry);
          const data = await image.write(
            MagickFormat.Png,
            (data: Uint8Array) => data
          );
          return data;
        }
      );

      if (!resizedImage || resizedImage.length === 0) {
        return new Response(
          JSON.stringify({ error: "Failed to resize image" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(resizedImage, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Length": resizedImage.length.toString(),
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

export const config = { path: "/api/resize-image" };
