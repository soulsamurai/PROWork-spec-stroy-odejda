import { PRODUCTS, SIZES } from "./data.js";
import { addToCart } from "./cart.js";
import { isFavorite, toggleFavorite } from "./favorites.js";
import {
  clamp,
  debounce,
  escapeHtml,
  formatPriceRub,
  getColorHex,
  getProductImageUrl,
  getQueryParam,
  setQueryParams,
} from "./utils.js";

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function initSizes() {
  const box = qs("#sizes-box");
  if (!box) return;
  // Mix sizes from PRODUCTS to cover numeric too
  const all = Array.from(
    new Set(
      PRODUCTS.flatMap((p) => p.sizes || []).concat(SIZES).map((s) => String(s))
    )
  ).slice(0, 12);

  box.innerHTML = all
    .map(
      (s) => `
    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" class="accent-orange-500" value="${escapeHtml(s)}" data-filter-size>
      <span>${escapeHtml(s)}</span>
    </label>`
    )
    .join("");
}

function stars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = Math.max(0, 5 - full - half);
  return (
    '<div class="flex text-yellow-400 text-sm">' +
    '<i class="fas fa-star"></i>'.repeat(full) +
    (half ? '<i class="fas fa-star-half-alt"></i>' : "") +
    '<i class="far fa-star"></i>'.repeat(empty) +
    "</div>"
  );
}

function card(p) {
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
  <div class="product-card bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg smooth-transition">
    <a href="./product.html?id=${encodeURIComponent(p.id)}" class="block relative bg-gray-100">
      ${media}
      ${badge}
    </a>
    <div class="p-4">
      <div class="flex justify-between items-start mb-2 gap-3">
        <a href="./product.html?id=${encodeURIComponent(p.id)}" class="font-semibold hover:text-primary smooth-transition line-clamp-2">${escapeHtml(
    p.title
  )}</a>
        <button class="text-gray-400 hover:text-accent smooth-transition" data-fav="${escapeHtml(
          p.id
        )}" aria-label="Избранное">
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

function readState() {
  const q = qs("#filter-q")?.value?.trim() ?? "";
  const cats = qsa("[data-filter-cat]:checked").map((x) => x.value);
  const sizes = qsa("[data-filter-size]:checked").map((x) => x.value);

  const min = Number(qs("#price-min")?.value ?? "");
  const max = Number(qs("#price-max")?.value ?? "");
  const sort = qs("#sort")?.value ?? "popular";
  return {
    q,
    cats,
    sizes,
    priceMin: Number.isFinite(min) ? min : null,
    priceMax: Number.isFinite(max) ? max : null,
    sort,
  };
}

function applyFromQuery() {
  const q = getQueryParam("q") ?? "";
  const cat = getQueryParam("cat");
  const sort = getQueryParam("sort");
  const pmin = getQueryParam("min");
  const pmax = getQueryParam("max");
  const size = getQueryParam("size");

  const qInput = qs("#filter-q");
  if (qInput) qInput.value = q;

  if (cat) {
    qsa("[data-filter-cat]").forEach((cb) => {
      cb.checked = cb.value === cat;
    });
  }
  if (size) {
    qsa("[data-filter-size]").forEach((cb) => {
      cb.checked = cb.value === size;
    });
  }
  if (sort && qs("#sort")) {
    // map special values to internal
    const s = sort === "discount" ? "popular" : sort;
    qs("#sort").value = s;
  }
  if (pmin && qs("#price-min")) qs("#price-min").value = String(Number(pmin) || "");
  if (pmax && qs("#price-max")) qs("#price-max").value = String(Number(pmax) || "");
}

