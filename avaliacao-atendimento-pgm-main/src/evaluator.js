import { ATENDENTES, PESOS } from './constants.js';
import { loadData, saveData } from './storage.js';

let selectedAttendant = null;
let selectedRating = null;
let selectedSubgroups = [];

export function initAvaliador() {
  const grid = document.getElementById('attendant-grid');
  if (!grid) return;
  grid.innerHTML = '';
  ATENDENTES.forEach((name) => {
    const card = document.createElement('div');
    card.className = 'attendant-card';
    card.innerHTML = `
      <div class="attendant-avatar">
        <img src="pessoas.png" alt="Atendente" class="attendant-img" />
      </div>
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

export function selectRating(btn) {
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedRating = btn.dataset.val;
  selectedSubgroups = [];
  renderSubgroupOptions(selectedRating);
  checkSubmit();
}

export function renderSubgroupOptions(rating) {
  const subgroupArea = document.getElementById('rating-subgroup-area');
  const subgroupList = document.getElementById('rating-subgroup-list');
  if (!subgroupArea || !subgroupList) return;

  const subgroupData = {
    'Ótimo': [
      'Atendimento rápido',
      'Muito educado',
      'Resolveu meu problema',
      'Explicação clara',
      'Excelente organização',
      'Superou expectativas'
    ],
    'Bom': [
      'Atendimento satisfatório',
      'Resolveu parcialmente',
      'Boa educação',
      'Tempo aceitável',
      'Poderia ser mais rápido',
      'Informações úteis'
    ],
    'Médio': [
      'Demorou no atendimento',
      'Informações confusas',
      'Pouca atenção',
      'Problema parcialmente resolvido',
      'Falta de clareza',
      'Atendimento regular'
    ],
    'Ruim': [
      'Demora excessiva',
      'Mau atendimento',
      'Não resolveu o problema',
      'Falta de educação',
      'Informações erradas',
      'Necessita melhoria'
    ]
  };

  const options = subgroupData[rating] || [];
  subgroupList.innerHTML = '';

  if (!options.length) {
    subgroupArea.classList.add('hidden');
    return;
  }

  options.forEach((label) => {
    const option = document.createElement('span');
    option.className = 'rating-subgroup';
    option.textContent = label;
    option.dataset.subgroup = label;
    option.onclick = (event) => toggleSubgroup(event, label, option);
    subgroupList.appendChild(option);
  });

  subgroupArea.classList.remove('hidden');
}

export function toggleSubgroup(event, label, element) {
  event.stopPropagation();
  const index = selectedSubgroups.indexOf(label);
  if (index === -1) {
    selectedSubgroups.push(label);
    element.classList.add('selected');
  } else {
    selectedSubgroups.splice(index, 1);
    element.classList.remove('selected');
  }
  checkSubmit();
}

export function validateAvaliador() {
  const input = document.getElementById('avaliador-input');
  if (!input) return false;
  const val = input.value.trim();
  const isValid = val.length >= 3 && val.includes(' ');
  input.classList.toggle('invalid', val.length > 0 && !isValid);
  const hint = document.getElementById('avaliador-hint');
  if (hint) hint.classList.toggle('show', val.length > 0 && !isValid);
  return isValid;
}

export function checkSubmit() {
  const avaliadorInput = document.getElementById('avaliador-input');
  if (!avaliadorInput) return;
  const avaliadorVal = avaliadorInput.value.trim();
  const isValidAvaliador = avaliadorVal.length >= 3 && avaliadorVal.includes(' ');
  const canSubmit = isValidAvaliador && selectedAttendant && selectedRating && selectedSubgroups.length > 0;
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) submitBtn.disabled = !canSubmit;
}

export function submitRating() {
  const data = loadData();
  const avaliadorInput = document.getElementById('avaliador-input');
  const agora = new Date();
  const novaAvaliacao = {
    id: Date.now(),
    avaliador: avaliadorInput.value.trim(),
    atendente: selectedAttendant,
    avaliacao: selectedRating,
    subgrupos: selectedSubgroups.slice(),
    peso: PESOS[selectedRating] || 0,
    data: agora.toLocaleDateString('pt-BR'),
    hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    timestamp: agora.toISOString()
  };
  data.push(novaAvaliacao);
  saveData(data);

  selectedAttendant = null;
  selectedRating = null;
  selectedSubgroups = [];
  avaliadorInput.value = '';

  document.querySelectorAll('.attendant-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.rating-subgroup').forEach(s => s.classList.remove('selected'));
  const subgroupArea = document.getElementById('rating-subgroup-area');
  if (subgroupArea) subgroupArea.classList.add('hidden');
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) submitBtn.disabled = true;
  const toast = document.getElementById('toast');
  if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2500); }
}
