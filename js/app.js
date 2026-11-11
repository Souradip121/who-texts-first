// Who Texts First: wiring for the three screens.
import { PROMPT } from './prompt.js';
import { parseChat, guessThem } from './parse.js';
import { readChatFile } from './zip.js';
import { computeStats, formatDuration, speedScore } from './stats.js';
import { PROVIDERS, askVerdict, SAMPLE_SIZE } from './ai.js';
import { renderCard } from './card.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const nf = new Intl.NumberFormat('en-IN');
const df = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dfShort = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// ---------- state ----------
// The key lives in this object and in sessionStorage (cleared when the tab closes).
// It is never written anywhere else and only ever sent to the provider's own API.
const store = {
  get(k) { try { return sessionStorage.getItem(`whotexts.${k}`); } catch { return null; } },
  set(k, v) { try { v ? sessionStorage.setItem(`whotexts.${k}`, v) : sessionStorage.removeItem(`whotexts.${k}`); } catch { /* private mode */ } },
};
const state = {
  provider: PROVIDERS[store.get('provider')] ? store.get('provider') : 'openai',
  keys: { openai: store.get('key.openai') || '', gemini: store.get('key.gemini') || '', claude: store.get('key.claude') || '' },
  models: {
    openai: store.get('model.openai') || PROVIDERS.openai.model,
    gemini: store.get('model.gemini') || PROVIDERS.gemini.model,
    claude: store.get('model.claude') || PROVIDERS.claude.model,
  },
  chat: null,
  fileName: '',
  me: null,
  them: null,
  stats: null,
  verdict: null,
  controller: null,
  cardUrl: null,
};

// ---------- screens + history ----------
const screens = { start: $('#screen-start'), chat: $('#screen-chat'), result: $('#screen-result') };
let current = 'start';

function show(name, { push = true, focus = true } = {}) {
  if (name === 'result' && !state.stats) name = state.chat ? 'chat' : 'start';
  current = name;
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
  const el = screens[name];
  el.classList.remove('enter');
  void el.offsetWidth;
  el.classList.add('enter');
  $('#back').hidden = name === 'start';
  if (push) history.pushState({ screen: name }, '', name === 'start' ? location.pathname + location.search : `#${name}`);
  window.scrollTo(0, 0);
  if (focus) $('.pill', el).focus({ preventScroll: true });
}

history.replaceState({ screen: 'start' }, '', location.pathname + location.search);
addEventListener('popstate', (e) => show(e.state?.screen || 'start', { push: false }));
$('#back').addEventListener('click', () => {
  if (history.state?.screen && history.state.screen !== 'start') history.back();
  else show('start');
});

// ---------- route A: the prompt ----------
const promptBox = $('#prompt');
$('#prompt-text').textContent = PROMPT;
$('#prompt-toggle').addEventListener('click', (e) => {
  const open = promptBox.dataset.open !== 'true';
  promptBox.dataset.open = String(open);
  e.currentTarget.setAttribute('aria-expanded', String(open));
  e.currentTarget.textContent = open ? 'Show less' : 'Show the whole prompt';
});

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { /* in-app browsers often block this; fall back */ }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.opacity = '0';
  document.body.append(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}

let copyTimer;
$('#copy').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const ok = await copyText(PROMPT);
  const status = $('#copy-status');
  if (ok) {
    btn.classList.add('done');
    $('.label', btn).textContent = 'Copied!';
    $('use', btn).setAttribute('href', '#i-check');
    status.textContent = 'Prompt copied. Now export your chat and paste both into the AI.';
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      btn.classList.remove('done');
      $('.label', btn).textContent = 'Copy prompt';
      $('use', btn).setAttribute('href', '#i-copy');
    }, 2400);
  } else {
    promptBox.dataset.open = 'true';
    $('#prompt-toggle').setAttribute('aria-expanded', 'true');
    $('#prompt-toggle').textContent = 'Show less';
    const range = document.createRange();
    range.selectNodeContents($('#prompt-text'));
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    status.textContent = 'Your browser blocked copying. The prompt is selected: tap Copy in the menu.';
    $('.label', btn).textContent = 'Selected, tap Copy';
  }
});