function normalizePriceInputs() {
  const minEl = qs("#price-min");
  const maxEl = qs("#price-max");
  const rangeEl = qs("#price-range");
  if (!minEl || !maxEl || !rangeEl) return;

  const allPrices = PRODUCTS.map((p) => p.price);
  const minPrice = Math.min(...allPrices, 0);
  const maxPrice = Math.max(...allPrices, 10000);
  rangeEl.min = String(minPrice);
  rangeEl.max = String(maxPrice);
  rangeEl.value = String(maxPrice);

  // if query max is set, sync range
  const qMax = Number(maxEl.value);
  if (Number.isFinite(qMax) && qMax > 0) {
    rangeEl.value = String(clamp(qMax, minPrice, maxPrice));
  } else {
    maxEl.value = String(maxPrice);
  }
  if (!minEl.value) minEl.value = String(minPrice);
}

function filterProducts(state) {
  const q = state.q.toLowerCase();
  return PRODUCTS.filter((p) => {
    if (q && !p.title.toLowerCase().includes(q)) return false;
    if (state.cats.length && !state.cats.includes(p.categoryId)) return false;
    if (state.sizes.length) {
      const has = (p.sizes || []).some((s) => state.sizes.includes(String(s)));
      if (!has) return false;
    }
    if (state.priceMin !== null && p.price < state.priceMin) return false;
    if (state.priceMax !== null && p.price > state.priceMax) return false;
    return true;
  });
}

function sortProducts(items, sort) {
  const list = [...items];
  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
  else list.sort((a, b) => b.popularity - a.popularity);
  return list;
}

function render() {
  const state = readState();
  const filtered = sortProducts(filterProducts(state), state.sort);

  setQueryParams({
    q: state.q || null,
    cat: state.cats.length === 1 ? state.cats[0] : null,
    size: state.sizes.length === 1 ? state.sizes[0] : null,
    min: state.priceMin ?? null,
    max: state.priceMax ?? null,
    sort: state.sort !== "popular" ? state.sort : null,
  });

  const grid = qs("#catalog-grid");
  const count = qs("#result-count");
  const empty = qs("#empty-state");

  if (count) count.textContent = String(filtered.length);
  if (!grid) return;
  grid.innerHTML = filtered.map(card).join("");

  const isEmpty = filtered.length === 0;
  empty?.classList.toggle("hidden", !isEmpty);
}

function resetFilters() {
  qs("#filter-q") && (qs("#filter-q").value = "");
  qsa("[data-filter-cat]").forEach((cb) => (cb.checked = false));
  qsa("[data-filter-size]").forEach((cb) => (cb.checked = false));
  normalizePriceInputs();
  const sort = qs("#sort");
  if (sort) sort.value = "popular";
  render();
}

function bind() {
  const onChange = debounce(render, 150);
  qs("#filter-q")?.addEventListener("input", onChange);
  qsa("[data-filter-cat]").forEach((cb) => cb.addEventListener("change", onChange));
  document.addEventListener("change", (e) => {
    if (e.target?.matches?.("[data-filter-size]")) onChange();
  });
  qs("#price-min")?.addEventListener("input", onChange);
  qs("#price-max")?.addEventListener("input", onChange);
  qs("#sort")?.addEventListener("change", onChange);

  const range = qs("#price-range");
  const maxEl = qs("#price-max");
  range?.addEventListener(
    "input",
    debounce(() => {
      if (maxEl) maxEl.value = String(range.value);
      render();
    }, 50)
  );

  qs("#filters-reset")?.addEventListener("click", resetFilters);
  qs("#empty-reset")?.addEventListener("click", resetFilters);
}

function bindCardActions() {
  const grid = qs("#catalog-grid");
  if (!grid) return;
  grid.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add-cart]");
    if (addBtn) {
      addToCart(addBtn.getAttribute("data-add-cart"), 1);
      return;
    }
    const favBtn = e.target.closest("[data-fav]");
    if (favBtn) {
      const id = favBtn.getAttribute("data-fav");
      toggleFavorite(id);
      const icon = favBtn.querySelector("i");
      if (icon) icon.className = isFavorite(id) ? "fas fa-heart text-accent" : "far fa-heart";
    }
  });
}

initSizes();
applyFromQuery();
normalizePriceInputs();
bind();
bindCardActions();
render();

