import { readJson, writeJson } from "./storage.js";

const FAV_KEY = "favorites";

/** @returns {string[]} */
export function getFavorites() {
  return readJson(FAV_KEY, []);
}

/** @param {string[]} ids */
export function setFavorites(ids) {
  writeJson(FAV_KEY, Array.from(new Set(ids)));
  window.dispatchEvent(new CustomEvent("prowork:favorites-changed"));
}

export function isFavorite(productId) {
  return getFavorites().includes(productId);
}

export function toggleFavorite(productId) {
  const ids = getFavorites();
  if (ids.includes(productId)) setFavorites(ids.filter((x) => x !== productId));
  else setFavorites([...ids, productId]);
}

