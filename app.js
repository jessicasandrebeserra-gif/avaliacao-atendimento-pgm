
/* ============================================================
   DICA DE DESENVOLVIMENTO:
   Para limpar os dados de teste pelo console do navegador (F12),
   execute: localStorage.removeItem('avaliacoes')
   ============================================================ */


/* ==========================================
   CONFIGURAÇÃO GERAL E VARIÁVEIS GLOBAIS
   ==========================================
   Aqui ficam os dados e constantes que serão
   usados por todas as funções do sistema.
   ========================================== */

// Lista com os nomes dos atendentes que aparecerão no formulário de avaliação.
// Para adicionar ou remover atendentes, basta editar este array.
const ATENDENTES = [
  "Alexandre", "Jamille", "Fatima",
  "Eduardo", "Jossânia", "Aparecida"
];

// Hash SHA-256 da senha do programador.
// Nunca salvamos a senha em texto puro — apenas seu hash.
// Se quiser trocar a senha, gere um novo hash SHA-256 e substitua aqui.
const HASH_SENHA = '083e9e06537510eba266871443c9448e480edf649aaf265efc02eef63f1df216';
// Pesos numéricos de cada nota, usados para calcular a média de desempenho.
// Ex: "Ótimo" vale 5, "Bom" vale 4, etc.
const PESOS = { 'Ótimo': 5, 'Bom': 4, 'Médio': 2, 'Ruim': 1 };
// Paleta de cores usada nos gráficos de barras do dashboard.
// Cada atendente recebe uma cor diferente, ciclando pelo array se necessário.
const CORES_GRAFICOS = ['#58a6ff', '#bc8cff', '#f57dd1', '#56d364', '#ffa657', '#eaf04d'];

// Variáveis de estado que guardam temporariamente o atendente e a nota
// selecionados pelo avaliador antes de enviar o formulário.
let selectedAttendant = null;
let selectedRating = null;

/* ==========================================
   PERSISTÊNCIA DE DADOS (localStorage)
   ==========================================
   O localStorage é um armazenamento do próprio
   navegador. Os dados ficam salvos mesmo após
   fechar a aba, até serem removidos manualmente.
   ========================================== */

// Lê as avaliações salvas no navegador.
// JSON.parse converte a string JSON de volta para um array de objetos.
// Se não houver nada salvo, retorna um array vazio [].
// O try/catch evita que um erro de leitura quebre o sistema.
function loadData() {
  try {
    return JSON.parse(localStorage.getItem('avaliacoes') || '[]');
  } catch (e) {
    console.error("Erro ao ler localStorage:", e);
    return [];
  }
}

// Salva o array de avaliações no navegador.
// JSON.stringify converte o array de objetos para uma string JSON
// que pode ser armazenada no localStorage (só aceita texto).
function saveData(data) {
  localStorage.setItem('avaliacoes', JSON.stringify(data));
}


/* ==========================================
   SISTEMA DE ACESSO — LOGIN DO PROGRAMADOR
   ==========================================
   Controla o modal (janela flutuante) de senha
   que protege o painel do programador.
   ========================================== */

// Abre o modal de senha adicionando a classe CSS "open" a ele.
// O setTimeout garante que o campo de senha receba foco
// somente após a animação de abertura começar (100ms de delay).
function openPwdModal() {
  const modal = document.getElementById('pwd-modal');
  if (modal) {
    modal.classList.add('open');
    setTimeout(() => document.getElementById('pwd-input').focus(), 100);
  }
}

// Fecha o modal de senha, limpa o campo de input e apaga qualquer
// mensagem de erro que estivesse sendo exibida.
function closePwdModal() {
  const modal = document.getElementById('pwd-modal');
  if (modal) {
    modal.classList.remove('open');
    document.getElementById('pwd-input').value = '';
    document.getElementById('pwd-error').textContent = '';
  }
}

