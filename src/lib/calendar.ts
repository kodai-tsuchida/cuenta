/** 日本式に「日 月 火 水 木 金 土」で並べたカレンダーマトリクスを作る */

export type CalendarCell = {
  /** YYYY-MM-DD */
  date: string;
  day: number;
  /** その月の枠外なら true */
  outside: boolean;
  /** 0=日, 1=月, ..., 6=土 */
  weekday: number;
};

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;
export const WEEKDAYS = WEEKDAY_LABELS;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function isoFor(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** YYYY-MM の月のカレンダーセルを返す(常に 6行 × 7列 = 42 セル) */
export function buildCalendar(monthKey: string): CalendarCell[] {
  const [y, m] = monthKey.split("-").map(Number);
  const firstOfMonth = new Date(y, m - 1, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(y, m, 0).getDate();

  const cells: CalendarCell[] = [];

  // 前月の埋め
  for (let i = 0; i < startWeekday; i += 1) {
    const d = new Date(y, m - 1, -startWeekday + i + 1);
    cells.push({
      date: isoFor(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      day: d.getDate(),
      outside: true,
      weekday: d.getDay(),
    });
  }
  // 今月
  for (let day = 1; day <= daysInMonth; day += 1) {
    const wd = new Date(y, m - 1, day).getDay();
    cells.push({
      date: isoFor(y, m, day),
      day,
      outside: false,
      weekday: wd,
    });
  }
  // 翌月の埋め(42セルになるまで)
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    const [yy, mm, dd] = last.date.split("-").map(Number);
    const next = new Date(yy, mm - 1, dd + 1);
    cells.push({
      date: isoFor(next.getFullYear(), next.getMonth() + 1, next.getDate()),
      day: next.getDate(),
      outside: true,
      weekday: next.getDay(),
    });
  }
  return cells;
}

/** YYYY-MM の前月キー */
export function prevMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function nextMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** 平日(月〜金)か */
export function isWeekday(weekday: number) {
  return weekday >= 1 && weekday <= 5;
}
