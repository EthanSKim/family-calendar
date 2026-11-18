export type Member = '수지' | '수환' | '이레' | '가족';
export const MEMBERS: Member[] = ['수지', '수환', '이레', '가족'];
export const COLOR: Record<Member, string> = { 수지: '#D98BA3', 수환: '#6FAEDB', 이레: '#9B8BB4', 가족: '#8A9A7B' };
export type Ev = { id: string; date: string; title: string; description: string; start_time: string | null; location: string; member: Member };

export function fmtTime(t: string | null) {
  if (!t) return '종일';
  const [h, m] = t.split(':').map(Number);
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(m).padStart(2, '0')}`;
}

export type Grocery = { id: string; name: string; done: boolean };
export type Todo = { id: string; title: string; done: boolean };
export type Anniv = { id: string; title: string; month: number; day: number };

// Days until the next yearly occurrence of month/day (0 = today).
export function daysUntil(month: number, day: number, from: Date) {
  const t = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let n = new Date(t.getFullYear(), month - 1, day);
  if (n < t) n = new Date(t.getFullYear() + 1, month - 1, day);
  return Math.round((n.getTime() - t.getTime()) / 86400000);
}

export type Expense = { id: string; date: string; name: string; amount_cents: number };
export const money = (c: number) => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// "10", "$10.5", "1,234.56" -> cents; anything else -> null
export function parseMoney(s: string) {
  const t = s.replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const c = Math.round(parseFloat(t) * 100);
  return c > 0 && c <= 100000000 ? c : null;
}

// Shorter form for tight spots (weekly totals): drops cents from $1,000 up.
export const moneyShort = (c: number) => (c >= 100000 ? '$' + Math.round(c / 100).toLocaleString('en-US') : money(c));