// Alterna a visibilidade da senha entre "•••••" e texto legível.
// Verifica o tipo atual do campo: se for "password", muda para "text", e vice-versa.
function togglePwd() {
  const input = document.getElementById('pwd-input');
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

// Verifica a senha digitada de forma segura usando criptografia no navegador.
// async/await é necessário pois crypto.subtle.digest é uma operação assíncrona.
async function confirmPwd() {
  const inputVal = document.getElementById('pwd-input').value;

  // TextEncoder converte a string da senha em bytes (Uint8Array),
  // que é o formato que a API de criptografia espera.
  const encoder = new TextEncoder();
  const data = encoder.encode(inputVal);
  // crypto.subtle.digest gera o hash SHA-256 dos bytes da senha.
  // Isso retorna um ArrayBuffer (bloco de bytes brutos).
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Converte o ArrayBuffer em um array comum de números (0-255).
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Converte cada número para hexadecimal de 2 dígitos e junta tudo em uma string.
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Compara o hash gerado com o hash da senha correta (definido no topo do arquivo).
  if (hashHex === HASH_SENHA) {
    closePwdModal();
    window.location.href = 'programador.html';  // Redireciona para o painel
  } else {
    // Exibe mensagem de erro e limpa o campo para nova tentativa.
    document.getElementById('pwd-error').textContent = 'Senha incorreta. Tente novamente.';
    document.getElementById('pwd-input').value = '';
  }
}


/* ==========================================
   TELA DO AVALIADOR (avaliador.html)
   ==========================================
   Funções que controlam o formulário de
   avaliação: criação dos cards, validação
   do nome e envio da avaliação.
   ========================================== */

// Executada automaticamente ao carregar a página avaliador.html (onload no <body>).
// Cria dinamicamente os cards de atendentes no grid do formulário.
function initAvaliador() {
  const grid = document.getElementById('attendant-grid');
  if (!grid) return; // Segurança: sai se o elemento não existir na página

  grid.innerHTML = ''; // Limpa o grid antes de preencher (evita duplicatas)

  // Para cada nome no array ATENDENTES, cria um card HTML e adiciona ao grid.
  ATENDENTES.forEach((name) => {
    const card = document.createElement('div');
    card.className = 'attendant-card';

    // Define o conteúdo interno do card (ícone + nome)
    card.innerHTML = `
      <div class="attendant-avatar">
        <img src="pessoas.png" alt="Atendente" class="attendant-img" />
      </div>
      <div class="attendant-name">${name}</div>
    `;

    // Quando o usuário clica no card:
    // 1. Remove a seleção visual de todos os outros cards
    // 2. Marca este card como selecionado
    // 3. Salva o nome do atendente na variável global
    // 4. Verifica se o botão de envio pode ser habilitado
    card.onclick = () => {
      document.querySelectorAll('.attendant-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedAttendant = name;
      checkSubmit();
    };

    grid.appendChild(card); // Adiciona o card ao DOM
  });
}

// Chamada quando o usuário clica em um botão de nota (Ótimo, Bom, Médio, Ruim).
// Remove a seleção dos outros botões, seleciona o clicado e salva a nota.
function selectRating(btn) {
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedRating = btn.dataset.val;
  checkSubmit();
}

// Valida o campo de nome do avaliador.
// Regras: mínimo 3 caracteres E pelo menos um espaço (indicando nome + sobrenome).
// Adiciona/remove classes visuais de erro conforme o resultado.
// Retorna true se válido, false se inválido.
function validateAvaliador() {
  const input = document.getElementById('avaliador-input');
  if (!input) return false;
  const val = input.value.trim();  // .trim() remove espaços extras no início/fim

  const isValid = val.length >= 3 && val.includes(' ');

  // classList.toggle(classe, condicao): adiciona a classe se a condição for true,
  // remove se for false. Aqui, só mostra o erro se o campo não está vazio E é inválido.
  input.classList.toggle('invalid', val.length > 0 && !isValid);

  const hint = document.getElementById('avaliador-hint');
  if (hint) {
    hint.classList.toggle('show', val.length > 0 && !isValid);
  }
  return isValid;
}

// Verifica se todos os campos obrigatórios estão preenchidos e válidos.
// Se sim, habilita o botão "Enviar Avaliação". Se não, mantém desabilitado.
// É chamada sempre que qualquer campo do formulário muda.
function checkSubmit() {
  const avaliadorInput = document.getElementById('avaliador-input');
  if (!avaliadorInput) return;

  const avaliadorVal = avaliadorInput.value.trim();
  const isValidAvaliador = avaliadorVal.length >= 3 && avaliadorVal.includes(' ');

  // O botão só é habilitado quando os três campos obrigatórios estão preenchidos:
  // nome válido + atendente selecionado + nota selecionada
  const canSubmit = isValidAvaliador && selectedAttendant && selectedRating;

  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.disabled = !canSubmit; // disabled=true desabilita, disabled=false habilita
  }
}

// Atualiza o contador de caracteres do campo de comentário em tempo real.
// Exibe "X / 300" conforme o usuário digita.
function updateCounter(textarea) {
  const counter = document.getElementById('feedback-counter');
  if (counter) {
    counter.textContent = `${textarea.value.length} / 300`;
  }
}

// Coleta os dados do formulário, cria um objeto de avaliação,
// salva no localStorage, limpa o formulário e exibe o toast de confirmação.
function submitRating() {
  const data = loadData();
  const avaliadorInput = document.getElementById('avaliador-input');
  const feedbackInput = document.getElementById('feedback-box');

  const agora = new Date(); // Captura data e hora no momento do envio
  // Monta o objeto com todos os dados da avaliação.
  // O id usa Date.now() (milissegundos desde 1970) para ser único.
  const novaAvaliacao = {
    id: Date.now(),
    avaliador: avaliadorInput.value.trim(),
    atendente: selectedAttendant,
    avaliacao: selectedRating,
    peso: PESOS[selectedRating] || 0, // Busca o peso numérico da nota
    feedback: feedbackInput.value.trim(),
    data: agora.toLocaleDateString('pt-BR'), // Ex: "09/05/2026" no formato brasileiro
    hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), // Ex: "13:45" no formato brasileiro
    timestamp: agora.toISOString() // Armazena a data/hora em formato ISO (formato universal) para facilitar ordenação e exportação
  };

  data.push(novaAvaliacao); // Adiciona a nova avaliação ao array
  saveData(data); // Salva o array atualizado no localStorage

  // ── Limpa o formulário para uma nova avaliação ──
  selectedAttendant = null;
  selectedRating = null;
  avaliadorInput.value = '';
  feedbackInput.value = '';

  // Reseta o contador de caracteres do comentário
  const counter = document.getElementById('feedback-counter');
  if (counter) counter.textContent = '0 / 300';

  // Remove a seleção visual dos cards de atendente e dos botões de nota
  document.querySelectorAll('.attendant-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));

  // Desabilita o botão de envio novamente até que o usuário preencha os campos para uma nova avaliação
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) submitBtn.disabled = true;

  // Exibe o toast (notificação flutuante) de sucesso por 2,5 segundos.
  // A classe "show" aciona a animação CSS que desliza o toast para cima.
  const toast = document.getElementById('toast');
  if (toast) {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
}


/* ==========================================
   PAINEL DO PROGRAMADOR (programador.html)
   ==========================================
   Funções que controlam as abas, sub-abas,
   gráficos e visualizações do dashboard.
   ========================================== */

// Executada ao carregar programador.html.
// Inicializa o dashboard na view padrão "geral".
function initProgramador() {
  updateDashboard();
  switchDashView('geral');
}

// Alterna entre as abas principais: "Dashboard" e "Exportar".
// Remove a classe "active" de todas as abas/telas e a adiciona apenas
// na aba/tela correspondente ao tabId recebido.
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  const selectedTab = document.getElementById(`tab-${tabId}`);
  const selectedScreen = document.getElementById(`screen-${tabId}`);

  if (selectedTab) selectedTab.classList.add('active');
  if (selectedScreen) selectedScreen.classList.add('active');

  // Ao entrar no dashboard, atualiza os dados; ao entrar em exportar, gera o preview.
  if (tabId === 'dashboard') {
    updateDashboard();
    switchDashView('geral');
  } else if (tabId === 'exportar') {
    renderPreview();
  }
}

