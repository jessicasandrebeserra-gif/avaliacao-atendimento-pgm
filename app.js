
/*LIMPAR TESTES PELO CONSOLE - F12: localStorage.removeItem('avaliacoes') */

/* ==========================================
   CONFIGURAÇÃO GERAL E VARIÁVEIS
   ========================================== */
const ATENDENTES = [
  "Alexandre", "Jamille", "Fatima",
  "Eduardo", "Jossânia", "Aparecida"
];

const HASH_SENHA = '083e9e06537510eba266871443c9448e480edf649aaf265efc02eef63f1df216';
const PESOS = { 'Ótimo': 5, 'Bom': 4, 'Médio': 2, 'Ruim': 1 };
const CORES_GRAFICOS = ['#58a6ff', '#bc8cff', '#f57dd1', '#56d364', '#ffa657', '#eaf04d'];

let selectedAttendant = null;
let selectedRating = null;

// Carrega os dados salvos do localStorage
function loadData() {
  try {
    return JSON.parse(localStorage.getItem('avaliacoes') || '[]');
  } catch (e) {
    console.error("Erro ao ler localStorage:", e);
    return [];
  }
}

// Salva os dados no localStorage
function saveData(data) {
  localStorage.setItem('avaliacoes', JSON.stringify(data));
}


/* ==========================================
   SISTEMA DE ACESSO (LOGIN DO PROGRAMADOR)
   ========================================== */
function openPwdModal() {
  const modal = document.getElementById('pwd-modal');
  if (modal) {
    modal.classList.add('open');
    setTimeout(() => document.getElementById('pwd-input').focus(), 100);
  }
}

function closePwdModal() {
  const modal = document.getElementById('pwd-modal');
  if (modal) {
    modal.classList.remove('open');
    document.getElementById('pwd-input').value = '';
    document.getElementById('pwd-error').textContent = '';
  }
}

