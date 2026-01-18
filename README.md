# Cloudflare AI Image Generator

A Cloudflare Worker API that generates images using various Stable Diffusion and Flux models. It supports an "auto" mode that uses a text-to-text model (Llama) to intelligently select the best image model based on your prompt.

## Features

* **Auth**: Protected by `x-api-key` header.

* **Auto-Routing**: Automatically picks the best model for the prompt using `auto` mode.

* **Multiple Models**: Supports Flux, Leonardo, Dreamshaper, and SDXL models.

## Deploy

## API Usage

**Base URL**: `https://your-worker-name.your-subdomain.workers.dev`

### Authentication

All requests must include the header:
`x-api-key: YOUR_CONFIGURED_SECRET_KEY`

### 1. List Models

**GET** `/models`

Returns a list of friendly model names and their corresponding Cloudflare IDs.

### 2. Generate Image

**POST** `/`

**Body:**

```
{
  "prompt": "A futuristic city with flying cars, cyberpunk style",
  "model": "auto" 
}
```

* `model`: (Optional) Can be a specific key (e.g., `flux-2-dev`, `sdxl-lightning`) or `auto`. Defaults to `auto`.

**Response:**
Returns the binary image data (PNG).
Header `X-Model-Used` indicates which model generated the image.

## Configuration

After deploying, make sure to set your secret key:

1. Go to your Cloudflare Dashboard > Workers & Pages.

2. Select your worker.

3. Go to **Settings** > **Variables and Secrets**.

4. Add a variable named `SECRET_KEY` with your desired password/key.

## Supported Models

| Key | Model ID | 
 | ----- | ----- | 
| `flux-2-klein` | `@cf/black-forest-labs/flux-2-klein-4b` | 
| `flux-2-dev` | `@cf/black-forest-labs/flux-2-dev` | 
| `lucid-origin` | `@cf/leonardo/lucid-origin` | 
| `phoenix-1.0` | `@cf/leonardo/phoenix-1.0` | 
| `flux-1-schnell` | `@cf/black-forest-labs/flux-1-schnell` | 
| `sdxl-lightning` | `@cf/bytedance/stable-diffusion-xl-lightning` | 
| `dreamshaper-8-lcm` | `@cf/lykon/dreamshaper-8-lcm` | 
| `sd-v1-5-img2img` | `@cf/runwayml/stable-diffusion-v1-5-img2img` | 
| `sd-v1-5-inpainting` | `@cf/runwayml/stable-diffusion-v1-5-inpainting` | 
| `sdxl-base` | `@cf/stabilityai/stable-diffusion-xl-base-1.0` |
