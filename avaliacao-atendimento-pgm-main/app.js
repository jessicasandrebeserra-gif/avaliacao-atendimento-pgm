
// Ponto de entrada modular. Importa os módulos e expõe as funções necessárias
import * as constants from './src/constants.js';
import * as storage from './src/storage.js';
import * as auth from './src/auth.js';
import * as evaluator from './src/evaluator.js';
import * as dashboard from './src/dashboard.js';

// Expõe no escopo global (window) as funções usadas por handlers inline nos HTMLs
window.ATENDENTES = constants.ATENDENTES;
window.initAvaliador = evaluator.initAvaliador;
window.selectRating = evaluator.selectRating;
window.renderSubgroupOptions = evaluator.renderSubgroupOptions;
window.toggleSubgroup = evaluator.toggleSubgroup;
window.validateAvaliador = evaluator.validateAvaliador;
window.checkSubmit = evaluator.checkSubmit;
window.submitRating = evaluator.submitRating;

window.initProgramador = dashboard.initProgramador;
window.switchTab = dashboard.switchTab;
window.switchDashView = dashboard.switchDashView;
window.updateDashboard = dashboard.updateDashboard;
window.buildAttChips = dashboard.buildAttChips;
window.showAttendantDetails = dashboard.showAttendantDetails;
window.renderPreview = dashboard.renderPreview;
window.exportCSV = dashboard.exportCSV;
window.exportJSON = dashboard.exportJSON;

window.openPwdModal = auth.openPwdModal;
window.closePwdModal = auth.closePwdModal;
window.togglePwd = auth.togglePwd;
window.confirmPwd = auth.confirmPwd;

// Nota: as variáveis e funções internas permanecem encapsuladas nos módulos.
      escapar(d.avaliacao || ''),
      pesoValue,                            // Peso — número, sem aspas (para cálculos no BI) 
      escapar(Array.isArray(d.subgrupos) ? d.subgrupos.join(', ') : (d.subgrupo || '')),
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