(function() {
    function init() {
        console.log('Scalefy Widget: Initializing...');
        const script = document.currentScript || document.querySelector('script[data-bot-id]');
        if (!script) {
            console.error('Scalefy Widget: Script tag not found');
            return;
        }
        
        const botId = script.getAttribute('data-bot-id');
        const API_BASE = script.src.split('/public')[0] || 'http://localhost:5000';

        if (!botId) {
            console.error('Scalefy Widget: data-bot-id is missing');
            return;
        }

        const isMobile = window.innerWidth < 480;
        console.log('Scalefy Widget: Bot ID found:', botId, '| Mobile:', isMobile);

        const primaryColor = '#10b981';

        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes scalefy-pulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                50% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
            }
            @keyframes scalefy-bounce-in {
                from { transform: scale(0.5); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            @keyframes scalefy-slide-up {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes scalefy-typing-dot {
                0%, 60% { transform: translateY(0); }
                30% { transform: translateY(-4px); }
            }
            #scalefy-widget-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            #scalefy-bubble {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(52, 211, 153, 0.9));
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
                cursor: pointer;
                display: flex !important;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s, box-shadow 0.2s;
                animation: scalefy-pulse 2s infinite;
            }
            #scalefy-bubble:hover { 
                transform: scale(1.1); 
                animation: none;
                box-shadow: 0 12px 40px rgba(16, 185, 129, 0.4);
            }
            #scalefy-chat-window {
                display: none;
                position: fixed;
                ${isMobile ? 'width: 100vw; height: 100vh; top: 0; left: 0; border-radius: 0;' : 'width: 380px; height: 580px; bottom: 90px; right: 20px;'}
                background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 20px;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1) inset;
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
            }
            #scalefy-chat-header {
                padding: ${isMobile ? '16px 20px 16px 24px' : '16px 20px'};
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.05));
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #scalefy-header-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            #scalefy-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${primaryColor}, #34d399);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }
            #scalefy-header-text {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            #scalefy-bot-name {
                font-size: 15px;
                font-weight: 600;
                color: #fff;
            }
            #scalefy-status {
                font-size: 12px;
                color: #22c55e;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            #scalefy-status-dot {
                width: 6px;
                height: 6px;
                background: #22c55e;
                border-radius: 50%;
            }
            #scalefy-close {
                cursor: pointer;
                color: rgba(255, 255, 255, 0.5);
                font-size: 20px;
                padding: 8px;
                transition: color 0.2s;
            }
            #scalefy-close:hover { color: #fff; }
            #scalefy-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .scalefy-msg {
                max-width: 85%;
                padding: 12px 16px;
                border-radius: 18px;
                font-size: 14px;
                line-height: 1.5;
                animation: scalefy-slide-up 0.3s ease-out;
            }
            .scalefy-msg-model { 
                background: rgba(255, 255, 255, 0.08);
                color: #e2e8f0;
                align-self: flex-start; 
                border-bottom-left-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.06);
            }
            .scalefy-msg-user { 
                background: linear-gradient(135deg, ${primaryColor}, #34d399);
                color: #fff;
                align-self: flex-end; 
                border-bottom-right-radius: 4px;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }
            .scalefy-typing {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 12px 16px;
            }
            .scalefy-typing-dot {
                width: 6px;
                height: 6px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                animation: scalefy-typing-dot 1.4s infinite;
            }
            .scalefy-typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .scalefy-typing-dot:nth-child(3) { animation-delay: 0.4s; }
            #scalefy-input-container {
                padding: ${isMobile ? '16px 24px 32px' : '16px 20px'};
                background: rgba(0, 0, 0, 0.2);
                border-top: 1px solid rgba(255, 255, 255, 0.06);
                display: flex;
                gap: 12px;
                align-items: center;
            }
            #scalefy-input {
                flex: 1;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 12px 18px;
                color: #fff !important;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s, background 0.2s;
            }
            #scalefy-input::placeholder { color: rgba(255, 255, 255, 0.4); }
            #scalefy-input:focus { 
                border-color: ${primaryColor};
                background: rgba(255, 255, 255, 0.1);
            }
            #scalefy-send {
                width: 44px;
                height: 44px;
                background: linear-gradient(135deg, ${primaryColor}, #34d399);
                border: none;
                border-radius: 50%;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
            }
            #scalefy-send:hover { 
                transform: scale(1.05);
                box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
            }
            #scalefy-send:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'scalefy-widget-container';
        container.innerHTML = `
            <div id="scalefy-chat-window">
                <div id="scalefy-chat-header">
                    <div id="scalefy-header-content">
                        <div id="scalefy-avatar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <div id="scalefy-header-text">
                            <span id="scalefy-bot-name">AI Assistant</span>
                            <span id="scalefy-status"><span id="scalefy-status-dot"></span>Online</span>
                        </div>
                    </div>
                    <span id="scalefy-close">✕</span>
                </div>
                <div id="scalefy-messages"></div>
                <div id="scalefy-input-container">
                    <input type="text" id="scalefy-input" placeholder="Type a message...">
                    <button id="scalefy-send">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
            <div id="scalefy-bubble">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
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
        const avatar = document.getElementById('scalefy-avatar');
        const statusDot = document.getElementById('scalefy-status-dot');

        let history = [];
        let config = null;

        fetch(`${API_BASE}/api/bots/${botId}`)
            .then(res => res.json())
            .then(data => {
                config = data;
                botNameSpan.innerText = config.name || 'AI Assistant';
                if (config.primary_color) {
                    const color = config.primary_color;
                    bubble.style.background = `linear-gradient(135deg, ${color}, ${color}cc)`;
                    avatar.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
                    sendBtn.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
                    style.innerHTML = style.innerHTML.replace('#10b981', color);
                    style.innerHTML = style.innerHTML.replace('rgba(16, 185, 129, 0.4)', color + '66');
                    style.innerHTML = style.innerHTML.replace('rgba(16, 185, 129, 0.3)', color + '4d');
                }
                addMessage('model', config.welcome_message || 'Hello! How can I help you today?', true);
            })
            .catch(err => {
                console.error('Failed to load bot config:', err);
            });

        bubble.onclick = () => {
            chatWindow.style.display = 'flex';
            bubble.style.display = 'none';
            input.focus();
        };

        closeBtn.onclick = () => {
            chatWindow.style.display = 'none';
            bubble.style.display = 'flex';
        };

        function showTyping() {
            const typing = document.createElement('div');
            typing.className = 'scalefy-msg scalefy-msg-model scalefy-typing';
            typing.id = 'scalefy-typing-indicator';
            typing.innerHTML = '<span class="scalefy-typing-dot"></span><span class="scalefy-typing-dot"></span><span class="scalefy-typing-dot"></span>';
            messagesDiv.appendChild(typing);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function hideTyping() {
            const typing = document.getElementById('scalefy-typing-indicator');
            if (typing) typing.remove();
        }

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
            sendBtn.disabled = true;
            addMessage('user', text);
            showTyping();

            try {
                const res = await fetch(`${API_BASE}/api/bots/${botId}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, history })
                });
                const data = await res.json();
                hideTyping();
                addMessage('model', data.response);
            } catch (err) {
                hideTyping();
                addMessage('model', 'Sorry, I am having trouble connecting. Please try again.');
            } finally {
                sendBtn.disabled = false;
                input.focus();
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
