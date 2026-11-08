// Writes radios.json with the mp3quran.net stations that are playing right now.
// Their server keeps some stations up with no sound for long stretches, so
// listening to each one for a few seconds is the only reliable check.
import { writeFile } from 'node:fs/promises';

const { radios } = await (await fetch('https://www.mp3quran.net/api/v3/radios?language=ar')).json();
const NEED = 16000, TIMEOUT = 12000;

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
// a bad run (their server down) shouldn't wipe the list
if (ok.length < radios.length / 3) { console.warn(`only ${ok.length} of ${radios.length} playing — keeping the current list`); process.exit(0); }
await writeFile('radios.json', JSON.stringify({ updated: new Date().toISOString(), radios: ok }));
console.log(`${ok.length} of ${radios.length} stations playing`);
