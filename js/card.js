// Draws the shareable result card (1080 x 1920, story size) on a canvas.
// Everything happens in the browser; the PNG is never uploaded.

import { formatDuration, speedScore } from './stats.js';

const W = 1080;
const H = 1920;
const SITE = 'souradip121.github.io/who-texts-first';

const images = {};
function load(name) {
  if (!images[name]) {
    images[name] = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `assets/hearts/${name}.webp`;
    });
  }
  return images[name];
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function sparkle(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + r * 0.12, cy - r * 0.12, cx + r, cy);
  ctx.quadraticCurveTo(cx + r * 0.12, cy + r * 0.12, cx, cy + r);
  ctx.quadraticCurveTo(cx - r * 0.12, cy + r * 0.12, cx - r, cy);
  ctx.quadraticCurveTo(cx - r * 0.12, cy - r * 0.12, cx, cy - r);
  ctx.fill();
  ctx.restore();
}

function heartPath(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.42);
  ctx.bezierCurveTo(cx - s * 0.62, cy, cx - s * 0.5, cy - s * 0.52, cx, cy - s * 0.22);
  ctx.bezierCurveTo(cx + s * 0.5, cy - s * 0.52, cx + s * 0.62, cy, cx, cy + s * 0.42);
  ctx.closePath();
}

function person(ctx, cx, cy, s, two) {
  ctx.save();
  ctx.fillStyle = '#fff';
  const one = (x, y, k) => {
    ctx.beginPath(); ctx.arc(x, y - s * 0.2 * k, s * 0.2 * k, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + s * 0.32 * k, s * 0.36 * k, s * 0.24 * k, 0, Math.PI, 0); ctx.fill();
  };
  if (two) { ctx.globalAlpha = 0.75; one(cx + s * 0.2, cy - s * 0.02, 0.8); ctx.globalAlpha = 1; one(cx - s * 0.1, cy + s * 0.04, 0.95); }
  else one(cx, cy, 1);
  ctx.restore();
}

