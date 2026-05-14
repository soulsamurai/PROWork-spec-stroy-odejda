/**
 * База для коротких имён в `images` (только файл без пути).
 * Пример: "pw-001.jpg" → "./media/products/pw-001.jpg"
 * Для товаров только со ссылками можно задать "" и везде писать полный https://...
 */
export const PRODUCT_MEDIA_BASE = "./media/products/";

/**
 * @param {string} raw значение из массива product.images
 * @returns {string} готовый src для <img>
 */
export function resolveProductImageUrl(raw) {
  const u = String(raw ?? "").trim();
  if (!u) return "";
  if (/^(?:https?:|data:)/i.test(u)) return u;
  if (u.startsWith("//")) return u;
  if (u.startsWith("/") || u.startsWith("./") || u.startsWith("../")) return u;
  const base = String(PRODUCT_MEDIA_BASE ?? "").trim();
  if (!base) return u;
  const normBase = base.endsWith("/") ? base : `${base}/`;
  return normBase + u.replace(/^\//, "");
}
