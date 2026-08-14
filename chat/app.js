// Aurum Brain AI - Chat Application
const $ = id => document.getElementById(id);

// Elements
const elements = {
    sidebar: $('sidebar'),
    openSidebar: $('openSidebar'),
    closeSidebar: $('closeSidebar'),
    serverUrl: $('serverUrl'),
    modelName: $('modelName'),
    systemPrompt: $('systemPrompt'),
    temperature: $('temperature'),
    tempValue: $('tempValue'),
    maxTokens: $('maxTokens'),
    maxTokensValue: $('maxTokensValue'),
    checkConnection: $('checkConnection'),
    connectionStatus: $('connectionStatus'),
    chatContainer: $('chatContainer'),
    messages: $('messages'),
    welcome: $('welcome'),
    userInput: $('userInput'),
    sendBtn: $('sendBtn'),
    clearChat: $('clearChat'),
    exportChat: $('exportChat'),
    headerStatus: $('headerStatus')
};

// State
let chatHistory = [];
let isGenerating = false;

// Sidebar toggle
elements.openSidebar.onclick = () => elements.sidebar.classList.remove('hidden');
elements.closeSidebar.onclick = () => elements.sidebar.classList.add('hidden');

// Range sliders
elements.temperature.oninput = () => elements.tempValue.textContent = elements.temperature.value;
elements.maxTokens.oninput = () => elements.maxTokensValue.textContent = elements.maxTokens.value;

// Auto-resize textarea
elements.userInput.oninput = function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    elements.sendBtn.disabled = !this.value.trim();
};

// Enter to send
elements.userInput.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (elements.userInput.value.trim() && !isGenerating) sendMessage();
    }
};

elements.sendBtn.onclick = sendMessage;

// Quick prompts
document.querySelectorAll('.quick-prompt').forEach(btn => {
    btn.onclick = () => {
        elements.userInput.value = btn.dataset.prompt;
        elements.userInput.dispatchEvent(new Event('input'));
        sendMessage();
    };
});

// Clear chat
elements.clearChat.onclick = () => {
    chatHistory = [];
    elements.messages.innerHTML = '';
    elements.welcome.style.display = 'flex';
};

// Export chat
elements.exportChat.onclick = () => {
    if (!chatHistory.length) return;
    const text = chatHistory.map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `aurum-chat-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
};

// Check connection
elements.checkConnection.onclick = async () => {
    const url = elements.serverUrl.value.replace(/\/+$/, '');
    elements.connectionStatus.className = 'status show';
    elements.connectionStatus.textContent = 'Testing connection...';

    try {
        const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
            const data = await res.json();
            const models = data.models?.map(m => m.name).join(', ') || 'none';
            elements.connectionStatus.className = 'status show success';
            elements.connectionStatus.textContent = `✓ Connected! Models: ${models}`;
            elements.headerStatus.innerHTML = '<span class="dot online"></span> Online';
        } else {
            throw new Error('Server responded with error');
        }
    } catch (err) {
        elements.connectionStatus.className = 'status show error';
        elements.connectionStatus.textContent = `✕ Failed: ${err.message}`;
        elements.headerStatus.innerHTML = '<span class="dot offline"></span> Offline';
    }
};

// Send message
async function sendMessage() {
    const text = elements.userInput.value.trim();
    if (!text || isGenerating) return;

    // Hide welcome
    elements.welcome.style.display = 'none';

    // Add user message
    addMessage('user', text);
    chatHistory.push({ role: 'user', content: text });

    // Clear input
    elements.userInput.value = '';
    elements.userInput.style.height = 'auto';
    elements.sendBtn.disabled = true;

    // Show typing indicator
    const typingEl = addTypingIndicator();
    isGenerating = true;

    try {
        const url = elements.serverUrl.value.replace(/\/+$/, '');
        const model = elements.modelName.value.trim() || 'aurum-brain';

        const messages = [];
        const sysPrompt = elements.systemPrompt.value.trim();
        if (sysPrompt) {
            messages.push({ role: 'system', content: sysPrompt });
        }
        messages.push(...chatHistory);

        const res = await fetch(`${url}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
                options: {
                    temperature: parseFloat(elements.temperature.value),
                    num_predict: parseInt(elements.maxTokens.value)
                }
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Remove typing indicator
        typingEl.remove();

        // Stream response
        const aiEl = addMessage('ai', '');
        let fullResponse = '';
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.trim());

            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.message?.content) {
                        fullResponse += json.message.content;
                        aiEl.querySelector('.message-content').textContent = fullResponse;
                        elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
                    }
                } catch {}
            }
        }

        chatHistory.push({ role: 'assistant', content: fullResponse });

    } catch (err) {
        typingEl.remove();
        addMessage('ai', `⚠️ Error: ${err.message}\n\nPastikan Ollama server berjalan di URL yang benar.`);
    }

    isGenerating = false;
}

// Add message to DOM
function addMessage(role, content) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.innerHTML = `
        <div class="message-avatar">${role === 'user' ? '👤' : '🧠'}</div>
        <div class="message-content">${escapeHtml(content)}</div>
    `;
    elements.messages.appendChild(div);
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
    return div;
}

// Typing indicator
function addTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message ai';
    div.innerHTML = `
        <div class="message-avatar">🧠</div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    elements.messages.appendChild(div);
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
    return div;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load saved settings
function loadSettings() {
    const saved = localStorage.getItem('aurum-chat-settings');
    if (saved) {
        const s = JSON.parse(saved);
        if (s.serverUrl) elements.serverUrl.value = s.serverUrl;
        if (s.modelName) elements.modelName.value = s.modelName;
        if (s.systemPrompt) elements.systemPrompt.value = s.systemPrompt;
        if (s.temperature) elements.temperature.value = s.temperature;
        if (s.maxTokens) elements.maxTokens.value = s.maxTokens;
    }
}

// Save settings on change
function saveSettings() {
    localStorage.setItem('aurum-chat-settings', JSON.stringify({
        serverUrl: elements.serverUrl.value,
        modelName: elements.modelName.value,
        systemPrompt: elements.systemPrompt.value,
        temperature: elements.temperature.value,
        maxTokens: elements.maxTokens.value
    }));
}

// Auto-save settings
[elements.serverUrl, elements.modelName, elements.systemPrompt, elements.temperature, elements.maxTokens].forEach(el => {
    el.onchange = saveSettings;
    el.oninput = saveSettings;
});

// Init
loadSettings();
elements.tempValue.textContent = elements.temperature.value;
elements.maxTokensValue.textContent = elements.maxTokens.value;
