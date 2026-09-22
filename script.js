/* ==========================================================================
   Morgana Salem — script partagé (nav, thème, cookies, calendrier, avis)
   Aucune dépendance externe. Fonctionne à l'identique sur chaque page :
   chaque fonction vérifie la présence de ses éléments avant d'agir.
   ========================================================================== */

/* Adresse de contact utilisée pour les demandes de rendez-vous et les avis.
   À REMPLACER par la véritable adresse professionnelle avant mise en ligne. */
const CONTACT_EMAIL = "contact@morgana-salem.fr";

document.addEventListener("DOMContentLoaded", () => {
  initFooterYear();
  initNav();
  initTheme();
  initCookieConsent();
  initCalendar();
  initReviewForm();
  initQuoteForm();
});

/* --------------------------------------------------------------------------
   Année courante dans le pied de page
   -------------------------------------------------------------------------- */
function initFooterYear() {
  document.querySelectorAll(".current-year").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

/* --------------------------------------------------------------------------
   Navigation mobile
   -------------------------------------------------------------------------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  const close = () => {
    nav.dataset.open = "false";
    toggle.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    nav.dataset.open = "true";
    toggle.setAttribute("aria-expanded", "true");
  };

  toggle.addEventListener("click", () => {
    nav.dataset.open === "true" ? close() : open();
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

/* --------------------------------------------------------------------------
   Thème clair / sombre / système
   -------------------------------------------------------------------------- */
function initTheme() {
  const btn = document.querySelector(".theme-toggle");
  const root = document.documentElement;
  const KEY = "ms-theme";

  const apply = (mode) => {
    if (mode === "light" || mode === "dark") {
      root.setAttribute("data-theme", mode);
    } else {
      root.removeAttribute("data-theme");
    }
    if (btn) {
      const label =
        mode === "dark" ? "Thème sombre actif — activer le thème clair"
        : mode === "light" ? "Thème clair actif — suivre le thème du système"
        : "Thème système actif — activer le thème sombre";
      btn.setAttribute("aria-label", label);
    }
  };

  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* stockage indisponible */ }
  apply(stored);

  if (!btn) return;
  btn.addEventListener("click", () => {
    const current = stored;
    const next = current === null ? "dark" : current === "dark" ? "light" : null;
    stored = next;
    apply(next);
    try {
      if (next === null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch (e) { /* stockage indisponible : le choix ne survivra pas à la session */ }
  });
}

/* --------------------------------------------------------------------------
   Consentement aux cookies
   Catégories : "necessary" (toujours actif — mémorise uniquement ce choix
   et la préférence de thème) et "analytics" (optionnel — voir loadAnalytics
   plus bas). Aucun cookie tiers, aucun traceur publicitaire.
   -------------------------------------------------------------------------- */
const CONSENT_KEY = "ms-cookie-consent";

function readConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeConsent(analytics) {
  const value = { necessary: true, analytics: !!analytics, decidedAt: new Date().toISOString() };
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); } catch (e) { /* stockage indisponible */ }
  return value;
}

