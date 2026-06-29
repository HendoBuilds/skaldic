export const CHUNK = 5001;
export const FOOTER = Uint8Array.of(0, 5, 0);
const AT = 0x40; // '@'

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Build one .sav chunk per 5001 content bytes: header + @-padded content + {0,5,0} footer. */
export function buildSavChunks(content: string, header: Uint8Array): Uint8Array[] {
  let data: Uint8Array = enc.encode(content);
  const remainder = data.length % CHUNK;
  const pad = remainder !== 0 ? CHUNK - remainder : data.length === 0 ? CHUNK : 0;
  if (pad) {
    const padded = new Uint8Array(data.length + pad);
    padded.set(data);
    padded.fill(AT, data.length);
    data = padded;
  }
  const chunks: Uint8Array[] = [];
  for (let off = 0; off < data.length; off += CHUNK) {
    const out = new Uint8Array(header.length + CHUNK + FOOTER.length);
    out.set(header, 0);
    out.set(data.subarray(off, off + CHUNK), header.length);
    out.set(FOOTER, header.length + CHUNK);
    chunks.push(out);
  }
  return chunks;
}

/** Inverse of buildSavChunks: strip header, cut at footer, strip @/NUL, concatenate. */
export function readSavContent(chunks: Uint8Array[], header: Uint8Array): string {
  let s = "";
  for (const c of chunks) {
    let body = c.subarray(header.length);
    const i = indexOfFooter(body);
    if (i >= 0) body = body.subarray(0, i);
    s += dec.decode(body).replace(/[@\0]/g, "");
  }
  return s;
}

function indexOfFooter(b: Uint8Array): number {
  for (let p = 0; p + 2 < b.length; p++) {
    if (b[p] === 0 && b[p + 1] === 5 && b[p + 2] === 0) return p;
  }
  return -1;
}
