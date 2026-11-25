import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const decode = value => value.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39|#\d+|#x[\da-f]+);/gi, entity => {
  const names = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&nbsp;': ' ' };
  if (names[entity.toLowerCase()]) return names[entity.toLowerCase()];
  const hexadecimal = /^&#x/i.test(entity);
  const code = Number.parseInt(entity.slice(hexadecimal ? 3 : 2, -1), hexadecimal ? 16 : 10);
  return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
});
const plain = value => decode(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const attribute = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function bookingInformation(business) {
  const enabled = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(business.bookingEndpoint.trim());
  return {
    onlineRequestsAvailable: enabled,
    url: `https://${business.domain}/#booking`,
    status: enabled
      ? 'Online service requests are available. A request is not a confirmed appointment.'
      : business.email
        ? 'Online requests are opening soon. Please email us to arrange a service.'
        : 'Online service requests are opening soon. Please check back to arrange your visit.',
    confirmationPolicy: 'An appointment is confirmed only after Swift Air Care contacts the customer and agrees on the date, time, and service.',
  };
}

function markdown(html, url, booking) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
  let text = main
    .replace(/<(svg|script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Form placeholders are examples, not business contact information.
    .replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, `\n\n${booking.status}\n\n${booking.confirmationPolicy}\n\n`)
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
      const readable = plain(label);
      return readable ? ` [${readable}](${new URL(decode(href), url).href}) ` : '';
    })
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, title) => `\n\n${'#'.repeat(Number(level))} ${plain(title)}\n\n`)
    .replace(/<summary\b[^>]*>([\s\S]*?)<\/summary>/gi, (_, question) => `\n\n### ${plain(question)}\n\n`)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => `\n- ${plain(item)}\n`)
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, text) => ` **${plain(text)}** `)
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|section|article|details|ul|ol)>/gi, '\n\n')
    .replace(/<(p|div|section|article|details|ul|ol)\b[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  text = decode(text).split('\n').map(line => line.replace(/[\t ]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return `> Source: ${url}\n\n${text}\n`;
}

function graphFor({ business, services, html, path, faqs }) {
  const origin = `https://${business.domain}/`;
  const url = new URL(path, origin).href;
  const businessId = `${origin}#business`;
  const areaId = `${origin}#service-area`;
  const websiteId = `${origin}#website`;
  const pageId = `${url}#webpage`;
  const service = services.find(item => path === `services/${item.slug}/`);
  const isHome = path === '';
  const title = plain(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || business.name);
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] || '');
  const serviceNode = item => ({
    '@type': 'Service', '@id': `${origin}services/${item.slug}/#service`,
    name: item.name, serviceType: item.name, description: item.summary,
    url: `${origin}services/${item.slug}/`,
    provider: { '@id': businessId }, areaServed: { '@id': areaId },
  });
  const nodes = [
    {
      '@type': ['HVACBusiness', 'LocalBusiness'], '@id': businessId, name: business.name, url: origin,
      description: 'Residential heating, air conditioning, heat pumps, and HVAC maintenance in the Greater Toronto Area and nearby communities.',
      logo: `${origin}assets/brand.svg`, image: `${origin}assets/hvac-service.jpg`,
      areaServed: { '@id': areaId },
      ...(business.phone ? { telephone: business.phone } : {}),
      ...(business.email ? { email: business.email } : {}),
      ...(isHome ? { hasOfferCatalog: {
        '@type': 'OfferCatalog', name: 'Residential HVAC services',
        itemListElement: services.map(item => ({ '@type': 'Offer', itemOffered: { '@id': `${origin}services/${item.slug}/#service` } })),
      } } : {}),
    },
    {
      '@type': 'Place', '@id': areaId, name: business.serviceArea,
      containedInPlace: { '@type': 'AdministrativeArea', name: 'Ontario', containedInPlace: { '@type': 'Country', name: 'Canada' } },
    },
    { '@type': 'WebSite', '@id': websiteId, name: business.name, url: origin, inLanguage: 'en-CA', publisher: { '@id': businessId } },
    {
      '@type': 'WebPage', '@id': pageId, url, name: title, description, inLanguage: 'en-CA',
      isPartOf: { '@id': websiteId }, about: { '@id': businessId },
      ...(service ? { mainEntity: { '@id': `${url}#service` }, breadcrumb: { '@id': `${url}#breadcrumbs` } } : {}),
    },
    ...(isHome ? services.map(serviceNode) : service ? [serviceNode(service)] : []),
  ];
  if (service) nodes.push({
    '@type': 'BreadcrumbList', '@id': `${url}#breadcrumbs`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${origin}#services` },
      { '@type': 'ListItem', position: 3, name: service.name, item: url },
    ],
  });
  if (isHome && faqs.length) nodes.push({
    '@type': 'FAQPage', '@id': `${origin}#faq`, url: `${origin}#faq`, isPartOf: { '@id': pageId },
    mainEntity: faqs.map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
  });
  return { '@context': 'https://schema.org', '@graph': nodes };
}

