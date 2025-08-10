export default async function handler(req, res) {
const { kv } = await import('@vercel/kv');

res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
if (req.method === 'OPTIONS') return res.status(200).end();

const KEY = 'kv:categories';
const defaults = ["Groceries","Food","Entertainment","Transport","Utilities","Medical","Education","Others"];

async function getAll() {
const data = await kv.get(KEY);
return Array.isArray(data) \&\& data.length ? data : defaults.slice();
}
async function saveAll(arr) {
await kv.set(KEY, arr);
}

try {
if (req.method === 'GET') {
const categories = await getAll();
return res.status(200).json({ categories });
}

    if (req.method === 'POST') {
      const { name } = req.body || {};
      const val = (name || '').trim();
      if (!val) return res.status(400).send('Name required');
      const categories = await getAll();
      if (!categories.some(c => c.toLowerCase() === val.toLowerCase())) {
        categories.push(val);
        await saveAll(categories);
      }
      return res.status(200).json({ ok: true });
    }
    
    if (req.method === 'DELETE') {
      const { name } = req.body || {};
      const val = (name || '').trim();
      if (!val) return res.status(400).send('Name required');
      const categories = await getAll();
      const filtered = categories.filter(c => c.toLowerCase() !== val.toLowerCase());
      await saveAll(filtered);
      return res.status(200).json({ ok: true });
    }
    
    return res.status(405).send('Method not allowed');
    } catch (e) {
console.error(e);
return res.status(500).send('Server error');
}
}
