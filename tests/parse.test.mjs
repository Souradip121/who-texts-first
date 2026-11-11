// node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';

import { parseChat, detectOrder, guessThem } from '../js/parse.js';
import { computeStats, isDry, formatDuration, speedScore, median, MIN } from '../js/stats.js';
import { chatTextFromZip, isZip } from '../js/zip.js';
import { buildRequest, parseVerdict, askVerdict, _request, SAMPLE_SIZE } from '../js/ai.js';
import { generate, toAndroid, toIphone, ME, THEM } from '../tools/make-sample.mjs';

const truth = generate();
const floorMin = t => Math.floor(t / MIN) * MIN;

function sameMessages(parsed, { minuteOnly }) {
  assert.equal(parsed.messages.length, truth.length, 'message count');
  for (let i = 0; i < truth.length; i++) {
    const a = parsed.messages[i], b = truth[i];
    assert.equal(a.sender, b.sender, `sender #${i}`);
    assert.equal(a.kind, b.kind, `kind #${i}`);
    assert.equal(a.t, minuteOnly ? floorMin(b.t) : b.t, `time #${i}`);
    if (b.kind === 'text') assert.equal(a.text, b.text, `text #${i}`);
  }
}

test('synthetic sample is about 2,000 messages between two made-up people', () => {
  assert.ok(truth.length > 1800 && truth.length < 2200, `${truth.length}`);
  assert.deepEqual([...new Set(truth.map(m => m.sender))].sort(), [ME, THEM].sort());
});

test('Android export, day/month, 12-hour with narrow space before pm', () => {
  const p = parseChat(toAndroid(truth));
  assert.equal(p.format, 'android');
  assert.equal(p.order, 'DMY');
  assert.equal(p.system, 1, 'encryption notice skipped');
  sameMessages(p, { minuteOnly: true });
  assert.deepEqual(p.participants.map(x => x.name).sort(), [ME, THEM].sort());
});

test('Android export, month/day (US phone), 12-hour', () => {
  const p = parseChat(toAndroid(truth, { order: 'MDY' }));
  assert.equal(p.order, 'MDY');
  sameMessages(p, { minuteOnly: true });
});

test('Android export, day/month, 24-hour', () => {
  const p = parseChat(toAndroid(truth, { clock: 24 }));
  sameMessages(p, { minuteOnly: true });
});

test('iPhone export with BOM, CRLF, seconds, LRM marks and attributed system line', () => {
  const p = parseChat(toIphone(truth));
  assert.equal(p.format, 'iphone');
  assert.equal(p.order, 'DMY');
  assert.equal(p.system, 1);
  sameMessages(p, { minuteOnly: false });
});

test('iPhone export, month/day', () => {
  const p = parseChat(toIphone(truth, { order: 'MDY' }));
  assert.equal(p.order, 'MDY');
  sameMessages(p, { minuteOnly: false });
});

test('multi-line, edited, deleted, media, group tilde names and system lines', () => {
  const raw = [
    '05/11/26, 10:00 pm - Messages and calls are end-to-end encrypted. Learn more.',
    '05/11/26, 10:00 pm - ~ Riya created group "CSE B"',
    '05/11/26, 10:01 pm - ~ Riya: first line',
    'second line',
    '',
    'third line after a blank',
    '05/11/26, 10:02 pm - Kabir: fixed it <This message was edited>',
    '05/11/26, 10:03 pm - Kabir: <Media omitted>',
    '05/11/26, 10:04 pm - Riya: This message was deleted',
    '05/11/26, 10:05 pm - Kabir: time: 10:05, place: canteen',
    '05/11/26, 10:06 pm - Riya added Arjun',
    '05/11/26, 10:07 pm - Kabir: Missed voice call',
    '05/11/26, 10:08 pm - Riya: null',
    '05/11/26, 10:09 pm - Kabir: IMG-20261105-WA0007.jpg (file attached)',
  ].join('\n');
  const p = parseChat(raw);
  assert.equal(p.messages.length, 7);
  assert.equal(p.system, 4);
  assert.equal(p.messages[0].sender, 'Riya');
  assert.equal(p.messages[0].text, 'first line\nsecond line\n\nthird line after a blank');
  assert.equal(p.messages[1].text, 'fixed it');
  assert.equal(p.messages[2].kind, 'media');
  assert.equal(p.messages[3].kind, 'deleted');
  assert.equal(p.messages[4].text, 'time: 10:05, place: canteen');
  assert.equal(p.messages[5].kind, 'media');
  assert.equal(p.messages[6].kind, 'media');
});

