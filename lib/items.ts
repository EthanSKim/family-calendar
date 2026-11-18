type Fn = (v: any) => unknown | null;
const str: Fn = (v) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 100) : null);
const bool: Fn = (v) => (typeof v === 'boolean' ? v : null);
const int = (min: number, max: number): Fn => (v) => (Number.isInteger(v) && v >= min && v <= max ? v : null);

export const KINDS: Record<string, { table: string; order: string[]; spec: Record<string, Fn> }> = {
  groceries: { table: 'grocery_items', order: ['created_at'], spec: { name: str, done: bool } },
  todos: { table: 'todos', order: ['created_at'], spec: { title: str, done: bool } },
  anniversaries: { table: 'anniversaries', order: ['month', 'day'], spec: { title: str, month: int(1, 12), day: int(1, 31) } },
};

// Returns the cleaned fields, or null if invalid. `done` is optional on create.
export function pick(kind: string, b: any, partial: boolean) {
  const out: Record<string, unknown> = {};
  for (const [k, fn] of Object.entries(KINDS[kind].spec)) {
    if (b?.[k] === undefined) { if (partial || k === 'done') continue; return null; }
    const v = fn(b[k]);
    if (v === null) return null;
    out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}
