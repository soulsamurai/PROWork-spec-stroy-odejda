import { getCart, getCartCount, removeCartItem, updateCartItem } from "./cart.js";
import { PRODUCTS } from "./data.js";
import { debounce, escapeHtml, formatPriceRub, getColorHex, getProductImageUrl, isValidEmail } from "./utils.js";

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function setText(el, value) {
  if (!el) return;
  el.textContent = String(value);
}

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

function initMobileMenu() {
  const btn = qs("#mobile-menu-button");
  const menu = qs("#mobile-menu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });
}

function initActiveNav() {
  const page = document.body?.dataset?.page ?? "";
  if (!page) return;
  qsa('[data-nav]').forEach((a) => {
    const key = a.getAttribute("data-nav");
    if (key === page) {
      a.classList.add("text-accent");
      a.setAttribute("aria-current", "page");
    }
  });
}

function initCartBadge() {
  const update = () => {
    const count = getCartCount();
    qsa("[data-cart-count]").forEach((el) => {
      if (count > 0) {
        el.classList.remove("hidden");
        setText(el, count);
      } else {
        el.classList.add("hidden");
        setText(el, "");
      }
    });
  };
  update();
  window.addEventListener("prowork:cart-changed", update);
}

function initLoginModal() {
  const openBtns = qsa('[data-open-login]');
  const modal = qs("#login-modal");
  if (!openBtns.length || !modal) return;

  const closeBtn = qs("#close-login", modal);
  openBtns.forEach((openBtn) => {
    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(modal);
    });
  });
  closeBtn?.addEventListener("click", () => closeModal(modal));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal(modal);
  });
}

function initCartQuickModal() {
  const openBtns = qsa('[data-open-cart]');
  const modal = qs("#cart-modal");
  if (!openBtns.length || !modal) return;
  const closeBtn = qs("#close-cart", modal);
  const body = qs("[data-quick-cart-body]", modal);

  const findProduct = (id) => PRODUCTS.find((p) => p.id === id) ?? null;
  const subtotal = (items) =>
    items.reduce((sum, it) => {
      const p = findProduct(it.productId);
      if (!p) return sum;
      return sum + (Number(p.price) || 0) * (Number(it.qty) || 0);
    }, 0);

  const renderQuick = () => {
    if (!body) return;
    const items = getCart();
    const title = qs("h3", modal);
    if (title) title.textContent = `Корзина (${items.reduce((a, b) => a + (Number(b.qty) || 0), 0)})`;

    if (!items.length) {
      body.innerHTML = `
        <div class="text-center py-6">
          <p class="text-secondary mb-4">Корзина пуста</p>
          <a href="./catalog.html" class="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg smooth-transition">Перейти в каталог</a>
        </div>`;
      return;
    }

    const rows = items
      .map((it) => {
        const p = findProduct(it.productId);
        if (!p) return "";
        const line = (Number(p.price) || 0) * (Number(it.qty) || 0);
        const colorName = p.colors?.[0] ?? "";
        const colorHex = getColorHex(colorName, "#e5e7eb");
        const imgUrl = getProductImageUrl(p, 0);
        const thumb = imgUrl
          ? `<img src="${escapeHtml(imgUrl)}" alt="" class="w-full h-full object-cover bg-gray-100" loading="lazy" decoding="async">`
          : `<div class="w-full h-full bg-gray-200" aria-hidden="true"></div>`;
        return `
        <div class="flex py-4 border-b" data-q-item="${it.productId}" data-q-size="${it.size ?? ""}">
          <a href="./product.html?id=${encodeURIComponent(it.productId)}" class="w-20 h-20 rounded border overflow-hidden shrink-0 bg-gray-100 block">
            ${thumb}
          </a>
          <div class="ml-3 flex-grow min-w-0">
            <a href="./product.html?id=${encodeURIComponent(it.productId)}" class="font-semibold hover:text-primary line-clamp-2 smooth-transition">${escapeHtml(
              p.title
            )}</a>
            <p class="text-sm text-gray-500">${it.size ? `Размер: ${it.size}` : "Размер: универсальный"}</p>
            <div class="flex justify-between items-center mt-2 gap-3">
              <div class="flex items-center border rounded">
                <button class="px-2 py-1 text-gray-500 hover:bg-gray-100" data-q-dec>-</button>
                <span class="px-2">${it.qty}</span>
                <button class="px-2 py-1 text-gray-500 hover:bg-gray-100" data-q-inc>+</button>
              </div>
              <div class="font-bold">${formatPriceRub(line)}</div>
            </div>
          </div>
          <button class="text-gray-400 hover:text-accent ml-2" data-q-remove aria-label="Удалить"><i class="far fa-trash-alt"></i></button>
        </div>`;
      })
      .join("");

    const sum = subtotal(items);
    body.innerHTML = `
      ${rows}
      <div class="mt-4">
        <div class="flex justify-between mb-2">
          <span>Товары</span>
          <span>${formatPriceRub(sum)}</span>
        </div>
        <div class="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
          <span>Итого</span>
          <span>${formatPriceRub(sum)}</span>
        </div>
        <div class="mt-4 grid grid-cols-1 gap-2">
          <a href="./cart.html" class="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded text-center smooth-transition">Открыть корзину</a>
          <a href="./checkout.html" class="w-full bg-accent hover:bg-orange-700 text-white font-bold py-3 rounded text-center smooth-transition">Оформить заказ</a>
        </div>
      </div>`;
  };

  openBtns.forEach((openBtn) => {
    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      renderQuick();
      openModal(modal);
    });
  });
  closeBtn?.addEventListener("click", () => closeModal(modal));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal(modal);
  });

  modal.addEventListener("click", (e) => {
    const wrap = e.target.closest("[data-q-item]");
    if (!wrap) return;
    const productId = wrap.getAttribute("data-q-item");
    const size = wrap.getAttribute("data-q-size") || "";
    const item = getCart().find((x) => x.productId === productId && (x.size ?? "") === size);
    if (!item) return;

    if (e.target.closest("[data-q-remove]")) {
      removeCartItem(productId, size);
      renderQuick();
      return;
    }
    if (e.target.closest("[data-q-inc]")) {
      updateCartItem(productId, size, Number(item.qty || 1) + 1);
      renderQuick();
      return;
    }
    if (e.target.closest("[data-q-dec]")) {
      updateCartItem(productId, size, Math.max(1, Number(item.qty || 1) - 1));
      renderQuick();
    }
  });

  window.addEventListener("prowork:cart-changed", renderQuick);
}