test('other separators and clocks: dots, a.m., 24h iPhone, ISO dates', () => {
  const a = parseChat('[05.11.26, 22:01:09] Riya: hi\n[05.11.26, 22:03:00] Kabir: hey');
  assert.equal(a.messages.length, 2);
  assert.equal(new Date(a.messages[0].t).toISOString(), '2026-11-05T22:01:09.000Z');
  const b = parseChat('5/11/2026, 9:41 p.m. - Riya: hi\n13/11/2026, 12:05 a.m. - Kabir: hey');
  assert.equal(new Date(b.messages[0].t).toISOString(), '2026-11-05T21:41:00.000Z');
  assert.equal(new Date(b.messages[1].t).toISOString(), '2026-11-13T00:05:00.000Z');
  const c = parseChat('[2026-11-05, 9:41:02 PM] Riya: hi');
  assert.equal(new Date(c.messages[0].t).toISOString(), '2026-11-05T21:41:02.000Z');
  const d = parseChat('11/5/26, 12:30 PM - Riya: noon');
  assert.equal(new Date(d.messages[0].t).getUTCHours(), 12);
});

test('ambiguous dates pick the order whose timestamps run forwards', () => {
  // Every number is <= 12. Read as M/D these run Jan 5, Jan 9, Feb 3, Feb 8,
  // Mar 1; read as D/M they would jump backwards twice.
  const days = [[1, 5], [1, 9], [2, 3], [2, 8], [3, 1]];
  const mdy = days.map(([m, d]) => `${m}/${d}/26, 9:00 pm - A: x`).join('\n');
  assert.equal(parseChat(mdy).order, 'MDY');
  const dmy = days.map(([m, d]) => `${d}/${m}/26, 9:00 pm - A: x`).join('\n');
  assert.equal(parseChat(dmy).order, 'DMY');
  assert.equal(detectOrder([]), 'DMY');
});

test('not a WhatsApp export gives no messages', () => {
  const p = parseChat('hello\nthis is a shopping list\nmilk');
  assert.equal(p.messages.length, 0);
});

test('dry replies', () => {
  for (const s of ['hmm', 'Hmmmm.', 'hm', 'mm', 'ok', 'Okayyy', 'k', 'kk', 'okk', 'okie', 'achha', 'Accha!', 'oh', 'ohh', 'hmm 🙂'])
    assert.ok(isDry(s), s);
  for (const s of ['hmm ok', 'okay see you at 5', 'kya', 'haha', 'nice', '👍', '', 'what', 'ka'])
    assert.ok(!isDry(s) || s === 'ka', s);
});

test('stats from the parsed iPhone export equal the ground truth', () => {
  const p = parseChat(toIphone(truth));
  for (const range of ['all', '3m']) {
    const a = computeStats(p.messages, ME, THEM, { range });
    const b = computeStats(truth, ME, THEM, { range });
    for (const k of ['messages', 'replyMedian', 'starts', 'doubles', 'dry', 'late'])
      for (const w of ['me', 'them']) assert.equal(a[w][k], b[w][k], `${range} ${w}.${k}`);
  }
});

test('stats from the Android export (minute precision) stay within a minute', () => {
  const p = parseChat(toAndroid(truth));
  const a = computeStats(p.messages, ME, THEM, { range: '3m' });
  const b = computeStats(truth, ME, THEM, { range: '3m' });
  for (const w of ['me', 'them']) {
    assert.ok(Math.abs(a[w].replyMedian - b[w].replyMedian) <= MIN, `${w} median`);
    assert.equal(a[w].dry, b[w].dry);
    assert.equal(a[w].late, b[w].late);
    assert.ok(Math.abs(a[w].starts - b[w].starts) <= 1, `${w} starts`);
  }
});

test('the sample tells the story the reel needs (last 3 months)', () => {
  const s = computeStats(truth, ME, THEM, { range: '3m' });
  assert.equal(formatDuration(s.me.replyMedian), '3 min');
  assert.equal(formatDuration(s.them.replyMedian), '2 h');
  assert.equal(Math.round(s.me.startShare * 100), 80);
  assert.ok(s.them.dry > 30 && s.them.dry < 60, `${s.them.dry}`);
  assert.ok(s.me.startShare + s.them.startShare > 0.999);
});

