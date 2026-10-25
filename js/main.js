// Número de WhatsApp para pedidos (código de país + número)
const WHATSAPP_NUMBER = "573176645184";

const money = (n) => "$" + n.toLocaleString("es-CO");
const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

// ---------- Imágenes que no cargan (logo, foto del abuelo) ----------
const onMissing = (img) => {
  const mode = img.dataset.fallback;
  img.hidden = true;
  if (mode === "wordmark") img.nextElementSibling.hidden = false;
  if (mode === "arch") img.nextElementSibling.hidden = false;
};
document.querySelectorAll("img[data-fallback]").forEach((img) => {
  if (img.complete && img.naturalWidth === 0) onMissing(img);
  else img.addEventListener("error", () => onMissing(img));
});

// ---------- Dónde estás: resaltar la sección actual ----------
const SECTION_NAMES = {
  inicio: "Inicio",
  "nuestra-historia": "Historia",
  menu: "Menú",
  pedidos: "Tu pedido",
  preguntas: "Preguntas",
  contacto: "Contacto",
};
const navLinks = [...document.querySelectorAll("#navMenu a, .tabbar a, #navCta")];
const topbarEl = document.getElementById("top");
const sections = Object.keys(SECTION_NAMES).map((id) => document.getElementById(id));

function setCurrent(id) {
  navLinks.forEach((a) => {
    const target = a.dataset.section || a.getAttribute("href").slice(1);
    if (target === id) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
}

// La sección actual es la última cuyo comienzo ya llegó al tercio de arriba de la pantalla.
// Al llegar al final de la página cuenta la última sección que se ve.
function sectionInView() {
  const line = Math.max(topbarEl.offsetHeight + 40, window.innerHeight * 0.35);
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  let current = sections[0].id;
  for (const sec of sections) {
    const top = sec.getBoundingClientRect().top;
    if (top <= line || (atBottom && top < window.innerHeight - 120)) current = sec.id;
  }
  return current;
}

// Al tocar un enlace, la sección elegida queda marcada aunque la página no pueda
// bajar hasta ponerla arriba (pasa con las últimas secciones). Se suelta cuando la
// persona vuelve a mover la página con el dedo, la rueda o el teclado.
let chosen = null;
let moving = false;
const release = () => { chosen = null; };
["wheel", "touchmove", "keydown", "pointerdown"].forEach((ev) => window.addEventListener(ev, release, { passive: true }));

let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    // Si la sección elegida ya no se ve, vuelve a mandar la posición real
    if (chosen && !moving) {
      const r = document.getElementById(chosen).getBoundingClientRect();
      if (r.bottom < topbarEl.offsetHeight || r.top > window.innerHeight) release();
    }
    setCurrent(chosen || sectionInView());
  });
}, { passive: true });

// ---------- Moverse entre secciones ----------
// La página sube o baja hasta la sección con un movimiento parejo: arranca suave,
// avanza y frena al llegar, y dura casi lo mismo sea cerca o lejos. Mientras se mueve,
// las barras de arriba y de abajo no cambian: ya muestran la sección de destino.
const root = document.documentElement;
let scrollAnim = 0;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function targetY(target) {
  const pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
  const max = root.scrollHeight - window.innerHeight;
  return Math.max(0, Math.min(max, target.getBoundingClientRect().top + window.scrollY - pad));
}

function stopMoving() {
  cancelAnimationFrame(scrollAnim);
  if (moving) {
    moving = false;
    root.style.scrollBehavior = "";
    updateCartBar();
  }
}

function goTo(target, focusAfter) {
  stopMoving();
  const from = window.scrollY;
  const to = targetY(target);
  const distance = Math.abs(to - from);
  // Con teclado, el foco pasa a la sección de destino para seguir desde ahí
  const done = () => {
    if (!focusAfter) return;
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };
  if (distance < 2) return done();
  const duration = Math.min(900, 450 + distance * 0.06);
  const t0 = performance.now();
  moving = true;
  root.style.scrollBehavior = "auto";
  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    window.scrollTo(0, from + (to - from) * easeInOut(t));
    if (t < 1) scrollAnim = requestAnimationFrame(step);
    else { stopMoving(); done(); }
  };
  scrollAnim = requestAnimationFrame(step);
}

// Si la persona mueve la página con el dedo o la rueda, el movimiento se detiene
["wheel", "touchstart"].forEach((ev) => window.addEventListener(ev, () => { if (moving) stopMoving(); }, { passive: true }));

document.addEventListener("click", (e) => {
  if (e.defaultPrevented) return;
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const target = document.getElementById(a.getAttribute("href").slice(1));
  if (!target) return;
  e.preventDefault();
  const sec = target.closest("section");
  if (sec && SECTION_NAMES[sec.id]) {
    chosen = sec.id;
    setCurrent(sec.id);
  }
  goTo(target, e.detail === 0); // detail 0: se activó con el teclado
});

setCurrent(sectionInView());

