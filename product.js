import { getProductById, getCategoryName } from "./data.js";
import { addToCart } from "./cart.js";
import { isFavorite, toggleFavorite } from "./favorites.js";
import { escapeHtml, formatPriceRub, getColorHex, getProductImageUrl, getQueryParam } from "./utils.js";
import { readJson, writeJson } from "./storage.js";

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function renderStars(rating) {
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

function reviewsKey(productId) {
  return `reviews:${productId}`;
}

function getReviews(productId) {
  return readJson(reviewsKey(productId), []);
}

function addReview(productId, review) {
  const list = getReviews(productId);
  list.unshift(review);
  writeJson(reviewsKey(productId), list.slice(0, 50));
}

function reviewItem(r) {
  return `
  <div class="border rounded-lg p-4">
    <div class="flex items-center justify-between gap-4 mb-2">
      <div class="min-w-0">
        <p class="font-semibold">${escapeHtml(r.name || "Гость")}</p>
        <p class="text-xs text-secondary">${escapeHtml(r.date)}</p>
      </div>
      <div class="shrink-0">${renderStars(Number(r.rating) || 0)}</div>
    </div>
    <p class="text-secondary">${escapeHtml(r.text || "")}</p>
  </div>`;
}

function calcRating(baseRating, baseCount, extraReviews) {
  const extras = extraReviews.map((x) => Number(x.rating) || 0).filter((x) => x > 0);
  if (!extras.length) return { rating: baseRating, count: baseCount };
  const baseSum = (Number(baseRating) || 0) * (Number(baseCount) || 0);
  const extraSum = extras.reduce((a, b) => a + b, 0);
  const totalCount = (Number(baseCount) || 0) + extras.length;
  const totalRating = totalCount ? (baseSum + extraSum) / totalCount : baseRating;
  return { rating: totalRating, count: totalCount };
}

function renderProduct(p) {
  const breadcrumb = qs("#breadcrumb-title");
  if (breadcrumb) breadcrumb.textContent = p.title;

  document.title = `${p.title} — PROWork`;

  const fav = isFavorite(p.id);
  const favIcon = fav ? "fas fa-heart text-accent" : "far fa-heart";

  const extraReviews = getReviews(p.id);
  const ratingAgg = calcRating(p.rating, p.reviewCount, extraReviews);

  const old = p.oldPrice
    ? `<span class="text-gray-500 text-sm line-through ml-2">${formatPriceRub(p.oldPrice)}</span>`
    : "";

  const colorName = p.colors?.[0] ?? "";
  const colorHex = getColorHex(colorName, p.categoryId === "ppe" ? "#fef3c7" : "#e5e7eb");

  const imgs = Array.isArray(p.images) && p.images.length ? p.images : [];
  const resolved = imgs.map((_, i) => getProductImageUrl(p, i)).filter(Boolean);
  const mainSrc = resolved[0] ?? "";
  const mainMedia = mainSrc
    ? `<img id="product-main-img" src="${escapeHtml(mainSrc)}" alt="${escapeHtml(
        p.title
      )}" class="w-full h-96 object-cover" loading="eager" decoding="async">`
    : `<div id="product-main-img" class="w-full h-96 bg-gray-200 flex items-center justify-center text-secondary text-sm">Нет фото</div>`;

  const thumbs =
    resolved.length > 1
      ? `<div class="grid grid-cols-4 gap-3 mt-3">
        ${resolved
          .slice(0, 4)
          .map(
            (src) => `
          <button type="button" class="rounded-lg overflow-hidden border hover:border-primary smooth-transition h-20 bg-gray-100" data-thumb="${escapeHtml(
            src
          )}">
            <img src="${escapeHtml(src)}" alt="" class="w-full h-full object-cover">
          </button>`
          )
          .join("")}
      </div>`
      : "";

  const sizes = (p.sizes || [])
    .map(
      (s, idx) => `
    <label class="inline-flex items-center gap-2 border rounded-full px-3 py-1 cursor-pointer hover:border-primary smooth-transition">
      <input ${idx === 0 ? "checked" : ""} type="radio" name="size" value="${escapeHtml(
        String(s)
      )}" class="accent-orange-500">
      <span class="text-sm">${escapeHtml(String(s))}</span>
    </label>`
    )
    .join("");

  const features = (p.features || [])
    .map((x) => `<li class="flex gap-2"><i class="fas fa-check text-accent mt-1"></i><span>${escapeHtml(x)}</span></li>`)
    .join("");

  const specsRows = Object.entries(p.specs || {})
    .map(
      ([k, v]) => `
    <tr class="border-b">
      <td class="py-3 pr-4 text-secondary">${escapeHtml(k)}</td>
      <td class="py-3 font-semibold">${escapeHtml(v)}</td>
    </tr>`
    )
    .join("");

  const care = (p.care || []).map((x) => `<li class="text-secondary">• ${escapeHtml(x)}</li>`).join("");

  const extraReviewsHtml = extraReviews.length
    ? extraReviews.map(reviewItem).join("")
    : `<p class="text-secondary">Пока нет отзывов. Будьте первым!</p>`;

  return `
  <div class="mb-4">
    <h1 class="text-3xl font-bold">${escapeHtml(p.title)}</h1>
    <p class="text-secondary mt-1">Категория: ${escapeHtml(getCategoryName(p.categoryId))} · Артикул: ${escapeHtml(
    p.sku
  )}</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div>
      <div class="rounded-lg overflow-hidden border bg-gray-100">
        ${mainMedia}
      </div>
      ${thumbs}
      <div class="mt-3 flex items-center gap-2 text-sm text-secondary">
        <span class="inline-block w-4 h-4 rounded-full border" style="background:${escapeHtml(colorHex)}"></span>
        <span>${escapeHtml(colorName || "цвет")}</span>
      </div>
    </div>

    <div>
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          ${renderStars(ratingAgg.rating)}
          <span class="text-sm text-secondary">${ratingAgg.rating.toFixed(1)} (${ratingAgg.count})</span>
        </div>
        <button class="text-gray-400 hover:text-accent smooth-transition" data-fav="${escapeHtml(
          p.id
        )}" aria-label="Избранное">
          <i class="${favIcon}"></i>
        </button>
      </div>

      <p class="text-secondary mb-4">${escapeHtml(p.shortDescription)}</p>

      <div class="flex items-baseline gap-2 mb-5">
        <span class="text-3xl font-bold">${formatPriceRub(p.price)}</span>
        ${old}
      </div>

      <div class="mb-5">
        <p class="text-sm font-semibold mb-2">Выберите размер</p>
        <div class="flex flex-wrap gap-2">${sizes}</div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <button
          id="add-to-cart"
          class="bg-accent hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-full smooth-transition"
        >
          В корзину
        </button>
        <a
          href="./cart.html"
          class="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-full text-center smooth-transition"
        >
          Перейти в корзину
        </a>
      </div>

      <div class="mt-6 bg-gray-50 rounded-lg p-4">
        <p class="font-semibold mb-2">Преимущества</p>
        <ul class="space-y-2">${features}</ul>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
    <section class="lg:col-span-2">
      <h2 class="text-2xl font-bold mb-3">Описание</h2>
      <p class="text-secondary leading-relaxed">${escapeHtml(p.description)}</p>

      <h2 class="text-2xl font-bold mt-8 mb-3">Характеристики</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <tbody>
            ${specsRows}
          </tbody>
        </table>
      </div>

      <h2 class="text-2xl font-bold mt-8 mb-3">Инструкция по уходу</h2>
      <ul class="space-y-1">${care}</ul>
    </section>

    <aside>
      <div class="border rounded-lg p-4">
        <h2 class="text-xl font-bold mb-3">Отзывы</h2>
        <div id="reviews-list" class="space-y-3">
          ${extraReviewsHtml}
        </div>

        <div class="mt-6 pt-4 border-t">
          <h3 class="font-semibold mb-3">Добавить отзыв</h3>
          <form id="review-form" class="space-y-3">
            <div>
              <label class="block text-sm mb-1" for="r-name">Имя</label>
              <input id="r-name" class="w-full px-3 py-2 border rounded-lg" placeholder="Иван" />
            </div>
            <div>
              <label class="block text-sm mb-1" for="r-rating">Оценка</label>
              <select id="r-rating" class="w-full px-3 py-2 border rounded-lg bg-white">
                <option value="5">5 — отлично</option>
                <option value="4">4 — хорошо</option>
                <option value="3">3 — нормально</option>
                <option value="2">2 — плохо</option>
                <option value="1">1 — ужасно</option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1" for="r-text">Текст</label>
              <textarea id="r-text" class="w-full px-3 py-2 border rounded-lg" rows="3" placeholder="Ваш опыт использования"></textarea>
              <p id="r-error" class="text-sm pw-error-text mt-1"></p>
            </div>
            <button type="submit" class="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg smooth-transition">
              Отправить
            </button>
          </form>
        </div>
      </div>
    </aside>
  </div>
  `;
}

