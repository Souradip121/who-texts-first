// Route B: asks the provider the user picked for a one-line verdict.
// Called straight from the browser with the user's own key. The key and the
// request go to that provider's API and nowhere else.

import { formatDuration } from './stats.js';

export const PROVIDERS = {
  openai: {
    label: 'OpenAI',
    model: 'gpt-6-luna',
    keyHint: 'sk-…',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  gemini: {
    label: 'Gemini',
    model: 'gemini-3.5-flash-lite',
    keyHint: 'AIza…',
    keyUrl: 'https://aistudio.google.com/apikey',
  },
  claude: {
    label: 'Claude',
    model: 'claude-haiku-5-5',
    keyHint: 'sk-ant-…',
    keyUrl: 'https://platform.claude.com/settings/keys',
  },
};

export const SAMPLE_SIZE = 300;
const TIMEOUT = 45000;

const SYSTEM = `You judge effort in a WhatsApp chat between two people: "You" (the person asking) and "Them".
You get exact stats worked out from the chat, plus their most recent messages for flavour.
Decide who is putting in more effort and write a playful verdict addressed to You.
Rules: warm and funny, never cruel or insulting; don't quote messages; don't use names; no emoji; no hashtags.
Reply with exactly one line and nothing else:
VERDICT: <the verdict, at most 10 words>`;

function pct(x) { return x == null ? '—' : `${Math.round(x * 100)}%`; }

function day(t) {
  return new Date(t).toISOString().slice(0, 16).replace('T', ' ');
}

/** Builds the user message: the stats table plus the last ~300 messages, names swapped for You/Them. */
export function buildRequest(stats, me, them) {
  const s = stats;
  const rows = [
    ['Median reply time', formatDuration(s.me.replyMedian), formatDuration(s.them.replyMedian)],
    ['Starts chats (after 6+ h silence)', pct(s.me.startShare), pct(s.them.startShare)],
    ['Double texts', s.me.doubles, s.them.doubles],
    ['Dry replies (hmm, ok, k)', s.me.dry, s.them.dry],
    ['Messages after midnight', s.me.late, s.them.late],
    ['Messages', s.me.messages, s.them.messages],
    ['Average words per message', s.me.avgWords.toFixed(1), s.them.avgWords.toFixed(1)],
  ];
  const table = ['| | You | Them |', '|---|---|---|', ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
  const recent = s.list.slice(-SAMPLE_SIZE).map(m => {
    const who = m.sender === me ? 'You' : 'Them';
    let text = m.kind === 'media' ? '<media>' : m.kind === 'deleted' ? '<deleted>' : m.text.replace(/\s+/g, ' ');
    if (text.length > 280) text = text.slice(0, 280) + '…';
    return `[${day(m.t)}] ${who}: ${text}`;
  });
  return `Stats from ${s.total} messages, ${day(s.from).slice(0, 10)} to ${day(s.to).slice(0, 10)}:\n\n${table}\n\n` +
    `Last ${recent.length} messages, oldest first:\n${recent.join('\n')}`;
}

export class AiError extends Error {
  constructor(kind, provider, detail = '', status = 0) {
    super(friendly(kind, provider, detail, status));
    this.kind = kind;
    this.provider = provider;
    this.status = status;
    this.detail = detail;
  }
}

function friendly(kind, provider, detail, status) {
  const name = PROVIDERS[provider]?.label || 'The AI';
  switch (kind) {
    case 'key': return `${name} didn't accept that key. Check you copied all of it, with no spaces.`;
    case 'quota': return `Your ${name} account is out of credit or free quota. Top it up, or pick another AI.`;
    case 'rate': return `${name} says too many requests right now. Wait a minute and try again.`;
    case 'model': return `${name} doesn't offer the model "${detail}" to this key. Change it under Model.`;
    case 'region': return `${name} isn't available in your region with this key.`;
    case 'network': return `Couldn't reach ${name}. Check your internet, or switch off any ad blocker for this page.`;
    // OpenAI sends its "bad key" and some billing errors without CORS headers,
    // so the browser can't read them and they look like a network failure.
    case 'openai-refused': return `OpenAI turned the request down. Usually the key is wrong or the account has no credit: check you copied all of it and that billing is set up, or try Gemini or Claude.`;
    case 'timeout': return `${name} took too long to answer. Try again.`;
    case 'blocked': return `${name} wouldn't write a verdict for this chat. Try another AI.`;
    case 'empty': return `${name} sent back an empty answer. Try again.`;
    case 'server': return `${name} is having a moment (error ${status}). Try again shortly.`;
    default: return `${name} said: ${detail || `error ${status}`}`;
  }
}

function classify(provider, status, body, model) {
  const err = body?.error || {};
  const msg = String(err.message || body?.message || '').slice(0, 200);
  const code = String(err.code || err.type || err.status || '');
  const reason = (err.details || []).map(d => d.reason).join(' ');
  if (provider === 'openai') {
    if (status === 401 || code === 'invalid_api_key') return ['key', msg];
    if (code === 'insufficient_quota' || /quota|billing/i.test(msg)) return ['quota', msg];
    if (status === 429) return ['rate', msg];
    if (status === 404 || code === 'model_not_found') return ['model', model];
    if (status === 403 && /country|region|territory/i.test(msg)) return ['region', msg];
    if (status === 403) return ['key', msg];
  }
  if (provider === 'gemini') {
    if (/API_KEY_INVALID|API_KEY/i.test(reason) || (status === 400 && /api key/i.test(msg))) return ['key', msg];
    if (status === 401 || status === 403) return ['key', msg];
    if (status === 429 || code === 'RESOURCE_EXHAUSTED') return [/quota|billing|limit: 0/i.test(msg) ? 'quota' : 'rate', msg];
    if (status === 404) return ['model', model];
    if (/location is not supported|region/i.test(msg)) return ['region', msg];
  }
  if (provider === 'claude') {
    if (status === 401 || code === 'authentication_error') return ['key', msg];
    if (status === 403 || code === 'permission_error') return ['key', msg];
    if (/credit balance|billing|quota/i.test(msg)) return ['quota', msg];
    if (status === 429 || code === 'rate_limit_error') return ['rate', msg];
    if (status === 404 || code === 'not_found_error') return ['model', model];
  }
  if (status === 529 || status >= 500) return ['server', msg];
  return ['other', msg];
}

function request(provider, key, model, user) {
  if (provider === 'openai') {
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: {
        model,
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
        max_completion_tokens: 400,
        reasoning_effort: 'none',
      },
    };
  }
  if (provider === 'gemini') {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: {
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        // Flash-Lite already thinks at its lowest level by default, so no thinkingConfig.
        generationConfig: { maxOutputTokens: 1024 },
      },
    };
  }
  return {
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: {
      model,
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: 'user', content: user }],
      output_config: { effort: 'low' },
      thinking: { type: 'disabled' },
    },
  };
}

