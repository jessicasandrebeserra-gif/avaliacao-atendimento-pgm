import { HASH_SENHA } from './constants.js';

export function openPwdModal() {
  const modal = document.getElementById('pwd-modal');
  if (modal) {
    modal.classList.add('open');
    setTimeout(() => document.getElementById('pwd-input').focus(), 100);
  }
}

export function closePwdModal() {
  const modal = document.getElementById('pwd-modal');
  if (modal) {
    modal.classList.remove('open');
    document.getElementById('pwd-input').value = '';
    const err = document.getElementById('pwd-error');
    if (err) err.textContent = '';
  }
}

export function togglePwd() {
  const input = document.getElementById('pwd-input');
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
}

export async function confirmPwd() {
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
    const err = document.getElementById('pwd-error');
    if (err) err.textContent = 'Senha incorreta. Tente novamente.';
    const input = document.getElementById('pwd-input');
    if (input) input.value = '';
  }
}