function sticker(ctx, img, x, y, w, deg) {
  const h = (w * img.height) / img.width;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.shadowColor = 'rgba(150, 90, 200, 0.32)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 16;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function greedy(ctx, words, maxW) {
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// Wraps like CSS text-wrap: balance, so no line is left with a lone word.
function wrap(ctx, text, maxW) {
  const words = text.split(/\s+/);
  const n = greedy(ctx, words, maxW).length;
  let lo = 40, hi = maxW;
  while (hi - lo > 2) {
    const mid = (lo + hi) / 2;
    if (greedy(ctx, words, mid).length <= n) hi = mid; else lo = mid;
  }
  return greedy(ctx, words, hi);
}

function glossyTitle(ctx, text, y, top, low) {
  ctx.save();
  ctx.font = '700 150px Fredoka, Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(140, 80, 210, 0.28)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 14;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 14;
  ctx.strokeText(text, W / 2, y);
  ctx.shadowColor = 'transparent';
  const g = ctx.createLinearGradient(0, y - 120, 0, y + 8);
  g.addColorStop(0, top);
  g.addColorStop(1, low);
  ctx.fillStyle = g;
  ctx.fillText(text, W / 2, y);
  ctx.restore();
}

/**
 * @param {{stats: object, verdict?: string, range: string}} data
 * @returns {Promise<Blob>}
 */
export async function renderCard({ stats, verdict, by = '', range, sample = false }) {
  await Promise.all([
    document.fonts.load('700 100px Fredoka'),
    document.fonts.load('600 50px Fredoka'),
    document.fonts.load('600 40px Nunito'),
    document.fonts.load('800 40px Nunito'),
  ]).catch(() => {});
  const [silver, pink, face, lilac] = await Promise.all(['heart-silver', 'heart-pink', 'heart-face', 'heart-lilac'].map(load));

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ground
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#FBEFFC');
  bg.addColorStop(1, '#F6E8FC');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  for (const [x, y, r, c] of [[960, 260, 520, 'rgba(246, 208, 240, 0.55)'], [90, 1560, 640, 'rgba(222, 212, 252, 0.6)']]) {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, c);
    rg.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }

  const hasVerdict = Boolean(verdict);
  const dy = hasVerdict ? 0 : 150;

  // title
  // the hearts flank "First", the narrower line, like the concept
  sticker(ctx, silver, 150, 296 + dy, 170, -14);
  sticker(ctx, pink, 768, 300 + dy, 164, 12);
  sparkle(ctx, 112, 300 + dy, 24, '#B39CF0');
  sparkle(ctx, 330, 446 + dy, 12, '#FFFFFF');
  sparkle(ctx, 968, 300 + dy, 20, '#F0A5DE');
  glossyTitle(ctx, 'Who Texts', 270 + dy, '#C6A2F6', '#7E4CD6');
  glossyTitle(ctx, 'First', 412 + dy, '#E59BEF', '#9440CC');

  // pill
  ctx.font = '700 50px Fredoka, sans-serif';
  const pillText = 'Who’s putting in the effort?';
  const pw = ctx.measureText(pillText).width + 160;
  rr(ctx, (W - pw) / 2, 480 + dy, pw, 100, 50);
  ctx.fillStyle = '#EAE2FC';
  ctx.fill();
  ctx.fillStyle = '#6A40C4';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillText, W / 2, 532 + dy);
  sparkle(ctx, (W - pw) / 2 + 48, 530 + dy, 16, '#9C80EA');
  sparkle(ctx, (W + pw) / 2 - 48, 530 + dy, 16, '#9C80EA');

  // reply lanes
  const lane = (y, who, ms, a, b, two) => {
    rr(ctx, 70, y, 940, 190, 54);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#F1E2F8';
    ctx.stroke();
    const ag = ctx.createLinearGradient(0, y + 37, 0, y + 153);
    ag.addColorStop(0, a);
    ag.addColorStop(1, b);
    ctx.beginPath();
    ctx.arc(175, y + 95, 58, 0, Math.PI * 2);
    ctx.fillStyle = ag;
    ctx.fill();
    person(ctx, 175, y + 95, 66, two);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '500 46px Nunito, sans-serif';
    ctx.fillStyle = '#5C4A80';
    const lead = `${who} reply in `;
    ctx.fillText(lead, 270, y + 84);
    const lw = ctx.measureText(lead).width;
    ctx.font = '700 54px Fredoka, sans-serif';
    ctx.fillStyle = '#3F2F60';
    ctx.fillText(formatDuration(ms), 270 + lw, y + 84);
    rr(ctx, 270, y + 112, 690, 32, 16);
    ctx.fillStyle = '#EFE5FC';
    ctx.fill();
    const w = Math.max(32, 690 * speedScore(ms));
    const bg2 = ctx.createLinearGradient(270, 0, 270 + w, 0);
    bg2.addColorStop(0, a);
    bg2.addColorStop(1, b);
    rr(ctx, 270, y + 112, w, 32, 16);
    ctx.fillStyle = bg2;
    ctx.fill();
  };
  lane(630 + dy, 'You', stats.me.replyMedian, '#F6A6EA', '#E166D8', false);
  lane(845 + dy, 'They', stats.them.replyMedian, '#BDA6F6', '#9478EC', true);

  // tiles
  const ty = 1065 + dy;
  const tile = (x, top, low, line) => {
    rr(ctx, x, ty, 460, 330, 54);
    const tg = ctx.createLinearGradient(0, ty, 0, ty + 330);
    tg.addColorStop(0, top);
    tg.addColorStop(1, low);
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = line;
    ctx.stroke();
  };
  tile(70, '#FDEBF9', '#FBDDF2', '#F5C6E8');
  tile(550, '#F6F1FE', '#EDE4FD', '#DCD2FA');
  heartPath(ctx, 300, ty + 70, 70);
  ctx.fillStyle = '#EB78D8';
  ctx.fill();
  sparkle(ctx, 120, ty + 110, 16, '#B39CF0');
  sparkle(ctx, 480, ty + 270, 12, '#F0A5DE');
  sparkle(ctx, 600, ty + 110, 16, '#B39CF0');
  sparkle(ctx, 960, ty + 270, 12, '#F0A5DE');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '600 44px Fredoka, sans-serif';
  ctx.fillStyle = '#9B45C0';
  ctx.fillText('You start', 300, ty + 150);
  ctx.font = '700 118px Fredoka, sans-serif';
  ctx.fillStyle = '#9A45C6';
  const pct = stats.me.startShare == null ? '—' : `${Math.round(stats.me.startShare * 100)}%`;
  ctx.fillText(pct, 300, ty + 262);
  ctx.font = '600 36px Nunito, sans-serif';
  ctx.fillStyle = '#6B5A8E';
  ctx.fillText('of chats', 300, ty + 306);

  // speech bubble icon
  ctx.save();
  ctx.strokeStyle = '#9C80EA';
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.ellipse(780, ty + 66, 40, 32, 0, Math.PI * 0.62, Math.PI * 2.5);
  ctx.lineTo(748, ty + 108);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
  const dryThem = stats.them.dry >= stats.me.dry;
  ctx.font = '600 50px Fredoka, sans-serif';
  ctx.fillStyle = '#7650C9';
  ctx.fillText('“hmm”', 780, ty + 158);
  ctx.font = '700 118px Fredoka, sans-serif';
  ctx.fillStyle = '#8657D6';
  ctx.fillText(`× ${dryThem ? stats.them.dry : stats.me.dry}`, 780, ty + 262);
  ctx.font = '600 32px Nunito, sans-serif';
  ctx.fillStyle = '#6B5A8E';
  ctx.fillText(dryThem ? 'dry replies from them' : 'dry replies from you', 780, ty + 306);

  // verdict
  if (hasVerdict) {
    const vy = 1425;
    rr(ctx, 70, vy, 940, 300, 58);
    const vg = ctx.createLinearGradient(70, vy, 1010, vy + 300);
    vg.addColorStop(0, '#FDEDF9');
    vg.addColorStop(0.55, '#FBE2F4');
    vg.addColorStop(1, '#F1E6FD');
    ctx.fillStyle = vg;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#F5C6E8';
    ctx.stroke();
    sticker(ctx, face, 92, vy + 46, 220, -6);
    let size = 64;
    let lines;
    for (;;) {
      ctx.font = `700 ${size}px Fredoka, sans-serif`;
      lines = wrap(ctx, `“${verdict}”`, 610);
      if (lines.length <= 3 || size <= 36) break;
      size -= 4;
    }
    const lh = size * 1.14;
    const block = lines.length * lh + 44;
    let y = vy + (300 - block) / 2 + size * 0.86;
    ctx.fillStyle = '#7043CB';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    for (const l of lines) { ctx.fillText(l, 340, y); y += lh; }
    if (by) {
      ctx.font = '700 30px Nunito, sans-serif';
      ctx.fillStyle = '#6B5A8E';
      ctx.fillText(by, 342, y + 8 - lh + size * 0.55);
    }
    sparkle(ctx, 960, vy + 60, 18, '#F0A5DE');
    sparkle(ctx, 300, vy + 262, 14, '#B39CF0');
  }

  // little hearts and footer
  sticker(ctx, lilac, 60, 1745, 88, -10);
  sticker(ctx, pink, 940, 1752, 82, 14);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 36px Nunito, sans-serif';
  ctx.fillStyle = '#7650C9';
  ctx.fillText(SITE, W / 2, 1808);
  ctx.font = '600 28px Nunito, sans-serif';
  ctx.fillStyle = '#6B5A8E';
  const scope = range === '3m' ? 'last 3 months' : 'all time';
  const tail = sample ? 'made-up sample chat' : 'worked out on my phone';
  ctx.fillText(`${stats.total.toLocaleString('en-IN')} messages, ${scope} · ${tail}`, W / 2, 1856);

  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('canvas'))), 'image/png'));
}
