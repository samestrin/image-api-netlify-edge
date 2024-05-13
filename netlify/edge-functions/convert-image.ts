import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import {
  ImageMagick,
  initialize,
  MagickImage,
  MagickFormat,
} from "https://deno.land/x/imagemagick_deno@0.0.26/mod.ts";

await initialize();

/**
 * Handles the image conversion request.
 *
 * @param request - The incoming HTTP request.
 * @returns The HTTP response with the converted image or an error message.
 * @throws Will throw an error if the request method is not POST or if processing fails.
 *
 * @example
 * // How to call the function.
 * fetch('/api/convert-image', { method: 'POST', body: formData });
 */
export default async (request: Request) => {
  if (request.method === "POST") {
    try {
      const form = await multiParser(request);
      const fileData = form.files.file.content;
      const targetFormat = form.fields.targetFormat;

      if (!fileData || !(fileData instanceof Uint8Array) || !targetFormat) {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const targetFormatEnum =
        MagickFormat[capitalizeWords(targetFormat.toLowerCase())];
      if (!targetFormatEnum) {
        return new Response(JSON.stringify({ error: "Unsupported format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const converted = await ImageMagick.read(
        fileData,
        async (image: MagickImage) => {
          return await image.write(
            targetFormatEnum,
            (data: Uint8Array) => data
          );
        }
      );

      if (!converted) {
        return new Response(JSON.stringify({ error: "Failed converting" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(converted, {
        status: 200,
        headers: {
          "Content-Type": `image/${targetFormat.toLowerCase()}`,
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

/**
 * Capitalizes the first letter of each word in a string.
 *
 * @param str - The string to capitalize.
 * @returns The capitalized string.
 *
 * @example
 * // How to use the function.
 * const capitalized = capitalizeWords("example string");
 */
function capitalizeWords(str: string): string {
  const words = str.split(" ");
  const capitalizedWords = words.map((word) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
  const capitalizedString = capitalizedWords.join(" ");
  return capitalizedString;
}

export const config = { path: "/api/convert-image" };
