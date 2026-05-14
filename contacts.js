import { isValidEmail } from "./utils.js";

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function setErr(key, text) {
  const el = qs(`[data-err="${key}"]`);
  if (el) el.textContent = text || "";
}

function setFieldError(id, hasError) {
  const el = qs(`#${id}`);
  if (!el) return;
  el.classList.toggle("pw-field-error", !!hasError);
}

function bind() {
  const form = qs("#contact-form");
  const msg = qs("#contact-msg");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = qs("#c-name")?.value?.trim() ?? "";
    const email = qs("#c-email")?.value?.trim() ?? "";
    const text = qs("#c-message")?.value?.trim() ?? "";

    setErr("c-name", "");
    setErr("c-email", "");
    setErr("c-message", "");
    setFieldError("c-name", false);
    setFieldError("c-email", false);
    setFieldError("c-message", false);

    let ok = true;
    if (name.length < 2) {
      setErr("c-name", "Введите имя (минимум 2 символа).");
      setFieldError("c-name", true);
      ok = false;
    }
    if (!isValidEmail(email)) {
      setErr("c-email", "Введите корректный email.");
      setFieldError("c-email", true);
      ok = false;
    }
    if (text.length < 10) {
      setErr("c-message", "Сообщение должно быть не короче 10 символов.");
      setFieldError("c-message", true);
      ok = false;
    }

    if (!ok) {
      if (msg) {
        msg.textContent = "Проверьте поля формы.";
        msg.className = "text-sm pw-error-text";
      }
      return;
    }

    // Demo: emulate sending
    if (msg) {
      msg.textContent = "Сообщение отправлено! Мы ответим в ближайшее время.";
      msg.className = "text-sm pw-success-text";
    }
    form.reset();
  });
}

bind();

