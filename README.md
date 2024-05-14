# image-api-netlify-edges

[![Star on GitHub](https://img.shields.io/github/stars/samestrin/image-api-netlify-edge?style=social)](https://github.com/samestrin/image-api-netlify-edge/stargazers)[![Fork on GitHub](https://img.shields.io/github/forks/samestrin/image-api-netlify-edge?style=social)](https://github.com/samestrin/image-api-netlify-edge/network/members)[![Watch on GitHub](https://img.shields.io/github/watchers/samestrin/image-api-netlify-edge?style=social)](https://github.com/samestrin/image-api-netlify-edge/watchers)

![Version 0.0.1](https://img.shields.io/badge/Version-0.0.1-blue)[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)[![Built with Node.js](https://img.shields.io/badge/Built%20with-TypeScript-green)](https://www.typescriptlang.org/)

**'image-size-api-netlify-edge'** is a collection of serverless functions for various image processing tasks hosted on Netlify's Edge platform. While Netlify Edge Functions are known for low latency and efficiency, this project aims to explore their capabilities with demanding, resource-intensive workloads. Leveraging Deno and ImageMagick, it covers tasks like image analysis, conversion, cropping, resizing, and thumbnail generation while exploring how far Netlify Edge Functions can go within their resource constraints when tackling potentially intensive image processing operations.

### **Netlify Edge Functions**

Edge functions have limits for their size and the amount of memory and execution time they can use:

- **Code size limit**: 20 MB after compression. This is the maximum edge function bundle size supported.
- **Memory per set of deployed edge functions**: 512 MB
- **CPU execution time per request**: _50 ms_. This tracks all time spent running your scripts. Execution time does not include time spent waiting for resources or responses.
- **Response header timeout**: 40 s

While resource-limited, Netlify provides _1M/month requests_ to edge functions per site at the free tier. Pro members have _2M/month requests_.

### **Features**

- **Analyze Image**: Computes the brightness and histogram of an image.
- **Convert Image**: Converts images to different formats.
- **Crop Image**: Crops images based on specified dimensions.
- **Edge Enhance**: Enhances the edges of an image.
- **Generate Thumbnail**: Creates thumbnails from images with specified dimensions.
- **Image Dimensions**: Extracts the dimensions of various image formats.
- **Resize Image**: Resizes images while maintaining aspect ratio.

### **Dependencies**

- **Netlify**: For deploying serverless functions.
- **Deno**: A secure runtime for JavaScript and TypeScript, used for running the edge functions.
- **ImageMagick**: For performing image manipulations.
- **multiParser**: For parsing multipart form data.

### **Installation**

To set up the project locally, follow these steps:

1.  **Clone the Repository**:

```bash
git clone https://github.com/samestrin/image-size-api-netlify-edge.git
cd image-size-api-netlify-edge
```

2.  **Install Dependencies**: Ensure you have the required dependencies installed. Use npm or yarn to install any necessary packages.

```bash
npm install
```

3.  **Set Up Netlify CLI**: Install the Netlify CLI to deploy and test the functions locally.

```bash

npm install -g netlify-cli
```

4.  **Run the Functions Locally**: Use the Netlify CLI to run the edge functions locally.

```bash
netlify dev
```

### **Configuration**

The `netlify.toml` file contains the configuration for the edge functions. Each function is mapped to a specific endpoint:

```toml
[build]
  publish = "public"
  functions = "netlify/functions"

[[edge_functions]]
  function = "image-dimensions"
  path = "/api/image-dimensions"

[[edge_functions]]
  function = "convert-image"
  path = "/api/convert-image"

[[edge_functions]]
  function = "generate-thumbnail"
  path = "/api/generate-thumbnail"

[[edge_functions]]
  function = "analyze-image"
  path = "/api/analyze-image"

[[edge_functions]]
  function = "crop-image"
  path = "/api/crop-image"

[[edge_functions]]
  function = "resize-image"
  path = "/api/resize-image"

[[edge_functions]]
  function = "edge-enhance"
  path = "/api/edge-enhance"
```

Endpoints Documentation

## Endpoints

### Analyze Image

**Endpoint:** `/api/analyze-image`  
**Method:** POST

Analyzes an image to compute its brightness and histogram.

- `file`: The image file to be analyzed.

#### Example Usage

Use a tool like Postman or curl to make a request:

```bash
curl -X POST \
    https://image-api-edge-function-demo.netlify.app/api/analyze-image \
    -F 'file=@/path/to/image.jpg'
```

The server responds with:

    {
      "brightness": 123.45,
      "histogram": {
        "255,255,255": 100,
        "0,0,0": 50,
        ...
      }
    }

### Convert Image

**Endpoint:** `/api/convert-image`  
**Method:** POST

Converts an image to a specified format.

- `file`: The image file to be converted.
- `targetFormat`: The desired target format (e.g., `png`, `jpeg`).

#### Example Usage

Use a tool like Postman or curl to make a request:

```bash
curl -X POST \
    https://image-api-edge-function-demo.netlify.app/api/convert-image \
    -F 'file=@/path/to/image.jpg' \
    -F 'targetFormat=png'
```

The server responds with the converted image file.

### Crop Image

**Endpoint:** `/api/crop-image`  
**Method:** POST

Crops an image based on the specified dimensions.

- `file`: The image file to be cropped.
- `x`: The x-coordinate of the top-left corner.
- `y`: The y-coordinate of the top-left corner.
- `width`: The width of the cropped area.
- `height`: The height of the cropped area.

#### Example Usage

Use a tool like Postman or curl to make a request:

```bash
curl -X POST \
    https://image-api-edge-function-demo.netlify.app/api/crop-image \
    -F 'file=@/path/to/image.jpg' \
    -F 'x=10' \
    -F 'y=10' \
    -F 'width=100' \
    -F 'height=100'
```

The server responds with the cropped image file.

### Edge Enhance

**Endpoint:** `/api/edge-enhance`  
**Method:** POST

Enhances the edges of an image.

- `file`: The image file to be processed.

#### Example Usage

Use a tool like Postman or curl to make a request:

```bash
curl -X POST \
    https://image-api-edge-function-demo.netlify.app/api/edge-enhance \
    -F 'file=@/path/to/image.jpg'
```

The server responds with the edge-enhanced image file.

### Generate Thumbnail

**Endpoint:** `/api/generate-thumbnail`  
**Method:** POST

Generates a thumbnail from an image with specified dimensions.

- `file`: The image file to be used for generating the thumbnail.
- `width`: The width of the thumbnail.
- `height`: The height of the thumbnail.

#### Example Usage

Use a tool like Postman or curl to make a request:

```bash
curl -X POST \
    https://image-api-edge-function-demo.netlify.app/api/generate-thumbnail \
    -F 'file=@/path/to/image.jpg' \
    -F 'width=100' \
    -F 'height=100'
```

The server responds with the generated thumbnail image.

### Image Dimensions

**Endpoint:** `/api/image-dimensions`  
**Method:** POST

Extracts the dimensions of an image.

- `file`: The image file to be analyzed.

#### Example Usage

Use a tool like Postman or curl to make a request:

```bash
curl -X POST \
    https://image-api-edge-function-demo.netlify.app/api/image-dimensions \
    -F 'file=@/path/to/image.jpg'
```

The server responds with:

    {
      "filename": "image.jpg",
      "dimensions": {
        "width": 800,
        "height": 600
      }
    }

### Resize Image

**Endpoint:** `/api/resize-image`  
**Method:** POST

Resizes an image while maintaining the aspect ratio.

- `file`: The image file to be resized.
- `width`: The desired width of the resized image.
- `height`: The desired height of the resized image.

#### Example Usage

Use a tool like Postman or curl to make a request:

```bash
curl -X POST \
    https://image-api-edge-function-demo.netlify.app/api/resize-image \
    -F 'file=@/path/to/image.jpg' \
    -F 'width=800' \
    -F 'height=600'
```

The server responds with the resized image file.

## Error Handling

The API handles errors gracefully and returns appropriate error responses:

- **400 Bad Request**: Invalid request parameters.
- **404 Not Found**: Resource not found.
- **405 Method Not Allowed**: Invalid request method (not POST).
- **500 Internal Server Error**: Unexpected server error.

## Contribute

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes or improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Share

[![Twitter](https://img.shields.io/badge/X-Tweet-blue)](https://twitter.com/intent/tweet?text=Check%20out%20this%20awesome%20project!&url=https://github.com/samestrin/image-api-netlify-edge) [![Facebook](https://img.shields.io/badge/Facebook-Share-blue)](https://www.facebook.com/sharer/sharer.php?u=https://github.com/samestrin/image-api-netlify-edge) [![LinkedIn](https://img.shields.io/badge/LinkedIn-Share-blue)](https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/samestrin/image-api-netlify-edge)
