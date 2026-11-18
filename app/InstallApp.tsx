'use client';
import { useEffect, useState } from 'react';

type InstallEvent = Event & { prompt: () => Promise<void> };

// Chrome/Edge/Android: real install prompt. iPhone/iPad: Safari has no prompt, so show the steps.
export default function InstallApp() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    setInstalled(matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);
    const ua = navigator.userAgent;
    setIos(/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)); // iPadOS reports as Mac
    const on = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    const done = () => { setInstalled(true); setEvt(null); };
    window.addEventListener('beforeinstallprompt', on);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', on); window.removeEventListener('appinstalled', done); };
  }, []);

  if (installed || (!evt && !ios)) return null;
  return (
    <div>
      <button className="link" onClick={async () => { if (evt) { await evt.prompt(); setEvt(null); } else setHint(!hint); }}>앱으로 설치</button>
      {hint && <div className="muted" role="status">Safari의 공유 버튼 → ‘홈 화면에 추가’를 눌러 주세요.</div>}
    </div>
  );
}
