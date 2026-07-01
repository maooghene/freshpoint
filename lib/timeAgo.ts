export function formatTimeAgo(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const secondsPast = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Fallback protection for tiny clock synchronization drifts
  if (secondsPast < 5) return "Just now";
  if (secondsPast < 60) return `${secondsPast} seconds ago`;

  const minutesPast = Math.floor(secondsPast / 60);
  if (minutesPast < 60)
    return `${minutesPast} minute${minutesPast === 1 ? "" : "s"} ago`;

  const hoursPast = Math.floor(minutesPast / 60);
  if (hoursPast < 24)
    return `${hoursPast} hour${hoursPast === 1 ? "" : "s"} ago`;

  const daysPast = Math.floor(hoursPast / 24);
  if (daysPast < 7) return `${daysPast} day${daysPast === 1 ? "" : "s"} ago`;

  const weeksPast = Math.floor(daysPast / 7);
  if (weeksPast < 4)
    return `${weeksPast} week${weeksPast === 1 ? "" : "s"} ago`;

  const monthsPast = Math.floor(daysPast / 30);
  return `${monthsPast} month${monthsPast === 1 ? "" : "s"} ago`;
}