// Alterna entre as sub-abas do dashboard: "Geral" e "Por Atendente".
// Funciona de forma similar ao switchTab, mas para os painéis internos.
function switchDashView(view) {
  // Remove o estado ativo de todas as sub-abas e views
  document.querySelectorAll('.dash-subtab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.dash-view').forEach(v => v.classList.remove('active'));

  // Seleciona os elementos pelo DOM (1º e 2º filho da lista de sub-abas)
  const tabGeral = document.querySelector('.dash-subtabs .dash-subtab:nth-child(1)');
  const tabAtendente = document.querySelector('.dash-subtabs .dash-subtab:nth-child(2)');

  const viewGeral = document.getElementById('dash-geral');
  const viewAtendente = document.getElementById('dash-atendente');

  if (view === 'geral') {
    if (tabGeral) tabGeral.classList.add('active');
    if (viewGeral) viewGeral.classList.add('active');
    updateDashboard(); // Atualiza os números e gráficos ao exibir a view geral
  } else if (view === 'atendente') {
    if (tabAtendente) tabAtendente.classList.add('active');
    if (viewAtendente) viewAtendente.classList.add('active');
    buildAttChips(); // Constrói os chips clicáveis de atendentes
  }
}

// Lê todos os dados e atualiza o dashboard completo:
// contadores de notas, gráfico de volume por atendente e
// gráfico de distribuição geral.
function updateDashboard() {
  const data = loadData();
  // Atualiza o badge com o total de avaliações no cabeçalho
  const totalBadge = document.getElementById('total-badge');
  if (totalBadge) totalBadge.textContent = `${data.length} avaliações`;

  // Inicializa os contadores de cada nota em zero
  const counts = { 'Ótimo': 0, 'Bom': 0, 'Médio': 0, 'Ruim': 0 };

  // attTotals acumulará quantas avaliações cada atendente recebeu
  // Ex: { "Alexandre": 3, "Jamille": 5, ... }
  const attTotals = {};

  // Percorre todas as avaliações e incrementa os contadores
  data.forEach(d => {
    if (d.avaliacao) counts[d.avaliacao] = (counts[d.avaliacao] || 0) + 1;
    if (d.atendente) attTotals[d.atendente] = (attTotals[d.atendente] || 0) + 1;
  });

  // Atualiza os 4 cards de estatísticas (Ótimo, Bom, Médio, Ruim)
  const cntOtimo = document.getElementById('cnt-otimo');
  const cntBom = document.getElementById('cnt-bom');
  const cntMedio = document.getElementById('cnt-medio');
  const cntRuim = document.getElementById('cnt-ruim');

  if (cntOtimo) cntOtimo.textContent = counts['Ótimo'];
  if (cntBom) cntBom.textContent = counts['Bom'];
  if (cntMedio) cntMedio.textContent = counts['Médio'];
  if (cntRuim) cntRuim.textContent = counts['Ruim'];

  // ── Gráfico de barras: Volume por atendente ──
  const barsContainer = document.getElementById('bars-container');
  if (barsContainer) {
    barsContainer.innerHTML = ''; // Limpa antes de redesenhar

    // O maior valor entre todos os atendentes será usado para calcular
    // a largura proporcional de cada barra. Math.max(...valores, 1)
    // garante que o mínimo seja 1 (evita divisão por zero).
    const maxVal = Math.max(...Object.values(attTotals), 1);

    ATENDENTES.forEach((att, index) => {
      const totalAtt = attTotals[att] || 0;

      // Calcula a largura da barra em percentual relativo ao maior valor
      const percent = (totalAtt / maxVal) * 100;

      // Pega a cor do array de cores, ciclando se houver mais atendentes que cores
      const barColor = CORES_GRAFICOS[index % CORES_GRAFICOS.length];

      // Injeta o HTML da linha de barra diretamente no container
      barsContainer.innerHTML += `
        <div class="bar-row">
          <div class="bar-label" style="width: 80px; font-size: 0.78rem;">${att}</div>
          <div class="bar-track" style="flex: 1; height: 10px; background: var(--border); border-radius: 50px; overflow: hidden;">
            <div class="bar-fill" style="width: ${percent}%; background-color: ${barColor}; height: 100%;"></div>
          </div>
          <div class="bar-count" style="width: 30px; font-size: 0.78rem; text-align: right; color: var(--muted);">${totalAtt}</div>
        </div>
      `;
    });
  }

  // ── Gráfico de distribuição geral por nota (mini-bars) ──
  const miniBars = document.getElementById('mini-bars');
  if (miniBars) {
    miniBars.innerHTML = '';

    // Usa data.length como total; mínimo 1 para evitar divisão por zero
    const total = data.length || 1;

    // Array que define a ordem e a cor de cada nota no gráfico
    const distribuicao = [
      { label: 'Ótimo', key: 'Ótimo', color: 'var(--otimo)' },
      { label: 'Bom', key: 'Bom', color: 'var(--bom)' },
      { label: 'Médio', key: 'Médio', color: 'var(--medio)' },
      { label: 'Ruim', key: 'Ruim', color: 'var(--ruim)' },
    ];

    distribuicao.forEach(({ label, key, color }) => {
      const count = counts[key] || 0;

      // toFixed(1) garante exibição com 1 casa decimal, ex: "33.3%"
      const percent = ((count / total) * 100).toFixed(1);
      miniBars.innerHTML += `
        <div class="bar-row">
          <div class="bar-label" style="width: 55px; font-size: 0.78rem;">${label}</div>
          <div class="bar-track" style="flex: 1; height: 10px; background: var(--border); border-radius: 50px; overflow: hidden;">
            <div class="bar-fill" style="width: ${percent}%; background-color: ${color}; height: 100%;"></div>
          </div>
          <div class="bar-count" style="width: 48px; font-size: 0.75rem; text-align: right; color: var(--muted);">${count} (${percent}%)</div>
        </div>
      `;
    });
  }
}

