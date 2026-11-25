# Swift Air Care

A Canadian-inspired HVAC business website for **swiftaircare.com**, serving the Greater Toronto Area and nearby communities. Graphite, maple red, and icy blue; responsive layouts; licensed HVAC service photography; a flame-and-snowflake identity.

## Run locally

Requires Node.js 22 or newer. There are no npm dependencies to install.

```powershell
npm run dev
```

Open [the local preview](http://127.0.0.1:4173). This builds the website and starts the local server. After editing a source file, run `npm run build` and refresh the browser. `npm run preview` serves an existing build.

```powershell
npm run build
npm run check
```

The build creates `dist/`, including the home page, four dedicated service pages, privacy notice, 404 page, sitemap, robots file, fonts, and images. Checks validate local links, page headings, metadata, sitemap, domain configuration, and hero image size.

## Business information and online requests

Edit `site.config.js` to add the verified phone number, customer email, and business hours. Empty contact details are hidden. Service descriptions are also in this file; confirm that the business offers each service before launch.

Online requests are deliberately disabled until `bookingEndpoint` contains a valid Formspree endpoint. No form submissions are stored in this repository or sent to an invented address. No customer enquiry can be accepted in the current configuration.

To enable requests:

1. Create a form in the business’s [Formspree account](https://formspree.io/html/), configure and verify the recipient email, and enable the provider’s spam controls.
2. Set `bookingEndpoint` to the generated public endpoint, for example `https://formspree.io/f/yourformid`.
3. Add the phone number and customer email in `site.config.js`. The customer email is also used for privacy enquiries.
4. Build again. Run `npm run check:launch`.
5. Send a clearly labelled test request, verify it arrives, and check that replies can reach the customer. Live delivery has not been tested in this version because no business account endpoint was supplied.

The form validates required fields, includes explicit enquiry consent and a spam honeypot, handles errors and timeouts, and shows success only after the provider accepts the request. An accepted enquiry is never represented as a confirmed appointment. Details are kept in the page on errors; the form does not use local storage. Do not put private API keys in client-side files.

## Publish with GitHub Pages

The repository contains `.github/workflows/deploy.yml`, which builds, checks, and deploys `dist/` when changes are pushed to `main` or `master`.

1. The source repository is [Pamkibbey-1/swiftaircare.com](https://github.com/Pamkibbey-1/swiftaircare.com). Upload or push future source changes to its main branch.
2. In the repository, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Run the deployment workflow or push a commit, then check that the build and deployment succeed.
4. In **Settings → Pages → Custom domain**, enter `swiftaircare.com` and save. Verify domain ownership in GitHub using its supplied TXT record when prompted.
5. Configure the DNS records below at the domain provider. Preserve existing email-related MX and TXT records.
6. Once the DNS check and certificate provisioning complete, enable **Enforce HTTPS**.

The build emits `CNAME` for portability, but with a custom GitHub Actions deployment the custom domain must still be set in GitHub’s Pages settings. See [GitHub’s workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [custom domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `pamkibbey-1.github.io` |

The `www` target excludes the repository name. These values were checked against GitHub’s documentation on November 25, 2026; recheck the linked documentation when making the change. DNS and certificate provisioning can take up to 24 hours.

The domain is managed through Spaceship. Connect its DNS to GitHub Pages after confirming the Pages deployment. Online service requests remain disabled until business contact details and the Formspree endpoint are supplied.

## Editing guide

| File | Purpose |
| --- | --- |
| `index.html` | Home page structure and copy |
| `styles.css` | Branding, typography, desktop and mobile layouts |
| `app.js` | Mobile menu, enquiry form, service selection, and contact details |
| `site.config.js` | Verified business information and service page content |
| `scripts/build.mjs` | Static pages, metadata, privacy notice, and deployment output |
| `.github/workflows/deploy.yml` | GitHub Pages build and deployment |

The site uses JavaScript for browser interactions and Node.js for the build and development server. GitHub Pages serves the generated static files; no Java or persistent Node.js production server is required. The form provider handles enquiry delivery.

Fonts and imagery are local, with no external font requests or analytics scripts. Font licences and image provenance are documented in [assets/ASSETS.md](assets/ASSETS.md).
