(function () {
  const updates = [
    {
      id: 'assistant-insights',
      date: '24 Abr 2026',
      tag: 'IA',
      title: 'Resumo inteligente de conversas finalizadas',
      summary: 'Agora o sistema gera um resumo automático com próximos passos quando um atendimento é encerrado.',
      details:
        'O recurso analisa contexto, motivo do contato e resultado final para montar um resumo objetivo no histórico. Isso reduz tempo de handoff e facilita retomada por outro agente sem perda de contexto.',
      highlights: ['Resumo em até 3 pontos', 'Sugestão de follow-up', 'Disponível para todos os canais']
    },
    {
      id: 'sla-alerts',
      date: '17 Abr 2026',
      tag: 'Operação',
      title: 'Alertas proativos de SLA em risco',
      summary: 'Antes de estourar prazo, o sistema sinaliza tickets com risco de atraso para priorização da fila.',
      details:
        'Os alertas usam regra de tempo médio da sua operação para prever risco de violação. Você pode filtrar por equipe, canal ou prioridade e agir com antecedência.',
      highlights: ['Sinalização por cor', 'Filtro por equipe', 'Ações rápidas de redistribuição']
    },
    {
      id: 'governance-audit',
      date: '09 Abr 2026',
      tag: 'Governança',
      title: 'Trilha de auditoria expandida',
      summary: 'Nova visão de auditoria mostra quem alterou regras, quando e qual impacto operacional foi gerado.',
      details:
        'A trilha reúne alterações de configuração, permissões e integrações em uma linha do tempo única. Ideal para compliance e revisão de incidentes.',
      highlights: ['Linha do tempo única', 'Exportação simplificada', 'Filtro por tipo de evento']
    }
  ];

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderListItems(items) {
    return items
      .map(
        (item) => `
          <button class="updates-item" data-update-id="${item.id}" type="button">
            <div class="updates-item-head">
              <span class="updates-tag">${escapeHtml(item.tag)}</span>
              <span class="updates-date">${escapeHtml(item.date)}</span>
            </div>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.summary)}</p>
          </button>
        `
      )
      .join('');
  }

  function renderDetail(update) {
    return `
      <button class="updates-back" id="updatesBack" type="button">← Voltar para novidades</button>
      <div class="updates-detail-head">
        <span class="updates-tag">${escapeHtml(update.tag)}</span>
        <span class="updates-date">${escapeHtml(update.date)}</span>
      </div>
      <h3>${escapeHtml(update.title)}</h3>
      <p>${escapeHtml(update.details)}</p>
      <ul>
        ${update.highlights.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
      </ul>
    `;
  }

  function mountWidget() {
    const wrapper = document.createElement('div');
    wrapper.className = 'updates-widget-root';
    wrapper.innerHTML = `
      <button class="updates-fab" id="updatesFab" type="button" aria-controls="updatesDrawer" aria-expanded="false">
        Novidades
      </button>

      <aside class="updates-drawer" id="updatesDrawer" aria-hidden="true" aria-label="Últimas novidades do sistema">
        <header class="updates-header">
          <div>
            <p class="updates-eyebrow">Central de novidades</p>
            <h2>O que mudou</h2>
          </div>
          <button class="updates-close" id="updatesClose" type="button" aria-label="Fechar novidades">×</button>
        </header>

        <div class="updates-content" id="updatesContent">
          <p class="updates-empty">Selecione uma novidade para ver detalhes.</p>
        </div>
      </aside>

      <div class="updates-overlay" id="updatesOverlay" hidden></div>
    `;

    document.body.appendChild(wrapper);

    const fab = document.getElementById('updatesFab');
    const drawer = document.getElementById('updatesDrawer');
    const close = document.getElementById('updatesClose');
    const overlay = document.getElementById('updatesOverlay');
    const content = document.getElementById('updatesContent');

    function bindListEvents() {
      content.querySelectorAll('[data-update-id]').forEach((button) => {
        button.addEventListener('click', () => {
          const selected = updates.find((u) => u.id === button.dataset.updateId);
          if (!selected) return;
          content.innerHTML = renderDetail(selected);
          const back = document.getElementById('updatesBack');
          if (back) {
            back.addEventListener('click', () => {
              content.innerHTML = renderListItems(updates);
              bindListEvents();
            });
          }
        });
      });
    }

    function openDrawer() {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      fab.setAttribute('aria-expanded', 'true');
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add('show'));
      if (!content.dataset.initialized) {
        content.innerHTML = renderListItems(updates);
        content.dataset.initialized = 'true';
        bindListEvents();
      }
    }

    function closeDrawer() {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      fab.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.hidden = true;
      }, 160);
    }

    fab.addEventListener('click', openDrawer);
    close.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && drawer.classList.contains('open')) {
        closeDrawer();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountWidget);
  } else {
    mountWidget();
  }
})();