$('#howto-toggle').addEventListener('click', (e) => {
  const box = $('#howto');
  box.hidden = !box.hidden;
  e.currentTarget.setAttribute('aria-expanded', String(!box.hidden));
});

// ---------- route B: provider + key ----------
const keyInput = $('#key');
const keyError = $('#key-error');

function article(label) { return /^[AEIOU]/.test(label) ? 'an' : 'a'; }

function selectProvider(id, { focus = false } = {}) {
  state.provider = id;
  store.set('provider', id);
  const p = PROVIDERS[id];
  for (const b of $$('.prov')) {
    const on = b.dataset.provider === id;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focus) b.focus();
  }
  keyInput.value = state.keys[id];
  keyInput.placeholder = p.keyHint;
  keyInput.setAttribute('aria-label', `${p.label} API key`);
  const get = $('#get-key');
  get.href = p.keyUrl;
  get.firstChild.textContent = `Get ${article(p.label)} ${p.label} key`;
  $('#model-name').textContent = state.models[id];
  $('#model').value = state.models[id];
  for (const n of $$('.prov-name')) n.textContent = p.label;
  $('#forget').hidden = !state.keys[id];
  clearKeyError();
}

$('.providers').addEventListener('click', (e) => {
  const b = e.target.closest('.prov');
  if (b) selectProvider(b.dataset.provider);
});
$('.providers').addEventListener('keydown', (e) => {
  const ids = Object.keys(PROVIDERS);
  const i = ids.indexOf(state.provider);
  let j = null;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % ids.length;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i + ids.length - 1) % ids.length;
  if (j !== null) { e.preventDefault(); selectProvider(ids[j], { focus: true }); }
});

function detectProvider(key) {
  if (/^sk-ant-/.test(key)) return 'claude';
  if (/^AIza/.test(key)) return 'gemini';
  if (/^sk-/.test(key)) return 'openai';
  return null;
}

function clearKeyError() {
  keyError.hidden = true;
  keyError.textContent = '';
  $('.keyfield').classList.remove('invalid');
}
function showKeyError(msg) {
  keyError.textContent = msg;
  keyError.hidden = false;
  $('.keyfield').classList.add('invalid');
}

keyInput.addEventListener('input', () => {
  const key = keyInput.value.trim();
  const guess = detectProvider(key);
  if (guess && guess !== state.provider) {
    // the key says which AI it belongs to; follow it
    state.keys[state.provider] = '';
    store.set(`key.${state.provider}`, '');
    state.keys[guess] = key;
    selectProvider(guess);
    keyInput.value = key;
  }
  state.keys[state.provider] = key;
  store.set(`key.${state.provider}`, key);
  $('#forget').hidden = !key;
  clearKeyError();
});

$('#eye').addEventListener('click', (e) => {
  const showing = keyInput.type === 'text';
  keyInput.type = showing ? 'password' : 'text';
  e.currentTarget.setAttribute('aria-pressed', String(!showing));
  e.currentTarget.setAttribute('aria-label', showing ? 'Show key' : 'Hide key');
  $('use', e.currentTarget).setAttribute('href', showing ? '#i-eye' : '#i-eye-off');
});

$('#forget').addEventListener('click', () => {
  state.keys[state.provider] = '';
  store.set(`key.${state.provider}`, '');
  keyInput.value = '';
  $('#forget').hidden = true;
  keyInput.focus();
});

$('#model-toggle').addEventListener('click', (e) => {
  const box = $('#model-box');
  box.hidden = !box.hidden;
  e.currentTarget.setAttribute('aria-expanded', String(!box.hidden));
  if (!box.hidden) $('#model').focus();
});
$('#model').addEventListener('input', (e) => {
  const v = e.target.value.trim() || PROVIDERS[state.provider].model;
  state.models[state.provider] = v;
  store.set(`model.${state.provider}`, v === PROVIDERS[state.provider].model ? '' : v);
  $('#model-name').textContent = v;
});

