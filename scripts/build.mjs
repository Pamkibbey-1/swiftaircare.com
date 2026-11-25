import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { business, services } from '../site.config.js';
import { publishKnowledge } from './knowledge.mjs';

const root = resolve(import.meta.dirname, '..');
const output = join(root, 'dist');
if (output !== join(root, 'dist')) throw new Error('Unexpected build path');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let home = await readFile(join(root, 'index.html'), 'utf8');
const cardMarkup = services.map(s => `<article class="service-card"><div class="service-icon"><svg class="icon" aria-hidden="true"><use href="#i-${s.icon}"/></svg></div><h3>${escape(s.name)}</h3><p>${escape(s.summary)}</p><a href="./services/${s.slug}/">Explore ${escape(s.name.toLowerCase())}</a></article>`).join('');
home = home.replace('<div class="service-grid" id="service-cards"></div>', `<div class="service-grid" id="service-cards">${cardMarkup}</div>`);
await writeFile(join(output, 'index.html'), home);
for (const file of ['styles.css', 'app.js', 'site.config.js']) await cp(join(root, file), join(output, file));
await cp(join(root, 'assets'), join(output, 'assets'), { recursive: true, filter: source => !source.endsWith('.md') });
await writeFile(join(output, 'CNAME'), `${business.domain}\n`);
await writeFile(join(output, '.nojekyll'), '');

const header = home.slice(home.indexOf('<body>') + 6, home.indexOf('<main id="main">'));
const footer = home.slice(home.indexOf('<footer class="footer">'), home.indexOf('<a class="mobile-book'));
const icons = home.slice(home.indexOf('<svg class="icon-definitions"'), home.indexOf('</body>'));
function page({ title, description, path, content, depth }) {
  const base = '../'.repeat(depth);
  const rebase = markup => markup.replace(/(href|src)="\.\//g, `$1="${base}`).replace(/href="#(?!i-)/g, `href="${base}#`);
  return `<!doctype html><html lang="en-CA"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#c82032"><title>${escape(title)} | Swift Air Care</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="https://${business.domain}/${path}"><meta property="og:title" content="${escape(title)} | Swift Air Care"><meta property="og:description" content="${escape(description)}"><meta property="og:image" content="https://${business.domain}/assets/hvac-service.jpg"><meta property="og:type" content="website"><meta property="og:url" content="https://${business.domain}/${path}"><link rel="icon" href="${base}assets/brand.svg"><link rel="stylesheet" href="${base}styles.css"><script type="module" src="${base}app.js"></script></head><body class="subpage">${rebase(header).replace(`href="${base}#main"`, 'href="#main"')}<main id="main">${content}</main>${rebase(footer)}${icons}</body></html>`;
}
const urls = [''];
for (const s of services) {
  const path = `services/${s.slug}/`;
  const bookingLink = `../../?service=${encodeURIComponent(s.name)}#booking`;
  const content = `<section class="sub-hero"><div class="container"><div class="breadcrumbs"><a href="../../">Home</a><span>/</span><a href="../../#services">Services</a><span>/</span>${escape(s.name)}</div><div class="eyebrow">${escape(s.tag.toUpperCase())}</div><h1>${escape(s.heading)}</h1><p>${escape(s.intro)}</p><a class="button" href="${bookingLink}">Request ${escape(s.name.toLowerCase())} service</a></div></section><section class="section"><div class="container"><div class="detail-grid"><div><h2>How we can help</h2><ul>${s.items.map(item => `<li>${escape(item)}</li>`).join('')}</ul></div><div><h2>Sound familiar?</h2><ul>${s.signs.map(item => `<li>${escape(item)}</li>`).join('')}</ul></div></div><div class="detail-callout"><h3>Let’s talk about your home.</h3><p>Serving the Greater Toronto Area and nearby communities. Include your location and a few details about your system. We’ll discuss your request and confirm availability before arranging a visit.</p><a class="button" href="${bookingLink}">Start a service request</a></div></div></section>`;
  await mkdir(join(output, path), { recursive: true });
  await writeFile(join(output, path, 'index.html'), page({ title: `${s.name} in the GTA`, description: s.summary, path, content, depth: 2 }));
  urls.push(path);
}
const privacy = `<section class="sub-hero"><div class="container"><div class="eyebrow">YOUR INFORMATION</div><h1>Privacy notice</h1><p>How information is handled when you visit this website or request a service.</p></div></section><section class="section"><div class="container privacy-content"><h2>About this website</h2><p>This website introduces Swift Air Care’s residential heating and cooling services in the Greater Toronto Area and nearby communities.</p><h2>Information you choose to share</h2><p>The service request form asks for your name, phone number, email, city or postal code, the service you need, and any message you choose to include. Please don’t include payment information, access codes, or other sensitive information.</p><h2>When you send a service request</h2><p>Online requests may be unavailable while the form is being set up. In that case the send button is disabled and your form details are not submitted. When online requests are enabled, the form uses Formspree to deliver your information to Swift Air Care. Their handling of information is described in the <a href="https://formspree.io/legal/privacy-policy/" rel="noopener noreferrer">Formspree privacy policy</a>.</p><p>Your contact information is used to respond to your enquiry, discuss the requested service, and arrange an appointment. The form consent relates to your enquiry and is not a newsletter subscription. A request is not a confirmed appointment.</p><h2>Website delivery</h2><p>The website is prepared for hosting on GitHub Pages. The hosting provider may process technical request information, such as your IP address, to deliver and protect the website. See the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener noreferrer">GitHub privacy statement</a>. Website fonts are served locally.</p><h2>Cookies and storage</h2><p>This website does not include advertising trackers, analytics scripts, or browser storage for your form details. Information entered into the form stays in the current page until you submit it, reset it, or leave the page.</p><h2>Questions about your information</h2><p>${business.email ? `Contact <a href="mailto:${escape(business.email)}">${escape(business.email)}</a> for questions about a service enquiry or to request correction or deletion of information you have shared, subject to applicable retention requirements.` : 'Contact details for privacy enquiries will be added before online requests are enabled.'}</p></div></section>`;
await mkdir(join(output, 'privacy'), { recursive: true });
await writeFile(join(output, 'privacy/index.html'), page({ title: 'Privacy notice', description: 'How Swift Air Care handles website visits and service enquiries.', path: 'privacy/', content: privacy, depth: 1 }));
urls.push('privacy/');
await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(path => `<url><loc>https://${business.domain}/${path}</loc></url>`).join('')}</urlset>`);
await writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: https://${business.domain}/sitemap.xml\n`);
await writeFile(join(output, '404.html'), `<!doctype html><html lang="en-CA"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Swift Air Care</title><style>body{margin:0;background:#f1f6f9;color:#20292f;font:18px/1.7 Arial,sans-serif;min-height:100vh;display:grid;place-items:center}main{padding:35px;max-width:550px}h1{font-size:44px;line-height:1.2}a{color:#c82032}</style></head><body><main><p>SWIFT AIR CARE</p><h1>Let’s get you back to comfort.</h1><p>We couldn’t find that page.</p><a href="https://${business.domain}/">Visit the home page</a></main></body></html>`);
await publishKnowledge({ output, business, services, paths: urls });
console.log(`Built ${urls.length} pages in ${output}`);
if (!business.bookingEndpoint) console.log('Launch note: booking delivery is not connected; the form is visibly disabled.');
