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
