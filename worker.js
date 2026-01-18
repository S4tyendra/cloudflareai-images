import { Ai } from '@cloudflare/ai';

const ALLOWED_MODELS = {
  "flux-2-klein": "@cf/black-forest-labs/flux-2-klein-4b",
  "flux-2-dev": "@cf/black-forest-labs/flux-2-dev",
  "lucid-origin": "@cf/leonardo/lucid-origin",
  "phoenix-1.0": "@cf/leonardo/phoenix-1.0",
  "flux-1-schnell": "@cf/black-forest-labs/flux-1-schnell",
  "sdxl-lightning": "@cf/bytedance/stable-diffusion-xl-lightning",
  "dreamshaper-8-lcm": "@cf/lykon/dreamshaper-8-lcm",
  "sd-v1-5-img2img": "@cf/runwayml/stable-diffusion-v1-5-img2img",
  "sd-v1-5-inpainting": "@cf/runwayml/stable-diffusion-v1-5-inpainting",
  "sdxl-base": "@cf/stabilityai/stable-diffusion-xl-base-1.0"
};

const TEXT_GENERATION_MODEL = "@cf/meta/llama-3.1-8b-instruct";

function truncateWords(str, maxChars) {
  if (str.length <= maxChars) return str;
  return str.slice(0, maxChars).replace(/\s+\S*$/, '');
}


export default {
  async fetch(request, env) {
    const ai = new Ai(env.AI);
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== env.SECRET_KEY) {
      return new Response('Unauthorized: Invalid or missing x-api-key', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    if (request.method === 'GET' && url.pathname === '/models') {
      return new Response(JSON.stringify({ 
        models: Object.keys(ALLOWED_MODELS).concat(["auto"]),
        details: ALLOWED_MODELS 
      }, null, 2), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        let { prompt, model = 'auto' } = body;

        if (!prompt) {
          return new Response('Missing parameter: prompt', { status: 400, headers: corsHeaders });
        }

        let selectedModelId = null;

        if (model === 'auto') {
          const systemPrompt = `You are an expert AI art curator. 
          Analyze the following image generation prompt and select the single best model ID from the provided list that would generate the highest quality result for this specific style.
          
          Available Models:
          ${JSON.stringify(ALLOWED_MODELS, null, 2)}
          
          Rules:
          1. For photorealism or general high quality, prefer 'flux-2-dev' or 'flux-1-schnell'.
          2. For speed, prefer 'flux-2-klein' or 'sdxl-lightning'.
          3. For artistic/painterly styles, consider 'dreamshaper-8-lcm'.
          4. Return ONLY the raw value of the model ID (e.g., @cf/black-forest-labs/flux-2-dev). Do not return JSON or markdown. just model name. one line. nothing else. `;

          const selection = await ai.run(TEXT_GENERATION_MODEL, {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Prompt: "${truncateWords(prompt, 400)}"` }
            ]
          });

          selectedModelId = selection.response.trim().replace(/['"`]/g, '');
          
          const validIds = Object.values(ALLOWED_MODELS);
          if (!validIds.includes(selectedModelId)) {
            selectedModelId = ALLOWED_MODELS['flux-1-schnell'];
          }

        } else {
          if (ALLOWED_MODELS[model]) {
            selectedModelId = ALLOWED_MODELS[model];
          } else if (Object.values(ALLOWED_MODELS).includes(model)) {
            selectedModelId = model;
          } else {
             return new Response('Invalid model specified', { status: 400, headers: corsHeaders });
          }
        }


        const response = await ai.run(selectedModelId, { prompt: truncateWords(prompt,1024) });

        return new Response(response, {
          headers: {
            'Content-Type': 'image/png',
            'X-Model-Used': selectedModelId,
            ...corsHeaders
          }
        });

      } catch (e) {
        return new Response(`Error: ${e.message}`, { status: 500, headers: corsHeaders });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
