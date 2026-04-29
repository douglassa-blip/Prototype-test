const state = { sync: true, sessions: [], activeSessionId: null, filterType: 'all', filterMessageId: null, conversationFilter: 'all' };

const el = {
  sessionList: document.getElementById('sessionList'), timeline: document.getElementById('timeline'), eventList: document.getElementById('eventList'),
  sessionCount: document.getElementById('sessionCount'), selectedHint: document.getElementById('selectedHint'), eventCount: document.getElementById('eventCount'),
  chatInput: document.getElementById('chatInput'), sendBtn: document.getElementById('sendBtn'), syncBtn: document.getElementById('syncBtn'),
  resetBtn: document.getElementById('resetBtn'), variantBtn: document.getElementById('variantBtn'), clearFilterBtn: document.getElementById('clearFilterBtn'),
  eventFilters: document.getElementById('eventFilters'), conversationFilters: document.getElementById('conversationFilters'), startTestBtn: document.getElementById('startTestBtn'),
  summaryGrid: document.getElementById('summaryGrid'), summaryView: document.getElementById('summaryView'), centerTitle: document.getElementById('centerTitle'),
};

const now = () => new Date().toLocaleTimeString('pt-BR');
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function seedProductionSessions() {
  if (state.sessions.length) return;
  ['Marina', 'Carlos', 'Bianca'].forEach((name, index) => {
    const session = { id: `P${index + 1}`, title: `${name} · produção`, type: 'production', reason: 'Conversa ativa', hasError: index !== 0, tokensIn: random(120, 450), tokensOut: random(240, 920), messages: [], events: [] };
    session.messages.push({ messageId: `${session.id}-MSG-01`, text: 'Mensagem de cliente em produção', author: 'user', at: now() });
    session.events.unshift({ type: session.hasError ? 'Error' : 'TrackEvent', detail: session.hasError ? 'Falha de integração com CRM' : 'Fluxo executado com sucesso', messageId: `${session.id}-MSG-01`, at: now() });
    state.sessions.push(session);
  });
}

function createSession(reason = 'Sessão iniciada manualmente', type = 'test') {
  const next = state.sessions.filter((s) => s.type === 'test').length + 1;
  const id = `T${next}`;
  const session = { id, title: `Teste manual ${next}`, type, reason, hasError: false, tokensIn: 0, tokensOut: 0, messages: [], events: [] };
  state.sessions.unshift(session);
  state.activeSessionId = id;
  state.filterMessageId = null;
  addEvent('Info', reason, 'SYSTEM');
  render();
}

function activeSession() { return state.sessions.find((s) => s.id === state.activeSessionId); }

function addMessage(text, author = 'user') {
  const session = activeSession(); if (!session) return;
  const index = session.messages.length + 1; const messageId = `${session.id}-MSG-${String(index).padStart(2, '0')}`;
  session.messages.push({ messageId, text, author, at: now() });
  session.tokensIn += random(30, 90); session.tokensOut += random(45, 140);

  if (author === 'user' && state.sync) {
    addEvent('TrackEvent', `Mensagem recebida: ${text}`, messageId);
    addEvent('TrackContactsJourney', 'Contexto de jornada identificado', messageId);
    const fail = Math.random() < 0.2;
    if (fail) { session.hasError = true; addEvent('Error', 'Timeout na chamada de ferramenta externa', messageId); }
    setTimeout(() => { addMessage(`Resposta do bot para: ${text}`, 'bot'); addEvent('SendMessage', 'Mensagem enviada ao usuário', messageId); render(); }, 350);
  }
  render();
}

function addEvent(type, detail, messageId) { const session = activeSession(); if (!session) return; session.events.unshift({ type, detail, messageId, at: now() }); }

function filteredSessions() {
  if (state.conversationFilter === 'all') return state.sessions;
  if (state.conversationFilter === 'production') return state.sessions.filter((s) => s.type === 'production');
  if (state.conversationFilter === 'test') return state.sessions.filter((s) => s.type === 'test');
  if (state.conversationFilter === 'error') return state.sessions.filter((s) => s.hasError);
  return state.sessions;
}

