"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import DayPanel from "./DayPanel";
import AnnivPanel from "./AnnivPanel";
import Checklist from "./Checklist";
import WallMode from "./WallMode";
import { Agenda, AgendaWeek, DayCard } from "./MobileViews";
import InstallApp from "./InstallApp";
import { useList } from "./useList";
import {
  Anniv,
  COLOR,
  Ev,
  Expense,
  Grocery,
  Member,
  Todo,
  daysUntil,
  fmtTime,
  money,
  moneyShort,
  moneyTiny,
} from "./types";

const WMO = (c: number) =>
  c === 0
    ? "맑음"
    : c <= 3
      ? "대체로 맑음"
      : c <= 48
        ? "안개"
        : c <= 67
          ? "비"
          : c <= 77
            ? "눈"
            : c <= 82
              ? "소나기"
              : "뇌우";
const AQI = (v: number) => (v <= 50 ? "좋음" : v <= 100 ? "보통" : "나쁨");

type Wx = {
  temp: number;
  text: string;
  hi: number;
  lo: number;
  aqi: number | null;
};

function useWeather(enabled: boolean) {
  const [wx, setWx] = useState<Wx | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const q = (n: number) => n.toFixed(2); // ~1 km precision is plenty for weather
    const load = async ({ lat, lon }: { lat: number; lon: number }) => {
      try {
        const [w, a] = await Promise.all([
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${q(lat)}&longitude=${q(lon)}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`,
          ).then((r) => r.json()),
          fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${q(lat)}&longitude=${q(lon)}&current=us_aqi`,
          ).then((r) => r.json()),
        ]);
        setWx({
          temp: Math.round(w.current.temperature_2m),
          text: WMO(w.current.weather_code),
          hi: Math.round(w.daily.temperature_2m_max[0]),
          lo: Math.round(w.daily.temperature_2m_min[0]),
          aqi: a.current?.us_aqi ?? null,
        });
      } catch {
        /* keep the last reading */
      }
    };
    const fallback = async () => {
      try {
        const r = await fetch("/api/home");
        if (r.ok) await load(await r.json());
      } catch {
        /* no fallback set */
      }
    };
    const locate = () => {
      if (!navigator.geolocation) {
        fallback();
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) => load({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => fallback(),
        { timeout: 8000, maximumAge: 600000 },
      );
    };
    locate();
    const t = setInterval(locate, 30 * 60000);
    return () => clearInterval(t);
  }, [enabled]);
  return wx;
}