function textOf(provider, data) {
  if (provider === 'openai') return data?.choices?.[0]?.message?.content || '';
  if (provider === 'gemini') {
    if (data?.promptFeedback?.blockReason) throw new AiError('blocked', provider);
    const c = data?.candidates?.[0];
    if (c?.finishReason === 'SAFETY' || c?.finishReason === 'PROHIBITED_CONTENT') throw new AiError('blocked', provider);
    return (c?.content?.parts || []).filter(p => !p.thought && p.text).map(p => p.text).join('');
  }
  return (data?.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
}

/** Splits "VERDICT: …\nWHY: …" into parts; falls back to the first line. */
export function parseVerdict(text) {
  const clean = String(text).replace(/\*\*/g, '').trim();
  const v = /VERDICT:\s*(.+)/i.exec(clean);
  const w = /WHY:\s*(.+)/i.exec(clean);
  const strip = s => s.trim().replace(/^["“”']+|["“”']+$/g, '').trim();
  if (v) return { verdict: strip(v[1]), why: w ? strip(w[1]) : '' };
  const first = clean.split('\n').find(Boolean) || '';
  return { verdict: strip(first), why: '' };
}

/**
 * Asks the provider for the verdict.
 * @returns {Promise<{verdict:string, why:string}>}
 */
export async function askVerdict({ provider, key, model, stats, me, them, signal }) {
  const user = buildRequest(stats, me, them);
  const req = request(provider, key.trim(), model, user);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort('timeout'), TIMEOUT);
  signal?.addEventListener('abort', () => ctl.abort('cancel'));
  let res;
  try {
    res = await fetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
      signal: ctl.signal,
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });
  } catch (e) {
    clearTimeout(timer);
    if (ctl.signal.aborted) throw new AiError(ctl.signal.reason === 'cancel' ? 'other' : 'timeout', provider, 'Cancelled');
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    throw new AiError(provider === 'openai' && !offline ? 'openai-refused' : 'network', provider);
  }
  clearTimeout(timer);
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) {
    const [kind, detail] = classify(provider, res.status, data, model);
    throw new AiError(kind, provider, detail, res.status);
  }
  const text = textOf(provider, data);
  if (!text.trim()) throw new AiError('empty', provider);
  return parseVerdict(text);
}

export { request as _request, SYSTEM as _SYSTEM };
