import { clamp } from "./utils.js";
import { readJson, writeJson } from "./storage.js";

const CART_KEY = "cart";

/**
 * @typedef {{productId:string, qty:number, size?:string}} CartItem
 */

/** @returns {CartItem[]} */
export function getCart() {
  return readJson(CART_KEY, []);
}

/** @param {CartItem[]} items */
export function setCart(items) {
  writeJson(CART_KEY, items);
  window.dispatchEvent(new CustomEvent("prowork:cart-changed"));
}

export function getCartCount() {
  return getCart().reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
}

export function addToCart(productId, qty = 1, size) {
  const items = getCart();
  const normalizedQty = clamp(Number(qty) || 1, 1, 99);
  const keySize = size ? String(size) : "";
  const idx = items.findIndex((x) => x.productId === productId && (x.size ?? "") === keySize);
  if (idx >= 0) {
    items[idx].qty = clamp((Number(items[idx].qty) || 0) + normalizedQty, 1, 99);
  } else {
    items.push({ productId, qty: normalizedQty, ...(keySize ? { size: keySize } : {}) });
  }
  setCart(items);
}

export function updateCartItem(productId, size, qty) {
  const items = getCart();
  const keySize = size ? String(size) : "";
  const idx = items.findIndex((x) => x.productId === productId && (x.size ?? "") === keySize);
  if (idx < 0) return;
  const normalizedQty = clamp(Number(qty) || 1, 1, 99);
  items[idx].qty = normalizedQty;
  setCart(items);
}

export function removeCartItem(productId, size) {
  const keySize = size ? String(size) : "";
  const items = getCart().filter((x) => !(x.productId === productId && (x.size ?? "") === keySize));
  setCart(items);
}

export function clearCart() {
  setCart([]);
}

/**
 * @param {number} subtotal
 * @param {string} code
 */
export function applyPromo(subtotal, code) {
  const normalized = String(code ?? "")
    .trim()
    .toUpperCase();
  if (normalized === "SAVE10") {
    const discount = Math.round(subtotal * 0.1);
    return { ok: true, code: normalized, discount, message: "Промокод применён: -10%" };
  }
  return { ok: false, code: normalized, discount: 0, message: "Промокод не найден" };
}

