import { useState } from 'react';

const json = { 'Content-Type': 'application/json' };

// Holds one list and its edits. Data arrives through setItems (see the page's sync);
// `reload` is called if a change fails, to snap back to what the server has.
export function useList<T extends { id: string }>(kind: string, reload: () => void, touch: () => void = () => {}) {
  const [items, setItems] = useState<T[]>([]);
  const base = `/api/items/${kind}`;

  const add = async (body: object) => {
    touch();
    const r = await fetch(base, { method: 'POST', headers: json, body: JSON.stringify(body) });
    if (r.ok) { const n = await r.json(); setItems((p) => [...p, n]); }
    touch();
    return r.ok;
  };
  const patch = async (id: string, body: Partial<T>) => {
    touch();
    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...body } : i)));
    const r = await fetch(`${base}/${id}`, { method: 'PATCH', headers: json, body: JSON.stringify(body) });
    touch();
    if (!r.ok) reload();
  };
  const remove = async (id: string) => {
    touch();
    setItems((p) => p.filter((i) => i.id !== id));
    const r = await fetch(`${base}/${id}`, { method: 'DELETE' });
    touch();
    if (!r.ok) reload();
  };
  return { items, setItems, add, patch, remove };
}
