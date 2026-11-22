"use client";
import { Anniv, COLOR, Ev, Expense, fmtTime, money } from "./types";

export type AgendaDay = {
  date: string;
  d: number;
  dow: string;
  events: Ev[];
  annivs: Anniv[];
  expenses: Expense[];
  total: number;
};
export type AgendaWeek = { label: string; total: number; days: AgendaDay[] };

// Details for the tapped day, shown under the phone calendar (month grid on top, day below).
export function DayCard({
  date,
  events,
  annivs,
  expenses,
  onAddEvent,
  onAddExpense,
}: {
  date: string;
  events: Ev[];
  annivs: Anniv[];
  expenses: Expense[];
  onAddEvent: () => void;
  onAddExpense: () => void;
}) {
  const d = new Date(date + "T00:00:00");
  const total = expenses.reduce((a, e) => a + e.amount_cents, 0);
  const empty = !events.length && !annivs.length && !expenses.length;
  return (
    <section className="card daycard" aria-label="선택한 날">
      <div className="hd">
        <h2>
          {d.getMonth() + 1}월 {d.getDate()}일 {"일월화수목금토"[d.getDay()]}
          요일
        </h2>
        <span className="lbl">{total ? money(total) : ""}</span>
      </div>
      {empty && <div className="muted">일정과 지출이 없어요.</div>}
      {events.map((e) => (
        <div className="row2" key={e.id}>
          <b>{fmtTime(e.start_time)}</b>
          <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
            {e.title}
            {e.location && <small className="muted"> · {e.location}</small>}
          </span>
          <span style={{ color: COLOR[e.member] }} aria-label={e.member}>
            ●
          </span>
        </div>
      ))}
      {annivs.map((a) => (
        <div className="row2" key={a.id}>
          <b>기념일</b>
          <span style={{ flex: 1 }}>{a.title}</span>
          <span style={{ color: "#A8884A" }}>●</span>
        </div>
      ))}
      {expenses.map((x) => (
        <div className="row2" key={x.id}>
          <b style={{ color: "var(--ink)" }}>{money(x.amount_cents)}</b>
          <span style={{ flex: 1, overflowWrap: "anywhere" }}>{x.name}</span>
        </div>
      ))}
      <div className="dcbtns">
        <button className="btn" onClick={onAddEvent}>
          + 일정
        </button>
        <button className="btn o" onClick={onAddExpense}>
          + 지출
        </button>
      </div>
    </section>
  );
}

// Month as a list: every day that has something, grouped by week with the weekly total. Full titles fit here.
export function Agenda({
  weeks,
  todayStr,
  onOpen,
}: {
  weeks: AgendaWeek[];
  todayStr: string;
  onOpen: (date: string) => void;
}) {
  const any = weeks.some((w) =>
    w.days.some((d) => d.events.length || d.annivs.length || d.expenses.length),
  );
  return (
    <div>
      {!any && (
        <div className="muted" style={{ padding: "8px 4px" }}>
          이 달에는 일정과 지출이 없어요.
        </div>
      )}
      {weeks
        .filter((w) => w.days.length)
        .map((w) => (
          <section className="agw" key={w.label}>
            <div className="hd">
              <h2 className="agh">{w.label}</h2>
              <span className="wkt">
                주간 합계 {w.total ? money(w.total) : "—"}
              </span>
            </div>
            {w.days.map((d) => (
              <button
                key={d.date}
                className={`agd${d.date === todayStr ? " today" : ""}`}
                onClick={() => onOpen(d.date)}
                aria-label={`${d.d}일 ${d.dow}요일 열기`}
              >
                <div className="agdate">
                  <b>{d.d}</b>
                  <small>{d.dow}</small>
                </div>
                <div style={{ minWidth: 0 }}>
                  {d.events.map((e) => (
                    <div className="agev" key={e.id}>
                      <i style={{ background: COLOR[e.member] }} />
                      <span>
                        <small>{fmtTime(e.start_time)}</small> {e.title}
                      </span>
                    </div>
                  ))}
                  {d.annivs.map((a) => (
                    <div className="agev" key={a.id}>
                      <i style={{ background: "#A8884A" }} />
                      <span>{a.title}</span>
                    </div>
                  ))}
                  {d.expenses.length > 0 && (
                    <div className="agx">
                      {d.expenses
                        .map((x) => `${x.name} ${money(x.amount_cents)}`)
                        .join(" · ")}
                    </div>
                  )}
                  {!d.events.length &&
                    !d.annivs.length &&
                    !d.expenses.length && <div className="agx">오늘</div>}
                </div>
                <div className="agsum">{d.total ? money(d.total) : ""}</div>
              </button>
            ))}
          </section>
        ))}
    </div>
  );
}