$('#to-chat').addEventListener('click', () => {
  const key = state.keys[state.provider];
  if (!key) {
    showKeyError(`Paste your ${PROVIDERS[state.provider].label} API key first, or use the prompt above instead.`);
    keyInput.focus();
    return;
  }
  if (/\s/.test(key)) {
    showKeyError('That key has a space in it. Copy it again without spaces.');
    keyInput.focus();
    return;
  }
  const short = { openai: 40, gemini: 30, claude: 40 }[state.provider];
  if (key.length < short) {
    showKeyError(`That looks too short for ${article(PROVIDERS[state.provider].label)} ${PROVIDERS[state.provider].label} key. Copy the whole thing.`);
    keyInput.focus();
    return;
  }
  show('chat');
});

// ---------- add your chat ----------
const drop = $('#drop');
const note = $('#parse-note');

function setNote(text, bad = false) {
  note.textContent = text;
  note.classList.toggle('bad', bad);
}

function fmtRange(a, b) {
  if (a == null) return '';
  const ya = new Date(a).getUTCFullYear();
  const yb = new Date(b).getUTCFullYear();
  return `${ya === yb ? dfShort.format(a) : df.format(a)} – ${df.format(b)}`;
}

function clearFile() {
  state.chat = null;
  state.fileName = '';
  state.me = state.them = null;
  $('#file').value = '';
  $('#filechip').hidden = true;
  drop.classList.remove('has-file');
  $('#who').hidden = true;
  $('#who-them-box').hidden = true;
  setNote('');
  syncAnalyze();
}

async function handleFile(file, { sample = false } = {}) {
  if (!file) return;
  state.fileName = file.name || 'chat.txt';
  state.sample = sample;
  $('#filename').textContent = sample ? 'Made-up sample chat' : state.fileName;
  $('#filechip').hidden = false;
  drop.classList.add('has-file');
  setNote('Reading your chat…');
  state.chat = null;
  syncAnalyze();
  await new Promise(r => setTimeout(r, 16));
  let parsed;
  try {
    const text = await readChatFile(file);
    parsed = parseChat(text);
  } catch (err) {
    const zip = /zip/.test(String(err?.message));
    setNote(zip
      ? 'Couldn’t open that .zip. Unzip it and pick the _chat.txt file inside.'
      : 'Couldn’t read that file. Pick the .txt or .zip that WhatsApp’s Export chat made.', true);
    return;
  }
  if (!parsed.messages.length) {
    setNote('This doesn’t look like a WhatsApp export. In WhatsApp, open the chat, use Export chat (without media), and pick that file.', true);
    return;
  }
  if (parsed.participants.length < 2) {
    setNote(`Only ${parsed.participants[0].name} has messages in this file. Is it the right chat?`, true);
    return;
  }
  state.chat = parsed;
  const fmt = parsed.format === 'iphone' ? 'iPhone export' : 'Android export';
  setNote(`${nf.format(parsed.messages.length)} messages · ${fmtRange(parsed.first, parsed.last)} · ${fmt}`);
  buildWho(parsed);
  syncAnalyze();
}

function choice(name, value, label, sub, checked) {
  const l = document.createElement('label');
  l.className = 'choice';
  const i = document.createElement('input');
  i.type = 'radio';
  i.name = name;
  i.value = value;
  i.checked = checked;
  const s = document.createElement('span');
  s.textContent = label;
  const sm = document.createElement('small');
  sm.textContent = sub;
  s.append(sm);
  l.append(i, s);
  return l;
}

function buildWho(parsed) {
  const people = parsed.participants.slice(0, 8);
  // The export is named after the other person, so if the file name matches
  // someone, they're "them" and the busiest other person is "you". Otherwise ask.
  const them = guessThem(state.fileName, people);
  state.them = them;
  state.me = them ? people.find(p => p.name !== them).name : null;
  const box = $('#who-me');
  box.replaceChildren(...people.map(p => choice('me', p.name, p.name, `${nf.format(p.count)} messages`, p.name === state.me)));
  $('#who').hidden = false;
  buildThem();
}

function buildThem() {
  const people = state.chat.participants.slice(0, 8);
  const others = people.filter(p => p.name !== state.me);
  if (!state.me) { $('#who-them-box').hidden = true; return; }
  if (!state.them || state.them === state.me) state.them = others[0].name;
  if (people.length <= 2) { $('#who-them-box').hidden = true; return; }
  $('#who-them').replaceChildren(...others.map(p => choice('them', p.name, p.name, `${nf.format(p.count)} messages`, p.name === state.them)));
  $('#who-them-box').hidden = false;
}

