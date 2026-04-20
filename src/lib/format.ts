export function formatJPY(amount: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number) {
  return new Intl.NumberFormat("ja-JP").format(amount);
}

/** "HH:mm" の2文字列から分を求める。終了が開始以下なら 0 を返す */
export function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return 0;
  const total = eh * 60 + em - (sh * 60 + sm);
  return total > 0 ? total : 0;
}

export function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}時間${m.toString().padStart(2, "0")}分`;
}

/** YYYY-MM-DD を "MM/DD" に(空文字は空文字で返す) */
export function shortDate(iso?: string) {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  if (!m || !d) return iso;
  return `${Number(m)}/${Number(d)}`;
}

export function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** YYYY-MM 形式で今月を返す */
export function currentMonthKey() {
  return todayIso().slice(0, 7);
}

/** YYYY-MM の "前の月" を返す */
export function prevMonthKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  const yy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${yy}-${mm}`;
}

/** YYYY-MM の "次の月" を返す */
export function nextMonthKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m, 1);
  const yy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${yy}-${mm}`;
}

export function daysUntil(dateIso: string) {
  const [y, m, d] = dateIso.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export function formatMonthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${y}年${Number(m)}月`;
}