function init() {
  const id = getQueryParam("id");
  const root = qs("#product-root");
  if (!root) return;

  const p = id ? getProductById(id) : null;
  if (!p) {
    root.innerHTML = `
    <div class="text-center p-8">
      <h1 class="text-2xl font-bold mb-2">Товар не найден</h1>
      <p class="text-secondary mb-6">Проверьте ссылку или вернитесь в каталог.</p>
      <a href="./catalog.html" class="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-full inline-block smooth-transition">
        В каталог
      </a>
    </div>`;
    return;
  }

  root.innerHTML = renderProduct(p);

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-thumb]");
    if (!btn) return;
    const src = btn.getAttribute("data-thumb");
    const main = root.querySelector("#product-main-img");
    if (main && main.tagName === "IMG" && src) {
      main.src = src;
    }
  });

  // favorite
  root.addEventListener("click", (e) => {
    const favBtn = e.target.closest("[data-fav]");
    if (!favBtn) return;
    toggleFavorite(p.id);
    const icon = favBtn.querySelector("i");
    if (icon) icon.className = isFavorite(p.id) ? "fas fa-heart text-accent" : "far fa-heart";
  });

  // add to cart
  const addBtn = qs("#add-to-cart", root);
  addBtn?.addEventListener("click", () => {
    const size = root.querySelector('input[name="size"]:checked')?.value;
    addToCart(p.id, 1, size);
    addBtn.textContent = "Добавлено";
    window.setTimeout(() => (addBtn.textContent = "В корзину"), 900);
  });

  // reviews
  const form = qs("#review-form", root);
  const error = qs("#r-error", root);
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = qs("#r-name", root)?.value?.trim() ?? "";
    const rating = Number(qs("#r-rating", root)?.value ?? "5");
    const text = qs("#r-text", root)?.value?.trim() ?? "";
    if (text.length < 10) {
      if (error) error.textContent = "Отзыв должен быть не короче 10 символов.";
      return;
    }
    if (error) error.textContent = "";
    addReview(p.id, {
      name: name || "Гость",
      rating: Math.max(1, Math.min(5, rating)),
      text,
      date: new Date().toLocaleDateString("ru-RU"),
    });
    // re-render only reviews list
    const list = qs("#reviews-list", root);
    const reviews = getReviews(p.id);
    if (list) list.innerHTML = reviews.map(reviewItem).join("");
    form.reset();
  });
}

init();

