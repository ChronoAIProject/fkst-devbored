/** Format an evidence timestamp in the shared UTC display form. */
export function formatAsOf(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown";

  const day = date.getUTCDate();
  const month = date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  const year = date.getUTCFullYear();
  const time = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
  return `${day} ${month} ${year} · ${time} UTC`;
}
