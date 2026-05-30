# ⬡ AI Chat Hub

Website chat dengan **27 free AI models** dari OpenRouter — DeepSeek, NVIDIA, OpenAI, Google, Meta, Qwen, dan banyak lagi. Semua gratis, tanpa kartu kredit.

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment
File `.env` sudah ada dengan API key. Atau copy dari contoh:
```bash
cp .env.example .env
# Edit .env dan isi OPENROUTER_API_KEY
```

### 3. Jalankan server
```bash
npm start
```

Buka browser → **http://localhost:3000**

### Development (auto-reload)
```bash
npm run dev
```

## 📦 Struktur Project

```
ai-chat-hub/
├── server.js          ← Express backend (proxy ke OpenRouter)
├── package.json
├── .env               ← API key (jangan di-commit ke git!)
├── .env.example       ← Template env
└── public/
    ├── index.html     ← Halaman utama
    ├── style.css      ← Styling
    └── app.js         ← Frontend logic
```

## 🤖 Model Gratis yang Tersedia (27 model)

| Model | Provider | Context | Kemampuan |
|-------|----------|---------|-----------|
| DeepSeek V4 Flash | DeepSeek | 1M | Tools |
| MiniMax M2.5 | MiniMax | 205K | Tools |
| Gemma 4 31B | Google | 262K | Vision, Tools |
| Nemotron 3 Super 120B | NVIDIA | 1M | Tools |
| GPT-OSS 120B | OpenAI | 131K | Tools |
| Qwen3 Coder | Qwen | 1M | Tools |
| Llama 3.3 70B | Meta | 131K | Tools |
| Kimi K2.6 | MoonshotAI | 262K | Vision, Tools |
| Hermes 3 Llama 405B | Nous Research | 131K | — |
| ... dan 18 lainnya | | | |

## ⚠️ Rate Limits (Model Gratis)

- **20 request/menit** per model
- **200 request/hari** per model
- Gratis tanpa kartu kredit

## 🔒 Security

- API key tersimpan di `.env` (server-side saja)
- Frontend tidak pernah melihat API key
- Tambahkan `.env` ke `.gitignore` sebelum push ke GitHub!

```
# .gitignore
.env
node_modules/
```
