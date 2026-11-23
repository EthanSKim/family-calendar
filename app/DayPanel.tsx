"use client";
import { useBackClose } from "./useBackClose";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  COLOR,
  Ev,
  Expense,
  MEMBERS,
  Member,
  fmtTime,
  money,
  parseMoney,
} from "./types";

const blank = {
  title: "",
  description: "",
  start_time: "",
  location: "",
  member: "가족" as Member,
};

export default function DayPanel({
  date,
  events,
  expenses,
  weekTotal,
  focus = null,
  onClose,
  onChanged,
  onSpendChanged,
}: {
  date: string;
  events: Ev[];
  expenses: Expense[];
  weekTotal: number;
  focus?: "expense" | "event" | null;
  onClose: () => void;
  onChanged: () => void;
  onSpendChanged: () => void;
}) {
  const xRef = useRef<HTMLInputElement>(null);
  const tRef = useRef<HTMLInputElement>(null);
  // 일정 and 지출 live on separate tabs; the expense shortcut opens straight on 지출
  const [tab, setTab] = useState<"event" | "spend">(
    focus === "expense" ? "spend" : "event",
  );
  useBackClose(onClose); // Android Back closes the popup instead of leaving the app
  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => {
      const el = focus === "expense" ? xRef.current : tRef.current;
      el?.scrollIntoView({ block: "center" });
      el?.focus();
    }, 300);
    return () => clearTimeout(t);
  }, [focus]);
  const [f, setF] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [en, setEn] = useState("");
  const [ea, setEa] = useState("");
  const [xerr, setXerr] = useState("");
  const d = new Date(date + "T00:00:00");
  const set = (k: keyof typeof blank, v: string) =>
    setF((p) => ({ ...p, [k]: v }));
  const reset = () => {
    setEditing(null);
    setF(blank);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const edit = (e: Ev) => {
    setEditing(e.id);
    setF({
      title: e.title,
      description: e.description,
      start_time: e.start_time?.slice(0, 5) ?? "",
      location: e.location,
      member: e.member,
    });
  };

  async function save(ev: FormEvent) {
    ev.preventDefault();
    if (!f.title.trim()) return;
    setBusy(true);
    setErr("");
    const r = await fetch(editing ? `/api/events/${editing}` : "/api/events", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, date }),
    });
    setBusy(false);
    if (!r.ok) return setErr("저장하지 못했어요. 다시 시도해 주세요.");
    reset();
    onChanged();
  }

  async function addExpense(ev: FormEvent) {
    ev.preventDefault();
    const cents = parseMoney(ea);
    if (!en.trim() || cents === null)
      return setXerr("이름과 금액(예: 10.50)을 확인해 주세요.");
    const r = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, name: en.trim(), amount_cents: cents }),
    });
    if (!r.ok) return setXerr("저장하지 못했어요. 다시 시도해 주세요.");
    setEn("");
    setEa("");
    setXerr("");
    onSpendChanged();
  }

  async function delExpense(id: string) {
    if (!confirm("이 지출을 삭제할까요?")) return;
    const r = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (r.ok) onSpendChanged();
    else setXerr("삭제하지 못했어요.");
  }

  async function del(id: string) {
    if (!confirm("이 일정을 삭제할까요?")) return;
    const r = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (!r.ok) return setErr("삭제하지 못했어요.");
    if (editing === id) reset();
    onChanged();
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside
        className="panel"
        role="dialog"
        aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일 일정`}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div className="lbl">{"일월화수목금토"[d.getDay()]}요일</div>
            <div className="day">
              {d.getMonth() + 1}월 {d.getDate()}일
            </div>
          </div>
          <button className="ib" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="ptabs" role="tablist" aria-label="일정 또는 지출">
          <button
            role="tab"
            aria-selected={tab === "event"}
            onClick={() => setTab("event")}
          >
            일정{events.length > 0 && <span> {events.length}</span>}
          </button>
          <button
            role="tab"
            aria-selected={tab === "spend"}
            onClick={() => setTab("spend")}
          >
            지출
            {expenses.length > 0 && (
              <span>
                {" "}
                {money(expenses.reduce((a, e) => a + e.amount_cents, 0))}
              </span>
            )}
          </button>
        </div>

        {tab === "event" && (
          <>
            <section>
              <div className="hd">
                <h2>일정</h2>
                <span className="lbl">{events.length}건</span>
              </div>
              {events.length === 0 && (
                <div className="muted">이 날은 일정이 없어요.</div>
              )}
              {events.map((e) => (
                <div className="erow" key={e.id}>
                  <div className="tm">{fmtTime(e.start_time)}</div>
                  <button
                    className="grow"
                    onClick={() => edit(e)}
                    aria-label={`${e.title} 수정`}
                  >
                    <div style={{ fontSize: 14 }}>{e.title}</div>
                    <div className="muted">
                      {[e.location, e.description].filter(Boolean).join(" · ")}
                    </div>
                  </button>
                  <span
                    style={{ color: COLOR[e.member] }}
                    aria-label={e.member}
                  >
                    ●
                  </span>
                  <button
                    className="ib"
                    aria-label={`${e.title} 삭제`}
                    onClick={() => del(e.id)}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </section>

            <form className="card form" onSubmit={save}>
              <div className="hd" style={{ marginBottom: 0 }}>
                <h2>{editing ? "일정 수정" : "일정 추가"}</h2>
                {editing && (
                  <button
                    type="button"
                    className="ib"
                    style={{ width: "auto", fontSize: 13 }}
                    onClick={reset}
                  >
                    취소
                  </button>
                )}
              </div>
              <label>
                제목
                <input
                  ref={tRef}
                  value={f.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                />
              </label>
              <label>
                설명
                <input
                  value={f.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="메모를 남겨 보세요"
                />
              </label>
              <div className="r2">
                <label>
                  시간
                  <input
                    type="time"
                    value={f.start_time}
                    onChange={(e) => set("start_time", e.target.value)}
                  />
                </label>
                <label>
                  장소
                  <input
                    value={f.location}
                    onChange={(e) => set("location", e.target.value)}
                  />
                </label>
              </div>
              <div
                className="chips"
                role="group"
                aria-label="누구의 일정인가요"
              >
                {MEMBERS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={f.member === m ? `on m-${m}` : ""}
                    style={
                      f.member === m ? { borderColor: COLOR[m] } : undefined
                    }
                    aria-pressed={f.member === m}
                    onClick={() => set("member", m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {err && (
                <div className="err" role="alert">
                  {err}
                </div>
              )}
              <button className="btn" disabled={busy}>
                {busy ? "저장 중…" : editing ? "수정 저장" : "일정 저장"}
              </button>
            </form>
          </>
        )}

        {tab === "spend" && (
          <>
            <section>
              <div className="hd">
                <h2>지출</h2>
                <span className="lbl">
                  하루 합계{" "}
                  {money(expenses.reduce((a, e) => a + e.amount_cents, 0))}
                </span>
              </div>
              {expenses.length === 0 && (
                <div className="muted">이 날은 지출이 없어요.</div>
              )}
              {expenses.map((e) => (
                <div className="erow" key={e.id}>
                  <div
                    style={{
                      flex: 1,
                      fontSize: 14,
                      minWidth: 0,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {e.name}
                  </div>
                  <div className="amt">{money(e.amount_cents)}</div>
                  <button
                    className="ib"
                    aria-label={`${e.name} 삭제`}
                    onClick={() => delExpense(e.id)}
                  >
                    🗑
                  </button>
                </div>
              ))}
              <form className="xadd" onSubmit={addExpense}>
                <input
                  ref={xRef}
                  value={en}
                  onChange={(e) => setEn(e.target.value)}
                  placeholder="이름"
                  aria-label="지출 이름"
                  maxLength={100}
                />
                <input
                  value={ea}
                  onChange={(e) => setEa(e.target.value)}
                  placeholder="$0.00"
                  aria-label="금액"
                  inputMode="decimal"
                />
                <button className="btn">추가</button>
              </form>
              {xerr && (
                <div className="err" role="alert" style={{ marginTop: 8 }}>
                  {xerr}
                </div>
              )}
            </section>
            <div className="wkfoot">
              <span>이 주 합계 (일–토)</span>
              <b
                className="serif"
                style={{ fontSize: 22, color: "var(--burg)" }}
              >
                {money(weekTotal)}
              </b>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
