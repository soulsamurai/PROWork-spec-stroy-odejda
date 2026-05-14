import { PRODUCTS } from "./data.js";
import { applyPromo, clearCart, getCart, removeCartItem, setCart, updateCartItem } from "./cart.js";
import { clamp, escapeHtml, formatPriceRub, getColorHex, getProductImageUrl } from "./utils.js";

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function findProduct(id) {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

function row(item, p) {
  const linePrice = (Number(p.price) || 0) * (Number(item.qty) || 0);
  const size = item.size ? `<p class="text-sm text-gray-500">Размер: ${escapeHtml(item.size)}</p>` : "";
  const colorName = p.colors?.[0] ?? "";
  const colorHex = getColorHex(colorName, "#e5e7eb");
  const imgUrl = getProductImageUrl(p, 0);
  const thumb = imgUrl
    ? `<img src="${escapeHtml(imgUrl)}" alt="" class="w-full h-full object-cover bg-gray-100" loading="lazy" decoding="async">`
    : `<div class="w-full h-full bg-gray-200" aria-hidden="true"></div>`;
  return `
  <div class="bg-white rounded-lg shadow-sm p-4 flex gap-4 items-start" data-item="${escapeHtml(
    item.productId
  )}" data-size="${escapeHtml(item.size ?? "")}">
    <a href="./product.html?id=${encodeURIComponent(item.productId)}" class="w-24 h-24 rounded overflow-hidden shrink-0 border bg-gray-100 block">
      ${thumb}
    </a>
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <a href="./product.html?id=${encodeURIComponent(item.productId)}" class="font-semibold hover:text-primary smooth-transition line-clamp-2">
            ${escapeHtml(p.title)}
          </a>
          ${size}
          <p class="text-xs text-secondary mt-1 inline-flex items-center gap-2">
            <span class="inline-block w-3 h-3 rounded-full border" style="background:${escapeHtml(colorHex)}"></span>
            ${escapeHtml(colorName || "цвет")}
          </p>
        </div>
        <button class="text-gray-400 hover:text-accent smooth-transition" data-remove aria-label="Удалить">
          <i class="far fa-trash-alt"></i>
        </button>
      </div>
      <div class="flex items-center justify-between mt-3 gap-3">
        <div class="flex items-center border rounded-lg overflow-hidden">
          <button class="px-3 py-2 text-gray-600 hover:bg-gray-100" data-dec aria-label="Уменьшить">-</button>
          <input
            class="w-14 text-center outline-none"
            inputmode="numeric"
            pattern="[0-9]*"
            value="${escapeHtml(String(item.qty))}"
            data-qty
            aria-label="Количество"
          />
          <button class="px-3 py-2 text-gray-600 hover:bg-gray-100" data-inc aria-label="Увеличить">+</button>
        </div>
        <div class="text-right">
          <p class="font-bold">${formatPriceRub(linePrice)}</p>
          <p class="text-xs text-secondary">${formatPriceRub(p.price)} / шт</p>
        </div>
      </div>
    </div>
  </div>`;
}

let promoState = { code: "", discount: 0, ok: false, message: "" };

function calcSubtotal(items) {
  return items.reduce((sum, it) => {
    const p = findProduct(it.productId);
    if (!p) return sum;
    return sum + (Number(p.price) || 0) * (Number(it.qty) || 0);
  }, 0);
}

function updateSummary(items) {
  const subtotal = calcSubtotal(items);
  const discount = promoState.ok ? clamp(promoState.discount, 0, subtotal) : 0;
  const total = Math.max(0, subtotal - discount);

  qs("#sum-subtotal").textContent = formatPriceRub(subtotal);
  qs("#sum-discount").textContent = discount ? `-${formatPriceRub(discount)}` : formatPriceRub(0);
  qs("#sum-total").textContent = formatPriceRub(total);

  const go = qs("#go-checkout");
  if (go) {
    go.classList.toggle("opacity-50", items.length === 0);
    go.classList.toggle("pointer-events-none", items.length === 0);
  }
}

function render() {
  const items = getCart();
  const box = qs("#cart-items");
  const empty = qs("#cart-empty");

  if (!items.length) {
    box.innerHTML = "";
    empty.classList.remove("hidden");
    updateSummary(items);
    return;
  }

  empty.classList.add("hidden");

  const html = items
    .map((it) => {
      const p = findProduct(it.productId);
      if (!p) return null;
      return row(it, p);
    })
    .filter(Boolean)
    .join("");

  box.innerHTML = html;
  updateSummary(items);
}

function bind() {
  const box = qs("#cart-items");

  box.addEventListener("click", (e) => {
    const wrap = e.target.closest("[data-item]");
    if (!wrap) return;
    const productId = wrap.getAttribute("data-item");
    const size = wrap.getAttribute("data-size") || "";

    const items = getCart();
    const item = items.find((x) => x.productId === productId && (x.size ?? "") === size);
    if (!item) return;

    if (e.target.closest("[data-remove]")) {
      removeCartItem(productId, size);
      return;
    }
    if (e.target.closest("[data-inc]")) {
      updateCartItem(productId, size, (Number(item.qty) || 1) + 1);
      return;
    }
    if (e.target.closest("[data-dec]")) {
      updateCartItem(productId, size, (Number(item.qty) || 1) - 1);
      return;
    }
  });

  box.addEventListener("change", (e) => {
    const input = e.target.closest("[data-qty]");
    if (!input) return;
    const wrap = input.closest("[data-item]");
    const productId = wrap.getAttribute("data-item");
    const size = wrap.getAttribute("data-size") || "";
    const qty = clamp(Number(input.value) || 1, 1, 99);
    input.value = String(qty);
    updateCartItem(productId, size, qty);
  });

  qs("#clear-cart")?.addEventListener("click", () => {
    promoState = { code: "", discount: 0, ok: false, message: "" };
    qs("#promo").value = "";
    qs("#promo-msg").textContent = "";
    clearCart();
  });

  qs("#promo-apply")?.addEventListener("click", () => {
    const code = qs("#promo")?.value ?? "";
    const subtotal = calcSubtotal(getCart());
    promoState = applyPromo(subtotal, code);
    const msg = qs("#promo-msg");
    if (msg) {
      msg.textContent = promoState.message;
      msg.classList.toggle("pw-success-text", promoState.ok);
      msg.classList.toggle("pw-error-text", !promoState.ok);
    }
    updateSummary(getCart());
  });

  window.addEventListener("prowork:cart-changed", render);
}

// Ensure legacy invalid qty is clamped on load
setCart(
  getCart().map((it) => ({
    ...it,
    qty: clamp(Number(it.qty) || 1, 1, 99),
  }))
);

bind();
render();

