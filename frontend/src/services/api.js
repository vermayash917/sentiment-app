// frontend/src/services/api.js
export async function register(email, password){
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
  return res.json();
}
export async function login(email, password){
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
  return res.json();
}
export function setToken(token){ localStorage.setItem('token', token); }
export function getToken(){ return localStorage.getItem('token'); }
export function authFetch(url, opts = {}){
  const token = getToken();
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers||{}), Authorization: `Bearer ${token}` },
  });
}
export async function uploadCSV(file){
  const fd = new FormData();
  fd.append('file', file);
  const res = await authFetch('/api/upload-csv', { method: 'POST', body: fd });
  return res.json();
}
export async function analyzeText(text){
  const res = await authFetch('/api/analyze', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ text })});
  return res.json();
}
export async function getHistory(){
  const res = await authFetch('/api/history');
  return res.json();
}
