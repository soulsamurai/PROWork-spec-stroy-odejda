import { PRODUCTS } from "./data.js";
import { clearCart, getCart } from "./cart.js";
import { isValidEmail, formatPriceRub } from "./utils.js";
import { writeJson } from "./storage.js";

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function setErr(key, text) {
  const el = qs(`[data-err="${key}"]`);
  if (el) el.textContent = text || "";
}

function setFieldError(fieldId, hasError) {
  const el = qs(`#${fieldId}`);
  if (!el) return;
  el.classList.toggle("pw-field-error", !!hasError);
}

function findProduct(id) {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

function calcTotal(items) {
  return items.reduce((sum, it) => {
    const p = findProduct(it.productId);
    if (!p) return sum;
    return sum + (Number(p.price) || 0) * (Number(it.qty) || 0);
  }, 0);
}

function renderMini() {
  const box = qs("#order-mini");
  const totalEl = qs("#order-total");
  const items = getCart();

  if (!items.length) {
    box.innerHTML = `<p class="text-secondary">Корзина пуста. <a class="text-primary hover:underline" href="./catalog.html">В каталог</a></p>`;
    totalEl.textContent = formatPriceRub(0);
    return;
  }

  box.innerHTML = items
    .map((it) => {
      const p = findProduct(it.productId);
      if (!p) return "";
      const size = it.size ? ` · ${it.size}` : "";
      return `
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="font-semibold line-clamp-1">${p.title}</p>
          <p class="text-xs text-secondary">${it.qty} шт${size}</p>
        </div>
        <div class="shrink-0 font-semibold">${formatPriceRub((Number(p.price) || 0) * (Number(it.qty) || 0))}</div>
      </div>`;
    })
    .join("");

  totalEl.textContent = formatPriceRub(calcTotal(items));
}

function validate() {
  const name = qs("#name")?.value?.trim() ?? "";
  const phone = qs("#phone")?.value?.trim() ?? "";
  const email = qs("#email")?.value?.trim() ?? "";
  const city = qs("#city")?.value?.trim() ?? "";
  const address = qs("#address")?.value?.trim() ?? "";
  const zip = qs("#zip")?.value?.trim() ?? "";
  const agree = !!qs("#agree")?.checked;

  let ok = true;
  const clear = () => {
    ["name", "phone", "email", "city", "address", "zip", "agree"].forEach((k) => setErr(k, ""));
    ["name", "phone", "email", "city", "address", "zip"].forEach((id) => setFieldError(id, false));
  };
  clear();

  if (name.length < 2) {
    setErr("name", "Введите имя (минимум 2 символа).");
    setFieldError("name", true);
    ok = false;
  }
  if (phone.replace(/\D/g, "").length < 10) {
    setErr("phone", "Введите корректный номер телефона.");
    setFieldError("phone", true);
    ok = false;
  }
  if (!isValidEmail(email)) {
    setErr("email", "Введите корректный email.");
    setFieldError("email", true);
    ok = false;
  }
  if (city.length < 2) {
    setErr("city", "Укажите город.");
    setFieldError("city", true);
    ok = false;
  }
  if (address.length < 6) {
    setErr("address", "Укажите адрес (улица, дом, квартира).");
    setFieldError("address", true);
    ok = false;
  }
  if (zip.replace(/\D/g, "").length < 5) {
    setErr("zip", "Укажите индекс.");
    setFieldError("zip", true);
    ok = false;
  }
  if (!agree) {
    setErr("agree", "Нужно согласие, чтобы продолжить.");
    ok = false;
  }

  if (!getCart().length) ok = false;

  return {
    ok,
    data: {
      name,
      phone,
      email,
      city,
      address,
      zip,
      comment: qs("#comment")?.value?.trim() ?? "",
      delivery: qs('input[name="delivery"]:checked')?.value ?? "courier",
      payment: qs('input[name="payment"]:checked')?.value ?? "card",
    },
  };
}

function saveOrder(payload) {
  const order = {
    id: `ORD-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  // store simple order history
  const key = "orders";
  const raw = localStorage.getItem("prowork:" + key);
  const list = raw ? JSON.parse(raw) : [];
  list.unshift(order);
  writeJson(key, list.slice(0, 20));
  return order;
}

function bind() {
  const form = qs("#checkout-form");
  const msg = qs("#checkout-msg");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const { ok, data } = validate();
    if (!ok) {
      if (msg) {
        msg.textContent = "Проверьте поля формы и убедитесь, что корзина не пуста.";
        msg.className = "text-sm mt-3 pw-error-text";
      }
      return;
    }

    const items = getCart();
    const total = calcTotal(items);
    const order = saveOrder({ customer: data, items, total });
    clearCart();
    if (msg) {
      msg.textContent = `Заказ ${order.id} оформлен! Мы свяжемся с вами для подтверждения.`;
      msg.className = "text-sm mt-3 pw-success-text";
    }
    form.reset();
    renderMini();
  });
}

renderMini();
bind();

