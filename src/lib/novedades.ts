const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function calculateInclusiveDays(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null;

  const start = Date.parse(`${startDate}T00:00:00.000Z`);
  const end = Date.parse(`${endDate}T00:00:00.000Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;

  return Math.floor((end - start) / millisecondsPerDay) + 1;
}
