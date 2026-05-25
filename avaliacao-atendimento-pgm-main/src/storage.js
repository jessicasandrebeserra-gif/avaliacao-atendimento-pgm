// Abstrai localStorage para facilitar testes e manutenibilidade
export function loadData() {
  try {
    return JSON.parse(localStorage.getItem('avaliacoes') || '[]');
  } catch (e) {
    console.error("Erro ao ler localStorage:", e);
    return [];
  }
}

export function saveData(data) {
  localStorage.setItem('avaliacoes', JSON.stringify(data));
}
