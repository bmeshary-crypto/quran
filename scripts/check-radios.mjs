// Writes radios.json with the mp3quran.net stations that are playing right now.
// Their server keeps some stations up with no sound for long stretches, so
// listening to each one for a few seconds is the only reliable check.
import { writeFile } from 'node:fs/promises';

const { radios } = await (await fetch('https://www.mp3quran.net/api/v3/radios?language=ar')).json();
const NEED = 16000, TIMEOUT = 12000;
// stations from other broadcasters, shown at the top of the list.
// Cairo's stream is the one its official site (misrquran.gov.eg) plays: HLS, so the page plays it with hls.js.
const EXTRA = [
  { name: 'إذاعة القرآن الكريم من القاهرة', url: 'https://service.webvideocore.net/CL1olYogIrDWvwqiIKK7eCxOS4PStqG9DuEjAr2ZjZQtvS3d4y9r0cvRhvS17SGN/a_7a4vuubc6mo8.m3u8' },
];

// HLS: the playlist answers and its newest segment downloads
async function hlsPlaying(url) {
  try {
    for (let depth = 0; depth < 3; depth++) {
      const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
      if (!r.ok) return false;
      const lines = (await r.text()).split(String.fromCharCode(10)).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      if (!lines.length) return false;
      const next = new URL(lines.at(-1), r.url).href;
      if (!/\.m3u8(\?|$)/i.test(next)) return playing(next);
      url = next;
    }
  } catch {}
  return false;
}

async function playing(url) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) return false;
    let got = 0;
    for await (const chunk of r.body) { got += chunk.length; if (got >= NEED) return true; }
    return false;
  } catch { return false; } finally { clearTimeout(t); ctl.abort(); }
}

const ok = [];
let next = 0;
await Promise.all(Array.from({ length: 24 }, async () => {
  while (next < radios.length) {
    const r = radios[next++];
    if (await playing(r.url)) ok.push({ name: r.name, url: r.url });
  }
}));
ok.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
for (const r of [...EXTRA].reverse()) if (await hlsPlaying(r.url)) ok.unshift(r); else console.warn(`${r.name} not playing`);
// a bad run (their server down) shouldn't wipe the list
if (ok.length < radios.length / 3) { console.warn(`only ${ok.length} of ${radios.length} playing — keeping the current list`); process.exit(0); }
await writeFile('radios.json', JSON.stringify({ updated: new Date().toISOString(), radios: ok }));
console.log(`${ok.length} of ${radios.length} stations playing`);