function renderSummary() {
  const total = state.sessions.length;
  const production = state.sessions.filter((s) => s.type === 'production').length;
  const errors = state.sessions.filter((s) => s.hasError).length;
  const avgIn = Math.round(state.sessions.reduce((a, s) => a + s.tokensIn, 0) / Math.max(total, 1));
  const avgOut = Math.round(state.sessions.reduce((a, s) => a + s.tokensOut, 0) / Math.max(total, 1));
  const cards = [
    { label: 'Conversas acontecendo agora', value: production, filter: 'production' },
    { label: 'Conversas com erro', value: errors, filter: 'error' },
    { label: 'Média tokens input', value: avgIn, filter: 'all' },
    { label: 'Média tokens output', value: avgOut, filter: 'all' },
  ];
  el.summaryGrid.innerHTML = '';
  cards.forEach((c) => {
    const card = document.createElement('button');
    card.className = 'kpi';
    card.innerHTML = `<strong>${c.value}</strong><small>${c.label}</small>`;
    card.onclick = () => {
      state.conversationFilter = c.filter;
      state.activeSessionId = null;
      syncFilterUI();
      render();
    };
    el.summaryGrid.appendChild(card);
  });
}

function renderSessions() {
  const sessions = filteredSessions();
  el.sessionList.innerHTML = '';
  sessions.forEach((s) => {
    const row = document.createElement('div');
    row.className = `session ${s.id === state.activeSessionId ? 'active' : ''}`;
    const typeClass = s.type === 'test' ? 'type-test' : 'type-prod';
    const preview = s.messages.at(-1)?.text || 'Sem mensagens ainda';
    row.innerHTML = `<div class="title">${s.title}<span class="tag-type ${typeClass}">${s.type === 'test' ? 'Teste' : 'Produção'}</span></div><div class="muted">${s.id} · ${s.reason}</div><div class="muted">${preview}</div>`;
    row.onclick = () => { state.activeSessionId = s.id; state.filterMessageId = null; render(); };
    el.sessionList.appendChild(row);
  });
  el.sessionCount.textContent = `${sessions.length} item(ns)`;
}

function renderTimeline() {
  const session = activeSession();
  if (!session) {
    el.timeline.style.display = 'none';
    el.summaryView.style.display = 'block';
    el.centerTitle.textContent = 'Visão gerencial';
    el.selectedHint.textContent = 'Últimos 30 dias';
    return;
  }

  el.timeline.style.display = 'grid';
  el.summaryView.style.display = 'none';
  el.centerTitle.textContent = 'Conversa';
  el.selectedHint.textContent = `${session.id} · ${session.title}`;
  el.timeline.innerHTML = '';
  session.messages.forEach((m) => {
    const div = document.createElement('button');
    div.className = `bubble ${m.author}`;
    div.innerHTML = `<span class="id">${m.messageId}</span>${m.text}<div class="muted">${m.at}</div>`;
    div.onclick = () => { state.filterMessageId = m.messageId; renderEvents(); };
    el.timeline.appendChild(div);
  });
}

function renderEvents() {
  const session = activeSession(); el.eventList.innerHTML = '';
  if (!session) { el.eventCount.textContent = '0 eventos'; return; }
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

function syncFilterUI() {
  [...el.conversationFilters.querySelectorAll('.chip')].forEach((b) => b.classList.toggle('active', b.dataset.conversationFilter === state.conversationFilter));
}

function render() { renderSummary(); renderSessions(); renderTimeline(); renderEvents(); }

el.sendBtn.onclick = () => { const text = el.chatInput.value.trim(); if (!text) return; if (!state.activeSessionId) createSession('Teste iniciado pelo composer'); addMessage(text, 'user'); el.chatInput.value = ''; };
el.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') el.sendBtn.click(); });
el.syncBtn.onclick = () => { state.sync = !state.sync; el.syncBtn.textContent = state.sync ? 'Sync ON' : 'Sync OFF'; };
el.resetBtn.onclick = () => createSession('Sessão reiniciada com contexto limpo');
el.variantBtn.onclick = () => createSession('Variante duplicada para teste A/B');
el.startTestBtn.onclick = () => createSession('Novo teste manual iniciado pelo usuário');
el.clearFilterBtn.onclick = () => { state.filterMessageId = null; state.filterType = 'all'; state.conversationFilter = 'all'; state.activeSessionId = null; [...el.eventFilters.querySelectorAll('.chip')].forEach((b) => b.classList.toggle('active', b.dataset.filter === 'all')); syncFilterUI(); render(); };

el.eventFilters.onclick = (event) => { const btn = event.target.closest('.chip'); if (!btn) return; state.filterType = btn.dataset.filter; [...el.eventFilters.querySelectorAll('.chip')].forEach((b) => b.classList.toggle('active', b === btn)); renderEvents(); };
el.conversationFilters.onclick = (event) => { const btn = event.target.closest('.chip'); if (!btn) return; state.conversationFilter = btn.dataset.conversationFilter; state.activeSessionId = null; syncFilterUI(); render(); };

seedProductionSessions();
createSession('Sessão inicial de avaliação');
addMessage('Olá, quero validar a saudação e o roteamento.', 'user');
state.activeSessionId = null;
render();
