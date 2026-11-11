// Reads a WhatsApp "Export chat" text file (Android or iPhone) into messages.
// Runs entirely in the browser (and in Node for the tests). Nothing is uploaded.

// Invisible marks WhatsApp sprinkles into exports (LRM/RLM, bidi embeds, BOM)
// and the odd spaces it puts before am/pm (narrow no-break, no-break).
const INVISIBLE = /[‎‏‪-‮⁦-⁩﻿]/g;
const ODD_SPACE = /[    ]/g;

// 11/10/26, 9:41 pm - Name: text        (Android)
// [11/10/26, 9:41:02 PM] Name: text     (iPhone)
// Dates may use / . or - and come in D/M/Y, M/D/Y or Y-M-D order.
const DATE = String.raw`(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{1,4})`;
const TIME = String.raw`(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([aApP]\.?\s?[mM]\.?)?`;
const ANDROID = new RegExp(String.raw`^${DATE},?\s+${TIME}\s*[-–—]\s(.*)$`);
const IPHONE = new RegExp(String.raw`^\[${DATE},?\s+${TIME}\]\s?(.*)$`);

const MEDIA = [
  /^<media omitted>$/i,
  /^(image|video|audio|sticker|gif|document|contact card|photo|voice message) omitted$/i,
  /^<attached: .+>$/i,
  /\(file attached\)$/i,
  /^null$/,
  /^<view once (voice )?message>$/i,
];
const DELETED = [
  /^this message was deleted\.?$/i,
  /^you deleted this message\.?$/i,
  /^this message was deleted by admin/i,
];
// Lines WhatsApp writes itself. On Android they have no "Name:" part; on iPhone
// some are attributed to a person, so the text alone has to give them away.
const SYSTEM_TEXT = [
  /^messages (and calls )?(to this (chat|group) )?(and calls )?are (now )?(end-to-end encrypted|secured)/i,
  /^your security code with .+ changed/i,
  /^(missed )?(voice|video|group voice|group video) call/i,
  /^disappearing messages /i,
  /turned (on|off) disappearing messages/i,
  /^this chat is with a business account/i,
  /^you (blocked|unblocked) this contact/i,
  /changed (their|your) phone number/i,
  /^waiting for this message/i,
];
const EDITED = /\s*<this message was edited>$/i;

function clean(line) {
  return line.replace(INVISIBLE, '').replace(ODD_SPACE, ' ');
}

function matchHeader(line) {
  let m = IPHONE.exec(line);
  let format = 'iphone';
  if (!m) { m = ANDROID.exec(line); format = 'android'; }
  if (!m) return null;
  return {
    format,
    a: m[1], b: +m[2], c: m[3],
    h: +m[4], min: +m[5], s: m[6] ? +m[6] : 0,
    ampm: m[7] ? m[7].replace(/[.\s]/g, '').toLowerCase() : null,
    rest: m[8],
  };
}

function yearOf(raw) {
  const n = +raw;
  return raw.length <= 2 ? 2000 + n : n;
}

// Builds a UTC timestamp from the parsed parts. Times are treated as plain
// wall-clock values: the gaps between them are what matter, so time zones and
// daylight saving can't distort a reply time.
function stamp(p, order) {
  let y, mo, d;
  if (order === 'YMD') { y = +p.a; mo = p.b; d = +p.c; }
  else if (order === 'MDY') { mo = +p.a; d = p.b; y = yearOf(p.c); }
  else { d = +p.a; mo = p.b; y = yearOf(p.c); }
  let h = p.h;
  if (p.ampm) {
    const pm = p.ampm[0] === 'p';
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
  }
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || p.min > 59) return NaN;
  return Date.UTC(y, mo - 1, d, h, p.min, p.s);
}

