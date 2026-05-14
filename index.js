import { PRODUCTS, getCategoryName } from "./data.js";
import { addToCart } from "./cart.js";
import { toggleFavorite, isFavorite } from "./favorites.js";
import { escapeHtml, formatPriceRub, getColorHex, getProductImageUrl } from "./utils.js";

function stars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = Math.max(0, 5 - full - half);
  return (
    '<div class="flex text-yellow-400">' +
    '<i class="fas fa-star"></i>'.repeat(full) +
    (half ? '<i class="fas fa-star-half-alt"></i>' : "") +
    '<i class="far fa-star"></i>'.repeat(empty) +
    "</div>"
  );
}

function renderCard(p) {
  const badge = p.badges?.[0]
    ? `<div class="absolute top-2 right-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded">${escapeHtml(
        p.badges[0]
      )}</div>`
    : "";
  const old = p.oldPrice
    ? `<span class="text-gray-500 text-sm line-through ml-2">${formatPriceRub(p.oldPrice)}</span>`
    : "";
  const favIcon = isFavorite(p.id) ? "fas fa-heart text-accent" : "far fa-heart";
  const colorName = p.colors?.[0] ?? "";
  const colorHex = getColorHex(colorName, "#e5e7eb");
  const imgUrl = getProductImageUrl(p, 0);
  const media = imgUrl
    ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.title)}" class="w-full h-48 object-cover bg-gray-100" loading="lazy" decoding="async">`
    : `<div class="w-full h-48 bg-gray-200" aria-hidden="true"></div>`;
  return `
  <div class="product-card bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg smooth-transition" data-product-card="${escapeHtml(
    p.id
  )}">
    <a href="./product.html?id=${encodeURIComponent(p.id)}" class="block relative bg-gray-100">
      ${media}
      ${badge}
    </a>
    <div class="p-4">
      <div class="flex justify-between items-start mb-2 gap-3">
        <div class="min-w-0">
          <a href="./product.html?id=${encodeURIComponent(p.id)}" class="font-semibold hover:text-primary smooth-transition line-clamp-2">${escapeHtml(
    p.title
  )}</a>
          <p class="text-xs text-gray-500 mt-1">${escapeHtml(getCategoryName(p.categoryId))}</p>
        </div>
        <button class="text-gray-400 hover:text-accent smooth-transition" data-fav="${escapeHtml(
          p.id
        )}" aria-label="Добавить в избранное">
          <i class="${favIcon}"></i>
        </button>
      </div>
      <div class="flex items-center gap-2 mb-2">
        <span class="inline-flex items-center gap-2 text-xs text-secondary">
          <span class="inline-block w-3 h-3 rounded-full border" style="background:${escapeHtml(colorHex)}"></span>
          ${escapeHtml(colorName || "цвет")}
        </span>
      </div>
      <div class="flex items-center mb-2">
        ${stars(p.rating)}
        <span class="text-gray-500 text-sm ml-2">(${Number(p.reviewCount) || 0})</span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <span class="text-lg font-bold">${formatPriceRub(p.price)}</span>
          ${old}
        </div>
        <button class="bg-primary hover:bg-primary-dark text-white rounded-full w-10 h-10 flex items-center justify-center smooth-transition" data-add-cart="${escapeHtml(
          p.id
        )}" aria-label="Добавить в корзину">
          <i class="fas fa-shopping-cart"></i>
        </button>
      </div>
    </div>
  </div>`;
}

function initFeatured() {
  const root = document.getElementById("featured-products");
  if (!root) return;
  const featured = [...PRODUCTS].sort((a, b) => b.popularity - a.popularity).slice(0, 4);
  root.innerHTML = featured.map(renderCard).join("");

  root.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add-cart]");
    if (addBtn) {
      const id = addBtn.getAttribute("data-add-cart");
      addToCart(id, 1);
      return;
    }
    const favBtn = e.target.closest("[data-fav]");
    if (favBtn) {
      const id = favBtn.getAttribute("data-fav");
      toggleFavorite(id);
      const icon = favBtn.querySelector("i");
      if (icon) {
        icon.className = isFavorite(id) ? "fas fa-heart text-accent" : "far fa-heart";
      }
    }
  });
}

initFeatured();