export async function publishKnowledge({ output, business, services, paths }) {
  const origin = `https://${business.domain}/`;
  const booking = bookingInformation(business);
  const home = await readFile(join(output, 'index.html'), 'utf8');
  const faqs = [...home.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g)]
    .map(([, question, answer]) => ({ question: plain(question), answer: plain(answer) }));
  const exports = [];
  for (const path of paths) {
    const file = join(output, path, 'index.html');
    let html = await readFile(file, 'utf8');
    const url = new URL(path, origin).href;
    const markdownUrl = `${url}index.md`;
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
    if (!path && !booking.onlineRequestsAvailable) {
      html = html.replace('<div id="booking-availability" class="form-notice" role="status"></div>', `<div id="booking-availability" class="form-notice" role="status">${booking.status}</div>`);
      html = html.replace('type="submit" disabled>Send service request', 'type="submit" disabled>Online requests opening soon');
    }
    const graph = graphFor({ business, services, html, path, faqs });
    html = html.replace('</head>', `<link rel="alternate" type="text/markdown" href="${attribute(markdownUrl)}" title="Plain-text version"><link rel="describedby" type="application/json" href="${origin}business.json"><script type="application/ld+json">${safeJson(graph)}</script></head>`);
    await writeFile(file, html);
    const text = markdown(html, url, booking);
    await writeFile(join(output, path, 'index.md'), text);
    exports.push({ url, text });
  }
  const facts = {
    name: business.name, url: origin,
    description: 'Residential heating, cooling, heat pumps, and HVAC maintenance.',
    serviceArea: business.serviceArea, province: 'Ontario', country: 'Canada',
    contact: { phone: business.phone || null, email: business.email || null, hours: business.hours || null },
    services: services.map(item => ({ name: item.name, description: item.summary, url: `${origin}services/${item.slug}/`, includes: item.items })),
    booking, faqs,
    sources: paths.map(path => new URL(path, origin).href),
  };
  await writeFile(join(output, 'business.json'), `${JSON.stringify(facts, null, 2)}\n`);
  const guide = `# ${business.name}\n\n> Residential heating, cooling, heat pumps, and HVAC maintenance for the Greater Toronto Area and nearby communities in Ontario, Canada.\n\nOfficial website: ${origin}\nService area: ${business.serviceArea}. Availability for an individual address is confirmed when the request is discussed.\n\n${booking.status}\n${booking.confirmationPolicy}\n\n## Services\n\n${services.map(item => `- [${item.name}](${origin}services/${item.slug}/index.md): ${item.summary}`).join('\n')}\n\n## Website information\n\n- [Home page](${origin}index.md): Website content, service area, FAQs, and service request information.\n- [Business information](${origin}business.json): Public business facts, service catalogue, contact availability, and booking status.\n- [Complete website text](${origin}llms-full.txt): The main content of the public pages in one file.\n- [Privacy notice](${origin}privacy/index.md): How website visits and service enquiries are handled.\n- [Service requests](${origin}#booking): Check current availability before attempting an enquiry.\n- [Sitemap](${origin}sitemap.xml): Canonical public HTML pages.\n`;
  await writeFile(join(output, 'llms.txt'), guide);
  await writeFile(join(output, 'llms-full.txt'), `# ${business.name} — public website content\n\n${exports.map(page => `${page.text}\n---\n`).join('\n')}`);
  const discoveryAgents = ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot', 'Claude-User'];
  await writeFile(join(output, 'robots.txt'), `# Search discovery and user-requested retrieval\n${discoveryAgents.map(name => `User-agent: ${name}`).join('\n')}\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: ${origin}sitemap.xml\n`);
  console.log(`Published ${exports.length} Markdown versions, linked structured data, business.json, and site guides.`);
}