function initCookieConsent() {
  const banner = document.querySelector(".cookie-banner");
  const modal = document.querySelector("#cookie-modal");
  if (!banner && !modal) return;

  const analyticsSwitch = modal ? modal.querySelector("#consent-analytics") : null;
  const openManageButtons = document.querySelectorAll("[data-open-cookie-prefs]");

  const applyConsent = (consent) => {
    if (consent && consent.analytics) loadAnalytics();
    if (analyticsSwitch) analyticsSwitch.checked = !!(consent && consent.analytics);
  };

  const hideBanner = () => { if (banner) banner.hidden = true; };
  const showBanner = () => { if (banner) banner.hidden = false; };
  const hideModal = () => { if (modal) modal.hidden = true; };
  const showModal = () => { if (modal) { modal.hidden = false; const f = modal.querySelector("button, input"); if (f) f.focus(); } };

  const existing = readConsent();
  if (existing) { applyConsent(existing); hideBanner(); }
  else showBanner();

  document.querySelectorAll("[data-consent='accept-all']").forEach((b) =>
    b.addEventListener("click", () => { applyConsent(writeConsent(true)); hideBanner(); hideModal(); })
  );
  document.querySelectorAll("[data-consent='reject-optional']").forEach((b) =>
    b.addEventListener("click", () => { applyConsent(writeConsent(false)); hideBanner(); hideModal(); })
  );
  document.querySelectorAll("[data-consent='open-prefs']").forEach((b) =>
    b.addEventListener("click", () => { const c = readConsent(); if (analyticsSwitch) analyticsSwitch.checked = !!(c && c.analytics); showModal(); })
  );
  openManageButtons.forEach((b) => b.addEventListener("click", () => {
    const c = readConsent();
    if (analyticsSwitch) analyticsSwitch.checked = !!(c && c.analytics);
    showModal();
  }));
  if (modal) {
    modal.querySelector("[data-consent='save-prefs']")?.addEventListener("click", () => {
      applyConsent(writeConsent(analyticsSwitch ? analyticsSwitch.checked : false));
      hideBanner(); hideModal();
    });
    modal.querySelector(".modal-close")?.addEventListener("click", hideModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) hideModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideModal(); });
  }
}

/**
 * Point d'intégration analytique — activé seulement si la visiteuse ou le
 * visiteur a accepté la catégorie "analytics".
 *
 * Ce site est aussi prévisualisé comme Artifact Claude : ce bac à sable
 * bloque silencieusement les appels réseau vers des domaines tiers (donc
 * vers un service comme Plausible, Matomo ou Google Analytics). Une fois
 * le site déployé sur un hébergement réel (GitHub Pages, etc.), ce blocage
 * n'existe plus : ajoutez ici le script fourni par l'outil choisi, par ex. :
 *
 *   const s = document.createElement("script");
 *   s.src = "https://plausible.io/js/script.js";
 *   s.setAttribute("data-domain", "morgana-salem.fr");
 *   s.defer = true;
 *   document.head.appendChild(s);
 *
 * Ne rien ajouter qui dépose des cookies de suivi publicitaire ou de
 * fingerprinting : la politique de cookies du site promet l'inverse.
 */
function loadAnalytics() {
  // Volontairement vide tant qu'aucun outil d'analyse n'est choisi.
}

/* --------------------------------------------------------------------------
   Calendrier de demande de rendez-vous (page réservation)
   -------------------------------------------------------------------------- */
const OPENING_HOURS = {
  // 0 = dimanche ... 6 = samedi. Fermé dimanche & lundi.
  days: [2, 3, 4, 5, 6],
  morning: ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"],
  afternoon: ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"],
};
const SERVICES = {
  triade: { label: "Consultation en Triade de Cartes", price: "15 €", duration: "≈ 20–25 min" },
  quintuple: { label: "Consultation du Quintuple", price: "20 €", duration: "≈ 40–45 min" },
};

