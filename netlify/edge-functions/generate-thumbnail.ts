import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import {
  ImageMagick,
  initialize,
  MagickImage,
  MagickFormat,
  MagickGeometry,
} from "https://deno.land/x/imagemagick_deno@0.0.26/mod.ts";

await initialize();

/**
 * Handles the image thumbnail generation request.
 *
 * @param request - The incoming HTTP request.
 * @returns The HTTP response with the generated thumbnail or an error message.
 * @throws Will throw an error if the request method is not POST or if processing fails.
 *
 * @example
 * // How to call the function.
 * fetch('/api/generate-thumbnail', { method: 'POST', body: formData });
 */
export default async (request: Request) => {
  if (request.method === "POST") {
    try {
      const form = await multiParser(request);

      const fileData = form.files.file.content;
      const width = parseInt(form.fields.width) || 100; // Default width
      const height = parseInt(form.fields.height) || 100; // Default height

      if (
        !fileData ||
        !(fileData instanceof Uint8Array) ||
        isNaN(width) ||
        isNaN(height)
      ) {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const thumbnail = await ImageMagick.read(
        fileData,
        async (image: MagickImage) => {
          const geometry = new MagickGeometry(width, height);
          image.resize(geometry);

          const data = await image.write(
            MagickFormat.Png,
            (data: Uint8Array) => data
          );

          return data;
        }
      );

      if (!thumbnail || thumbnail.length === 0) {
        return new Response(
          JSON.stringify({ error: "Failed to generate thumbnail" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(thumbnail, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Length": thumbnail.length.toString(),
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

export const config = { path: "/api/generate-thumbnail" };
