require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const FREE_MODELS = [
  { id: 'deepseek/deepseek-v4-flash:free',                      name: 'DeepSeek V4 Flash',            provider: 'DeepSeek',        context: '1M',   badge: '🔥 Top', capabilities: ['tools'] },
  { id: 'minimax/minimax-m2.5:free',                             name: 'MiniMax M2.5',                 provider: 'MiniMax',         context: '205K', badge: '',       capabilities: ['tools'] },
  { id: 'google/gemma-4-31b-it:free',                            name: 'Gemma 4 31B',                  provider: 'Google',          context: '262K', badge: '',       capabilities: ['vision', 'tools'] },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free',                name: 'Nemotron 3 Super 120B',        provider: 'NVIDIA',          context: '1M',   badge: '',       capabilities: ['tools'] },
  { id: 'openai/gpt-oss-120b:free',                              name: 'GPT-OSS 120B',                 provider: 'OpenAI',          context: '131K', badge: '',       capabilities: ['tools'] },
  { id: 'google/gemma-4-26b-a4b-it:free',                       name: 'Gemma 4 26B',                  provider: 'Google',          context: '262K', badge: '',       capabilities: ['vision', 'tools'] },
  { id: 'qwen/qwen3-coder:free',                                 name: 'Qwen3 Coder',                  provider: 'Qwen',            context: '1M',   badge: '💻 Code', capabilities: ['tools'] },
  { id: 'openai/gpt-oss-20b:free',                               name: 'GPT-OSS 20B',                  provider: 'OpenAI',          context: '131K', badge: '',       capabilities: ['tools'] },
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free',                   name: 'Nemotron 3 Nano 30B',          provider: 'NVIDIA',          context: '256K', badge: '',       capabilities: ['tools'] },
  { id: 'z-ai/glm-4.5-air:free',                                 name: 'GLM-4.5 Air',                  provider: 'Z.ai',            context: '131K', badge: '',       capabilities: ['tools'] },
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',    name: 'Nemotron Nano Omni 30B',       provider: 'NVIDIA',          context: '256K', badge: '👁 Vision', capabilities: ['vision', 'tools'] },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free',                 name: 'Qwen3 Next 80B',               provider: 'Qwen',            context: '262K', badge: '',       capabilities: ['tools'] },
  { id: 'nvidia/nemotron-nano-12b-v2-vl:free',                   name: 'Nemotron Nano 12B VL',         provider: 'NVIDIA',          context: '128K', badge: '',       capabilities: ['vision', 'tools'] },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',                name: 'Llama 3.3 70B',                provider: 'Meta',            context: '131K', badge: '',       capabilities: ['tools'] },
  { id: 'nvidia/nemotron-nano-9b-v2:free',                       name: 'Nemotron Nano 9B',             provider: 'NVIDIA',          context: '128K', badge: '',       capabilities: ['tools'] },
  { id: 'meta-llama/llama-3.2-3b-instruct:free',                 name: 'Llama 3.2 3B',                 provider: 'Meta',            context: '131K', badge: '⚡ Fast', capabilities: [] },
  { id: 'liquid/lfm-2.5-1.2b-thinking:free',                     name: 'LFM 2.5 1.2B Thinking',       provider: 'LiquidAI',        context: '33K',  badge: '',       capabilities: ['reasoning'] },
  { id: 'liquid/lfm-2.5-1.2b-instruct:free',                     name: 'LFM 2.5 1.2B',                 provider: 'LiquidAI',        context: '33K',  badge: '',       capabilities: [] },
  { id: 'openrouter/owl-alpha',                                   name: 'Owl Alpha',                    provider: 'OpenRouter',      context: '1M',   badge: '',       capabilities: ['tools'] },
  { id: 'poolside/laguna-xs.2:free',                              name: 'Laguna XS.2',                  provider: 'Poolside',        context: '262K', badge: '',       capabilities: ['tools'] },
  { id: 'poolside/laguna-m.1:free',                               name: 'Laguna M.1',                   provider: 'Poolside',        context: '262K', badge: '',       capabilities: ['tools'] },
  { id: 'moonshotai/kimi-k2.6:free',                              name: 'Kimi K2.6',                    provider: 'MoonshotAI',      context: '262K', badge: '',       capabilities: ['vision', 'tools'] },
  { id: 'openrouter/free',                                        name: 'Free Router (Auto)',           provider: 'OpenRouter',      context: '200K', badge: '🎲 Auto', capabilities: ['vision', 'tools'] },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',             name: 'Hermes 3 Llama 405B',          provider: 'Nous Research',   context: '131K', badge: '',       capabilities: [] },
  { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Dolphin Mistral 24B', provider: 'Venice',          context: '33K',  badge: '',       capabilities: [] },
];

// Get all models
app.get('/api/models', (req, res) => {
  res.json(FREE_MODELS);
});

// Chat endpoint (proxy to OpenRouter)
app.post('/api/chat', async (req, res) => {
  const { model, messages, stream } = req.body;

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-cho.onrender.com',
        'X-Title': 'AI Chat Hub',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: stream || false,
        max_tokens: 2048,
      }),
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      response.body.pipe(res);
    } else {
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.json(data);
    }
  } catch (err) {
    console.error('OpenRouter error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ AI Chat Hub running → http://localhost:${PORT}`);
});
