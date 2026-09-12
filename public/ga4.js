// Google Analytics 4 — tdotssolutionsz.com (G-YBX25V70TJ)
// External file rather than an inline <script> so the site's
// Content-Security-Policy does not need 'unsafe-inline' for scripts.
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-YBX25V70TJ');

/* Contact-intent events, added 2026-09-12. GA4's enhanced measurement only counts
   outbound http(s) links; a mailto:, tel:, or WhatsApp tap was invisible, so the
   question "did anyone try to contact them" had no answer. Delegated from document,
   passive, wrapped: analytics can never break a click. Nothing typed is recorded. */
(function () {
  function sent(name, params) { try { gtag('event', name, params || {}); } catch (_e) {} }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var label = (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 60);
    if (/^mailto:/i.test(href)) return sent('contact_email', { label: label });
    if (/^tel:/i.test(href)) return sent('contact_phone', { label: label });
    if (/^sms:/i.test(href)) return sent('contact_sms', { label: label });
    if (/wa\.me|api\.whatsapp\.com/i.test(href)) return sent('contact_whatsapp', { label: label });
    if (/instagram\.com\/direct/i.test(href)) return sent('contact_instagram_dm', { label: label });
    if (/instagram\.com/i.test(href)) return sent('outbound_instagram', { label: label });
    if (/calendly\.com|booksy|fresha|square\.site|acuity/i.test(href)) return sent('contact_booking', { label: label, url: href });
    if (/^https?:/i.test(href) && href.indexOf(location.hostname) === -1) return sent('outbound_click', { label: label, url: href });
  }, { passive: true, capture: true });
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f || f.tagName !== 'FORM') return;
    sent('contact_form_submit', { form: f.id || f.getAttribute('name') || f.getAttribute('action') || 'form' });
  }, { passive: true, capture: true });
})();
