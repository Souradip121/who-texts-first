// Takes the reel screenshots with headless Chrome over the DevTools protocol.
// Uses the made-up sample chat. The AI call is STUBBED: no key is used and the
// verdict text below is a placeholder, not a real model answer.
//
//   node tools/shoot.mjs [url] [outDir]
//   default url: http://127.0.0.1:8794/   default outDir: screenshots/

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL_ = process.argv[2] || 'http://127.0.0.1:8794/';
const OUT = process.argv[3] || 'screenshots';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STUB_VERDICT = 'VERDICT: You’re carrying this chat.';
const FAKE_KEY = 'sk-ant-api03-SCREENSHOT-ONLY-NOT-A-REAL-KEY-0000000000';

mkdirSync(OUT, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'wtf-shoot-'));
const port = 9300 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function json(path) {
  for (let i = 0; i < 50; i++) {
    try { return await (await fetch(`http://127.0.0.1:${port}${path}`)).json(); } catch { await sleep(200); }
  }
  throw new Error('chrome did not start');
}

const targets = await json('/json/list');
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const n = ++id;
  pending.set(n, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
  ws.send(JSON.stringify({ id: n, method, params }));
});
const run = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r.result.value;
};
async function shot(file, { full = false } = {}) {
  const params = { format: 'png', captureBeyondViewport: full };
  if (full) {
    const { cssContentSize } = await send('Page.getLayoutMetrics');
    params.clip = { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 };
  }
  const { data } = await send('Page.captureScreenshot', params);
  writeFileSync(file, Buffer.from(data, 'base64'));
  console.log('saved', file);
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.setBypassCSP', { enabled: true });
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `(() => {
    const real = window.fetch.bind(window);
    window.fetch = async (url, opts) => {
      if (/api\\.(anthropic|openai)\\.com|generativelanguage/.test(String(url))) {
        await new Promise(r => setTimeout(r, 1200));
        return new Response(JSON.stringify({ content: [{ type: 'text', text: ${JSON.stringify(STUB_VERDICT)} }] }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return real(url, opts);
    };
  })();`,
});

async function phone() {
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
}
async function desktop() {
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
}
async function load() {
  await send('Page.navigate', { url: URL_ });
  await sleep(1500);
  await run('document.fonts.ready.then(() => true)');
}
const flow = {
  toChat: `(async () => {
    document.querySelector('.prov[data-provider=claude]').click();
    const k = document.querySelector('#key'); k.value = ${JSON.stringify(FAKE_KEY)}; k.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#to-chat').click();
    await new Promise(r => setTimeout(r, 300));
    document.querySelector('#sample').click();
    for (let i = 0; i < 40 && !document.querySelector('input[name=me]'); i++) await new Promise(r => setTimeout(r, 100));
    return document.querySelector('#parse-note').textContent;
  })()`,
  toResult: `(async () => {
    document.querySelector('#analyze').click();
    for (let i = 0; i < 80 && document.querySelector('#verdict').dataset.state !== 'done'; i++) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 2200));
    return document.querySelector('#verdict-text').textContent;
  })()`,
};

try {
  await phone();
  await load();
  await shot(join(OUT, '1-pick-how-to-run-it.png'));
  await shot(join(OUT, '1-pick-how-to-run-it-full.png'), { full: true });
  console.log(await run(flow.toChat));
  await sleep(700);
  await run('window.scrollTo(0, 0)');
  await shot(join(OUT, '2-add-your-chat.png'));
  console.log(await run(flow.toResult));
  await run('window.scrollTo(0, 0)');
  await sleep(300);
  await shot(join(OUT, '3-whos-putting-in-the-effort.png'));
  await shot(join(OUT, '3-whos-putting-in-the-effort-full.png'), { full: true });
  // the share card PNG itself, exactly as the page made it
  await run(`document.querySelector('#share').click()`);
  for (let i = 0; i < 50; i++) { if (await run(`document.querySelector('#sheet').open`)) break; await sleep(200); }
  await sleep(400);
  const dataUrl = await run(`(async () => { const b = await (await fetch(document.querySelector('#sheet-img').src)).blob(); return await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); })()`);
  writeFileSync(join(OUT, '4-share-card.png'), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('saved', join(OUT, '4-share-card.png'));
  await shot(join(OUT, '5-share-sheet.png'));

  if (process.env.DESKTOP !== '0') {
    await desktop();
    await load();
    await shot(join(OUT, 'desktop.png'));
  }
} finally {
  ws.close();
  chrome.kill();
}
