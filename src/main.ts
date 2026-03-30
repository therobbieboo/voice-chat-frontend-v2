// OpenAI Realtime Agent - Simple A2A Implementation
import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';

const BACKEND_URL = 'https://voice-chat-backend-production.up.railway.app';

const chatContainer = document.getElementById('chatContainer')!;
const callBtn = document.getElementById('callBtn')! as HTMLButtonElement;
const statusEl = document.getElementById('status')!;

let session: RealtimeSession | null = null;
let isConnected = false;

function addMessage(type: string, text: string) {
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.textContent = text;
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function updateStatus(text: string) {
  statusEl.textContent = text;
}

// Get ephemeral key from our backend
async function getEphemeralKey(): Promise<string> {
  updateStatus('🔄 取得連線密鑰...');
  
  const response = await fetch(BACKEND_URL + '/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-realtime',
      voice: 'alloy'
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to get ephemeral key');
  }
  
  const data = await response.json();
  return data.client_secret.value;
}

// Create and connect to the Realtime Agent
async function startCall() {
  try {
    addMessage('system', '🔄 連接中...');
    updateStatus('🔄 連接 OpenAI...');
    callBtn.classList.add('recording');
    
    // Get ephemeral key
    const ephemeralKey = await getEphemeralKey();
    addMessage('system', '✅ 取得密鑰成功');
    
    // Create the agent
    const agent = new RealtimeAgent({
      name: 'Assistant',
      instructions: '你是個友善的語音助理，請用繁體中文簡潔回覆。'
    });
    
    // Create session
    session = new RealtimeSession(agent, {
      transport: 'webrtc', // Use WebRTC for browser
    });
    
    // Set up event handlers
    session.on('session.started', () => {
      console.log('✅ Session started');
      addMessage('system', '✅ 已連接，開始說話！');
      updateStatus('🎙️ 說話中...');
      isConnected = true;
    });
    
    session.on('conversation.item.completed', (item: any) => {
      console.log('📝 Item completed:', item);
      if (item.content && item.content[0]?.transcript) {
        const text = item.content[0].transcript;
        addMessage('user', `👤 ${text}`);
        updateStatus(`👤 ${text}`);
      }
    });
    
    session.on('response.done', (response: any) => {
      console.log('🤖 Response done:', response);
      if (response.output && response.output[0]?.content) {
        response.output[0].content.forEach((c: any) => {
          if (c.type === 'text' && c.text) {
            addMessage('ai', `🤖 ${c.text}`);
            updateStatus(`🤖 ${c.text}`);
          }
        });
      }
    });
    
    session.on('error', (error: any) => {
      console.error('❌ Error:', error);
      addMessage('system', `❌ 錯誤: ${error.message || error}`);
      updateStatus('❌ 連線錯誤');
    });
    
    // Connect with apiKey in options
    await session.connect({
      apiKey: ephemeralKey,
    });
    
    console.log('🎙️ Connected to OpenAI Realtime API!');
    
  } catch (error) {
    console.error('❌ Failed to connect:', error);
    addMessage('system', `❌ 連線失敗: ${(error as Error).message}`);
    updateStatus('❌ 連線失敗');
    callBtn.classList.remove('recording');
    session = null;
    isConnected = false;
  }
}

function stopCall() {
  if (session) {
    session.close();
    session = null;
  }
  isConnected = false;
  callBtn.classList.remove('recording');
  updateStatus('已斷線');
  addMessage('system', '🔌 已斷線');
}

callBtn.addEventListener('click', () => {
  if (isConnected) {
    stopCall();
  } else {
    startCall();
  }
});

console.log('🚀 OpenAI Realtime A2A Ready');
addMessage('system', '🎙️ 點擊麥克風開始對話');
