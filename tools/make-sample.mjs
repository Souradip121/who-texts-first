// Generates a SYNTHETIC WhatsApp chat (made-up people, made-up messages) in
// both export formats, for the "Try the sample chat" button and the tests.
// No real chat is used anywhere in this project.
//
//   node tools/make-sample.mjs            -> writes samples/*.txt
//
// The story: Aarav replies in minutes and starts most chats; Meera replies in
// hours and says "hmm" a lot.

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ME = 'Aarav';
export const THEM = 'Meera';
const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AARAV = [
  'heyy what are you up to', 'did you see the timetable for next week', 'canteen samosa was actually good today',
  'okay random question', 'are you coming for the fest prep meeting', 'bro the DBMS assignment is so long',
  'just finished the lab record finally', 'what did you have for dinner', 'I found a cafe near the station, we should go',
  'you free tomorrow evening?', 'the new episode dropped!!', 'lol that\'s so true', 'wait really?', 'haha same',
  'how was your day', 'sleeping already?', 'good morning! exam at 10, wish me luck', 'did you reach home?',
  'that prof was so funny today', 'sending you the notes now', 'which song was that', 'you have to try this game',
  'okay I\'ll stop spamming now', 'tell me when you\'re free', 'coffee at 5?', 'the WiFi in the hostel died again',
  'I made maggi at 2am, no regrets', 'can you share the PPT', 'Sunday plans?', 'that meme is literally us',
  'happy birthday to your dog!!', 'I think I failed the quiz', 'nah I\'m kidding I did okay', 'what time is the bus',
  'okay goodnight!', 'are you mad at me lol', 'you\'re so busy these days', 'I saved you a seat in the front row',
  'the auto guy charged 80 rupees for 2 km', 'guess who got placed in the coding round', 'hello??',
];
const MEERA = [
  'hmm ok', 'lol', 'nice', 'busy rn', 'will see', 'maybe',
  'yeah', 'sorry was asleep', 'just saw this', 'cool', 'idk', 'haha', 'nothing much', 'in class', 'tired',
  'sure', 'can\'t today', 'what', 'good', 'hmm nice', 'sent', 'thanks', 'on my way', 'lmao',
  'that was fun', 'tell me later', 'yeah I\'ll come',
];
const DRY_MEERA = ['hmm', 'ok', 'k', 'hmmm', 'okay', 'achha', 'okk', 'oh'];

/** Ground-truth messages, in order. */
export function generate(seed = 379) {
  const r = rng(seed);
  const pick = arr => arr[Math.floor(r() * arr.length)];
  const logn = (median, sigma) => median * Math.exp(sigma * Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()));
  const out = [];
  let t = Date.UTC(2026, 2, 16, 9, 0, 0); // 16 Mar 2026
  const end = Date.UTC(2026, 10, 10, 23, 0, 0); // 10 Nov 2026
  const push = (sender, text, kind = 'text') => {
    const last = out.length ? out[out.length - 1].t : 0;
    if (t <= last) t = last + 1000 + Math.floor(r() * 4000);
    t = Math.max(Math.round(t / 1000) * 1000, last + 1000); // exports have whole seconds
    out.push({ t, sender, text, kind });
  };
  const say = (sender) => {
    const roll = r();
    if (roll < 0.03) return push(sender, '', 'media');
    if (roll < 0.035) return push(sender, '', 'deleted');
    if (sender === THEM) {
      const text = r() < 0.19 ? pick(DRY_MEERA) : pick(MEERA);
      return push(sender, text);
    }
    let text = pick(AARAV);
    if (r() < 0.04) text += '\n' + pick(AARAV); // a multi-line message
    if (r() < 0.012) text = 'hmm';
    return push(sender, text);
  };
  const burst = (sender) => {
    const n = sender === ME ? 1 + Math.floor(r() * 3) : 1 + (r() < 0.25 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      if (i) t += 4000 + Math.floor(r() * 50000);
      say(sender);
    }
  };

  while (t < end) {
    // next conversation: mostly evenings, some late nights
    const dayStart = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth(), new Date(t).getUTCDate());
    const gapDays = r() < 0.9 ? 1 : 2;
    const hour = r() < 0.2 ? 23 + r() * 2 : 9 + r() * 13;
    let start = dayStart + gapDays * DAY + hour * HOUR;
    if (start <= t + 6 * HOUR) start = t + 6 * HOUR + r() * 3 * HOUR;
    t = Math.floor(start);
    if (t >= end) break;

    let speaker = r() < 0.78 ? ME : THEM;
    const exchanges = 6 + Math.floor(r() * 12);
    for (let i = 0; i < exchanges; i++) {
      burst(speaker);
      const other = speaker === ME ? THEM : ME;
      if (other === THEM && r() < 0.12) {
        // no reply: Aarav sometimes double texts
        if (r() < 0.6) { t += 25 * MIN + r() * 90 * MIN; push(ME, pick(['hello??', 'you there?', '??', 'okay nvm'])); }
        break;
      }
      const delay = other === ME
        ? Math.min(logn(3.2 * MIN, 0.85), 3 * HOUR)
        : Math.min(logn(118 * MIN, 0.7), 5.6 * HOUR);
      t += Math.max(20000, Math.floor(delay));
      speaker = other;
    }
  }
  return out;
}

