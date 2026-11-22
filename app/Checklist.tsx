'use client';
import { FormEvent, useState } from 'react';

export type Row = { id: string; label: string; done: boolean };

export default function Checklist({ title, rows, hint, inputId, onAdd, onToggle, onRemove }: {
  title: string; rows: Row[]; hint: string; inputId?: string;
  onAdd: (label: string) => Promise<boolean>; onToggle: (id: string, done: boolean) => void; onRemove: (id: string) => void;
}) {
  const [v, setV] = useState('');
  const sorted = [...rows].sort((a, b) => Number(a.done) - Number(b.done));
  const doneRows = rows.filter((r) => r.done);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!v.trim()) return;
    if (await onAdd(v.trim())) setV('');
  }

  return (
    <div>
      <div className="hd"><h2>{title}</h2><span className="lbl">{rows.length - doneRows.length}</span></div>
      {sorted.map((r) => (
        <div className="ckrow" key={r.id}>
          <label className="ck">
            <input type="checkbox" checked={r.done} onChange={() => onToggle(r.id, !r.done)} />
            <span className={r.done ? 'done' : ''}>{r.label}</span>
          </label>
          <button className="x" aria-label={`${r.label} 삭제`} onClick={() => onRemove(r.id)}>×</button>
        </div>
      ))}
      <form className="addrow" onSubmit={add}>
        <input id={inputId} value={v} onChange={(e) => setV(e.target.value)} placeholder={hint} aria-label={`${title} 추가`} maxLength={100} />
      </form>
      {doneRows.length > 0 && <button className="link" onClick={() => doneRows.forEach((r) => onRemove(r.id))}>완료 항목 지우기</button>}
    </div>
  );
}
