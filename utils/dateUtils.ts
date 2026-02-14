import { format } from "date-fns";

export function formatToCst(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(
    new Date(d.toLocaleString("en-US", { timeZone: "America/Chicago" })),
    "MM/dd/yyyy 'at' hh:mm a 'CST'"
  );
}

export function convertTimeToCst(date: Date | string): string {
  const utcDate = new Date(date + "Z"); // Append 'Z' to indicate UTC time
  const cstDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Enables AM/PM format
  }).format(utcDate);

  return cstDate;
}

