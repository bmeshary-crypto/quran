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
  // mp3quran has his full mujawwad and murattal; these are his concerts and rare outside recordings
  { key: 'mustafa', name: 'مصطفى إسماعيل — حفلات وتلاوات نادرة', kind: 'tilawa', items: ['Mostafa_Ismaiil_uP_bY_KAdim_Kitab_Alah'], unnamed: 'تلاوة نادرة' },
  { key: 'ghalwash', name: 'راغب مصطفى غلوش', kind: 'tilawa', items: ['Tasjilat-Mojawada_Kharijia_Ragheb-Mostafa-Ghalwash_uP_bY_mUSLEm', 'Ragheb-Mustafa-Ghalwash_uP_bY_mUSLEm'] },
  { key: 'naqshbandi', name: 'سيد النقشبندي', kind: 'ibtihal', items: ['Naqshabandee', 'Sama3almelouk_yahoo_20160525'] },
  { key: 'tubar', name: 'نصر الدين طوبار', kind: 'ibtihal', items: ['Tobar1', '07._20210119'] },
];
// non-stop stations of full mushafs on mp3quran.net, surah after surah (radio tab only)
const STATIONS = [
  { key: 'st-minshawi-mujawwad', name: 'المنشاوي — مجوّد', moshaf: 113 },
  { key: 'st-minshawi-murattal', name: 'المنشاوي — مرتّل', moshaf: 112 },
  { key: 'st-abdulbasit-mujawwad', name: 'عبد الباسط عبد الصمد — مجوّد', moshaf: 51 },
  { key: 'st-abdulbasit-murattal', name: 'عبد الباسط عبد الصمد — مرتّل', moshaf: 53 },
  { key: 'st-mustafa-mujawwad', name: 'مصطفى إسماعيل — مجوّد', moshaf: 288 },
  { key: 'st-mustafa-murattal', name: 'مصطفى إسماعيل — مرتّل', moshaf: 125 },
  { key: 'st-abdullah-kamel', name: 'عبد الله كامل — مرتّل', moshaf: 267 },
];
const DIR = 'archive';

// some collections were uploaded with Arabic names read as Latin-1: decode them as Windows-1256
const fix = s => /[ÃÇÈÉÊÚÞáäåæíóú]{2}/.test(s) ? new TextDecoder('windows-1256').decode(Buffer.from(s, 'latin1')) : s;
const clean = s => fix(s)
  .replace(/\.mp3$/i, '').replace(/_?up_?by_?(muslem|kadim_kitab_alah)/ig, '').replace(/^\s*\d+\s*[-.)_]\s*/, '')
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
        if (!t || !r.unnamed && /_{2,}|[à]/.test(fix(f.title || f.name)) && !/[؀-ۿ]{3}/.test(t)) continue;
        const url = `https://archive.org/download/${encodeURIComponent(id)}/${f.name.split('/').map(encodeURIComponent).join('/')}`;
        if (seen.has(url)) continue; seen.add(url);
        // numbered files with no name get a plain label
        tracks.push({ t: r.unnamed && !/[؀-ۿ]/.test(t) ? `${r.unnamed} ${tracks.length + 1}` : t, url });
      }
    } catch (e) { console.warn(`${r.name} / ${id}: ${e.message}`); }
  }
  if (!tracks.length) continue;
  writeFileSync(`${DIR}/${r.key}.json`, JSON.stringify(tracks));
  index.reciters.push({ key: r.key, name: r.name, kind: r.kind, n: tracks.length });
  console.log(r.name, tracks.length);
}
try {
  const mq = async p => (await fetch('https://www.mp3quran.net/api/v3/' + p, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
  const [{ reciters }, { suwar }] = await Promise.all([mq('reciters?language=ar'), mq('suwar?language=ar')]);
  const names = Object.fromEntries(suwar.map(x => [x.id, x.name.trim()]));
  const moshafs = Object.fromEntries(reciters.flatMap(r => r.moshaf.map(m => [m.id, m])));
  for (const st of STATIONS) {
    const m = moshafs[st.moshaf];
    if (!m) { console.warn(st.name + ': mushaf not found'); continue; }
    const tracks = m.surah_list.split(',').map(Number).sort((a, b) => a - b)
      .map(n => ({ t: 'سورة ' + names[n], url: m.server + String(n).padStart(3, '0') + '.mp3' }));
    writeFileSync(`${DIR}/${st.key}.json`, JSON.stringify(tracks));
    index.reciters.push({ key: st.key, name: st.name, kind: 'tilawa', n: tracks.length, station: true });
    console.log(st.name, tracks.length);
  }
} catch (e) { console.warn('mp3quran stations: ' + e.message); }
writeFileSync(`${DIR}/index.json`, JSON.stringify(index));