function initCalendar() {
  const cal = document.querySelector("#booking-calendar");
  if (!cal) return;

  const monthLabel = cal.querySelector(".calendar-head strong");
  const grid = cal.querySelector(".cal-grid");
  const prevBtn = cal.querySelector("[data-cal-prev]");
  const nextBtn = cal.querySelector("[data-cal-next]");
  const slotList = document.querySelector("#slot-list");
  const summary = document.querySelector("#booking-summary");
  const form = document.querySelector("#booking-form");
  const statusEl = document.querySelector("#booking-status");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = null;
  let selectedSlot = null;

  // Pré-sélection depuis un lien "Réserver" de la page tarifs (?prestation=triade|quintuple|sur-mesure)
  try {
    const requested = new URLSearchParams(window.location.search).get("prestation");
    if (requested) {
      const radio = form?.querySelector(`input[name='service'][value='${CSS.escape(requested)}']`);
      if (radio) radio.checked = true;
    }
  } catch (e) { /* paramètre absent ou navigateur ancien : sélection manuelle */ }

  const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
  const dowLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  function currentService() {
    const checked = form?.querySelector("input[name='service']:checked");
    return checked ? SERVICES[checked.value] : null;
  }

  function renderMonth() {
    monthLabel.textContent = capitalize(monthFmt.format(viewDate));
    grid.innerHTML = "";
    dowLabels.forEach((d) => {
      const el = document.createElement("div");
      el.className = "dow";
      el.textContent = d;
      grid.appendChild(el);
    });

    const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 90);

    for (let i = 0; i < startOffset; i++) {
      grid.appendChild(document.createElement("div"));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-day";
      btn.textContent = String(d);
      const isOpenDay = OPENING_HOURS.days.includes(date.getDay());
      const inRange = date >= today && date <= maxDate;
      const available = isOpenDay && inRange;
      btn.disabled = !available;
      btn.dataset.available = String(available);
      const iso = toISODate(date);
      btn.dataset.date = iso;
      btn.setAttribute("aria-pressed", String(selectedDate === iso));
      btn.setAttribute("aria-label", date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + (available ? "" : " — fermé"));
      if (available) {
        btn.addEventListener("click", () => selectDate(iso));
      }
      grid.appendChild(btn);
    }

    prevBtn.disabled = viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();
  }

  function selectDate(iso) {
    selectedDate = iso;
    selectedSlot = null;
    renderMonth();
    renderSlots();
    renderSummary();
  }

  function renderSlots() {
    if (!slotList) return;
    slotList.innerHTML = "";
    if (!selectedDate) {
      slotList.innerHTML = '<p class="hint">Choisissez d’abord une date disponible dans le calendrier.</p>';
      return;
    }
    const all = [...OPENING_HOURS.morning, ...OPENING_HOURS.afternoon];
    all.forEach((time) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-btn";
      btn.textContent = time;
      btn.setAttribute("aria-pressed", String(selectedSlot === time));
      btn.addEventListener("click", () => {
        selectedSlot = time;
        renderSlots();
        renderSummary();
      });
      slotList.appendChild(btn);
    });
  }

  function renderSummary() {
    if (!summary) return;
    const service = currentService();
    if (!service || !selectedDate || !selectedSlot) {
      summary.hidden = true;
      return;
    }
    summary.hidden = false;
    const d = new Date(selectedDate + "T00:00:00");
    summary.querySelector("[data-sum-service]").textContent = `${service.label} — ${service.price}`;
    summary.querySelector("[data-sum-date]").textContent =
      capitalize(d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })) + ` à ${selectedSlot}`;
    summary.querySelector("[data-sum-duration]").textContent = service.duration;
  }

  prevBtn?.addEventListener("click", () => { viewDate.setMonth(viewDate.getMonth() - 1); renderMonth(); });
  nextBtn?.addEventListener("click", () => { viewDate.setMonth(viewDate.getMonth() + 1); renderMonth(); });
  form?.querySelectorAll("input[name='service']").forEach((r) => r.addEventListener("change", () => {
    toggleBookingMode();
    renderSummary();
  }));

  function toggleBookingMode() {
    const service = currentService();
    const bookingPanel = document.querySelector("#booking-panel");
    const bespokeNote = document.querySelector("#bespoke-note");
    if (!bookingPanel) return;
    const isBespoke = !service;
    bookingPanel.hidden = isBespoke;
    if (bespokeNote) bespokeNote.hidden = !isBespoke;
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const service = currentService();
    const name = form.querySelector("#rdv-nom")?.value.trim();
    const email = form.querySelector("#rdv-email")?.value.trim();
    const phone = form.querySelector("#rdv-tel")?.value.trim();
    const message = form.querySelector("#rdv-message")?.value.trim();

    if (!service || !selectedDate || !selectedSlot || !name || !email) {
      showStatus(statusEl, "error", "Merci de choisir une prestation, une date, un horaire, puis de renseigner au minimum votre nom et votre email.");
      return;
    }

    const d = new Date(selectedDate + "T00:00:00");
    const dateLabel = capitalize(d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    const subject = `Demande de rendez-vous — ${service.label}`;
    const bodyLines = [
      `Prestation souhaitée : ${service.label} (${service.price})`,
      `Créneau souhaité : ${dateLabel} à ${selectedSlot}`,
      `Nom : ${name}`,
      `Email : ${email}`,
      phone ? `Téléphone : ${phone}` : null,
      "",
      message ? `Message :\n${message}` : "(Aucun message complémentaire)",
    ].filter(Boolean);

    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = href;
    showStatus(statusEl, "ok", "Votre messagerie va s’ouvrir avec votre demande pré-remplie. Envoyez le message : Morgana vous confirmera ce créneau par retour sous 24 à 48 h.");
  });

  toggleBookingMode();
  renderMonth();
  renderSlots();
}