// ---------- Señal para bajar ----------
const scrollHint = document.getElementById("scrollHint");
// Se muestra solo al abrir la página; cuando la persona baja, no vuelve a aparecer
const updateHint = () => {
  if (window.scrollY > 120) {
    scrollHint.classList.add("is-gone");
    setTimeout(() => { scrollHint.hidden = true; }, 300); // fuera también del teclado
    window.removeEventListener("scroll", updateHint);
  }
};
window.addEventListener("scroll", updateHint, { passive: true });
scrollHint.addEventListener("click", () => {
  release();
  window.scrollBy({ top: window.innerHeight * 0.75, behavior: "smooth" });
});
updateHint();

// ---------- Aviso corto ----------
const toast = document.getElementById("toast");
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.hidden = false;
  toast.classList.remove("is-out");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("is-out");
    setTimeout(() => { toast.hidden = true; }, 250);
  }, 2200);
}

// ---------- Armar el pedido ----------
const items = [...document.querySelectorAll(".item")];
const cart = new Map(items.map((el) => [el.dataset.name, 0]));
const priceOf = (name) => Number(items.find((el) => el.dataset.name === name).dataset.price);

const lines = document.getElementById("orderLines");
const empty = document.getElementById("orderEmpty");
const totalRow = document.getElementById("orderTotalRow");
const totalEl = document.getElementById("orderTotal");
const sendBtn = document.getElementById("sendOrder");
const form = document.getElementById("orderForm");

const navCta = document.getElementById("navCta");
const ctaCount = document.getElementById("ctaCount");
const cartBar = document.getElementById("cartBar");
const cartBarCount = document.getElementById("cartBarCount");
const cartBarTotal = document.getElementById("cartBarTotal");
const waFloat = document.getElementById("waFloat");
const tabCount = document.getElementById("tabCount");
const menuNext = document.getElementById("menuNext");
const menuNextHint = document.getElementById("menuNextHint");
const orderError = document.getElementById("orderError");

// Mensaje editable ("Prefiero copiar el mensaje y completarlo yo")
const messageBox = document.getElementById("messageText");
const sendTemplate = document.getElementById("sendTemplate");
const resetTemplate = document.getElementById("resetTemplate");
const copyBtn = document.getElementById("copyTemplate");
const copyMsg = document.getElementById("copyMsg");
let messageEdited = false;

const picked = () => [...cart].filter(([, q]) => q > 0);
const totalOf = (list) => list.reduce((sum, [name, q]) => sum + q * priceOf(name), 0);

function buildMessage() {
  const data = new FormData(form);
  const list = picked();
  const barrio = data.get("barrio").trim();
  let text = "¡Hola Loli's Küche! Quiero pedir:\n";
  text += list.length ? list.map(([name, q]) => `• ${q} ${name}`).join("\n") : "• ";
  if (list.length) text += `\nTotal: ${money(totalOf(list))} + domicilio`;
  text += `\n\nNombre: ${data.get("name").trim()}`;
  text += `\nDirección: ${data.get("address").trim()}${barrio ? ", " + barrio : ""} (Bogotá)`;
  text += `\nPago: ${data.get("pay")}`;
  return text;
}

const filled = (id) => document.getElementById(id).value.trim() !== "";
const orderReady = () => messageEdited || (picked().length > 0 && filled("oName") && filled("oAddress"));

// El texto que se envía: el que la persona editó, o el generado
const currentMessage = () => (messageEdited ? messageBox.value : buildMessage());

