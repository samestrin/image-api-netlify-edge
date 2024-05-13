// file: netlify/edge-functions/convert-image.ts
import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import {
  ImageMagick,
  initialize,
  MagickImage,
  MagickFormat,
} from "https://deno.land/x/imagemagick_deno@0.0.26/mod.ts";

await initialize();

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

      // Create temporary files for input and output
      const inputFile = await Deno.makeTempFile();
      const outputFile = `${inputFile}.${targetFormat.toLowerCase()}`;

      // Write the input file data
      await Deno.writeFile(inputFile, fileData);

      // Read and convert the image
      const inputBuffer = await Deno.readFile(inputFile);
      const converted = await ImageMagick.read(
        inputBuffer,
        async (image: MagickImage) => {
          return await image.write(
            targetFormatEnum,
            (data: Uint8Array) => data
          );
        }
      );

      // Write the converted image data to the output file
      await Deno.writeFile(outputFile, converted);

      // Read the converted image data
      const outputData = await Deno.readFile(outputFile);

      // Cleanup temporary files
      await Deno.remove(inputFile);
      await Deno.remove(outputFile);

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

function capitalizeWords(str) {
  // Split the string into an array of words
  const words = str.split(" ");

  // Loop through each word and capitalize the first letter
  const capitalizedWords = words.map((word) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  // Join the capitalized words back into a string
  const capitalizedString = capitalizedWords.join(" ");

  return capitalizedString;
}

export const config = { path: "/api/convert-image" };
