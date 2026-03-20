// ============================================================
// Customer Service — API Client
// ============================================================

const API = '';

let _csToken: string | null = null;

export function setCsAuthToken(token: string | null) {
  _csToken = token;
  if (token) sessionStorage.setItem('cs_token', token);
  else sessionStorage.removeItem('cs_token');
}
export function getCsAuthToken() { return _csToken; }

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (_csToken) headers['Authorization'] = `Bearer ${_csToken}`;
  return fetch(`${API}${path}`, { ...init, headers });
}

// ── Auth ──
export async function csLogin(email: string, password: string) {
  const res = await apiFetch('/api/cs/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  return res.json();
}
export async function csLogout() { setCsAuthToken(null); }
export async function csGetMe() {
  const res = await apiFetch('/api/cs/auth/me');
  return res.json();
}

// ── Stats ──
export async function getCsStats() {
  const res = await apiFetch('/api/cs/stats');
  return res.json();
}

// ── Tickets ──
export async function getTickets(status?: string) {
  const url = status ? `/api/cs/tickets?status=${encodeURIComponent(status)}` : '/api/cs/tickets';
  const res = await apiFetch(url);
  return res.json();
}
export async function getTicket(id: string) {
  const res = await apiFetch(`/api/cs/tickets/${encodeURIComponent(id)}`);
  return res.json();
}
export async function createTicket(data: { customerId: string; subject: string; description: string; priority?: string; category?: string }) {
  const res = await apiFetch('/api/cs/tickets', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}
export async function updateTicket(id: string, data: { status?: string; assigneeId?: string; priority?: string }) {
  const res = await apiFetch(`/api/cs/tickets/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
  return res.json();
}
export async function addTicketReply(id: string, data: { message: string; isInternal?: boolean }) {
  const res = await apiFetch(`/api/cs/tickets/${encodeURIComponent(id)}/replies`, { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// ── Customers ──
export async function getCustomers(q?: string) {
  const url = q ? `/api/cs/customers?q=${encodeURIComponent(q)}` : '/api/cs/customers';
  const res = await apiFetch(url);
  return res.json();
}
export async function getCustomer(id: string) {
  const res = await apiFetch(`/api/cs/customers/${encodeURIComponent(id)}`);
  return res.json();
}

// ── FAQ ──
export async function getFaqCategories() {
  const res = await apiFetch('/api/cs/faq');
  return res.json();
}

// ── xClaw Chat (via @xclaw-ai/chat-sdk) ──
import { XClawClient } from '@xclaw-ai/chat-sdk';

const XCLAW_BASE = '/xclaw-api';
const xclawClient = new XClawClient({ baseUrl: XCLAW_BASE });

export async function loginXClaw(email: string, password: string): Promise<{ token: string } | { error: string }> {
  try {
    const res = await xclawClient.login({ email, password });
    return { token: res.token };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Login failed' };
  }
}

export function chatXClawStream(token: string, message: string, sessionId?: string, onDelta?: (text: string) => void): { cancel: () => void; done: Promise<string> } {
  xclawClient.setToken(token);
  const handle = xclawClient.chatStream(message, {
    onTextDelta: (delta) => onDelta?.(delta),
  }, { sessionId });
  return { cancel: handle.cancel, done: handle.done };
}
