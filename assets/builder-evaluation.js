const state = {
  sync: true,
  sessions: [],
  activeSessionId: null,
  filterType: 'all',
  filterMessageId: null,
};

const el = {
  sessionList: document.getElementById('sessionList'),
  timeline: document.getElementById('timeline'),
  eventList: document.getElementById('eventList'),
  sessionCount: document.getElementById('sessionCount'),
  selectedHint: document.getElementById('selectedHint'),
  eventCount: document.getElementById('eventCount'),
  chatInput: document.getElementById('chatInput'),
  sendBtn: document.getElementById('sendBtn'),
  syncBtn: document.getElementById('syncBtn'),
  resetBtn: document.getElementById('resetBtn'),
  variantBtn: document.getElementById('variantBtn'),
  clearFilterBtn: document.getElementById('clearFilterBtn'),
  filters: document.getElementById('filters'),
};

const now = () => new Date().toLocaleTimeString('pt-BR');

function createSession(reason = 'Sessão iniciada manualmente') {
  const id = `T${state.sessions.length + 1}`;
  const session = { id, title: `Tester ${new Date().toLocaleDateString('pt-BR')} ${now()}`, reason, messages: [], events: [] };
  state.sessions.unshift(session);
  state.activeSessionId = id;
  addEvent('Info', reason, 'SYSTEM');
  render();
}

function activeSession() {
  return state.sessions.find((s) => s.id === state.activeSessionId);
}

function addMessage(text, author = 'user') {
  const session = activeSession();
  if (!session) return;
  const index = session.messages.length + 1;
  const messageId = `${session.id}-MSG-${String(index).padStart(2, '0')}`;
  session.messages.push({ messageId, text, author, at: now() });

  if (author === 'user' && state.sync) {
    addEvent('TrackEvent', `Mensagem recebida: ${text}`, messageId);
    addEvent('TrackContactsJourney', 'Contexto de jornada identificado', messageId);
    setTimeout(() => {
      addMessage(`Resposta do bot para: ${text}`, 'bot');
      addEvent('SendMessage', 'Mensagem enviada ao usuário', messageId);
    }, 350);
  }
  render();
}

function addEvent(type, detail, messageId) {
  const session = activeSession();
  if (!session) return;
  session.events.unshift({ type, detail, messageId, at: now() });
}

function renderSessions() {
  el.sessionList.innerHTML = '';
  state.sessions.forEach((s) => {
    const row = document.createElement('div');
    row.className = `session ${s.id === state.activeSessionId ? 'active' : ''}`;
    row.innerHTML = `<div class="title">${s.title}</div><div class="muted">${s.id} · ${s.reason}</div><div class="muted">${s.messages.at(-1)?.text || 'Sem mensagens ainda'}</div>`;
    row.onclick = () => { state.activeSessionId = s.id; state.filterMessageId = null; render(); };
    el.sessionList.appendChild(row);
  });
  el.sessionCount.textContent = `${state.sessions.length} sessão(ões)`;
}

function renderTimeline() {
  const session = activeSession();
  el.timeline.innerHTML = '';
  if (!session) return;
  el.selectedHint.textContent = `${session.id} · ${session.title}`;
  session.messages.forEach((m) => {
    const div = document.createElement('button');
    div.className = `bubble ${m.author}`;
    div.innerHTML = `<span class="id">${m.messageId}</span>${m.text}<div class="muted">${m.at}</div>`;
    div.onclick = () => { state.filterMessageId = m.messageId; renderEvents(); };
    el.timeline.appendChild(div);
  });
}

function renderEvents() {
  const session = activeSession();
  el.eventList.innerHTML = '';
  if (!session) return;

  let events = session.events;
  if (state.filterType !== 'all') events = events.filter((e) => e.type === state.filterType);
  if (state.filterMessageId) events = events.filter((e) => e.messageId === state.filterMessageId);

  events.forEach((evt) => {
    const item = document.createElement('div');
    item.className = `event ${state.filterMessageId === evt.messageId ? 'highlight' : ''}`;
    item.innerHTML = `<strong>${evt.type}</strong><div class="meta">${evt.messageId} · ${evt.at}</div><div>${evt.detail}</div>`;
    el.eventList.appendChild(item);
  });

  el.eventCount.textContent = `${events.length} evento(s)`;
}

function render() { renderSessions(); renderTimeline(); renderEvents(); }

el.sendBtn.onclick = () => {
  const text = el.chatInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  el.chatInput.value = '';
};

el.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') el.sendBtn.click(); });

el.syncBtn.onclick = () => {
  state.sync = !state.sync;
  el.syncBtn.textContent = state.sync ? 'Sync ON' : 'Sync OFF';
};

el.resetBtn.onclick = () => {
  createSession('Sessão reiniciada com contexto limpo');
};

el.variantBtn.onclick = () => {
  createSession('Variante duplicada para teste A/B');
};

el.clearFilterBtn.onclick = () => {
  state.filterMessageId = null;
  state.filterType = 'all';
  [...el.filters.querySelectorAll('.tag')].forEach((b) => b.classList.toggle('active', b.dataset.filter === 'all'));
  renderEvents();
};

el.filters.onclick = (event) => {
  const btn = event.target.closest('.tag');
  if (!btn) return;
  state.filterType = btn.dataset.filter;
  [...el.filters.querySelectorAll('.tag')].forEach((b) => b.classList.toggle('active', b === btn));
  renderEvents();
};

createSession('Sessão inicial de avaliação');
addMessage('Olá, quero validar a saudação e o roteamento.', 'user');
