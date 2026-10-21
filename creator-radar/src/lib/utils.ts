import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});
const dateOnly = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

export function formatDateTime(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : dateTime.format(d);
}

export function formatDate(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = new Date(typeof v === "string" && v.length === 10 ? `${v}T00:00:00Z` : v);
  return Number.isNaN(d.getTime()) ? "—" : dateOnly.format(d);
}

export function formatRelative(v: string | Date | null | undefined, now = Date.now()): string {
  if (!v) return "never";
  const diff = now - new Date(v).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function pct(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${Math.round(Number(n) * 100)}%`;
}