function togglePwd() {
  const input = document.getElementById('pwd-input');
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

async function confirmPwd() {
  const inputVal = document.getElementById('pwd-input').value;
  const encoder = new TextEncoder();
  const data = encoder.encode(inputVal);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (hashHex === HASH_SENHA) {
    closePwdModal();
    window.location.href = 'programador.html';
  } else {
    document.getElementById('pwd-error').textContent = 'Senha incorreta. Tente novamente.';
    document.getElementById('pwd-input').value = '';
  }
}


/* ==========================================
   SISTEMA DO AVALIADOR (avaliador.html)
   ========================================== */
function initAvaliador() {
  const grid = document.getElementById('attendant-grid');
  if (!grid) return;

  grid.innerHTML = '';
  ATENDENTES.forEach((name) => {
    const card = document.createElement('div');
    card.className = 'attendant-card';
    card.innerHTML = `
      <div class="attendant-avatar">🎧</div>
      <div class="attendant-name">${name}</div>
    `;
    card.onclick = () => {
      document.querySelectorAll('.attendant-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedAttendant = name;
      checkSubmit();
    };
    grid.appendChild(card);
  });
}

function selectRating(btn) {
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedRating = btn.dataset.val;
  checkSubmit();
}

function validateAvaliador() {
  const input = document.getElementById('avaliador-input');
  if (!input) return false;
  const val = input.value.trim();

  const isValid = val.length >= 3 && val.includes(' ');
  input.classList.toggle('invalid', val.length > 0 && !isValid);

  const hint = document.getElementById('avaliador-hint');
  if (hint) {
    hint.classList.toggle('show', val.length > 0 && !isValid);
  }
  return isValid;
}

function checkSubmit() {
  const avaliadorInput = document.getElementById('avaliador-input');
  if (!avaliadorInput) return;

  const avaliadorVal = avaliadorInput.value.trim();
  const isValidAvaliador = avaliadorVal.length >= 3 && avaliadorVal.includes(' ');
  const canSubmit = isValidAvaliador && selectedAttendant && selectedRating;

  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.disabled = !canSubmit;
  }
}

function updateCounter(textarea) {
  const counter = document.getElementById('feedback-counter');
  if (counter) {
    counter.textContent = `${textarea.value.length} / 300`;
  }
}

function submitRating() {
  const data = loadData();
  const avaliadorInput = document.getElementById('avaliador-input');
  const feedbackInput = document.getElementById('feedback-box');

  const agora = new Date();
  const novaAvaliacao = {
    id: Date.now(),
    avaliador: avaliadorInput.value.trim(),
    atendente: selectedAttendant,
    avaliacao: selectedRating,
    peso: PESOS[selectedRating] || 0,
    feedback: feedbackInput.value.trim(),
    data: agora.toLocaleDateString('pt-BR'),
    hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    timestamp: agora.toISOString()
  };

  data.push(novaAvaliacao);
  saveData(data);

  selectedAttendant = null;
  selectedRating = null;
  avaliadorInput.value = '';
  feedbackInput.value = '';

  const counter = document.getElementById('feedback-counter');
  if (counter) counter.textContent = '0 / 300';

  document.querySelectorAll('.attendant-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));

  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) submitBtn.disabled = true;

  const toast = document.getElementById('toast');
  if (toast) {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
}


/* ==========================================
   SISTEMA DO PROGRAMADOR (programador.html)
   ========================================== */
function initProgramador() {
  updateDashboard();
  switchDashView('geral');
}

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  const selectedTab = document.getElementById(`tab-${tabId}`);
  const selectedScreen = document.getElementById(`screen-${tabId}`);

  if (selectedTab) selectedTab.classList.add('active');
  if (selectedScreen) selectedScreen.classList.add('active');

  if (tabId === 'dashboard') {
    updateDashboard();
    switchDashView('geral');
  } else if (tabId === 'exportar') {
    renderPreview();
  }
}

function switchDashView(view) {
  document.querySelectorAll('.dash-subtab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.dash-view').forEach(v => v.classList.remove('active'));

  const tabGeral = document.querySelector('.dash-subtabs .dash-subtab:nth-child(1)');
  const tabAtendente = document.querySelector('.dash-subtabs .dash-subtab:nth-child(2)');

  const viewGeral = document.getElementById('dash-geral');
  const viewAtendente = document.getElementById('dash-atendente');

  if (view === 'geral') {
    if (tabGeral) tabGeral.classList.add('active');
    if (viewGeral) viewGeral.classList.add('active');
    updateDashboard();
  } else if (view === 'atendente') {
    if (tabAtendente) tabAtendente.classList.add('active');
    if (viewAtendente) viewAtendente.classList.add('active');
    buildAttChips();
  }
}

function updateDashboard() {
  const data = loadData();
  const totalBadge = document.getElementById('total-badge');
  if (totalBadge) totalBadge.textContent = `${data.length} avaliações`;

  const counts = { 'Ótimo': 0, 'Bom': 0, 'Médio': 0, 'Ruim': 0 };
  const attTotals = {};

  data.forEach(d => {
    if (d.avaliacao) counts[d.avaliacao] = (counts[d.avaliacao] || 0) + 1;
    if (d.atendente) attTotals[d.atendente] = (attTotals[d.atendente] || 0) + 1;
  });

  const cntOtimo = document.getElementById('cnt-otimo');
  const cntBom = document.getElementById('cnt-bom');
  const cntMedio = document.getElementById('cnt-medio');
  const cntRuim = document.getElementById('cnt-ruim');

  if (cntOtimo) cntOtimo.textContent = counts['Ótimo'];
  if (cntBom) cntBom.textContent = counts['Bom'];
  if (cntMedio) cntMedio.textContent = counts['Médio'];
  if (cntRuim) cntRuim.textContent = counts['Ruim'];

  // Gráfico: Volume por atendente
  const barsContainer = document.getElementById('bars-container');
  if (barsContainer) {
    barsContainer.innerHTML = '';
    const maxVal = Math.max(...Object.values(attTotals), 1);

    ATENDENTES.forEach((att, index) => {
      const totalAtt = attTotals[att] || 0;
      const percent = (totalAtt / maxVal) * 100;
      const barColor = CORES_GRAFICOS[index % CORES_GRAFICOS.length];

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

  // ✅ CORREÇÃO: Gráfico de Distribuição Geral (mini-bars) — estava vazio antes
  const miniBars = document.getElementById('mini-bars');
  if (miniBars) {
    miniBars.innerHTML = '';
    const total = data.length || 1;
    const distribuicao = [
      { label: 'Ótimo', key: 'Ótimo', color: 'var(--otimo)' },
      { label: 'Bom',   key: 'Bom',   color: 'var(--bom)'   },
      { label: 'Médio', key: 'Médio', color: 'var(--medio)'  },
      { label: 'Ruim',  key: 'Ruim',  color: 'var(--ruim)'   },
    ];

    distribuicao.forEach(({ label, key, color }) => {
      const count = counts[key] || 0;
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

function buildAttChips() {
  const container = document.getElementById('att-chips');
  if (!container) return;

  container.innerHTML = '';
  const data = loadData();

  ATENDENTES.forEach((att, index) => {
    const totalAtt = data.filter(d => d.atendente === att).length;
    const chip = document.createElement('div');
    chip.className = 'att-chip';

    const cor = CORES_GRAFICOS[index % CORES_GRAFICOS.length];
    chip.style.borderLeft = `4px solid ${cor}`;
    chip.innerHTML = `👤 ${att} (${totalAtt})`;

    chip.onclick = () => {
      document.querySelectorAll('.att-chip').forEach(c => c.style.background = 'var(--surface)');
      chip.style.background = 'var(--border)';
      showAttendantDetails(att, cor);
    };
    container.appendChild(chip);
  });
}

function showAttendantDetails(att, cor) {
  const data = loadData();
  const attData = data.filter(d => d.atendente === att);
  const detailArea = document.getElementById('att-detail-area');

  if (!detailArea) return;

  if (attData.length === 0) {
    detailArea.innerHTML = `<div class="empty-state">Nenhuma avaliação para ${att} ainda.</div>`;
    return;
  }

  const somaPesos = attData.reduce((acc, d) => acc + (d.peso || PESOS[d.avaliacao] || 0), 0);
  const media = (somaPesos / attData.length).toFixed(1);

  let html = `
    <div class="chart-section" style="border-top: 3px solid ${cor}; margin-top: 15px; padding: 16px; background: var(--surface); border-radius: 14px;">
      <h4 style="margin-bottom: 5px; font-family: 'Syne', sans-serif;">${att}</h4>
      <p style="font-size: 0.8rem; color: var(--muted); margin-bottom: 15px;">
        Média de Desempenho: <strong>${media} / 5.0</strong> (${attData.length} avaliações)
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
  `;

  [...attData].reverse().forEach(d => {
    const avaliacaoText = d.avaliacao || 'Sem Nota';
    const pesoValue = d.peso || PESOS[d.avaliacao] || 0;
    const avaliadorText = d.avaliador || 'Anônimo';

    let dataText = d.data || '';
    let horaText = d.hora || '';
    if (!dataText && d.timestamp) {
      const dtObj = new Date(d.timestamp);
      dataText = dtObj.toLocaleDateString('pt-BR');
      horaText = dtObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

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
  detailArea.innerHTML = html;
}


/* ==========================================
   EXPORTAÇÃO DE DADOS
   ========================================== */
function renderPreview() {
  const data = loadData();
  const container = document.getElementById('preview-area');
  if (!container) return;

  if (!data.length) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📋</div>Nenhum dado cadastrado ainda.</div>';
    return;
  }

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

  [...data].reverse().slice(0, 5).forEach((d, i) => {
    const pesoValue = d.peso || PESOS[d.avaliacao] || 0;

    let dataText = d.data || '';
    let horaText = d.hora || '';
    // ✅ CORREÇÃO: ID formatado como string legível (sem notação científica)
    let finalId = d.id ? String(d.id) : '';

    if (d.timestamp) {
      const dtObj = new Date(d.timestamp);
      if (!dataText) dataText = dtObj.toLocaleDateString('pt-BR');
      if (!horaText) horaText = dtObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (!finalId) finalId = String(dtObj.getTime());
    }

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

  // Função para escapar campos — usa aspas duplas apenas se necessário
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

    if (d.timestamp) {
      const dtObj = new Date(d.timestamp);
      if (!dataText) dataText = dtObj.toLocaleDateString('pt-BR');
      if (!horaText) horaText = dtObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (!finalId) finalId = String(dtObj.getTime());
    }
    if (!finalId) finalId = String(Date.now() - i);

    // Extrai Mês e Ano para filtros no Power BI
    let mes = '';
    let ano = '';
    if (d.timestamp) {
      const dtObj = new Date(d.timestamp);
      mes = String(dtObj.getMonth() + 1).padStart(2, '0'); // 01 a 12
      ano = String(dtObj.getFullYear());
    } else if (dataText) {
      // Tenta extrair do campo data (formato DD/MM/AAAA)
      const partes = dataText.split('/');
      if (partes.length === 3) {
        mes = partes[1];
        ano = partes[2];
      }
    }

    // ="valor" é o único jeito confiável de forçar texto puro no Excel via CSV:
    // impede que "09/05/2026" vire data e que "1778..." vire notação científica.
    const texto = (str) => `="${String(str == null ? '' : str).replace(/"/g, '""')}"`;

    const row = [
      texto(finalId),                        // ID — evita 1,78E+12
      escapar(d.avaliador || 'Anônimo'),
      escapar(d.atendente || ''),
      escapar(d.avaliacao || ''),
      pesoValue,                             // Peso — número normal, sem aspas
      escapar(d.feedback || ''),
      texto(dataText),                       // Data — evita ########
      texto(horaText),                       // Hora — evita conversão automática
      escapar(mes),                          // Mês (01-12) — para filtro no Power BI
      escapar(ano)                           // Ano (ex: 2026) — para filtro no Power BI
    ];
    csvRows.push(row.join(SEP));
  });

  // BOM UTF-8 (\ufeff) garante acentos corretos no Excel Windows
  // \r\n é o fim de linha padrão do Windows/Excel
  const conteudo = '\ufeff' + csvRows.join('\r\n');
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'avaliacoes_fortaleza.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportJSON() {
  const data = loadData();
  if (!data.length) return alert('Sem dados para exportar!');

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'avaliacoes_fortaleza.json';
  a.click();
  URL.revokeObjectURL(url);
}