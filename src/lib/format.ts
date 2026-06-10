import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(value: string): string {
  return format(new Date(value), "dd MMM yyyy, HH:mm", { locale: es });
}

export function formatRelativeDate(value: string): string {
  return formatDistanceToNow(new Date(value), {
    addSuffix: true,
    locale: es,
  });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
