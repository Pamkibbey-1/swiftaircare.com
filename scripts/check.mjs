import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import { business } from '../site.config.js';
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
console.log(`Passed: ${pages.length} HTML pages, ${links} local references, metadata, sitemap, custom domain, optimized hero image.`);
if (process.argv.includes('--launch')) {
  const missing = [];
  if (!business.phone.trim()) missing.push('business phone number');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(business.email)) missing.push('customer / privacy email address');
  if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(business.bookingEndpoint)) missing.push('Formspree delivery endpoint');
  if (missing.length) { console.error(`Not ready for customer enquiries: add ${missing.join(', ')} in site.config.js.`); process.exitCode = 1; }
  else console.log('Contact configuration is complete. Send and receive a real test enquiry before announcing the website.');
}
