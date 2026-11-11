// Effort stats for a two-person chat. Pure functions, no I/O.

export const MIN = 60 * 1000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const RULES = {
  replyCap: 12 * HOUR,   // longer gaps aren't replies, they're a new chat
  newChat: 6 * HOUR,     // silence that makes the next message a "start"
  doubleText: 20 * MIN,  // your own follow-up after this long, with no reply between
  lateFrom: 0,           // "after midnight" = 12:00 am ...
  lateTo: 5,             // ... to 4:59 am
};

// "hmm", "hm", "mm", "ok", "okay", "okk", "okie", "k", "kk", "achha", "oh"
// in any spelling with stretched letters, ignoring punctuation and emoji.
const DRY = [
  /^h+m+$/, /^m{2,}$/,
  /^o*k+a*y*$/, /^o+k+i+e*$/,
  /^ac+h*c*h*a+$/,
  /^o+h+$/,
];
export function isDry(text) {
  if (!text || text.length > 16) return false;
  const t = text.toLowerCase().replace(/[^\p{L}]/gu, '');
  if (!t || t.length > 10) return false;
  return DRY.some(r => r.test(t));
}

export function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// The first moment of the calendar month three months before `last`
// ("last 3 months" of the chat, counted back from its newest message).
export function threeMonthsBefore(last) {
  const d = new Date(last);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 3, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes());
}

/**
 * @param {{t:number,sender:string,text:string,kind:string}[]} messages in file order
 * @param {string} me  the user's name as it appears in the export
 * @param {string} them the other person's name
 * @param {{range?: 'all'|'3m'}} opts
 */
export function computeStats(messages, me, them, opts = {}) {
  const pair = messages.filter(m => m.sender === me || m.sender === them);
  let list = pair;
  if (opts.range === '3m' && pair.length) {
    const from = threeMonthsBefore(pair[pair.length - 1].t);
    list = pair.filter(m => m.t >= from);
  }

  const blank = () => ({ messages: 0, replies: [], starts: 0, doubles: 0, dry: 0, late: 0, words: 0 });
  const who = { [me]: blank(), [them]: blank() };

  let prev = null;
  for (const m of list) {
    const p = who[m.sender];
    p.messages++;
    const gap = prev ? m.t - prev.t : Infinity;
    if (!prev || gap >= RULES.newChat) p.starts++;
    if (prev && prev.sender !== m.sender && gap >= 0 && gap <= RULES.replyCap) p.replies.push(gap);
    if (prev && prev.sender === m.sender && gap >= RULES.doubleText) p.doubles++;
    if (m.kind === 'text') {
      if (isDry(m.text)) p.dry++;
      p.words += m.text.split(/\s+/).filter(Boolean).length;
    }
    const hour = new Date(m.t).getUTCHours();
    if (hour >= RULES.lateFrom && hour < RULES.lateTo) p.late++;
    prev = m;
  }

  const sum = (k) => who[me][k] + who[them][k];
  const shape = (p) => ({
    messages: p.messages,
    replyMedian: median(p.replies),
    replyCount: p.replies.length,
    starts: p.starts,
    startShare: sum('starts') ? p.starts / sum('starts') : null,
    doubles: p.doubles,
    dry: p.dry,
    late: p.late,
    avgWords: p.messages ? p.words / p.messages : 0,
  });

  return {
    me: shape(who[me]),
    them: shape(who[them]),
    total: list.length,
    from: list.length ? list[0].t : null,
    to: list.length ? list[list.length - 1].t : null,
    range: opts.range === '3m' ? '3m' : 'all',
    list,
  };
}

// 3 min, 45 min, 2 h, 1.5 h, under a min
export function formatDuration(ms) {
  if (ms == null) return '—';
  const min = ms / MIN;
  if (min < 1) return '<1 min';
  if (min < 90) return `${Math.round(min)} min`;
  const h = min / 60;
  const r = h < 10 ? Math.round(h * 10) / 10 : Math.round(h);
  return `${r} h`;
}

// Bar length for a reply time: faster = longer, on a log scale from 1 min
// (full) to 12 h (nearly empty). 3 min ≈ 83%, 2 h ≈ 27%.
export function speedScore(ms) {
  if (ms == null) return 0;
  const min = Math.max(1, ms / MIN);
  const s = 1 - Math.log(min) / Math.log(12 * 60);
  return Math.min(1, Math.max(0.05, s));
}