function initGlobalSearch() {
  const inputs = qsa("[data-site-search]");
  if (!inputs.length) return;

  const go = (value) => {
    const q = String(value ?? "").trim();
    const url = new URL("catalog.html", window.location.href);
    if (q) url.searchParams.set("q", q);
    window.location.href = url.toString();
  };

  inputs.forEach((input) => {
    const form = input.closest("form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        go(input.value);
      });
    } else {
      input.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Enter") go(input.value);
        },
        { passive: true }
      );
    }
  });
}

function initPageTransitions() {
  // Add a subtle fade-out on internal navigation (non-SPA).
  const isInternal = (a) => {
    try {
      const url = new URL(a.href, window.location.href);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  };

  document.addEventListener("click", (e) => {
    const a = e.target?.closest?.("a");
    if (!a) return;
    if (a.target && a.target !== "_self") return;
    if (a.hasAttribute("download")) return;
    if (a.getAttribute("href")?.startsWith("#")) return;
    if (!a.href) return;
    if (!isInternal(a)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // allow normal navigation, but fade body
    document.body.classList.add("pw-navigate-away");
  });
}

function initNewsletterValidation() {
  const form = qs("[data-newsletter-form]");
  if (!form) return;
  const input = qs('input[type="email"]', form);
  const msg = qs("[data-newsletter-msg]", form);

  const setMsg = (text, ok) => {
    if (!msg) return;
    msg.textContent = text;
    msg.classList.toggle("pw-success-text", !!ok);
    msg.classList.toggle("pw-error-text", !ok);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = input?.value ?? "";
    if (!isValidEmail(email)) {
      input?.classList.add("pw-field-error");
      setMsg("Введите корректный email.", false);
      input?.focus();
      return;
    }
    input?.classList.remove("pw-field-error");
    setMsg("Спасибо! Вы подписаны на рассылку.", true);
    form.reset();
  });

  input?.addEventListener(
    "input",
    debounce(() => {
      input.classList.remove("pw-field-error");
      if (msg) msg.textContent = "";
    }, 150)
  );
}

export function initCommon() {
  initMobileMenu();
  initActiveNav();
  initCartBadge();
  initLoginModal();
  initCartQuickModal();
  initGlobalSearch();
  initPageTransitions();
  initNewsletterValidation();
}

initCommon();