// Cria os chips (botões compactos) de cada atendente na sub-aba "Por Atendente".
// Cada chip mostra o nome e o total de avaliações recebidas.
// Ao clicar, exibe os detalhes daquele atendente na área lateral direita.
function buildAttChips() {
  const container = document.getElementById('att-chips');
  if (!container) return;

  container.innerHTML = ''; // Limpa antes de reconstruir
  const data = loadData();

  ATENDENTES.forEach((att, index) => {
    // Conta quantas avaliações este atendente específico recebeu
    const totalAtt = data.filter(d => d.atendente === att).length;

    const chip = document.createElement('div');
    chip.className = 'att-chip';

    // Cada chip tem uma borda esquerda colorida para identificação visual
    const cor = CORES_GRAFICOS[index % CORES_GRAFICOS.length];
    chip.style.borderLeft = `4px solid ${cor}`;
    chip.innerHTML = `👤 ${att} (${totalAtt})`;

    // Ao clicar: destaca o chip clicado e exibe os detalhes do atendente
    chip.onclick = () => {
      // Remove o destaque de todos os chips
      document.querySelectorAll('.att-chip').forEach(c => c.style.background = 'var(--surface)');
      chip.style.background = 'var(--border)'; // Destaca este chip
      showAttendantDetails(att, cor);
    };
    container.appendChild(chip);
  });
}

