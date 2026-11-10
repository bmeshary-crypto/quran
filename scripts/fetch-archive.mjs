// Builds archive/: recitations and ibtihalat of reciters that mp3quran.net doesn't carry,
// from public collections on archive.org (Internet Archive).
//   archive/index.json   the reciters, shown in the reciters tab and as non-stop stations in the radio tab
//   archive/<key>.json   one reciter's recordings [{t, url}]
import { mkdirSync, writeFileSync } from 'node:fs';

const RECITERS = [
  { key: 'metwally', name: 'السيد متولي عبد العال', kind: 'tilawa', items: ['Sayyid-Mutauli', 'Saied_Metwali_uP_bY_mUSLEm'] },
  { key: 'laythi', name: 'محمد الليثي', kind: 'tilawa', items: ['Tasjilat-mojawada_kharijia_mohammadAl-laythi_up_by_muslem', 'Mohammad_Al-laythi_uP_bY_mUSLEm'] },
  { key: 'shuaisha', name: 'أبو العينين شعيشع', kind: 'tilawa', items: ['Tasjilat-Mojawada_Kharijia_Abou_Il_Ainin_Chichaa_uP_bY_mUSLEm', 'Abou_Il_Ainin_Chiichaa_uP_bY_mUSLEm'] },
  { key: 'bahtimi', name: 'كامل يوسف البهتيمي', kind: 'tilawa', items: ['Tasjilat-Mojawada_Kharijia_Kamel_Yusuf_Albahtemy_uP_bY_mUSLEm', '20250615_20250615_1737'] },
  { key: 'naqshbandi', name: 'سيد النقشبندي', kind: 'ibtihal', items: ['Naqshabandee', 'Sama3almelouk_yahoo_20160525'] },
  { key: 'tubar', name: 'نصر الدين طوبار', kind: 'ibtihal', items: ['Tobar1', '07._20210119'] },
];
const DIR = 'archive';

// some collections were uploaded with Arabic names read as Latin-1: decode them as Windows-1256
const fix = s => /[ÃÇÈÉÊÚÞáäåæíóú]{2}/.test(s) ? new TextDecoder('windows-1256').decode(Buffer.from(s, 'latin1')) : s;
const clean = s => fix(s)
  .replace(/\.mp3$/i, '').replace(/_?up_?by_?muslem/ig, '').replace(/^\s*\d+\s*[-.)_]\s*/, '')
  .replace(/^الشيخ (طوبار|نصر ?الدين طوبار)\s*/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

mkdirSync(DIR, { recursive: true });
const index = { updated: new Date().toISOString(), reciters: [] };
for (const r of RECITERS) {
  const tracks = [], seen = new Set();
  for (const id of r.items) {
    try {
      const m = await (await fetch('https://archive.org/metadata/' + id)).json();
      for (const f of m.files || []) {
        if (!/\.mp3$/i.test(f.name) || f.source !== 'original') continue;
        const t = clean(f.title || f.name.split('/').pop());
        // names that are still unreadable, or empty, aren't worth listing
        if (!t || /_{2,}|[à]/.test(fix(f.title || f.name)) && !/[؀-ۿ]{3}/.test(t)) continue;
        const url = `https://archive.org/download/${encodeURIComponent(id)}/${f.name.split('/').map(encodeURIComponent).join('/')}`;
        if (seen.has(url)) continue; seen.add(url);
        tracks.push({ t, url });
      }
    } catch (e) { console.warn(`${r.name} / ${id}: ${e.message}`); }
  }
  if (!tracks.length) continue;
  writeFileSync(`${DIR}/${r.key}.json`, JSON.stringify(tracks));
  index.reciters.push({ key: r.key, name: r.name, kind: r.kind, n: tracks.length });
  console.log(r.name, tracks.length);
}
writeFileSync(`${DIR}/index.json`, JSON.stringify(index));
