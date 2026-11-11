// Just enough of a .zip reader to pull the chat text out of an iPhone export
// ("WhatsApp Chat - Name.zip" with _chat.txt inside). Uses the browser's own
// DecompressionStream, so there's no library and nothing leaves the device.

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

export function isZip(bytes) {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

function findEnd(view) {
  const min = Math.max(0, view.byteLength - 22 - 65535);
  for (let i = view.byteLength - 22; i >= min; i--) {
    if (view.getUint32(i, true) === EOCD) return i;
  }
  throw new Error('zip: no end record');
}

async function inflate(data) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('zip: this browser cannot unzip; unzip the export and pick _chat.txt');
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Returns the text of the chat inside a WhatsApp .zip export.
 * Picks `_chat.txt`, else the largest .txt that isn't in a __MACOSX folder.
 * @param {ArrayBuffer} buffer
 */
export async function chatTextFromZip(buffer) {
  const view = new DataView(buffer);
  const end = findEnd(view);
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const dec = new TextDecoder('utf-8');
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (view.getUint32(at, true) !== CENTRAL) break;
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const usize = view.getUint32(at + 24, true);
    const nameLen = view.getUint16(at + 28, true);
    const extraLen = view.getUint16(at + 30, true);
    const commentLen = view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const name = dec.decode(new Uint8Array(buffer, at + 46, nameLen));
    entries.push({ method, size, usize, local, name });
    at += 46 + nameLen + extraLen + commentLen;
  }
  const txt = entries.filter(e => /\.txt$/i.test(e.name) && !/(^|\/)__MACOSX\//.test(e.name));
  const pick = txt.find(e => /(^|\/)_chat\.txt$/i.test(e.name)) || txt.sort((a, b) => b.usize - a.usize)[0];
  if (!pick) throw new Error('zip: no chat text inside');
  if (view.getUint32(pick.local, true) !== LOCAL) throw new Error('zip: bad entry');
  const start = pick.local + 30 + view.getUint16(pick.local + 26, true) + view.getUint16(pick.local + 28, true);
  const data = new Uint8Array(buffer, start, pick.size);
  let bytes;
  if (pick.method === 0) bytes = data;
  else if (pick.method === 8) bytes = await inflate(data);
  else throw new Error('zip: unsupported compression');
  return dec.decode(bytes);
}

/** Reads a picked/dropped File (.txt or .zip) into chat text. */
export async function readChatFile(file) {
  const buffer = await file.arrayBuffer();
  const head = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
  if (isZip(head)) return chatTextFromZip(buffer);
  return new TextDecoder('utf-8').decode(buffer);
}