const pad = n => String(n).padStart(2, '0');

function parts(t) {
  const d = new Date(t);
  return { y: d.getUTCFullYear() % 100, mo: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds() };
}
function h12(h) { return { h: h % 12 === 0 ? 12 : h % 12, ap: h < 12 ? 'am' : 'pm' }; }

/**
 * Android "Export chat (without media)": 11/10/26, 9:41 pm - Name: text
 * @param {{order?: 'DMY'|'MDY', clock?: 12|24}} opts
 */
export function toAndroid(messages, { order = 'DMY', clock = 12 } = {}) {
  const lines = [];
  const first = messages[0];
  const head = (t) => {
    const p = parts(t);
    const date = order === 'MDY' ? `${p.mo}/${p.d}/${pad(p.y)}` : `${pad(p.d)}/${pad(p.mo)}/${pad(p.y)}`;
    if (clock === 24) return `${date}, ${pad(p.h)}:${pad(p.mi)}`;
    const { h, ap } = h12(p.h);
    return `${date}, ${h}:${pad(p.mi)} ${ap}`;
  };
  lines.push(`${head(first.t)} - Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. Learn more.`);
  for (const m of messages) {
    let text = m.kind === 'media' ? '<Media omitted>' : m.kind === 'deleted' ? 'This message was deleted' : m.text;
    lines.push(`${head(m.t)} - ${m.sender}: ${text}`);
  }
  return lines.join('\n') + '\n';
}

/** iPhone "Export Chat (Without Media)": [11/10/26, 9:41:02 PM] Name: text */
export function toIphone(messages, { order = 'DMY' } = {}) {
  const lines = [];
  const head = (t) => {
    const p = parts(t);
    const date = order === 'MDY' ? `${p.mo}/${p.d}/${pad(p.y)}` : `${pad(p.d)}/${pad(p.mo)}/${pad(p.y)}`;
    const { h, ap } = h12(p.h);
    return `[${date}, ${h}:${pad(p.mi)}:${pad(p.s)} ${ap.toUpperCase()}]`;
  };
  lines.push(`${head(messages[0].t)} ${THEM}: ‎Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them.`);
  for (const m of messages) {
    let text = m.kind === 'media' ? '‎image omitted' : m.kind === 'deleted' ? '‎This message was deleted.' : m.text;
    lines.push(`${head(m.t)} ${m.sender}: ${text}`);
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const msgs = generate();
  mkdirSync(join(root, 'samples'), { recursive: true });
  writeFileSync(join(root, 'samples', 'sample-android.txt'), toAndroid(msgs));
  writeFileSync(join(root, 'samples', 'sample-iphone.txt'), toIphone(msgs));
  console.log(`${msgs.length} synthetic messages written to samples/`);
}