function Gate({ onOpen }: { onOpen: () => void }) {
  const [v, setV] = useState("");
  const [msg, setMsg] = useState("");
  async function go(e: FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: v }),
    });
    if (r.ok) onOpen();
    else
      setMsg(
        r.status === 429
          ? "시도가 너무 많아요. 15분 뒤에 다시 해 주세요."
          : r.status === 500
            ? "서버 설정이 아직 끝나지 않았어요."
            : "비밀번호가 맞지 않아요.",
      );
  }
  return (
    <div className="gate">
      <form onSubmit={go}>
        <div className="lbl">우리 집 이야기</div>
        <h1
          className="serif"
          style={{
            margin: 0,
            fontWeight: 500,
            color: "var(--navy)",
            fontSize: 34,
          }}
        >
          수수 부부 달력♥️
        </h1>
        <input
          type="password"
          name="passcode"
          autoComplete="current-password"
          aria-label="가족 비밀번호"
          placeholder="••••"
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            setMsg("");
          }}
        />
        {msg && (
          <div className="err" role="alert">
            {msg}
          </div>
        )}
        <button type="submit">들어가기</button>
      </form>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function Home() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [off, setOff] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState<"expense" | "event" | null>(null);
  const [mobile, setMobile] = useState(false);
  const [mtab, setMtab] = useState<"cal" | "list">("cal");
  const [pick, setPick] = useState<string | null>(null);
  const swipe0 = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const q = window.matchMedia("(max-width: 640px)");
    const f = () => setMobile(q.matches);
    f();
    q.addEventListener("change", f);
    return () => q.removeEventListener("change", f);
  }, []);
  const [dbErr, setDbErr] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const wx = useWeather(ok === true);
  const okRef = useRef<boolean | null>(null);
  okRef.current = ok;
  const syncRef = useRef<() => void>(() => {});
  const mutAt = useRef(0);
  const touch = () => {
    mutAt.current = Date.now();
  };
  const reload = () => syncRef.current();
  const groceries = useList<Grocery>("groceries", reload, touch);
  const todos = useList<Todo>("todos", reload, touch);
  const annivs = useList<Anniv>("anniversaries", reload, touch);
  const [annivOpen, setAnnivOpen] = useState(false);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const view = now
    ? new Date(now.getFullYear(), now.getMonth() + off, 1)
    : null;
  const todayStr = now ? ymd(now) : "";
  const from = view ? ymd(view) : "";
  const to = view
    ? ymd(new Date(view.getFullYear(), view.getMonth() + 1, 0))
    : "";
  const lo = todayStr && todayStr < from ? todayStr : from;
  const hi = todayStr && todayStr > to ? todayStr : to;
  // Spending range: the whole calendar grid (weeks can cross months) plus last week and this week.
  const gStart = view
    ? new Date(view.getFullYear(), view.getMonth(), 1 - view.getDay())
    : null;
  const gEnd = view
    ? new Date(
        view.getFullYear(),
        view.getMonth() + 1,
        6 - new Date(view.getFullYear(), view.getMonth() + 1, 0).getDay(),
      )
    : null;
  const wkS = now
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    : null;
  const lwS = wkS
    ? new Date(wkS.getFullYear(), wkS.getMonth(), wkS.getDate() - 7)
    : null;
  const wkE = wkS
    ? new Date(wkS.getFullYear(), wkS.getMonth(), wkS.getDate() + 6)
    : null;
  const xlo =
    gStart && lwS ? (ymd(lwS) < ymd(gStart) ? ymd(lwS) : ymd(gStart)) : "";
  const xhi = gEnd && wkE ? (ymd(wkE) > ymd(gEnd) ? ymd(wkE) : ymd(gEnd)) : "";

  // One request refreshes everything. Runs every 15s while the screen is visible, and right away
  // when the tab comes back or the Wi-Fi returns.
  const sync = useCallback(async () => {
    if (!lo || !xlo) return;
    const started = Date.now();
    try {
      const r = await fetch(
        `/api/sync?from=${lo}&to=${hi}&xfrom=${xlo}&xto=${xhi}`,
      );
      if (r.status === 401) return setOk(false);
      setOk(true);
      if (!r.ok) return setDbErr(true);
      const d = await r.json();
      if (mutAt.current > started) return; // an edit happened meanwhile; the next refresh will include it
      setEvents(d.events);
      setExpenses(d.expenses);
      groceries.setItems(d.groceries);
      todos.setItems(d.todos);
      annivs.setItems(d.anniversaries);
      setDbErr(false);
    } catch {
      setOk((o) => o ?? true);
      setDbErr(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lo, hi, xlo, xhi]);

  useEffect(() => {
    syncRef.current = sync;
    sync();
    const run = () => {
      if (!document.hidden && okRef.current !== false) sync();
    };
    const t = setInterval(run, 15000);
    document.addEventListener("visibilitychange", run);
    window.addEventListener("online", run);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", run);
      window.removeEventListener("online", run);
    };
  }, [sync]);

  // Android shortcuts (long-press the app icon): ?add=expense | event | grocery
  const quickRef = useRef<"expense" | "event" | "grocery" | null>(null);
  useEffect(() => {
    const a = new URLSearchParams(window.location.search).get("add");
    if (a === "expense" || a === "event" || a === "grocery") {
      quickRef.current = a;
      window.history.replaceState(null, "", "/"); // so a refresh doesn't reopen it
    }
  }, []);
  useEffect(() => {
    const a = quickRef.current;
    if (ok !== true || !todayStr || !a) return;
    quickRef.current = null;
    if (a === "grocery") {
      // jump to the grocery list's "add item" line
      setTimeout(() => {
        const el = document.getElementById("grocery-add");
        el?.scrollIntoView({ block: "center" });
        el?.focus();
      }, 400);
    } else {
      setQuickAdd(a); // today's panel, cursor on the event title or the expense name
      setSel(todayStr);
    }
  }, [ok, todayStr]);

  const changed = () => {
    touch();
    sync();
  };

  if (ok === null || !now || !view) return null;
  if (!ok)
    return (
      <Gate
        onOpen={() => {
          setOk(true);
          sync();
        }}
      />
    );

  const y = view.getFullYear(),
    m = view.getMonth();
  const first = view.getDay(),
    days = new Date(y, m + 1, 0).getDate();
  const weeks = Math.ceil((first + days) / 7);
  const hh = now.getHours(),
    mm = pad(now.getMinutes());
  const byDay: Record<string, number> = {};
  for (const e of expenses)
    byDay[e.date] = (byDay[e.date] ?? 0) + e.amount_cents;
  const sumWeek = (s0: Date) => {
    let t = 0;
    for (let i = 0; i < 7; i++)
      t +=
        byDay[
          ymd(new Date(s0.getFullYear(), s0.getMonth(), s0.getDate() + i))
        ] ?? 0;
    return t;
  };
  const weekSum = (w: number) => sumWeek(new Date(y, m, 1 - first + w * 7));
  const thisWk = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay(),
  );
  const lastWk = new Date(
    thisWk.getFullYear(),
    thisWk.getMonth(),
    thisWk.getDate() - 7,
  );
  const selD = sel ? new Date(sel + "T00:00:00") : null;
  const selWeek = selD
    ? sumWeek(
        new Date(
          selD.getFullYear(),
          selD.getMonth(),
          selD.getDate() - selD.getDay(),
        ),
      )
    : 0;
  const upcoming = annivs.items
    .map((a) => ({ a, n: daysUntil(a.month, a.day, now) }))
    .sort((x, y) => x.n - y.n)
    .slice(0, 4);
  const todayEvents = events.filter((e) => e.date === todayStr);

  const monthKey = `${y}-${pad(m + 1)}`;
  const pickDate =
    pick && pick.startsWith(monthKey)
      ? pick
      : off === 0
        ? todayStr
        : `${monthKey}-01`;
  const cells = [];
  for (let w = 0; w < weeks; w++) {
    for (let i = 0; i < 7; i++) {
      const d = w * 7 + i - first + 1,
        inMonth = d >= 1 && d <= days;
      const ds = `${y}-${pad(m + 1)}-${pad(d)}`;
      const evs = inMonth ? events.filter((e) => e.date === ds) : [];
      const sp = inMonth ? (byDay[ds] ?? 0) : 0;
      const ans = inMonth
        ? annivs.items.filter((a) => a.month === m + 1 && a.day === d)
        : [];
      const chips = [
        ...evs.map((e) => ({ k: e.id, t: e.title, c: `m-${e.member}` })),
        ...ans.map((a) => ({ k: a.id, t: a.title, c: "an" })),
      ];
      const shown = mobile ? chips.slice(0, 2) : chips; // phones: two titles per day, the day card below has the rest
      cells.push(
        <button
          key={`${w}-${i}`}
          className={`cell${i === 0 ? " su" : ""}${!inMonth ? " out" : ""}${inMonth && ds === todayStr ? " today" : ""}${mobile && inMonth && ds === pickDate ? " pick" : ""}`}
          disabled={!inMonth}
          aria-label={
            inMonth
              ? `${m + 1}월 ${d}일, 일정 ${evs.length}건${sp ? `, 지출 ${money(sp)}` : ""}`
              : undefined
          }
          onClick={() => (mobile ? setPick(ds) : setSel(ds))}
        >
          <span className="n">
            {inMonth ? d : d < 1 ? new Date(y, m, d).getDate() : d - days}
          </span>
          {shown.map((c) => (
            <span key={c.k} className={`chip ${c.c}`}>
              {c.t}
            </span>
          ))}
          {mobile && chips.length > 2 && (
            <span className="more">+{chips.length - 2}</span>
          )}
          {sp ? (
            <>
              <span className="spent">{moneyShort(sp)}</span>
              <span className="spent-s">{moneyTiny(sp)}</span>
            </>
          ) : null}
        </button>,
      );
    }
    cells.push(
      <div key={`w${w}`} className="wk">
        {weekSum(w) ? moneyShort(weekSum(w)) : "—"}
      </div>,
    );
  }

  // Phone list view: only days that have something (plus today), grouped by week.
  const agenda: AgendaWeek[] = [];
  for (let w = 0; w < weeks; w++) {
    const rows = [];
    for (let i = 0; i < 7; i++) {
      const d = w * 7 + i - first + 1;
      if (d < 1 || d > days) continue;
      const ds = `${monthKey}-${pad(d)}`;
      const evs = events.filter((e) => e.date === ds),
        ans = annivs.items.filter((a) => a.month === m + 1 && a.day === d),
        xs = expenses.filter((e) => e.date === ds);
      if (evs.length || ans.length || xs.length || ds === todayStr)
        rows.push({
          date: ds,
          d,
          dow: "일월화수목금토"[i],
          events: evs,
          annivs: ans,
          expenses: xs,
          total: byDay[ds] ?? 0,
        });
    }
    const wa = new Date(y, m, 1 - first + w * 7),
      wb = new Date(y, m, 1 - first + w * 7 + 6);
    agenda.push({
      label: `${wa.getMonth() + 1}/${wa.getDate()} – ${wb.getMonth() + 1}/${wb.getDate()}`,
      total: weekSum(w),
      days: rows,
    });
  }
  const pd = Number(pickDate.slice(8));

  return (
    <main className="app">
      <header className="top">
        <div className="clock">
          <div className="serif time">
            {hh % 12 || 12}:{mm}
          </div>
          <div className="date">
            {hh < 12 ? "오전" : "오후"}
            <br />
            {now.getMonth() + 1}월 {now.getDate()}일{" "}
            {"일월화수목금토"[now.getDay()]}요일
          </div>
        </div>
        <div className="title">
          <div className="lbl">우리 집 이야기</div>
          <h1>수수 부부 달력♥️</h1>
        </div>
        <div className="card weather">
          <div className="serif deg">{wx ? `${wx.temp}°` : "--°"}</div>
          <small>
            {wx ? wx.text : "날씨 불러오는 중"}
            <br />
            {wx ? `최고 ${wx.hi}° · 최저 ${wx.lo}°` : ""}
            <br />
            {wx?.aqi != null ? `대기질 ${AQI(wx.aqi)}` : ""}
          </small>
        </div>
      </header>

      {dbErr && (
        <div className="card err" role="alert">
          데이터베이스에 연결하지 못했어요. .env.local 설정을 확인해 주세요.
        </div>
      )}

      {mobile && (
        <div className="seg" role="tablist" aria-label="보기">
          <button
            role="tab"
            aria-selected={mtab === "cal"}
            onClick={() => setMtab("cal")}
          >
            달력
          </button>
          <button
            role="tab"
            aria-selected={mtab === "list"}
            onClick={() => setMtab("list")}
          >
            목록
          </button>
        </div>
      )}

      <div className="main">
        <section
          className="card calcard"
          aria-label="달력"
          onTouchStart={(e) => {
            swipe0.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
            };
          }}
          onTouchEnd={(e) => {
            const s0 = swipe0.current;
            swipe0.current = null;
            if (!s0) return;
            const dx = e.changedTouches[0].clientX - s0.x,
              dy = e.changedTouches[0].clientY - s0.y;
            if (Math.abs(dx) > 70 && Math.abs(dy) < 40)
              setOff(off + (dx < 0 ? 1 : -1)); // swipe to change month
          }}
        >
          <div className="cal-hd">
            <div className="mnav">
              <button
                className="ib"
                aria-label="이전 달"
                onClick={() => setOff(off - 1)}
              >
                ‹
              </button>
              <div className="serif m">
                {y}년{" "}
                <i style={{ color: "var(--gold-d)", fontWeight: 500 }}>
                  {m + 1}월
                </i>
              </div>
              <button
                className="ib"
                aria-label="다음 달"
                onClick={() => setOff(off + 1)}
              >
                ›
              </button>
              {off !== 0 && (
                <button
                  className="ib"
                  style={{ width: "auto", fontSize: 13 }}
                  onClick={() => setOff(0)}
                >
                  오늘
                </button>
              )}
            </div>
            <div className="legend">
              {(Object.keys(COLOR) as Member[]).map((k) => (
                <span key={k}>
                  <span style={{ color: COLOR[k] }}>●</span> {k}
                </span>
              ))}
            </div>
          </div>
          {mobile && mtab === "list" ? (
            <Agenda weeks={agenda} todayStr={todayStr} onOpen={setSel} />
          ) : (
            <div className="cal">
              {["일", "월", "화", "수", "목", "금", "토", "주간"].map((d) => (
                <div key={d} className="dow">
                  {d}
                </div>
              ))}
              {cells}
            </div>
          )}
        </section>

        {mobile && mtab === "cal" && (
          <DayCard
            date={pickDate}
            events={events.filter((e) => e.date === pickDate)}
            annivs={annivs.items.filter(
              (a) => a.month === m + 1 && a.day === pd,
            )}
            expenses={expenses.filter((e) => e.date === pickDate)}
            onAddEvent={() => {
              setQuickAdd("event");
              setSel(pickDate);
            }}
            onAddExpense={() => {
              setQuickAdd("expense");
              setSel(pickDate);
            }}
          />
        )}

        <aside className="side">
          <div className="card">
            <div className="hd">
              <h2>오늘</h2>
              <span className="lbl">
                {now.getMonth() + 1}월 {now.getDate()}일
              </span>
            </div>
            {todayEvents.length === 0 && (
              <div className="muted">오늘은 일정이 없어요.</div>
            )}
            {todayEvents.map((e) => (
              <div className="tl" key={e.id}>
                <b>{fmtTime(e.start_time)}</b>
                {e.title}
              </div>
            ))}
          </div>
          <div className="card two">
            <Checklist
              title="장보기"
              inputId="grocery-add"
              hint="+ 항목 추가"
              rows={groceries.items.map((g) => ({
                id: g.id,
                label: g.name,
                done: g.done,
              }))}
              onAdd={(name) => groceries.add({ name })}
              onToggle={(id, done) => groceries.patch(id, { done })}
              onRemove={groceries.remove}
            />
            <Checklist
              title="할 일"
              hint="+ 할 일 추가"
              rows={todos.items.map((t) => ({
                id: t.id,
                label: t.title,
                done: t.done,
              }))}
              onAdd={(title) => todos.add({ title })}
              onToggle={(id, done) => todos.patch(id, { done })}
              onRemove={todos.remove}
            />
          </div>
          <div className="card">
            <div className="hd">
              <h2>다가오는 날</h2>
              <button className="link" onClick={() => setAnnivOpen(true)}>
                관리
              </button>
            </div>
            {upcoming.length === 0 && (
              <div className="muted">기념일을 추가해 보세요.</div>
            )}
            <div className="two">
              {upcoming.map(({ a, n }) => (
                <div key={a.id}>
                  <div className="dd">{n === 0 ? "오늘" : `D-${n}`}</div>
                  <div>
                    {a.title} · {a.month}/{a.day}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="hd">
              <h2>가계부</h2>
              <button className="link" onClick={() => setSel(todayStr)}>
                지출 추가
              </button>
            </div>
            <div className="big">
              {money(byDay[todayStr] ?? 0)} <span className="muted">오늘</span>
            </div>
            <div className="muted" style={{ marginTop: 8 }}>
              이번 주 {money(sumWeek(thisWk))} · 지난주 {money(sumWeek(lastWk))}
            </div>
          </div>
        </aside>
      </div>

      <footer className="foot">
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <WallMode />
          <InstallApp />
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Weather data by Open-Meteo.com
          </a>
          <button
            className="link"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              setOk(false);
            }}
          >
            로그아웃
          </button>
        </div>
      </footer>

      {annivOpen && (
        <AnnivPanel
          items={annivs.items}
          onAdd={annivs.add}
          onRemove={annivs.remove}
          onClose={() => setAnnivOpen(false)}
        />
      )}
      {sel && (
        <DayPanel
          date={sel}
          events={events.filter((e) => e.date === sel)}
          expenses={expenses.filter((e) => e.date === sel)}
          weekTotal={selWeek}
          focus={quickAdd}
          onClose={() => {
            setSel(null);
            setQuickAdd(null);
          }}
          onChanged={changed}
          onSpendChanged={changed}
        />
      )}
    </main>
  );
}
