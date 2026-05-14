import { PRODUCTS } from "./data.js";
import { getFavorites, toggleFavorite } from "./favorites.js";
import { escapeHtml, formatPriceRub, getColorHex, getProductImageUrl, isValidEmail } from "./utils.js";
import { readJson, writeJson } from "./storage.js";

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function renderOrders() {
  const list = readJson("orders", []);
  const box = qs("#orders-list");
  const empty = qs("#orders-empty");
  if (!box || !empty) return;

  if (!list.length) {
    empty.classList.remove("hidden");
    box.innerHTML = "";
    return;
  }
  empty.classList.add("hidden");

  box.innerHTML = list
    .map((o) => {
      const date = new Date(o.createdAt).toLocaleString("ru-RU");
      return `
      <div class="border rounded-lg p-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="font-semibold">${escapeHtml(o.id)}</p>
            <p class="text-sm text-secondary">${escapeHtml(date)}</p>
          </div>
          <div class="font-bold">${formatPriceRub(o.total || 0)}</div>
        </div>
        <p class="text-sm text-secondary mt-2">Товаров: ${(o.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0)}</p>
      </div>`;
    })
    .join("");
}

function renderFavorites() {
  const ids = getFavorites();
  const box = qs("#fav-grid");
  const empty = qs("#fav-empty");
  if (!box || !empty) return;

  if (!ids.length) {
    empty.classList.remove("hidden");
    box.innerHTML = "";
    return;
  }
  empty.classList.add("hidden");

  const items = ids
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean);

  box.innerHTML = items
    .map((p) => {
      const colorName = p.colors?.[0] ?? "";
      const colorHex = getColorHex(colorName, "#e5e7eb");
      const imgUrl = getProductImageUrl(p, 0);
      const media = imgUrl
        ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.title)}" class="w-full h-40 object-cover bg-gray-100" loading="lazy" decoding="async">`
        : `<div class="w-full h-40 bg-gray-200" aria-hidden="true"></div>`;
      return `
      <div class="product-card bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg smooth-transition border">
        <a href="./product.html?id=${encodeURIComponent(p.id)}" class="block bg-gray-100">
          ${media}
        </a>
        <div class="p-4">
          <div class="flex items-start justify-between gap-3">
            <a href="./product.html?id=${encodeURIComponent(p.id)}" class="font-semibold hover:text-primary smooth-transition line-clamp-2">${escapeHtml(
        p.title
      )}</a>
            <button class="text-accent hover:text-orange-700 smooth-transition" data-unfav="${escapeHtml(
              p.id
            )}" aria-label="Убрать из избранного">
              <i class="fas fa-heart"></i>
            </button>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <span class="inline-flex items-center gap-2 text-xs text-secondary">
              <span class="inline-block w-3 h-3 rounded-full border" style="background:${escapeHtml(colorHex)}"></span>
              ${escapeHtml(colorName || "цвет")}
            </span>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <span class="font-bold">${formatPriceRub(p.price)}</span>
            <a href="./cart.html" class="text-sm text-primary hover:underline">В корзину</a>
          </div>
        </div>
      </div>`;
    })
    .join("");

}

function loadProfile() {
  const p = readJson("profile", { name: "", phone: "", email: "" });
  qs("#p-name").value = p.name || "";
  qs("#p-phone").value = p.phone || "";
  qs("#p-email").value = p.email || "";
}

function bindProfile() {
  const form = qs("#profile-form");
  const msg = qs("#profile-msg");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = qs("#p-name")?.value?.trim() ?? "";
    const phone = qs("#p-phone")?.value?.trim() ?? "";
    const email = qs("#p-email")?.value?.trim() ?? "";

    if (email && !isValidEmail(email)) {
      if (msg) {
        msg.textContent = "Введите корректный email.";
        msg.className = "text-sm pw-error-text";
      }
      return;
    }
    writeJson("profile", { name, phone, email });
    if (msg) {
      msg.textContent = "Сохранено.";
      msg.className = "text-sm pw-success-text";
      window.setTimeout(() => (msg.textContent = ""), 1200);
    }
  });
}

loadProfile();
bindProfile();
renderOrders();
renderFavorites();

const favBox = qs("#fav-grid");
favBox?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-unfav]");
  if (!btn) return;
  toggleFavorite(btn.getAttribute("data-unfav"));
  renderFavorites();
});

