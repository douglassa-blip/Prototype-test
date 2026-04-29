const sessionsEl = document.getElementById('sessions');
const timelineEl = document.getElementById('timeline');
const chatLogEl = document.getElementById('chatLog');
const eventsEl = document.getElementById('events');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const resetSessionBtn = document.getElementById('resetSession');
const variantBtn = document.getElementById('newVariant');
const toggleSyncBtn = document.getElementById('toggleSync');

let syncEnabled = true;
let messageCount = 0;
let sessionId = 1;
let selectedMessageId = null;
let events = [];

const now = () => new Date().toLocaleTimeString('pt-BR');

function addSession(text = 'Sessão manual ativa') {
  const div = document.createElement('div');
  div.className = 'conv-item';
  div.innerHTML = `<strong>T${sessionId}</strong><br/><small>${text}</small><br/><small>${now()}</small>`;
  sessionsEl.prepend(div);
}

function addMessage(text, sender = 'user') {
  messageCount += 1;
  const messageId = `T${sessionId}-MSG-${String(messageCount).padStart(2, '0')}`;

  const bubble = document.createElement('button');
  bubble.className = `msg ${sender}`;
  bubble.textContent = `${messageId} · ${text}`;
  bubble.title = 'Filtrar eventos desta mensagem';
  bubble.onclick = () => {
    selectedMessageId = messageId;
    renderEvents();
  };

  timelineEl.appendChild(bubble.cloneNode(true));
  chatLogEl.appendChild(bubble);

  if (sender === 'user' && syncEnabled) {
    addEvent(messageId, 'TrackEvent', 'Mensagem recebida');
    addEvent(messageId, 'TrackContactsJourney', 'Roteamento de contexto');
    setTimeout(() => {
      addMessage(`Resposta automática para: ${text}`, 'bot');
      addEvent(messageId, 'SendMessage', 'Resposta enviada');
    }, 450);
  }

  timelineEl.scrollTop = timelineEl.scrollHeight;
  chatLogEl.scrollTop = chatLogEl.scrollHeight;
}

function addEvent(messageId, type, detail) {
  events.unshift({ messageId, type, detail, at: now() });
  renderEvents();
}

function renderEvents() {
  const list = selectedMessageId ? events.filter((e) => e.messageId === selectedMessageId) : events;
  eventsEl.innerHTML = '';
  list.forEach((evt) => {
    const item = document.createElement('div');
    item.className = 'event';
    item.innerHTML = `<strong>${evt.type}</strong><small>${evt.messageId}</small><span>${evt.detail}</span><small>${evt.at}</small>`;
    eventsEl.appendChild(item);
  });
}

sendBtn.onclick = () => {
  const txt = chatInput.value.trim();
  if (!txt) return;
  addMessage(txt, 'user');
  chatInput.value = '';
};

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

resetSessionBtn.onclick = () => {
  sessionId += 1;
  messageCount = 0;
  selectedMessageId = null;
  events = [];
  timelineEl.innerHTML = '';
  chatLogEl.innerHTML = '';
  addSession('Sessão reiniciada com contexto limpo');
  renderEvents();
};

variantBtn.onclick = () => {
  addSession('Variante duplicada (A/B) pronta para novo envio');
};

toggleSyncBtn.onclick = () => {
  syncEnabled = !syncEnabled;
  toggleSyncBtn.textContent = `Sync em tempo real: ${syncEnabled ? 'ON' : 'OFF'}`;
};

addSession();
addMessage('Olá! Este protótipo já inicia no modo avaliar.', 'bot');
addEvent('SYSTEM', 'Info', 'Use o chat dockado para testar e observar eventos sem fechar painel.');
