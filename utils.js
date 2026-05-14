export function formatPriceRub(value) {
  const n = Number(value ?? 0);
  return `${n.toLocaleString("ru-RU")} ₽`;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function debounce(fn, waitMs = 250) {
  let t = null;
  return (...args) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), waitMs);
  };
}

export function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

export function setQueryParams(params) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, String(value));
  }
  window.history.replaceState({}, "", url.toString());
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? "").trim());
}

export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  return div.innerHTML;
}

const COLOR_MAP = {
  "синий": "#1e3a8a",
  "голубой": "#3b82f6",
  "серый": "#6b7280",
  "черный": "#111827",
  "чёрный": "#111827",
  "белый": "#e5e7eb",
  "оранжевый": "#f97316",
  "красный": "#ef4444",
  "хаки": "#4b5320",
  "песочный": "#d6b88c",
  "коричневый": "#92400e",
  "желтый": "#facc15",
  "жёлтый": "#facc15",
  "прозрачный": "#e5e7eb",
};

export function getColorHex(input, fallback = "#e5e7eb") {
  const key = String(input ?? "").trim().toLowerCase();
  return COLOR_MAP[key] ?? fallback;
}

import { resolveProductImageUrl } from "./image-url.js";

/** Первое (или по индексу) изображение товара из массива `images` (ссылка или путь — см. data.js). */
export function getProductImageUrl(product, index = 0) {
  const arr = product?.images;
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const i = Math.max(0, Math.min(index, arr.length - 1));
  return resolveProductImageUrl(arr[i]);
}

