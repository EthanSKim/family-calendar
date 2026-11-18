'use client';
import { FormEvent, useEffect, useState } from 'react';
import { Anniv } from './types';

export default function AnnivPanel({ items, onAdd, onRemove, onClose }: {
  items: Anniv[]; onAdd: (b: object) => Promise<boolean>; onRemove: (id: string) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [err, setErr] = useState('');
  const sorted = [...items].sort((a, b) => a.month - b.month || a.day - b.day);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const [, m, d] = date.split('-').map(Number); // the year is ignored: it repeats every year
    if (await onAdd({ title: title.trim(), month: m, day: d })) { setTitle(''); setDate(''); setErr(''); }
    else setErr('저장하지 못했어요. 다시 시도해 주세요.');
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="panel" role="dialog" aria-label="기념일 관리">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div className="lbl">매년 반복</div><div className="day" style={{ fontSize: 34 }}>기념일</div></div>
          <button className="ib" aria-label="닫기" onClick={onClose}>✕</button>
        </div>
        <section>
          {sorted.length === 0 && <div className="muted">아직 기념일이 없어요.</div>}
          {sorted.map((a) => (
            <div className="erow" key={a.id}>
              <div className="tm">{a.month}월 {a.day}일</div>
              <div style={{ flex: 1, fontSize: 14 }}>{a.title}</div>
              <button className="ib" aria-label={`${a.title} 삭제`} onClick={() => confirm('이 기념일을 삭제할까요?') && onRemove(a.id)}>🗑</button>
            </div>
          ))}
        </section>
        <form className="card form" onSubmit={save}>
          <div className="hd" style={{ marginBottom: 0 }}><h2>기념일 추가</h2></div>
          <label>이름<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 수지 생일" required maxLength={100} /></label>
          <label>날짜<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
          {err && <div className="err" role="alert">{err}</div>}
          <button className="btn">저장</button>
        </form>
      </aside>
    </>
  );
}
