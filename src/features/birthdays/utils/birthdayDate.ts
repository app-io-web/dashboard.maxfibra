export function extractYMD(dateStr: string): { year: number; month: number; day: number } {
  const [datePart] = dateStr.split("T");
  const [y, m, d] = datePart.split("-").map((n) => parseInt(n, 10));
  return { year: y, month: m, day: d };
}

export function getNextBirthdayInfo(dateStr: string) {
  const { year: birthYear, month, day } = extractYMD(dateStr);

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let nextYear = today.getFullYear();
  let nextBirthday = new Date(nextYear, month - 1, day);

  if (nextBirthday < todayDate) {
    nextYear += 1;
    nextBirthday = new Date(nextYear, month - 1, day);
  }

  const oneDayMs = 1000 * 60 * 60 * 24;
  const diffMs = nextBirthday.getTime() - todayDate.getTime();
  const daysUntil = Math.round(diffMs / oneDayMs);

  const ageAtNext = nextYear - birthYear;

  return { nextBirthday, daysUntil, ageAtNext };
}

export function formatDate(dateStr: string) {
  const { month, day } = extractYMD(dateStr);
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return `${dd}/${mm}`;
}

export function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
