// Builds series/: every playlist (a book's explanation or a lecture series) from the
// scholars' channels below, with all lessons in order, so visitors need no API key.
//   series/index.json        the scholars and their playlists
//   series/<playlistId>.json the lessons of one playlist (loaded when it is opened)
// Listing playlists and their items costs 1 quota unit per 50, so this stays far
// below the daily 10,000 even with thousands of lessons.
import { mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';

const KEY = process.env.YT_API_KEY;
if (!KEY) { console.warn('YT_API_KEY is not set — keeping the current series'); process.exit(0); }
const DIR = 'series';

const SCHOLARS = [
  {
    key: 'uthaymeen', name: 'شروح ابن عثيمين',
    channels: ['UCFjzJYgxHjk44AFoEwwgPjg', 'UCtF3YygTiodnYSw8vD3UJtQ'],
    // explanations of books only: no fatwa collections or short clips
    keep: /شرح|كتاب|تفسير|تعليق|باب|متن|الممتع|منظومة|رسالة|العقيدة|الأصول|أصول|بلوغ|رياض|زاد|عمدة|صحيح|الواسطية|التوحيد|القواعد|الأربعين|ألفية|الآجرومية|البيقونية|السفارينية|الحموية|لمعة|كشف الشبهات|الورقات|نزهة|مقدمة/,
    drop: /فتاوى|فتاوي|فواصل|مختارات|مقاطع|نصائح/,
  },
  {
    key: 'huwaini', name: 'محاضرات الحويني',
    channels: ['UC43bHWI3eZwfxOONWdQBi-w'],
    keep: /./,
    drop: /جنازة|محطات في حياة|مكتبة الحويني/,
  },
];
const MAX_LISTS = 600, MAX_ITEMS = 1000;
const GONE = /^(Private video|Deleted video)$/i;

const api = async (path, params) => {
  const r = await fetch(`https://www.googleapis.com/youtube/v3/${path}?` + new URLSearchParams({ ...params, key: KEY }));
  const j = await r.json();
  if (j.error) throw new Error(`${path}: ${j.error.code} ${j.error.message}`);
  return j;
};
const decode = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function pages(path, params, max) {
  const out = []; let pageToken = '';
  do {
    const j = await api(path, { ...params, maxResults: '50', ...(pageToken ? { pageToken } : {}) });
    out.push(...j.items); pageToken = j.nextPageToken || '';
  } while (pageToken && out.length < max);
  return out;
}

mkdirSync(DIR, { recursive: true });
let previous = { scholars: [] };
try { previous = JSON.parse(readFileSync(`${DIR}/index.json`, 'utf8')); } catch {}

const index = { updated: new Date().toISOString(), scholars: [] };
const written = new Set();
for (const s of SCHOLARS) {
  try {
    const lists = [];
    for (const channelId of s.channels) {
      for (const p of await pages('playlists', { part: 'snippet,contentDetails', channelId }, MAX_LISTS)) {
        const t = decode(p.snippet.title);
        if (!p.contentDetails.itemCount || !s.keep.test(t) || s.drop.test(t)) continue;
        const items = (await pages('playlistItems', { part: 'snippet', playlistId: p.id }, MAX_ITEMS))
          .map(i => ({ id: i.snippet.resourceId.videoId, t: decode(i.snippet.title) }))
          .filter(v => v.id && !GONE.test(v.t));
        if (!items.length) continue;
        writeFileSync(`${DIR}/${p.id}.json`, JSON.stringify(items));
        written.add(`${p.id}.json`);
        const th = p.snippet.thumbnails || {};
        lists.push({ id: p.id, t, n: items.length, img: (th.medium || th.default || {}).url || '' });
      }
    }
    lists.sort((a, b) => a.t.localeCompare(b.t, 'ar'));
    index.scholars.push({ key: s.key, name: s.name, lists });
    console.log(s.name, lists.length, 'playlists,', lists.reduce((n, l) => n + l.n, 0), 'lessons');
  } catch (e) {
    // quota or network trouble: keep yesterday's playlists for this scholar
    console.warn(`${s.name}: ${e.message} — keeping previous`);
    const old = previous.scholars.find(x => x.key === s.key);
    if (old) { index.scholars.push(old); old.lists.forEach(l => written.add(`${l.id}.json`)); }
  }
}
writeFileSync(`${DIR}/index.json`, JSON.stringify(index));
// remove lesson files of playlists that no longer exist
for (const f of readdirSync(DIR)) if (f !== 'index.json' && !written.has(f)) unlinkSync(`${DIR}/${f}`);
