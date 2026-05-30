/* ============================================================
   AI Chat Hub — App Logic
   ============================================================ */

let models = [];
let currentModel = null;
let chatHistory = [];
let isStreaming = false;

const modelList     = document.getElementById('modelList');
const activeModelName = document.getElementById('activeModelName');
const activeModelCtx  = document.getElementById('activeModelCtx');
const chatArea      = document.getElementById('chatArea');
const messages      = document.getElementById('messages');
const welcomeScreen = document.getElementById('welcomeScreen');
const userInput     = document.getElementById('userInput');
const sendBtn       = document.getElementById('sendBtn');
const clearBtn      = document.getElementById('clearBtn');
const modelSearch   = document.getElementById('modelSearch');
const menuBtn       = document.getElementById('menuBtn');
const sidebar       = document.getElementById('sidebar');

/* ===================== INIT ===================== */
async function init() {
  try {
    const res = await fetch('/api/models');
    models = await res.json();
    renderModelList(models);
  } catch (e) {
    modelList.innerHTML = '<div class="loading-models" style="color:#ff5c5c">Failed to load models</div>';
  }
}

/* ===================== RENDER MODELS ===================== */
function renderModelList(list) {
  if (!list.length) {
    modelList.innerHTML = '<div class="loading-models">No models found</div>';
    return;
  }

  modelList.innerHTML = list.map(m => `
    <div class="model-item${currentModel?.id === m.id ? ' active' : ''}"
         data-id="${m.id}"
         onclick="selectModel('${m.id}')">
      <div class="model-item-top">
        <span class="model-name">${m.name}</span>
        ${m.badge ? `<span class="model-badge">${m.badge}</span>` : ''}
      </div>
      <div class="model-meta">
        <span class="model-provider">${m.provider}</span>
        <span class="model-ctx">${m.context}</span>
      </div>
      ${m.capabilities.length ? `
        <div class="model-caps">
          ${m.capabilities.map(c => `<span class="cap-tag">${c}</span>`).join('')}
        </div>` : ''}
    </div>
  `).join('');
}

/* ===================== SELECT MODEL ===================== */
function selectModel(id) {
  const model = models.find(m => m.id === id);
  if (!model) return;

  currentModel = model;
  chatHistory = [];
  messages.innerHTML = '';

  // Update active states
  document.querySelectorAll('.model-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });

  // Update topbar
  activeModelName.textContent = model.name;
  activeModelCtx.textContent  = model.context + ' ctx';

  // Hide welcome
  welcomeScreen.style.display = 'none';
  messages.style.display = 'flex';

  // Close sidebar on mobile
  sidebar.classList.remove('open');

  userInput.focus();
}

/* ===================== SEND MESSAGE ===================== */
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isStreaming) return;

  if (!currentModel) {
    alert('Please select a model first!');
    return;
  }

  userInput.value = '';
  autoResize();

  // Add user message
  chatHistory.push({ role: 'user', content: text });
  appendMessage('user', text);

  // Show typing
  const typingEl = appendTyping();
  isStreaming = true;
  sendBtn.disabled = true;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: currentModel.id,
        messages: chatHistory,
        stream: false,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || data.error || 'API Error ' + res.status);
    }

    const reply = data.choices?.[0]?.message?.content || '(empty response)';
    chatHistory.push({ role: 'assistant', content: reply });
    typingEl.remove();
    appendMessage('assistant', reply, currentModel.name);

  } catch (err) {
    typingEl.remove();
    appendErrorMessage(err.message);
  } finally {
    isStreaming = false;
    sendBtn.disabled = false;
    scrollToBottom();
  }
}

/* ===================== APPEND HELPERS ===================== */
function appendMessage(role, content, modelName = null) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const avatar = role === 'user' ? '👤' : '⬡';
  const modelLabel = (role === 'assistant' && modelName)
    ? `<div class="msg-model">${modelName}</div>` : '';

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-content">
      ${modelLabel}
      <div class="msg-text">${formatText(content)}</div>
    </div>
  `;

  messages.appendChild(div);
  scrollToBottom();
  return div;
}

function appendTyping() {
  const div = document.createElement('div');
  div.className = 'message assistant';
  div.innerHTML = `
    <div class="msg-avatar">⬡</div>
    <div class="msg-content">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messages.appendChild(div);
  scrollToBottom();
  return div;
}

function appendErrorMessage(msg) {
  const div = document.createElement('div');
  div.className = 'message assistant';
  div.innerHTML = `
    <div class="msg-avatar">⬡</div>
    <div class="msg-content">
      <div class="msg-error">⚠️ ${escapeHtml(msg)}</div>
    </div>
  `;
  messages.appendChild(div);
  scrollToBottom();
}

/* ===================== TEXT FORMATTING ===================== */
function formatText(text) {
  // Escape HTML first
  let t = escapeHtml(text);

  // Code blocks ```lang\n...\n```
  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="lang-${lang || 'text'}">${code.trim()}</code></pre>`
  );

  // Inline code `...`
  t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Bold **text**
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic *text*
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Newlines
  t = t.replace(/\n/g, '<br>');

  return t;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scrollToBottom() {
  chatArea.scrollTop = chatArea.scrollHeight;
}

/* ===================== SEARCH & FILTER ===================== */
let activeFilter = 'all';

modelSearch.addEventListener('input', applyFilters);

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    applyFilters();
  });
});

function applyFilters() {
  const q = modelSearch.value.toLowerCase();
  const filtered = models.filter(m => {
    const matchText = m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q);
    const matchFilter = activeFilter === 'all' || m.capabilities.includes(activeFilter);
    return matchText && matchFilter;
  });
  renderModelList(filtered);
}

/* ===================== WELCOME CARDS ===================== */
function setPrompt(text) {
  userInput.value = text;
  autoResize();
  userInput.focus();
}

/* ===================== KEYBOARD EVENTS ===================== */
userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

clearBtn.addEventListener('click', () => {
  if (!currentModel) return;
  chatHistory = [];
  messages.innerHTML = '';
});

menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

/* Click outside sidebar on mobile */
document.addEventListener('click', e => {
  if (window.innerWidth <= 720 &&
      !sidebar.contains(e.target) &&
      !menuBtn.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

/* ===================== AUTO RESIZE TEXTAREA ===================== */
function autoResize() {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';
}

userInput.addEventListener('input', autoResize);

/* ===================== START ===================== */
init();