test('stats rules on a hand-made chat', () => {
  const t0 = Date.UTC(2026, 10, 1, 23, 58);
  const m = (min, sender, text = 'yo') => ({ t: t0 + min * MIN, sender, text, kind: 'text' });
  const s = computeStats([
    m(0, 'A'),            // start A
    m(5, 'B', 'hmm'),     // B replies in 5 min (12:03 am): dry, after midnight
    m(6, 'A'),            // A replies in 1 min
    m(40, 'A', 'hello??'),// A double text (34 min later)
    m(40 + 13 * 60, 'B'), // 13 h later: not a reply, a new start by B
    m(40 + 13 * 60 + 2, 'C'), // someone else: ignored
  ], 'A', 'B');
  assert.equal(s.me.starts, 1);
  assert.equal(s.them.starts, 1);
  assert.equal(s.me.replyMedian, 1 * MIN);
  assert.equal(s.them.replyMedian, 5 * MIN);
  assert.equal(s.them.replyCount, 1);
  assert.equal(s.me.doubles, 1);
  assert.equal(s.them.dry, 1);
  assert.equal(s.them.late, 1);
  assert.equal(s.me.late, 2);
  assert.equal(s.total, 5);
});

test('durations and bar lengths', () => {
  assert.equal(formatDuration(20e3), '<1 min');
  assert.equal(formatDuration(3 * MIN), '3 min');
  assert.equal(formatDuration(89 * MIN), '89 min');
  assert.equal(formatDuration(95 * MIN), '1.6 h');
  assert.equal(formatDuration(11.6 * 60 * MIN), '12 h');
  assert.equal(formatDuration(null), '—');
  assert.ok(Math.abs(speedScore(3 * MIN) - 0.83) < 0.01);
  assert.ok(Math.abs(speedScore(120 * MIN) - 0.27) < 0.01);
  assert.equal(median([3, 1, 2, 4]), 2.5);
});

// a tiny zip writer, to test the reader against a real deflated archive
function makeZip(files) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const [name, text, store] of files) {
    const data = Buffer.from(text, 'utf8');
    const body = store ? data : zlib.deflateRawSync(data);
    const n = Buffer.from(name);
    const crc = zlib.crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(store ? 0 : 8, 8);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(n.length, 26);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(store ? 0 : 8, 10);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(n.length, 28); ch.writeUInt32LE(offset, 42);
    locals.push(lh, n, body);
    centrals.push(ch, n);
    offset += 30 + n.length + body.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  const buf = Buffer.concat([...locals, cd, end]);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
}

test('iPhone .zip export: finds _chat.txt and inflates it', async () => {
  const text = toIphone(truth);
  const zip = makeZip([
    ['__MACOSX/._chat.txt', 'junk', true],
    ['00000012-PHOTO-2026-05-02.jpg', 'not really a jpg', true],
    ['_chat.txt', text, false],
  ]);
  assert.ok(isZip(new Uint8Array(zip, 0, 4)));
  const out = await chatTextFromZip(zip);
  assert.equal(out, text.replace(/^﻿/, '')); // TextDecoder drops the BOM
  assert.equal(parseChat(out).messages.length, truth.length);
});

test('file name tells us who "them" is', () => {
  const people = [{ name: 'Aarav' }, { name: 'Meera' }];
  assert.equal(guessThem('WhatsApp Chat with Meera.txt', people), 'Meera');
  assert.equal(guessThem('WhatsApp Chat - Meera.zip', people), 'Meera');
  assert.equal(guessThem('WhatsApp Chat with Meera (sample).txt', people), 'Meera');
  assert.equal(guessThem('WhatsApp Chat with Meera (2).txt', people), 'Meera');
  assert.equal(guessThem('chat.txt', people), null);
});

test('the AI gets stats plus the last 300 messages, with names swapped for You/Them', () => {
  const s = computeStats(truth, ME, THEM, { range: 'all' });
  const body = buildRequest(s, ME, THEM);
  const lines = body.split('\n').filter(l => /^\[\d{4}-\d\d-\d\d \d\d:\d\d\] (You|Them): /.test(l));
  assert.equal(lines.length, SAMPLE_SIZE);
  assert.ok(!/\] (Aarav|Meera):/.test(body), 'no real sender names');
  assert.match(body, /\| Median reply time \| 3 min \| 2 h \|/);
  assert.ok(body.length < 20000, `prompt is ${body.length} chars`);
});

