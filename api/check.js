// Fonction de contrôle d'accès L&A — lit la liste dans un repo GitHub PRIVÉ (jamais exposée).
// Renvoie {active, ok} + les infos de mise à jour (latestVersion, updateUrl, updateNote).
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const REPO = process.env.GH_REPO;
  const FILE = process.env.GH_FILE || 'controle_acces.json';
  const TOKEN = process.env.GH_TOKEN;
  if (!REPO || !TOKEN) return res.status(200).json({ error: 'config' });
  try {
    const r = await fetch(
      'https://api.github.com/repos/' + REPO + '/contents/' + FILE + '?ref=main&_t=' + Date.now(),
      { headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github.raw+json', 'User-Agent': 'la-control' } }
    );
    if (!r.ok) return res.status(200).json({ error: 'gh', status: r.status });
    const ctrl = await r.json();
    const upd = { latestVersion: ctrl.latestVersion, updateUrl: ctrl.updateUrl, updateNote: ctrl.updateNote };
    const message = ctrl.message || "Acces suspendu. Contactez l'administrateur.";
    if (ctrl.active === false) return res.status(200).json({ active: false, message, ...upd });
    const norm = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const name = norm(req.query.name), code = String(req.query.code || '').trim().toLowerCase();
    if (!name && !code) return res.status(200).json({ active: true, ...upd });
    const ok = (ctrl.authorized || []).some(a => norm(a.name) === name && String(a.code || '').trim().toLowerCase() === code);
    return res.status(200).json({ active: true, ok, message, ...upd });
  } catch (e) {
    return res.status(200).json({ error: 'unreachable' });
  }
}
