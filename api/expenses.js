export default async function handler(req, res) {
const { kv } = await import('@vercel/kv');

res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
if (req.method === 'OPTIONS') return res.status(200).end();

const KEY = 'kv:expenses';

async function getAll() {
const data = await kv.get(KEY);
return Array.isArray(data) ? data : [];
}
async function saveAll(arr) {
await kv.set(KEY, arr);
}

try {
if (req.method === 'GET') {
let expenses = await getAll();
expenses = expenses.slice().sort((a,b)=> b.date.localeCompare(a.date) || (b.createdAt||'').localeCompare(a.createdAt||''));
return res.status(200).json({ expenses });
}

    if (req.method === 'POST') {
      const { id, date, amount, category, paidBy, note } = req.body || {};
      if (!id || !date || !(Number(amount)>0) || !category || !paidBy) return res.status(400).send('Invalid payload');
      const expenses = await getAll();
      const item = { id, date, amount: Number(amount), category, paidBy, note: note || '', createdAt: new Date().toISOString() };
      expenses.push(item);
      await saveAll(expenses);
      return res.status(200).json({ ok: true, item });
    }
    
    if (req.method === 'PUT') {
      const { id, patch } = req.body || {};
      if (!id || !patch) return res.status(400).send('Invalid payload');
      const expenses = await getAll();
      const idx = expenses.findIndex(x=>x.id===id);
      if (idx < 0) return res.status(404).send('Not found');
      const updated = { ...expenses[idx], ...patch };
      if (!(Number(updated.amount)>0)) return res.status(400).send('Amount must be > 0');
      expenses[idx] = updated;
      await saveAll(expenses);
      return res.status(200).json({ ok: true, item: updated });
    }
    
    if (req.method === 'DELETE') {
      const { id, all } = req.body || {};
      if (all) {
        await saveAll([]);
        return res.status(200).json({ ok: true });
      }
      if (!id) return res.status(400).send('Invalid payload');
      const expenses = await getAll();
      const filtered = expenses.filter(x=>x.id!==id);
      await saveAll(filtered);
      return res.status(200).json({ ok: true });
    }
    
    return res.status(405).send('Method not allowed');
    } catch (e) {
console.error(e);
return res.status(500).send('Server error');
}
}
