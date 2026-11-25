import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import { business, services } from '../site.config.js';
const root = resolve(import.meta.dirname, '..', 'dist');
async function filesIn(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? filesIn(join(dir, entry.name)) : join(dir, entry.name)))).flat();
}
const files = await filesIn(root);
const pages = files.filter(file => file.endsWith('.html'));
let links = 0;
for (const file of pages) {
  const html = await readFile(file, 'utf8');
  assert.match(html, /<html lang="en-CA">/, `Missing language: ${file}`);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `Expected one main heading: ${file}`);
  for (const match of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
    let target = match[1].split('#')[0].split('?')[0];
    if (!target || /^(?:https?:|mailto:|tel:|data:)/.test(target)) continue;
    target = resolve(dirname(file), decodeURIComponent(target));
    assert.ok(target.startsWith(root), `Link outside build: ${target}`);
    const info = await stat(target).catch(() => null);
    assert.ok(info, `Broken local link from ${file}: ${match[1]}`);
    if (info.isDirectory()) await stat(join(target, 'index.html'));
    links++;
  }
  if (!file.endsWith('404.html')) {
    assert.match(html, /<link rel="canonical"/, `Missing canonical: ${file}`);
    assert.match(html, /name="description"/, `Missing description: ${file}`);
  }
}
assert.ok((await stat(join(root, 'assets/hvac-service.jpg'))).size < 600000, 'Hero image should be optimized for mobile');
assert.equal((await readFile(join(root, 'CNAME'), 'utf8')).trim(), 'swiftaircare.com');
const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
assert.equal((sitemap.match(/<url>/g) || []).length, 6);
const origin = `https://${business.domain}/`;
const facts = JSON.parse(await readFile(join(root, 'business.json'), 'utf8'));
assert.equal(facts.name, business.name);
assert.equal(facts.contact.phone, business.phone || null);
assert.equal(facts.contact.email, business.email || null);
assert.equal(facts.contact.hours, business.hours || null);
assert.equal(facts.booking.onlineRequestsAvailable, /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(business.bookingEndpoint.trim()));
assert.deepEqual(facts.services.map(service => service.name), services.map(service => service.name));
assert.ok(!Object.hasOwn(facts, 'address'), 'Do not publish an invented or private business address');
for (const source of facts.sources) {
  const directory = join(root, new URL(source).pathname);
  const html = await readFile(join(directory, 'index.html'), 'utf8');
  const text = await readFile(join(directory, 'index.md'), 'utf8');
  assert.ok(text.startsWith(`> Source: ${source}`), 'Markdown should identify the corresponding canonical page');
  assert.ok(!text.includes('(416) 555-0123'), 'Example form values must not become business facts');
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1, `Expected one structured-data graph: ${source}`);
  const data = JSON.parse(scripts[0][1]);
  assert.equal(data['@context'], 'https://schema.org');
  const entities = data['@graph'];
  assert.equal(new Set(entities.map(node => node['@id'])).size, entities.length, 'Structured-data identities should be unique');
  const hasType = (node, type) => [node['@type']].flat().includes(type);
  for (const type of ['HVACBusiness', 'Place', 'WebSite', 'WebPage']) assert.ok(entities.some(node => hasType(node, type)), `Missing ${type} on ${source}`);
  const entity = entities.find(node => hasType(node, 'HVACBusiness'));
  assert.ok(!entity.address && !entity.aggregateRating && !entity.openingHoursSpecification, 'Only include verified business facts');
  assert.equal(entity.name, business.name);
  assert.ok(!scripts[0][1].includes('ReserveAction'), 'Do not advertise instant booking');
  assert.ok(html.includes(`type="text/markdown" href="${source}index.md"`), 'HTML should advertise its Markdown representation');
  if (source.includes('/services/')) {
    const offered = entities.find(node => node['@type'] === 'Service');
    assert.ok(offered && entities.some(node => node['@type'] === 'BreadcrumbList'));
    assert.ok(html.includes(offered.description.replace(/&/g, '&amp;')) || html.includes(offered.description), 'Service data must match visible content');
  }
  if (source === origin) {
    const faq = entities.find(node => node['@type'] === 'FAQPage');
    assert.equal(faq.mainEntity.length, facts.faqs.length);
    for (const [index, question] of faq.mainEntity.entries()) {
      assert.equal(question.name, facts.faqs[index].question);
      assert.equal(question.acceptedAnswer.text, facts.faqs[index].answer);
    }
    if (!facts.booking.onlineRequestsAvailable) {
      assert.ok(html.includes(facts.booking.status), 'Crawlers must see booking unavailability before JavaScript runs');
      assert.ok(text.includes(facts.booking.status));
    }
  }
}
const guide = await readFile(join(root, 'llms.txt'), 'utf8');
assert.ok(guide.startsWith(`# ${business.name}\n`));
assert.ok((await readFile(join(root, 'llms-full.txt'), 'utf8')).includes('Source: '+origin+'services/heating/'));
for (const [, href] of guide.matchAll(/\]\((https:\/\/[^)]+)\)/g)) {
  const target = new URL(href);
  if (target.origin === new URL(origin).origin) {
    const file = join(root, target.pathname);
    await stat(file);
  }
}
const robots = await readFile(join(root, 'robots.txt'), 'utf8');
assert.match(robots, /User-agent: OAI-SearchBot/);
assert.match(robots, /User-agent: \*\nAllow: \//);
assert.ok(!/Disallow:\s*\//.test(robots), 'Public discovery must remain allowed');
console.log(`Passed: ${pages.length} HTML pages, ${links} local references, metadata, sitemap, custom domain, optimized hero image.`);
console.log('Passed: page representations, structured-data graphs, guide links, crawler access, and accurate booking/contact facts.');
if (process.argv.includes('--launch')) {
  const missing = [];
  if (!business.phone.trim()) missing.push('business phone number');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(business.email)) missing.push('customer / privacy email address');
  if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(business.bookingEndpoint)) missing.push('Formspree delivery endpoint');
  if (missing.length) { console.error(`Not ready for customer enquiries: add ${missing.join(', ')} in site.config.js.`); process.exitCode = 1; }
  else console.log('Contact configuration is complete. Send and receive a real test enquiry before announcing the website.');
}
