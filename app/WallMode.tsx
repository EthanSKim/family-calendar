'use client';
import { useEffect, useState } from 'react';

// Fullscreen and keep-screen-on, for the wall display. Each button only appears if the device supports it.
export default function WallMode() {
  const [canFs, setCanFs] = useState(false);
  const [canWake, setCanWake] = useState(false);
  const [fs, setFs] = useState(false);
  const [awake, setAwake] = useState(false);

  useEffect(() => {
    setCanFs(!!document.fullscreenEnabled);
    setCanWake('wakeLock' in navigator);
    setAwake(localStorage.getItem('awake') === '1');
    const f = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);

  useEffect(() => {
    if (!awake || !canWake) return;
    let lock: { release?: () => void } | null = null;
    const get = async () => { try { lock = await (navigator as any).wakeLock.request('screen'); } catch { /* not allowed right now */ } };
    get();
    const v = () => { if (!document.hidden) get(); }; // the lock is released whenever the tab is hidden
    document.addEventListener('visibilitychange', v);
    return () => { document.removeEventListener('visibilitychange', v); lock?.release?.(); };
  }, [awake, canWake]);

  if (!canFs && !canWake) return <span />;
  return (
    <div className="wall">
      {canFs && <button className="link" onClick={() => (fs ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}))}>{fs ? '전체 화면 끄기' : '전체 화면'}</button>}
      {canWake && <button className="link" aria-pressed={awake} onClick={() => { localStorage.setItem('awake', awake ? '0' : '1'); setAwake(!awake); }}>{awake ? '화면 켜두기 끄기' : '화면 켜두기'}</button>}
    </div>
  );
}