$('#who-me').addEventListener('change', (e) => {
  state.me = e.target.value;
  if (state.them === state.me) state.them = null;
  buildThem();
  syncAnalyze();
});
$('#who-them').addEventListener('change', (e) => { state.them = e.target.value; });

$('#file').addEventListener('change', (e) => handleFile(e.target.files[0]));
for (const ev of ['dragenter', 'dragover']) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); });
for (const ev of ['dragleave', 'dragend']) drop.addEventListener(ev, () => drop.classList.remove('over'));
drop.addEventListener('drop', (e) => {
  e.preventDefault();
  drop.classList.remove('over');
  handleFile(e.dataTransfer?.files?.[0]);
});
$('#file-remove').addEventListener('click', () => { clearFile(); $('#file').focus(); });

$('#sample').addEventListener('click', async () => {
  setNote('Loading the made-up sample…');
  try {
    const res = await fetch('samples/sample-android.txt');
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    await handleFile(new File([blob], 'WhatsApp Chat with Meera (sample).txt', { type: 'text/plain' }), { sample: true });
  } catch {
    setNote('Couldn’t load the sample. Check your connection and try again.', true);
  }
});

function syncAnalyze() {
  const ready = Boolean(state.chat && state.me);
  $('#analyze').setAttribute('aria-disabled', String(!ready));
}

$('#analyze').addEventListener('click', () => {
  if (!state.chat) {
    setNote('Add your chat first: tap the box above and pick the export.', true);
    $('#file').focus();
    return;
  }
  if (!state.me) {
    setNote('Pick which name is you.', true);
    $('input[name="me"]')?.focus();
    return;
  }
  if (!state.keys[state.provider]) {
    show('start');
    showKeyError(`Paste your ${PROVIDERS[state.provider].label} API key first.`);
    keyInput.focus();
    return;
  }
  const range = $('input[name="range"]:checked').value;
  state.stats = computeStats(state.chat.messages, state.me, state.them, { range });
  if (state.stats.total < 2) {
    setNote('There are almost no messages in that range. Try “All time”.', true);
    state.stats = null;
    return;
  }
  state.verdict = null;
  show('result');
  renderResult();
  runVerdict();
});

// ---------- results ----------
function countUp(el, to, suffix = '') {
  if (reduceMotion.matches || to == null) { el.textContent = to == null ? '—' : `${to}${suffix}`; return; }
  const t0 = performance.now();
  const dur = 900;
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = `${Math.round(to * e)}${suffix}`;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function renderResult() {
  const s = state.stats;
  $('#r-you').textContent = formatDuration(s.me.replyMedian);
  $('#r-them').textContent = formatDuration(s.them.replyMedian);
  const race = $('#race');
  race.classList.remove('racing');
  for (const [id, ms, who] of [['you', s.me.replyMedian, 'Your'], ['them', s.them.replyMedian, 'Their']]) {
    const w = speedScore(ms);
    const bar = $(`#bar-${id}`);
    bar.style.setProperty('--w', w.toFixed(3));
    bar.style.setProperty('--dur', `${(0.35 + 1.3 * w).toFixed(2)}s`);
    $(`#bar-${id}-label`).setAttribute('aria-label', `${who} median reply time is ${formatDuration(ms)}; the longer the bar, the faster.`);
  }
  void race.offsetWidth;
  race.classList.add('racing');

  countUp($('#start-pct'), s.me.startShare == null ? null : Math.round(s.me.startShare * 100), '%');
  const dryThem = s.them.dry >= s.me.dry;
  countUp($('#dry-n'), dryThem ? s.them.dry : s.me.dry);
  $('#dry-who').textContent = dryThem ? 'dry replies from them' : 'dry replies from you';

  const pct = x => (x == null ? '—' : `${Math.round(x * 100)}%`);
  const rows = [
    ['Median reply', formatDuration(s.me.replyMedian), formatDuration(s.them.replyMedian)],
    ['Starts chats', pct(s.me.startShare), pct(s.them.startShare)],
    ['Double texts', nf.format(s.me.doubles), nf.format(s.them.doubles)],
    ['Dry replies', nf.format(s.me.dry), nf.format(s.them.dry)],
    ['After midnight', nf.format(s.me.late), nf.format(s.them.late)],
    ['Messages', nf.format(s.me.messages), nf.format(s.them.messages)],
  ];
  $('#receipts').replaceChildren(...rows.map(([k, a, b]) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = k;
    const ta = document.createElement('td');
    ta.textContent = a;
    const tb = document.createElement('td');
    tb.textContent = b;
    tr.append(th, ta, tb);
    return tr;
  }));
  const scope = s.range === '3m' ? 'the last 3 months of the chat' : 'the whole chat';
  const sampleNote = state.sample ? ' This is the made-up sample chat, not a real one.' : '';
  $('#range-note').textContent = `${nf.format(s.total)} messages from ${scope}, ${fmtRange(s.from, s.to)}. You are ${state.me}; they are ${state.them}.${sampleNote}`;
}

