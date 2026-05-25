import { ATENDENTES, PESOS, CORES_GRAFICOS } from './constants.js';
import { loadData } from './storage.js';

export function initProgramador() {
  updateDashboard();
  switchDashView('geral');
}

export function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const selectedTab = document.getElementById(`tab-${tabId}`);
  const selectedScreen = document.getElementById(`screen-${tabId}`);
  if (selectedTab) selectedTab.classList.add('active');
  if (selectedScreen) selectedScreen.classList.add('active');
  if (tabId === 'dashboard') { updateDashboard(); switchDashView('geral'); }
  else if (tabId === 'exportar') { renderPreview(); }
}

export function switchDashView(view) {
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

export function updateDashboard() {
  const data = loadData();
  const totalBadge = document.getElementById('total-badge');
  if (totalBadge) totalBadge.textContent = `${data.length} avaliações`;
  const counts = { 'Ótimo': 0, 'Bom': 0, 'Médio': 0, 'Ruim': 0 };
  const attTotals = {};
  const subgroupCounts = {};
  data.forEach(d => {
    if (d.avaliacao) counts[d.avaliacao] = (counts[d.avaliacao] || 0) + 1;
    if (d.atendente) attTotals[d.atendente] = (attTotals[d.atendente] || 0) + 1;
    if (Array.isArray(d.subgrupos)) d.subgrupos.forEach(sub => subgroupCounts[sub] = (subgroupCounts[sub] || 0) + 1);
    else if (d.subgrupo) subgroupCounts[d.subgrupo] = (subgroupCounts[d.subgrupo] || 0) + 1;
  });
  const cntOtimo = document.getElementById('cnt-otimo');
  const cntBom = document.getElementById('cnt-bom');
  const cntMedio = document.getElementById('cnt-medio');
  const cntRuim = document.getElementById('cnt-ruim');
  if (cntOtimo) cntOtimo.textContent = counts['Ótimo'];
  if (cntBom) cntBom.textContent = counts['Bom'];
  if (cntMedio) cntMedio.textContent = counts['Médio'];
  if (cntRuim) cntRuim.textContent = counts['Ruim'];

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

  const miniBars = document.getElementById('mini-bars');
  if (miniBars) {
    miniBars.innerHTML = '';
    const total = data.length || 1;
    const distribuicao = [
      { label: 'Ótimo', key: 'Ótimo', color: 'var(--otimo)' },
      { label: 'Bom', key: 'Bom', color: 'var(--bom)' },
      { label: 'Médio', key: 'Médio', color: 'var(--medio)' },
      { label: 'Ruim', key: 'Ruim', color: 'var(--ruim)' },
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

  const subgroupBars = document.getElementById('subgroup-bars');
  if (subgroupBars) {
    subgroupBars.innerHTML = '';
    const total = data.length || 1;
    const subgroupMap = {};

    data.forEach(d => {
      const subgroups = Array.isArray(d.subgrupos)
        ? d.subgrupos
        : (d.subgrupo ? [d.subgrupo] : []);
      const atendente = d.atendente || 'Sem atendente';

      subgroups.forEach(sub => {
        if (!subgroupMap[sub]) subgroupMap[sub] = {};
        subgroupMap[sub][atendente] = (subgroupMap[sub][atendente] || 0) + 1;
      });
    });

    const sortedSubgroups = Object.entries(subgroupMap)
      .map(([label, attendants]) => ({
        label,
        totalCount: Object.values(attendants).reduce((sum, count) => sum + count, 0),
        attendants
      }))
      .sort((a, b) => b.totalCount - a.totalCount);

    sortedSubgroups.forEach(({ label, totalCount, attendants }) => {
      const sortedAttendants = Object.entries(attendants).sort((a, b) => b[1] - a[1]);

      subgroupBars.innerHTML += `
        <div class="bar-row">
          <div class="bar-label" style="width: 120px; font-size: 0.75rem;">${label}</div>
          <div class="bar-track" style="flex: 1; height: 10px; background: var(--border); border-radius: 50px; overflow: hidden; display: flex; align-items: stretch;">
            ${sortedAttendants.map(([att, count], index) => {
              const attIndex = ATENDENTES.indexOf(att);
              const color = CORES_GRAFICOS[(attIndex >= 0 ? attIndex : index) % CORES_GRAFICOS.length];
              const segmentPercent = ((count / totalCount) * 100).toFixed(1);
              const isFirst = index === 0;
              const isLast = index === sortedAttendants.length - 1;
              return `<div class="bar-fill" style="width: ${segmentPercent}%; background-color: ${color}; height: 100%; border-radius: ${isFirst ? '50px 0 0 50px' : isLast ? '0 50px 50px 0' : '0'};"></div>`;
            }).join('')}
          </div>
          <div class="bar-count" style="width: 48px; font-size: 0.72rem; text-align: right; color: var(--muted);">${totalCount}</div>
        </div>
        <div style="margin: -6px 0 12px 130px; display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.72rem; color: var(--muted);">
          ${sortedAttendants.map(([att, count], index) => {
            const attIndex = ATENDENTES.indexOf(att);
            const color = CORES_GRAFICOS[(attIndex >= 0 ? attIndex : index) % CORES_GRAFICOS.length];
            return `<span style="display: flex; align-items: center; gap: 4px;">
              <span style="width: 10px; height: 10px; border-radius: 999px; background: ${color}; display: inline-block;"></span>
              ${att} (${count})
            </span>`;
          }).join('')}
        </div>
      `;
    });
  }
}

export function buildAttChips() {
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

export function showAttendantDetails(att, cor) {
  const data = loadData();
  const attData = data.filter(d => d.atendente === att);
  const detailArea = document.getElementById('att-detail-area');
  if (!detailArea) return;
  if (attData.length === 0) { detailArea.innerHTML = `<div class="empty-state">Nenhuma avaliação para ${att} ainda.</div>`; return; }
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
        <p style="font-size: 0.8rem; color: var(--text);">
          <strong>Subgrupos:</strong> ${Array.isArray(d.subgrupos) ? d.subgrupos.join(', ') : (d.subgrupo || 'Não informado')}
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

export function renderPreview() {
  const data = loadData();
  const container = document.getElementById('preview-area');
  if (!container) return;
  if (!data.length) { container.innerHTML = '<div class="empty-state"><div class="icon">📋</div>Nenhum dado cadastrado ainda.</div>'; return; }
  let tableHtml = `
    <table class="preview-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Avaliador</th>
          <th>Atendente</th>
          <th>Avaliação</th>
          <th>Peso</th>
          <th>Subgrupos</th>
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
        <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${Array.isArray(d.subgrupos) ? d.subgrupos.join(', ') : (d.subgrupo || '')}</td>
        <td>${dataText}</td>
        <td>${horaText}</td>
      </tr>
    `;
  });
  tableHtml += '</tbody></table>';
  container.innerHTML = tableHtml;
}

export function exportCSV() {
  const data = loadData();
  if (!data.length) return alert('Sem dados para exportar!');
  const SEP = ';';
  const headers = ['ID', 'Avaliador', 'Atendente', 'Avaliacao', 'Peso', 'Subgrupos', 'Data', 'Hora', 'Mes', 'Ano'];
  const csvRows = [headers.join(SEP)];
  const escapar = (str) => {
    const s = String(str == null ? '' : str);
    if (s.includes(',') || s.includes(SEP) || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
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
    let mes = '';
    let ano = '';
    if (d.timestamp) {
      const dtObj = new Date(d.timestamp);
      mes = String(dtObj.getMonth() + 1).padStart(2, '0');
      ano = String(dtObj.getFullYear());
    } else if (dataText) {
      const partes = dataText.split('/');
      if (partes.length === 3) { mes = partes[1]; ano = partes[2]; }
    }
    const texto = (str) => `="${String(str == null ? '' : str).replace(/"/g, '""')}"`;
    const row = [texto(finalId), escapar(d.avaliador || 'Anônimo'), escapar(d.atendente || ''), escapar(d.avaliacao || ''), pesoValue, escapar(Array.isArray(d.subgrupos) ? d.subgrupos.join(', ') : (d.subgrupo || '')), texto(dataText), texto(horaText), escapar(mes), escapar(ano)];
    csvRows.push(row.join(SEP));
  });
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

export function exportJSON() {
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
