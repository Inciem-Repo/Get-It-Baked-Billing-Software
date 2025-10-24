export function formatDate(date, pattern = "dd-MM-yyyy") {
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return pattern
    .replace("dd", day)
    .replace("MM", month)
    .replace("yyyy", year)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}
