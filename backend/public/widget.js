(function() {
    function init() {
        console.log('Scalefy Widget: Initializing...');
        const script = document.currentScript || document.querySelector('script[data-bot-id]');
        if (!script) {
            console.error('Scalefy Widget: Script tag not found');
            return;
        }
        
        const botId = script.getAttribute('data-bot-id');
        const API_BASE = 'http://localhost:5000/api';

        if (!botId) {
            console.error('Scalefy Widget: data-bot-id is missing');
            return;
        }

        console.log('Scalefy Widget: Bot ID found:', botId);

        // Styles
        const style = document.createElement('style');
        style.innerHTML = `
            #scalefy-widget-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            #scalefy-bubble {
                width: 60px;
                height: 60px;
                border-radius: 30px;
                background: #7c3aed;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                cursor: pointer;
                display: flex !important;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s;
            }
            #scalefy-bubble:hover { transform: scale(1.1); }
            #scalefy-chat-window {
                display: none;
                width: 350px;
                height: 500px;
                background: #141414;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            }
            #scalefy-chat-header {
                padding: 15px;
                background: #7c3aed;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #scalefy-messages {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                color: white;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .scalefy-msg {
                max-width: 80%;
                padding: 8px 12px;
                border-radius: 12px;
                font-size: 14px;
            }
            .scalefy-msg-model { background: rgba(255,255,255,0.05); align-self: flex-start; border-bottom-left-radius: 2px; }
            .scalefy-msg-user { background: #7c3aed; align-self: flex-end; border-bottom-right-radius: 2px; }
            #scalefy-input-container {
                padding: 15px;
                border-top: 1px solid rgba(255,255,255,0.1);
                display: flex;
                gap: 10px;
            }
            #scalefy-input {
                flex: 1;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 8px;
                color: white !important;
                outline: none;
            }
            #scalefy-send {
                background: #7c3aed;
                border: none;
                color: white;
                padding: 8px 15px;
                border-radius: 8px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);

        // HTML
        const container = document.createElement('div');
        container.id = 'scalefy-widget-container';
        container.innerHTML = `
            <div id="scalefy-chat-window">
                <div id="scalefy-chat-header">
                    <span id="scalefy-bot-name">AI Assistant</span>
                    <span id="scalefy-close" style="cursor:pointer">✕</span>
                </div>
                <div id="scalefy-messages"></div>
                <div id="scalefy-input-container">
                    <input type="text" id="scalefy-input" placeholder="Type a message...">
                    <button id="scalefy-send">➤</button>
                </div>
            </div>
            <div id="scalefy-bubble">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
        `;
        document.body.appendChild(container);

        const bubble = document.getElementById('scalefy-bubble');
        const chatWindow = document.getElementById('scalefy-chat-window');
        const closeBtn = document.getElementById('scalefy-close');
        const messagesDiv = document.getElementById('scalefy-messages');
        const input = document.getElementById('scalefy-input');
        const sendBtn = document.getElementById('scalefy-send');
        const botNameSpan = document.getElementById('scalefy-bot-name');

        let history = [];
        let config = null;

        // Fetch config
        fetch(`${API_BASE}/bots/${botId}`)
            .then(res => res.json())
            .then(data => {
                config = data;
                botNameSpan.innerText = config.name;
                if (config.primary_color) {
                    bubble.style.background = config.primary_color;
                    document.getElementById('scalefy-chat-header').style.background = config.primary_color;
                    sendBtn.style.background = config.primary_color;
                }
                addMessage('model', config.welcome_message || 'Hello! How can I help you?', true);
            });

        bubble.onclick = () => {
            chatWindow.style.display = 'flex';
            bubble.style.display = 'none';
        };

        closeBtn.onclick = () => {
            chatWindow.style.display = 'none';
            bubble.style.display = 'flex';
        };

        function addMessage(role, text, skipHistory = false) {
            const msg = document.createElement('div');
            msg.className = `scalefy-msg scalefy-msg-${role}`;
            msg.innerText = text;
            messagesDiv.appendChild(msg);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            if (role !== 'system' && !skipHistory) {
                history.push({ role, parts: [{ text }] });
            }
        }

        async function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            input.value = '';
            addMessage('user', text);

            try {
                const res = await fetch(`${API_BASE}/bots/${botId}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, history })
                });
                const data = await res.json();
                addMessage('model', data.response);
            } catch (err) {
                addMessage('model', 'Sorry, I am having trouble connecting.');
            }
        }

        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();
