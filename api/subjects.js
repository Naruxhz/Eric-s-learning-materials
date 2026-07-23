const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const root = process.cwd();
  let entries = [];

  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membaca folder project', detail: String(err) });
    return;
  }

  // Folder-folder ini bukan mata kuliah, jadi selalu dilewati
  const EXCLUDE = new Set(['api', 'node_modules', '.git', '.vercel', '.github', 'public']);

  const subjects = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (EXCLUDE.has(entry.name)) continue;

    const metaPath = path.join(root, entry.name, 'meta.json');
    if (!fs.existsSync(metaPath)) continue; // folder tanpa meta.json = bukan mata kuliah, dilewati

    try {
      const raw = fs.readFileSync(metaPath, 'utf-8');
      const meta = JSON.parse(raw);
      subjects.push({
        folder: entry.name,
        nama: meta.nama || entry.name,
        deskripsi: meta.deskripsi || '',
        ikon: meta.ikon || '📚',
        topik: meta.topik ?? null,
        soal: meta.soal ?? null,
        warna: meta.warna || 'red', // red | teal | amber | muted
      });
    } catch (err) {
      // meta.json ada tapi isinya rusak/bukan JSON valid -> lewati folder ini, jangan bikin API error total
      continue;
    }
  }

  subjects.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
  res.status(200).json({ subjects, total: subjects.length });
};