/* --------------------------------------------------------------------------
   Demande de devis — consultation sur mesure (page réservation)
   -------------------------------------------------------------------------- */
function initQuoteForm() {
  const form = document.querySelector("#quote-form");
  if (!form) return;
  const statusEl = document.querySelector("#quote-status");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.querySelector("#devis-nom")?.value.trim();
    const email = form.querySelector("#devis-email")?.value.trim();
    const phone = form.querySelector("#devis-tel")?.value.trim();
    const message = form.querySelector("#devis-message")?.value.trim();

    if (!name || !email || !message) {
      showStatus(statusEl, "error", "Merci de renseigner votre nom, votre email et de décrire votre demande.");
      return;
    }

    const subject = "Demande de devis — Consultation sur mesure";
    const bodyLines = [
      `Nom : ${name}`,
      `Email : ${email}`,
      phone ? `Téléphone : ${phone}` : null,
      "",
      `Description de la demande :\n${message}`,
    ].filter(Boolean);
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = href;
    showStatus(statusEl, "ok", "Votre messagerie va s’ouvrir avec votre demande pré-remplie. Morgana revient vers vous avec une proposition adaptée.");
  });
}

/* --------------------------------------------------------------------------
   Avis — formulaire (page avis)
   Pas de dépôt automatique et public : l'avis est envoyé par email pour
   relecture, puis ajouté manuellement au site. Voir la politique de
   confidentialité pour la justification de ce choix (pas de faux avis,
   pas de modération automatisée présentée comme humaine).
   -------------------------------------------------------------------------- */
function initReviewForm() {
  const form = document.querySelector("#review-form");
  if (!form) return;
  const statusEl = document.querySelector("#review-status");
  const ratingButtons = form.querySelectorAll(".rating-input button");
  const ratingInputHidden = form.querySelector("#avis-note-valeur");
  let rating = 0;

  ratingButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      rating = Number(btn.dataset.value);
      ratingButtons.forEach((b) => {
        const active = Number(b.dataset.value) <= rating;
        b.classList.toggle("lit", active);
        b.setAttribute("aria-pressed", String(Number(b.dataset.value) === rating));
      });
      if (ratingInputHidden) ratingInputHidden.value = String(rating);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.querySelector("#avis-nom")?.value.trim();
    const comment = form.querySelector("#avis-commentaire")?.value.trim();

    if (!name || !comment || !rating) {
      showStatus(statusEl, "error", "Merci d’indiquer votre nom, une note (en cliquant sur les étoiles) et votre commentaire.");
      return;
    }

    const subject = `Nouvel avis (${rating}/5) — ${name}`;
    const bodyLines = [`Note : ${rating}/5`, `Nom affiché : ${name}`, "", `Avis :\n${comment}`];
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = href;
    showStatus(statusEl, "ok", "Merci ! Votre messagerie va s’ouvrir avec votre avis pré-rempli. Une fois envoyé, il sera ajouté à cette page après relecture.");
    form.reset();
    ratingButtons.forEach((b) => { b.classList.remove("lit"); b.setAttribute("aria-pressed", "false"); });
    rating = 0;
  });
}

/* --------------------------------------------------------------------------
   Utilitaires
   -------------------------------------------------------------------------- */
function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function showStatus(el, state, message) {
  if (!el) return;
  el.dataset.state = state;
  el.textContent = message;
  el.setAttribute("role", "status");
}