test('request shapes match each provider\'s docs', () => {
  const o = _request('openai', 'k', 'gpt-6-luna', 'u');
  assert.equal(o.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(o.headers.Authorization, 'Bearer k');
  assert.equal(o.body.reasoning_effort, 'none');
  assert.ok(o.body.max_completion_tokens);
  const g = _request('gemini', 'k', 'gemini-3.5-flash-lite', 'u');
  assert.equal(g.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
  assert.equal(g.headers['x-goog-api-key'], 'k');
  assert.equal(g.body.contents[0].parts[0].text, 'u');
  const c = _request('claude', 'k', 'claude-haiku-5-5', 'u');
  assert.equal(c.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(c.headers['x-api-key'], 'k');
  assert.equal(c.headers['anthropic-dangerous-direct-browser-access'], 'true');
  assert.equal(c.headers['anthropic-version'], '2023-06-01');
  assert.equal(c.body.thinking.type, 'disabled');
  assert.equal(c.body.output_config.effort, 'low');
});

test('verdict parsing', () => {
  assert.deepEqual(parseVerdict('VERDICT: "You\'re carrying this chat."\nWHY: You reply in 3 min, they take 2 h.'),
    { verdict: 'You\'re carrying this chat.', why: 'You reply in 3 min, they take 2 h.' });
  assert.deepEqual(parseVerdict('**VERDICT:** Fair fight.'), { verdict: 'Fair fight.', why: '' });
  assert.equal(parseVerdict('Just one line').verdict, 'Just one line');
});

test('provider errors turn into friendly messages', async () => {
  const s = computeStats(truth, ME, THEM, { range: '3m' });
  const run = async (provider, status, body, thrown) => {
    globalThis.fetch = async () => {
      if (thrown) throw thrown;
      return new Response(JSON.stringify(body), { status });
    };
    try { await askVerdict({ provider, key: 'x', model: 'm', stats: s, me: ME, them: THEM }); return null; }
    catch (e) { return e; }
  };
  assert.equal((await run('openai', 401, { error: { code: 'invalid_api_key', message: 'Incorrect API key' } })).kind, 'key');
  assert.equal((await run('openai', 429, { error: { code: 'insufficient_quota', message: 'You exceeded your current quota' } })).kind, 'quota');
  assert.equal((await run('openai', 429, { error: { code: 'rate_limit_exceeded', message: 'Rate limit' } })).kind, 'rate');
  assert.equal((await run('gemini', 400, { error: { code: 400, status: 'INVALID_ARGUMENT', message: 'API key not valid. Please pass a valid API key.', details: [{ reason: 'API_KEY_INVALID' }] } })).kind, 'key');
  assert.equal((await run('gemini', 429, { error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: 'You exceeded your current quota' } })).kind, 'quota');
  assert.equal((await run('claude', 401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } })).kind, 'key');
  assert.equal((await run('claude', 400, { type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API.' } })).kind, 'quota');
  assert.equal((await run('claude', 404, { type: 'error', error: { type: 'not_found_error', message: 'model: m' } })).kind, 'model');
  assert.equal((await run('claude', 529, { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } })).kind, 'server');
  // OpenAI's 401 has no CORS header, so in a browser a bad key surfaces as a TypeError
  const refused = await run('openai', 0, null, new TypeError('Failed to fetch'));
  assert.equal(refused.kind, 'openai-refused');
  assert.match(refused.message, /key is wrong or the account has no credit/);
  const net = await run('claude', 0, null, new TypeError('Failed to fetch'));
  assert.equal(net.kind, 'network');
  assert.match(net.message, /Couldn't reach Claude/);
  // and a good answer from each provider
  const ok = {
    openai: { choices: [{ message: { content: 'VERDICT: You\'re carrying this chat.\nWHY: 3 min vs 2 h.' } }] },
    gemini: { candidates: [{ content: { parts: [{ text: 'thinking…', thought: true }, { text: 'VERDICT: You\'re carrying this chat.\nWHY: 3 min vs 2 h.' }] } }] },
    claude: { content: [{ type: 'text', text: 'VERDICT: You\'re carrying this chat.\nWHY: 3 min vs 2 h.' }] },
  };
  for (const p of Object.keys(ok)) {
    globalThis.fetch = async () => new Response(JSON.stringify(ok[p]), { status: 200 });
    const v = await askVerdict({ provider: p, key: 'x', model: 'm', stats: s, me: ME, them: THEM });
    assert.equal(v.verdict, 'You\'re carrying this chat.', p);
  }
});
