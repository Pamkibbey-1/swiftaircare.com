import { business, services } from './site.config.js';

const cards = document.querySelector('#service-cards');
if (cards && !cards.childElementCount) {
  for (const service of services) {
    const article = document.createElement('article');
    article.className = 'service-card';
    article.innerHTML = `<div class="service-icon"><svg class="icon" aria-hidden="true"><use href="#i-${service.icon}"/></svg></div><h3>${service.name}</h3><p>${service.summary}</p><a href="./services/${service.slug}/">Explore ${service.name.toLowerCase()}</a>`;
    cards.append(article);
  }
}

const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu() {
  nav?.classList.remove('is-open');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', 'Open navigation');
}
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  nav.classList.toggle('is-open', open);
});
nav?.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
    closeMenu(); toggle.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.nav-wrap')) closeMenu();
});

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
const contact = document.querySelector('#contact-details');
if (contact) {
  for (const [label, href] of [
    [business.phone, `tel:${business.phone.replace(/[^+\d]/g, '')}`],
    [business.email, `mailto:${business.email}`],
  ]) {
    if (!label) continue;
    const a = document.createElement('a'); a.textContent = label; a.href = href;
    contact.append(a);
  }
  if (business.hours) {
    const hours = document.createElement('span'); hours.textContent = business.hours; contact.append(hours);
  }
}

const form = document.querySelector('#booking-form');
const notice = document.querySelector('#booking-availability');
const result = document.querySelector('#form-result');
const endpoint = business.bookingEndpoint.trim();
// Restrict the public integration to the provider documented in the launch guide.
const endpointReady = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint);
if (form) {
  const submit = form.querySelector('button[type="submit"]');
  if (endpointReady) submit.disabled = false;
  if (!endpointReady) {
    notice.textContent = business.email
      ? 'Online requests are opening soon. Please email us to arrange a service.'
      : 'Online service requests are opening soon. Please check back to arrange your visit.';
    submit.disabled = true;
    submit.textContent = 'Online requests opening soon';
    submit.setAttribute('aria-describedby', 'booking-availability');
  }
  const selected = new URLSearchParams(location.search).get('service');
  if (services.some(service => service.name === selected)) form.elements.service.value = selected;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!endpointReady || !form.reportValidity()) return;
    if (form.elements._gotcha.value) return;
    submit.disabled = true; submit.textContent = 'Sending your request…';
    result.textContent = ''; result.classList.remove('error');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, signal: controller.signal,
      });
      if (!response.ok) throw new Error('Request not accepted');
      result.textContent = 'Thank you. Your service request has been sent. We’ll contact you to discuss your needs and confirm an appointment. Your visit is not booked yet.';
      form.reset();
    } catch {
      result.classList.add('error');
      result.textContent = 'We couldn’t confirm that your request was sent. Your details are still here. Please try again or contact us directly before resending to avoid duplicates.';
    } finally {
      clearTimeout(timeout); submit.disabled = false; submit.textContent = 'Send service request';
    }
  });
}

const mobileBook = document.querySelector('.mobile-book');
const booking = document.querySelector('#booking');
if (mobileBook && booking && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(([entry]) => mobileBook.classList.toggle('is-hidden', entry.isIntersecting), { threshold: 0.05 });
  observer.observe(booking);
}