function render() {
  const list = picked();
  const total = totalOf(list);
  const count = list.reduce((sum, [, q]) => sum + q, 0);

  lines.innerHTML = "";
  list.forEach(([name, q]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${q} × ${name}</span><span>${money(q * priceOf(name))}</span>`;
    lines.appendChild(li);
  });
  empty.hidden = list.length > 0;
  totalRow.hidden = list.length === 0;
  totalEl.textContent = money(total);

  items.forEach((el) => {
    const q = cart.get(el.dataset.name);
    el.querySelector(".qty__val").textContent = q;
    el.classList.toggle("is-picked", q > 0);
  });

  // Botón "Pedir ahora" del menú superior
  ctaCount.hidden = count === 0;
  ctaCount.textContent = count;
  navCta.setAttribute("aria-label", count ? `Pedir ahora: ${count} paquete${count > 1 ? "s" : ""} en tu pedido` : "Pedir ahora");

  // Botones de pedido: sin salchichas van al paso 1 (menú); con salchichas, al paso 2
  document.querySelectorAll("[data-order-link]").forEach((a) => {
    a.setAttribute("href", count ? "#pedidos" : "#menu");
  });
  document.getElementById("tabCta").classList.toggle("has-items", count > 0);

  tabCount.hidden = count === 0;
  tabCount.textContent = count;
  menuNext.hidden = count === 0;
  menuNextHint.hidden = count > 0;
  menuNext.textContent = `Listo, seguir al paso 2 (${count} paquete${count === 1 ? "" : "s"}) →`;
  if (count > 0 && orderError.dataset.reason === "empty") hideError();

  // Barra inferior con el resumen
  cartBarCount.textContent = `${count} paquete${count === 1 ? "" : "s"}`;
  cartBarTotal.textContent = money(total);
  updateCartBar();

  if (!messageEdited) messageBox.value = buildMessage();
  const link = waLink(currentMessage());
  sendTemplate.href = link;
  // Sin salchichas, nombre o dirección, el botón no lleva a WhatsApp: muestra qué falta.
  // (Algunas apps abren el enlace antes de que la página pueda detenerlo.)
  if (orderReady()) {
    sendBtn.href = link;
    sendBtn.target = "_blank";
  } else {
    sendBtn.href = "#orderForm";
    sendBtn.removeAttribute("target");
  }
}

// La barra inferior se oculta cuando ya estás viendo la sección de pedidos
let pedidosVisible = false;
function updateCartBar() {
  if (moving) return;
  const show = picked().length > 0 && !pedidosVisible;
  cartBar.hidden = !show;
  waFloat.classList.toggle("is-raised", show);
}
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    pedidosVisible = entry.isIntersecting;
    updateCartBar();
  }, { threshold: 0.15 }).observe(document.getElementById("pedidos"));
}

items.forEach((el) => {
  el.querySelectorAll(".qty__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = el.dataset.name;
      const before = cart.get(name);
      cart.set(name, Math.max(0, before + Number(btn.dataset.step)));
      render();
      const count = picked().reduce((sum, [, q]) => sum + q, 0);
      const llevas = count ? `Llevas ${count} paquete${count === 1 ? "" : "s"}.` : "Tu pedido está vacío.";
      if (btn.dataset.step === "1") showToast(`✓ Agregaste 1 ${name}. ${llevas}`);
      else if (before > 0) showToast(`Quitaste 1 ${name}. ${llevas}`);
      if (btn.dataset.step === "1") {
        navCta.classList.remove("is-bump");
        void navCta.offsetWidth;
        navCta.classList.add("is-bump");
      }
    });
  });
});
form.addEventListener("input", (e) => {
  e.target.classList.remove("is-invalid");
  if (orderError.dataset.reason === "fields") hideError();
  render();
});

// ---------- Revisar antes de abrir WhatsApp ----------
function showError(text, reason) {
  orderError.textContent = text;
  orderError.dataset.reason = reason;
  orderError.hidden = false;
  release();
  orderError.scrollIntoView({ behavior: "smooth", block: "center" });
}
function hideError() {
  orderError.hidden = true;
  orderError.dataset.reason = "";
}

sendBtn.addEventListener("click", (e) => {
  if (messageEdited) return; // la persona escribió su propio mensaje
  if (picked().length === 0) {
    e.preventDefault();
    showError("Primero elige al menos una salchicha en el menú (paso 1).", "empty");
    showToast("Primero elige tus salchichas en el menú.");
    return;
  }
  const missing = ["oName", "oAddress"].map((id) => document.getElementById(id)).filter((el) => !el.value.trim());
  if (missing.length) {
    e.preventDefault();
    missing.forEach((el) => el.classList.add("is-invalid"));
    showError(missing.length === 2 ? "Escribe tu nombre y tu dirección de entrega." :
      missing[0].id === "oName" ? "Escribe tu nombre." : "Escribe tu dirección de entrega en Bogotá.", "fields");
    missing[0].focus();
  }
});
// Enter en un campo de texto hace lo mismo que tocar el botón verde
form.addEventListener("submit", (e) => e.preventDefault());
form.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || e.target.type !== "text" || e.isComposing) return;
  e.preventDefault();
  sendBtn.click();
});

messageBox.addEventListener("input", () => {
  messageEdited = true;
  resetTemplate.hidden = false;
  render();
});
resetTemplate.addEventListener("click", () => {
  messageEdited = false;
  resetTemplate.hidden = true;
  copyMsg.textContent = "";
  render();
});

copyBtn.addEventListener("click", () => {
  const selectText = () => {
    messageBox.focus();
    messageBox.select();
    copyMsg.textContent = "Texto seleccionado: cópialo con Ctrl+C o mantén presionado.";
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(messageBox.value)
      .then(() => { copyMsg.textContent = "Mensaje copiado. Pégalo en WhatsApp al 317 664 5184."; })
      .catch(selectText);
  } else {
    selectText();
  }
});

render();

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Aviso "Powered by Netlify" ----------
// En el plan gratis de Netlify aparece un aviso fijo abajo a la derecha. Cuando
// está, se deja espacio para que no tape la barra inferior ni los botones.
const markHostBadge = () => {
  if (document.getElementById("nl-badge-frame")) {
    document.body.classList.add("has-host-badge");
    return true;
  }
  return false;
};
if (!markHostBadge()) {
  const badgeWatch = new MutationObserver(() => { if (markHostBadge()) badgeWatch.disconnect(); });
  badgeWatch.observe(document.body, { childList: true });
  setTimeout(() => badgeWatch.disconnect(), 15000);
}