// Exibe o painel detalhado de um atendente: média de desempenho e
// lista de todas as avaliações individuais com avaliador, nota, comentário e data.
function showAttendantDetails(att, cor) {
  const data = loadData();

  // Filtra apenas as avaliações do atendente selecionado
  const attData = data.filter(d => d.atendente === att);
  const detailArea = document.getElementById('att-detail-area');

  if (!detailArea) return;

  // Se não há avaliações, exibe mensagem de estado vazio
  if (attData.length === 0) {
    detailArea.innerHTML = `<div class="empty-state">Nenhuma avaliação para ${att} ainda.</div>`;
    return;
  }

  // Calcula a média de desempenho ponderada pelos pesos das notas.
  // reduce acumula a soma dos pesos; depois divide pela quantidade.
  const somaPesos = attData.reduce((acc, d) => acc + (d.peso || PESOS[d.avaliacao] || 0), 0);
  const media = (somaPesos / attData.length).toFixed(1);

  // Inicia a montagem do HTML do painel detalhado do atendente
  let html = `
    <div class="chart-section" style="border-top: 3px solid ${cor}; margin-top: 15px; padding: 16px; background: var(--surface); border-radius: 14px;">
      <h4 style="margin-bottom: 5px; font-family: 'Syne', sans-serif;">${att}</h4>
      <p style="font-size: 0.8rem; color: var(--muted); margin-bottom: 15px;">
        Média de Desempenho: <strong>${media} / 5.0</strong> (${attData.length} avaliações)
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
  `;

  // [...attData].reverse() cria uma cópia invertida do array para mostrar
  // as avaliações mais recentes primeiro (sem alterar o array original).
  [...attData].reverse().forEach(d => {
    const avaliacaoText = d.avaliacao || 'Sem Nota';
    const pesoValue = d.peso || PESOS[d.avaliacao] || 0;
    const avaliadorText = d.avaliador || 'Anônimo';

    // Tenta usar os campos data/hora salvos; se não existirem,
    // recalcula a partir do timestamp ISO (compatibilidade com dados antigos).
    let dataText = d.data || '';
    let horaText = d.hora || '';
    if (!dataText && d.timestamp) {
      const dtObj = new Date(d.timestamp);
      dataText = dtObj.toLocaleDateString('pt-BR');
      horaText = dtObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    // Adiciona o card individual de avaliação ao HTML
    html += `
      <div style="background: var(--bg); padding: 12px; border-radius: 8px; border: 1px solid var(--border)">
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 6px;">
          <span style="font-weight: bold; color: var(--text)">${avaliadorText}</span>
          <span style="font-weight: bold; color: #58a6ff;">${avaliacaoText} (Peso: ${pesoValue})</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text); font-style: italic;">
          "${d.feedback || 'Sem comentários adicionais.'}"
        </p>
        <span style="font-size: 0.65rem; color: var(--muted); display: block; text-align: right; margin-top: 4px;">
          ${dataText} ${horaText ? 'às ' + horaText : ''}
        </span>
      </div>
    `;
  });

  html += `</div></div>`;
  detailArea.innerHTML = html; // Renderiza tudo de uma vez no DOM
}


/* ==========================================
   EXPORTAÇÃO DE DADOS
   ==========================================
   Funções para visualizar e baixar os dados
   em formato CSV (Excel/Power BI) e JSON.
   ========================================== */

// Renderiza uma tabela de preview com as 5 avaliações mais recentes
// na aba "Exportar" do painel do programador.
function renderPreview() {
  const data = loadData();
  const container = document.getElementById('preview-area');
  if (!container) return;

  if (!data.length) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📋</div>Nenhum dado cadastrado ainda.</div>';
    return;
  }

  // Monta o HTML da tabela com cabeçalho
  let tableHtml = `
    <table class="preview-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Avaliador</th>
          <th>Atendente</th>
          <th>Avaliação</th>
          <th>Peso</th>
          <th>Feedback</th>
          <th>Data</th>
          <th>Hora</th>
        </tr>
      </thead>
      <tbody>
  `;

  // [...data].reverse() inverte para mostrar as mais recentes primeiro;
  // .slice(0, 5) pega apenas as 5 primeiras (preview limitado).
  [...data].reverse().slice(0, 5).forEach((d, i) => {
    const pesoValue = d.peso || PESOS[d.avaliacao] || 0;

    let dataText = d.data || '';
    let horaText = d.hora || '';

    // Garante que o ID seja exibido como string para evitar notação científica no Excel via CSV (IDs muito grandes podem virar 1,78E+12, por exemplo).
    let finalId = d.id ? String(d.id) : '';

    // Preenche campos ausentes a partir do timestamp quando disponível (compatibilidade com dados antigos que não tinham data/hora separada).
    if (d.timestamp) {
      const dtObj = new Date(d.timestamp);
      if (!dataText) dataText = dtObj.toLocaleDateString('pt-BR');
      if (!horaText) horaText = dtObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (!finalId) finalId = String(dtObj.getTime());
    }

    // Fallback final para o ID caso ainda esteja vazio
    // (caso o timestamp não tenha sido usado para preencher).
    if (!finalId) finalId = String(Date.now() - i);

    tableHtml += `
      <tr>
        <td>${finalId}</td>
        <td>${d.avaliador || 'Anônimo'}</td>
        <td>${d.atendente || ''}</td>
        <td>${d.avaliacao || ''}</td>
        <td>${pesoValue}</td>
        <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${d.feedback || ''}</td>
        <td>${dataText}</td>
        <td>${horaText}</td>
      </tr>
    `;
  });

  tableHtml += '</tbody></table>';
  container.innerHTML = tableHtml;
}