function setVerdictState(st) { $('#verdict').dataset.state = st; }

async function typeOut(el, text) {
  if (reduceMotion.matches) { el.textContent = text; return; }
  el.textContent = '';
  el.classList.add('caret');
  for (let i = 1; i <= text.length; i++) {
    el.textContent = text.slice(0, i);
    await new Promise(r => setTimeout(r, text[i - 1] === ' ' ? 18 : 34));
  }
  el.classList.remove('caret');
}

async function runVerdict() {
  state.controller?.abort();
  const ctl = new AbortController();
  state.controller = ctl;
  const text = $('#verdict-text');
  const by = $('#verdict-by');
  $('#verdict-error').hidden = true;
  by.textContent = '';
  setVerdictState('loading');
  text.textContent = `Asking ${PROVIDERS[state.provider].label}…`;
  try {
    const v = await askVerdict({
      provider: state.provider,
      key: state.keys[state.provider],
      model: state.models[state.provider],
      stats: state.stats,
      me: state.me,
      them: state.them,
      signal: ctl.signal,
    });
    if (ctl.signal.aborted) return;
    state.verdict = v;
    state.verdictBy = state.provider;
    setVerdictState('done');
    await typeOut(text, `“${v.verdict}”`);
    by.textContent = `${PROVIDERS[state.provider].label}’s verdict`;
  } catch (err) {
    if (ctl.signal.aborted) return;
    setVerdictState('error');
    text.textContent = '';
    $('#err-msg').textContent = err.message || 'Something went wrong. Try again.';
    $('#verdict-error').hidden = false;
  }
}

$('#retry').addEventListener('click', runVerdict);
$('#change-key').addEventListener('click', () => {
  show('start');
  keyInput.focus();
  keyInput.select();
});
$('#again').addEventListener('click', () => {
  state.controller?.abort();
  state.stats = null;
  clearFile();
  show('chat');
});

// ---------- share ----------
const sheet = $('#sheet');
$('#share').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.setAttribute('aria-busy', 'true');
  try {
    const blob = await renderCard({
      stats: state.stats,
      verdict: state.verdict?.verdict,
      by: state.verdict ? `${PROVIDERS[state.verdictBy || state.provider].label}’s verdict` : '',
      range: state.stats.range,
      sample: state.sample,
    });
    if (state.cardUrl) URL.revokeObjectURL(state.cardUrl);
    state.cardUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.className = 'sheet-img';
    img.id = 'sheet-img';
    img.alt = 'Your result card: reply times, who starts chats, dry replies and the AI verdict.';
    img.src = state.cardUrl;
    $('#sheet-frame').replaceChildren(img);
    $('#download').href = state.cardUrl;
    const file = new File([blob], 'who-texts-first.png', { type: 'image/png' });
    const canShare = Boolean(navigator.canShare && navigator.canShare({ files: [file] }));
    const native = $('#native-share');
    native.hidden = !canShare;
    native.onclick = async () => {
      try { await navigator.share({ files: [file], title: 'Who Texts First' }); } catch { /* user closed the sheet */ }
    };
    if (typeof sheet.showModal === 'function') sheet.showModal();
    else { const a = $('#download'); a.click(); }
  } finally {
    btn.removeAttribute('aria-busy');
  }
});
$('#sheet-close').addEventListener('click', () => sheet.close());
sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });

// ---------- boot ----------
selectProvider(state.provider);
syncAnalyze();