// Works out the date order. A first number above 12 means day/month; a second
// number above 12 means month/day. If every date is ambiguous, pick the order
// whose timestamps run forwards most often, preferring day/month (India).
export function detectOrder(headers) {
  if (headers.length === 0) return 'DMY';
  if (headers.some(p => p.a.length === 4)) return 'YMD';
  let dayFirst = false, monthFirst = false;
  for (const p of headers) {
    if (+p.a > 12) dayFirst = true;
    if (p.b > 12) monthFirst = true;
  }
  if (dayFirst && !monthFirst) return 'DMY';
  if (monthFirst && !dayFirst) return 'MDY';
  const backwards = order => {
    let n = 0, prev = -Infinity;
    for (const p of headers) {
      const t = stamp(p, order);
      if (Number.isNaN(t)) { n += 2; continue; }
      if (t < prev) n++;
      prev = t;
    }
    return n;
  };
  return backwards('MDY') < backwards('DMY') ? 'MDY' : 'DMY';
}

function kindOf(text) {
  const t = text.trim();
  if (MEDIA.some(r => r.test(t))) return 'media';
  if (DELETED.some(r => r.test(t))) return 'deleted';
  return 'text';
}

/**
 * Parses a WhatsApp export.
 * @param {string} raw the whole .txt file
 * @returns {{messages: {t:number, sender:string, text:string, kind:'text'|'media'|'deleted'}[],
 *   participants: {name:string, count:number}[], format:string, order:string,
 *   system:number, first:number|null, last:number|null}}
 */
export function parseChat(raw) {
  const lines = String(raw).split(/\r\n|\r|\n/);
  const rows = []; // {p, lines: [rest, ...continuations]}
  let android = 0, iphone = 0;
  for (const original of lines) {
    const line = clean(original);
    const p = matchHeader(line);
    if (p) {
      if (p.format === 'iphone') iphone++; else android++;
      rows.push({ p, extra: [] });
    } else if (rows.length) {
      rows[rows.length - 1].extra.push(line);
    }
  }

  const order = detectOrder(rows.map(r => r.p));
  const messages = [];
  const counts = new Map();
  let system = 0;

  for (const { p, extra } of rows) {
    const t = stamp(p, order);
    if (Number.isNaN(t)) { system++; continue; }
    const rest = p.rest;
    const colon = rest.indexOf(': ');
    // "Name: text". A bare "Name:" (empty message) also counts as a message.
    let sender, text;
    if (colon > 0) {
      sender = rest.slice(0, colon).trim();
      text = rest.slice(colon + 2);
    } else if (rest.endsWith(':') && rest.length > 1) {
      sender = rest.slice(0, -1).trim();
      text = '';
    } else {
      system++; // "Alice added Bob", the encryption notice on Android, ...
      continue;
    }
    if (sender.startsWith('~')) sender = sender.slice(1).trim();
    if (extra.length) text += '\n' + extra.join('\n');
    text = text.replace(EDITED, '');
    const first = text.trim();
    if (SYSTEM_TEXT.some(r => r.test(first))) { system++; continue; }
    const kind = kindOf(first);
    messages.push({ t, sender, text: kind === 'text' ? text.trim() : '', kind });
    counts.set(sender, (counts.get(sender) || 0) + 1);
  }

  const participants = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((x, y) => y.count - x.count);

  return {
    messages,
    participants,
    format: iphone > android ? 'iphone' : 'android',
    order,
    system,
    first: messages.length ? messages[0].t : null,
    last: messages.length ? messages[messages.length - 1].t : null,
  };
}

// WhatsApp names the export after the other person ("WhatsApp Chat with Meera.txt",
// "WhatsApp Chat - Meera.zip"), so the file name usually tells us who "them" is.
export function guessThem(fileName, participants) {
  if (!fileName) return null;
  // drop the extension and a trailing "(2)" / "(sample)" the OS or we added
  const base = fileName.replace(/\.(txt|zip)$/i, '').replace(/\s*\([^)]*\)$/, '');
  const m = /whatsapp chat (?:with|-)\s*(.+)$/i.exec(base);
  if (!m) return null;
  const label = m[1].trim().toLowerCase();
  const hit = participants.find(p => p.name.toLowerCase() === label);
  return hit ? hit.name : null;
}