// Gera e faz o download de um arquivo CSV compatível com Excel (BR) e Power BI.
function exportCSV() {
  const data = loadData();
  if (!data.length) return alert('Sem dados para exportar!');

  // Separador ";" é o padrão do Excel em português (BR)
  // O "sep=;" na 1ª linha instrui o Excel explicitamente — mas aqui usamos
  // uma abordagem melhor: salvar como .txt com extensão .csv e sep no início
  const SEP = ';';
  const headers = ['ID', 'Avaliador', 'Atendente', 'Avaliacao', 'Peso', 'Feedback', 'Data', 'Hora', 'Mes', 'Ano'];

  // "sep=;" como 1ª linha funciona APENAS quando o arquivo não tem BOM.
  // Com BOM, o Excel lê o encoding correto. Então usamos BOM + sem sep=.
  // O segredo é que com ";" o Excel BR já separa corretamente sem precisar do sep=.
  const csvRows = [headers.join(SEP)];

  // Função auxiliar: envolve em aspas duplas campos que contenham
  // separadores, aspas ou quebras de linha (padrão CSV RFC 4180).
  const escapar = (str) => {
    const s = String(str == null ? '' : str);
    // Se contém ; ou " ou quebra de linha, envolve em aspas
    if (s.includes(SEP) || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  data.forEach((d, i) => {
    const pesoValue = d.peso || PESOS[d.avaliacao] || 0;

    let dataText = d.data || '';
    let horaText = d.hora || '';
    let finalId = d.id ? String(d.id) : '';

    // Garante que data, hora e ID estejam preenchidos a partir do timestamp quando disponível (compatibilidade com dados antigos).
    if (d.timestamp) {
      const dtObj = new Date(d.timestamp);
      if (!dataText) dataText = dtObj.toLocaleDateString('pt-BR');
      if (!horaText) horaText = dtObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (!finalId) finalId = String(dtObj.getTime());
    }
    if (!finalId) finalId = String(Date.now() - i);

    // Extrai mês e ano para facilitar filtros no Power BI
    let mes = '';
    let ano = '';
    if (d.timestamp) {
      const dtObj = new Date(d.timestamp);
      mes = String(dtObj.getMonth() + 1).padStart(2, '0'); // getMonth() é 0-indexado, por isso +1 e padStart para garantir formato "01", "02", ..., "12"
      ano = String(dtObj.getFullYear());
    } else if (dataText) {
      // Fallback: tenta extrair do campo data formatado como "DD/MM/AAAA"
      const partes = dataText.split('/');
      if (partes.length === 3) {
        mes = partes[1];
        ano = partes[2];
      }
    }

    // A função texto() usa a fórmula ="valor" do Excel.
    // Isso força o Excel a interpretar o conteúdo como texto puro,
    // evitando que IDs virem notação científica (1,78E+12) e
    // que datas causem formatação automática indesejada.
    const texto = (str) => `="${String(str == null ? '' : str).replace(/"/g, '""')}"`;

    const row = [
      texto(finalId),                        // ID — sem notação científica e sem aspas no Excel para garantir compatibilidade com Power BI (que lê o número puro)
      escapar(d.avaliador || 'Anônimo'),
      escapar(d.atendente || ''),
      escapar(d.avaliacao || ''),
      pesoValue,                            // Peso — número, sem aspas (para cálculos no BI) 
      escapar(d.feedback || ''),
      texto(dataText),                       // Data — sem conversão automática do Excel — evita ########
      texto(horaText),                        // Hora — sem conversão automática do Excel
      escapar(mes),                          // Mês (01-12) — para filtros no Power BI
      escapar(ano)                           // Ano (ex: 2026) — para filtros no Power BI
    ];
    csvRows.push(row.join(SEP)); // Junta os campos com o separador e adiciona à lista de linhas
  });

  // '\ufeff' é o BOM (Byte Order Mark) do UTF-8.
  // Ele instrui o Excel a interpretar o arquivo com encoding correto,
  // garantindo que acentos e cedilhas apareçam sem distorção no Windows.
  // '\r\n' é o fim de linha padrão Windows/Excel (CRLF).
  const conteudo = '\ufeff' + csvRows.join('\r\n');

  // Cria um Blob (arquivo em memória) e dispara o download via link temporário
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);  // Gera URL temporária apontando para o blob
  const a = document.createElement('a'); // Cria um link invisível
  a.href = url;
  a.download = 'avaliacoes_fortaleza.csv'; // Nome do arquivo que será baixado
  document.body.appendChild(a);
  a.click(); // Simula o clique para iniciar o download
  document.body.removeChild(a);  // Remove o link temporário do DOM
  URL.revokeObjectURL(url); // Libera a memória da URL temporária
}

// Gera e faz o download de um arquivo JSON com todos os dados brutos.
// Útil para backup, debug ou integração com outras ferramentas.
function exportJSON() {
  const data = loadData();
  if (!data.length) return alert('Sem dados para exportar!');

  // JSON.stringify(data, null, 2) formata o JSON com 2 espaços de indentação,
  // tornando o arquivo legível.
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'avaliacoes_fortaleza.json';
  a.click();
  URL.revokeObjectURL(url); // Libera a memória após o download
}