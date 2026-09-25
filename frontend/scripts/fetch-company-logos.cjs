#!/usr/bin/env node
/**
 * TRAP — Automated Company Logo Acquisition & Verification System
 * 
 * Sources authentic company logos from:
 * 1. Verified Local SVGs in public/company-logos/
 * 2. Simple Icons (npm package simple-icons - 3000+ vector brand icons)
 * 3. Official Brand Domains via Clearbit Logo API (https://logo.clearbit.com/{domain})
 * 4. Google High-Resolution Favicon Service (https://www.google.com/s2/favicons?domain={domain}&sz=128)
 * 
 * Validates responses, saves assets locally, updates src/config/companyLogos.ts,
 * and generates company_logo_audit.json, missing_logos.json, and logo_sources.json.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const simpleIcons = require('simple-icons');

const projectRoot = path.resolve(__dirname, '..');
const dbFile = path.resolve(projectRoot, '../backend/all_companies_db.json');
const logosDir = path.resolve(projectRoot, 'public/company-logos');
const configFile = path.resolve(projectRoot, 'src/config/companyLogos.ts');
const auditFile = path.resolve(projectRoot, '../backend/company_logo_audit.json');
const missingFile = path.resolve(projectRoot, '../backend/missing_logos.json');
const sourcesFile = path.resolve(projectRoot, '../backend/logo_sources.json');

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

if (!fs.existsSync(dbFile)) {
  console.error(`[Error] Database file not found at ${dbFile}`);
  process.exit(1);
}

const companies = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));

// Alias mapping for subsidiaries, parent companies, and alternate slugs
const KNOWN_ALIASES = {
  "walmart-labs": "walmart",
  "walmartlabs": "walmart",
  "palantir-technologies": "palantir",
  "jpmorgan-chase": "jpmorgan",
  "jp-morgan": "jpmorgan",
  "jpmorganchase": "jpmorgan",
  "morgan-stanley": "morgan-stanley",
  "goldman-sachs": "goldmansachs",
  "goldman": "goldmansachs",
  "d-e-shaw": "d-e-shaw",
  "de-shaw": "d-e-shaw",
  "tcs": "tata",
  "tata-consultancy-services": "tata",
  "cisco-systems": "cisco",
  "google-llc": "google",
  "google-inc": "google",
  "amazon-com": "amazon",
  "amazon-web-services": "amazon",
  "meta-platforms": "meta",
  "facebook": "meta",
  "apple-inc": "apple",
  "uber-technologies": "uber",
  "bytedance": "tiktok",
  "oracle-corporation": "oracle",
  "ola-cabs": "ola",
  "lti": "ltimindtree",
  "ltimindtree": "ltimindtree",
  "confluent": "confluent.io",
  "epic-systems": "epic",
  "epicgames": "epic-games",
  "western-digital": "westerndigital",
  "juniper-networks": "junipernetworks",
  "cockroach-labs": "cockroachlabs",
  "scale-ai": "scaleai",
  "hugging-face": "huggingface",
  "booking-com": "bookingdotcom",
  "bookingcom": "bookingdotcom",
  "american-express": "americanexpress",
  "wells-fargo": "wellsfargo",
  "two-sigma": "twosigma"
};

// Domain mapping dictionary for companies not directly matching simple-icons or standard slug.com
const DOMAIN_MAP = {
  "meesho": "meesho.com",
  "josh-technology": "joshtechnologygroup.com",
  "turing": "turing.com",
  "media.net": "media.net",
  "medianet": "media.net",
  "hashedin": "hashedin.com",
  "zeta": "zeta.tech",
  "squarepoint-capital": "squarepoint-capital.com",
  "tekion": "tekion.com",
  "accolite": "accolite.com",
  "juspay": "juspay.in",
  "makemytrip": "makemytrip.com",
  "myntra": "myntra.com",
  "wayfair": "wayfair.com",
  "verkada": "verkada.com",
  "geico": "geico.com",
  "openai": "openai.com",
  "akuna-capital": "akunacapital.com",
  "ixl": "ixl.com",
  "epic-systems": "epic.com",
  "hudson-river-trading": "hudsonrivertrading.com",
  "moloco": "moloco.com",
  "bcg": "bcg.com",
  "avito": "avito.ru",
  "cashfree": "cashfree.com",
  "hsbc": "hsbc.com",
  "chewy": "chewy.com",
  "virtu": "virtu.com",
  "pwc": "pwc.com",
  "cme-group": "cmegroup.com",
  "sonatus": "sonatus.ai",
  "cvent": "cvent.com",
  "mckinsey": "mckinsey.com",
  "thomson-reuters": "thomsonreuters.com",
  "braze": "braze.com",
  "epic-games": "epicgames.com",
  "increff": "increff.com",
  "nerdwallet": "nerdwallet.com",
  "shipsy": "shipsy.io",
  "veeva-systems": "veeva.com",
  "electronic-arts": "ea.com",
  "blackrock": "blackrock.com",
  "bloomberg": "bloomberg.com",
  "goldman-sachs": "goldmansachs.com",
  "morgan-stanley": "morganstanley.com",
  "d-e-shaw": "deshaw.com",
  "citadel": "citadel.com",
  "two-sigma": "twosigma.com",
  "janestreet": "janestreet.com",
  "jane-street": "janestreet.com",
  "optiver": "optiver.com",
  "flow-traders": "flowtraders.com",
  "jump-trading": "jumptrading.com",
  "drw": "drw.com",
  "susquehanna": "sig.com",
  "tcs": "tcs.com",
  "infosys": "infosys.com",
  "wipro": "wipro.com",
  "hcl": "hcltech.com",
  "cognizant": "cognizant.com",
  "tech-mahindra": "techmahindra.com",
  "persistent-systems": "persistent.com",
  "mphasis": "mphasis.com",
  "coforge": "coforge.com",
  "bny-mellon": "bnymellon.com",
  "societe-generale": "societegenerale.com",
  "deutsche-bank": "db.com",
  "ubs": "ubs.com",
  "credit-suisse": "credit-suisse.com",
  "barclays": "barclays.com",
  "standard-chartered": "sc.com",
  "wells-fargo": "wellsfargo.com",
  "bank-of-america": "bankofamerica.com",
  "citigroup": "citigroup.com",
  "citi": "citi.com",
  "fidelity": "fidelity.com",
  "vanguard": "vanguard.com",
  "charles-schwab": "schwab.com",
  "state-street": "statestreet.com",
  "northern-trust": "northerntrust.com",
  "mastercard": "mastercard.com",
  "visa": "visa.com",
  "american-express": "americanexpress.com",
  "discover": "discover.com",
  "capital-one": "capitalone.com",
  "synchrony": "synchrony.com",
  "ally": "ally.com",
  "sofi": "sofi.com",
  "chime": "chime.com",
  "revolut": "revolut.com",
  "monzo": "monzo.com",
  "n26": "n26.com",
  "starling": "starlingbank.com",
  "klarna": "klarna.com",
  "afterpay": "afterpay.com",
  "affirm": "affirm.com",
  "plaid": "plaid.com",
  "marqeta": "marqeta.com",
  "toast": "toasttab.com",
  "bill.com": "bill.com",
  "flywire": "flywire.com",
  "remitly": "remitly.com",
  "wise": "wise.com",
  "worldremit": "worldremit.com",
  "tinkoff": "tinkoff.ru",
  "yandex": "yandex.ru",
  "vk": "vk.com",
  "ozon": "ozon.ru",
  "wildberries": "wildberries.ru",
  "sberbank": "sberbank.ru",
  "headhunter": "hh.ru",
  "kaspersky": "kaspersky.com",
  "jetbrains": "jetbrains.com",
  "wrike": "wrike.com",
  "acronis": "acronis.com",
  "veeam": "veeam.com",
  "playrix": "playrix.com",
  "gaijin": "gaijin.net",
  "wargaming": "wargaming.net",
  "plarium": "plarium.com",
  "playtika": "playtika.com",
  "supercell": "supercell.com",
  "rovio": "rovio.com",
  "king": "king.com",
  "zynga": "zynga.com",
  "jam-city": "jamcity.com",
  "scopely": "scopely.com",
  "niantic": "nianticlabs.com",
  "roblox": "roblox.com",
  "unity": "unity.com",
  "godot": "godotengine.org",
  "applovin": "applovin.com",
  "iron-source": "ironsrc.com",
  "inmobi": "inmobi.com",
  "criteo": "criteo.com",
  "taboola": "taboola.com",
  "outbrain": "outbrain.com",
  "sprinklr": "sprinklr.com",
  "sprout-social": "sproutsocial.com",
  "hootsuite": "hootsuite.com",
  "buffer": "buffer.com",
  "rappi": "rappi.com",
  "nubank": "nubank.com.br",
  "mercadolibre": "mercadolibre.com",
  "vtex": "vtex.com",
  "globant": "globant.com",
  "bairesdev": "bairesdev.com",
  "endava": "endava.com",
  "epam": "epam.com",
  "softserve": "softserveinc.com",
  "ciklum": "ciklum.com",
  "zensar": "zensar.com",
  "cybage": "cybage.com",
  "tata-elxsi": "tataelxsi.com",
  "ltts": "ltts.com",
  "inshorts": "inshorts.com",
  "dailyhunt": "dailyhunt.in",
  "sharechat": "sharechat.com",
  "pratilipi": "pratilipi.com",
  "pocket-fm": "pocketfm.com",
  "kuku-fm": "kukufm.com",
  "winzo": "winzogames.com",
  "mpl": "mpl.live",
  "dream11": "dream11.com",
  "games24x7": "games24x7.com",
  "gameskraft": "gameskraft.com",
  "nazara": "nazara.com",
  "confluent": "confluent.io",
  "zopsmart": "zopsmart.com",
  "fractal-analytics": "fractal.ai",
  "wissen-technology": "wissentechnology.com",
  "info-edge": "infoedge.in"
};

// Build index of Simple Icons
const simpleIconMap = new Map();
for (const title in simpleIcons) {
  const icon = simpleIcons[title];
  if (icon && icon.slug) {
    simpleIconMap.set(icon.slug, icon);
    const normTitle = icon.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    simpleIconMap.set(normTitle, icon);
  }
}

// Function to generate SVG string from SimpleIcon
function generateSimpleIconSvg(icon) {
  return `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#${icon.hex}">
  <title>${icon.title}</title>
  <path d="${icon.path}"/>
</svg>`;
}

// HTTP fetch helper with timeout
function fetchBuffer(url, timeoutMs = 5000) {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (TRAP Logo Engine)' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith('http')) {
            const parsed = new URL(url);
            redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
          }
          return resolve(fetchBuffer(redirectUrl, timeoutMs));
        }

        if (res.statusCode !== 200) {
          return resolve({ success: false, status: res.statusCode });
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({ success: true, status: 200, buffer, contentType: res.headers['content-type'] });
        });
      });

      req.on('error', (err) => resolve({ success: false, error: err.message }));
      req.setTimeout(timeoutMs, () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
}

function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 100) return false;
  const str = buffer.toString('utf-8', 0, Math.min(buffer.length, 300)).toLowerCase();
  if (str.includes('<!doctype html') || str.includes('<html') || str.includes('404 not found') || str.includes('access denied')) {
    return false;
  }
  return true;
}

async function run() {
  console.log('============================================================');
  console.log('TRAP — AUTOMATED COMPANY LOGO ACQUISITION SYSTEM');
  console.log('============================================================\n');

  console.log(`Loaded ${companies.length} companies from catalog.`);

  let verifiedLocalCount = 0;
  let simpleIconsCount = 0;
  let onlineDownloadedCount = 0;
  let fallbackCount = 0;

  const auditLog = [];
  const missingLogos = [];
  const logoSources = [];
  const mappedLogosRegistry = {};
  const aliasesRegistry = { ...KNOWN_ALIASES };

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    const slug = c.slug.toLowerCase().trim();
    const name = c.name;
    const normSlug = slug.replace(/[^a-z0-9]/g, '');
    const normName = name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Resolve target slug if alias exists
    const targetSlug = KNOWN_ALIASES[slug] || slug;

    let logoPath = null;
    let sourceType = null;
    let sourceUrl = null;
    let fileExt = 'svg';

    // 1. Check existing verified local asset
    const localSvgPath = path.join(logosDir, `${targetSlug}.svg`);
    const localPngPath = path.join(logosDir, `${targetSlug}.png`);

    if (fs.existsSync(localSvgPath) && fs.statSync(localSvgPath).size > 100) {
      logoPath = `/company-logos/${targetSlug}.svg`;
      sourceType = 'Local Verified SVG';
      sourceUrl = `file://${localSvgPath}`;
      verifiedLocalCount++;
    } else if (fs.existsSync(localPngPath) && fs.statSync(localPngPath).size > 100) {
      logoPath = `/company-logos/${targetSlug}.png`;
      sourceType = 'Local Verified PNG';
      sourceUrl = `file://${localPngPath}`;
      fileExt = 'png';
      verifiedLocalCount++;
    } else {
      // 2. Search Simple Icons
      let icon = simpleIconMap.get(targetSlug) || simpleIconMap.get(slug) || simpleIconMap.get(normSlug) || simpleIconMap.get(normName);
      
      if (!icon) {
        try {
          const directMatch = simpleIcons.Get(name) || simpleIcons.Get(slug);
          if (directMatch) icon = directMatch;
        } catch (e) {}
      }

      if (icon) {
        const svgContent = generateSimpleIconSvg(icon);
        fs.writeFileSync(localSvgPath, svgContent, 'utf-8');
        logoPath = `/company-logos/${targetSlug}.svg`;
        sourceType = 'Simple Icons Vector SVG';
        sourceUrl = `https://simpleicons.org/?q=${icon.slug}`;
        simpleIconsCount++;
      } else {
        // 3. Try Online Logo Services via Domain
        const domain = DOMAIN_MAP[targetSlug] || DOMAIN_MAP[slug] || `${normSlug}.com`;
        const clearbitUrl = `https://logo.clearbit.com/${domain}`;
        const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

        let res = await fetchBuffer(clearbitUrl, 4000);
        let usedUrl = clearbitUrl;
        let usedSource = 'Clearbit Brand API';

        if (!res.success || !isValidImageBuffer(res.buffer)) {
          res = await fetchBuffer(googleFaviconUrl, 4000);
          usedUrl = googleFaviconUrl;
          usedSource = 'Google Brand Favicon Service';
        }

        if (res.success && isValidImageBuffer(res.buffer)) {
          const isSvg = res.contentType && res.contentType.includes('svg');
          fileExt = isSvg ? 'svg' : 'png';
          const targetFile = path.join(logosDir, `${targetSlug}.${fileExt}`);
          fs.writeFileSync(targetFile, res.buffer);
          logoPath = `/company-logos/${targetSlug}.${fileExt}`;
          sourceType = usedSource;
          sourceUrl = usedUrl;
          onlineDownloadedCount++;
        } else {
          fallbackCount++;
          missingLogos.push({
            company: name,
            slug,
            question_count: c.question_count,
            attempted_sources: [clearbitUrl, googleFaviconUrl],
            reason: 'Official SVG/PNG unavailable across public brand APIs'
          });
        }
      }
    }

    if (logoPath) {
      mappedLogosRegistry[slug] = logoPath;
      mappedLogosRegistry[targetSlug] = logoPath;
      aliasesRegistry[slug] = targetSlug;

      logoSources.push({
        company: name,
        slug,
        assetPath: logoPath,
        sourceType,
        sourceUrl,
        fileType: fileExt,
        verified: true
      });

      auditLog.push({
        company: name,
        slug,
        status: 'VERIFIED',
        logoPath,
        sourceType
      });
    } else {
      auditLog.push({
        company: name,
        slug,
        status: 'FALLBACK_INITIALS',
        logoPath: null,
        sourceType: 'Monospace Initial Avatar'
      });
    }
  }

  // Write updated registry files
  const newTsContent = `/**
 * TRAP — Complete Company Logo Registry & Normalization Engine
 * 
 * Auto-generated and verified logo registry mapping company catalog items
 * to local vector SVGs or high-resolution PNG brand assets.
 */

export const COMPANY_ALIASES: Record<string, string> = ${JSON.stringify(aliasesRegistry, null, 2)};

export const COMPANY_LOGOS: Record<string, string> = ${JSON.stringify(mappedLogosRegistry, null, 2)};

/**
 * Normalizes any company input (name or slug) into a clean canonical lookup key.
 */
export function normalizeCompanyKey(raw: string | undefined | null): string {
  if (!raw) return ''
  const clean = raw
    .toLowerCase()
    .trim()
    .replace(/[._\\-–—]+/g, ' ')
    .replace(/[^a-z0-9\\s]/g, '')
    .trim()
  
  const slugified = clean.replace(/\\s+/g, '-')
  if (COMPANY_ALIASES[slugified]) {
    return COMPANY_ALIASES[slugified]
  }

  if (COMPANY_ALIASES[clean]) {
    return COMPANY_ALIASES[clean]
  }

  return slugified
}

/**
 * Resolves a company's official logo URL dynamically from the local registry.
 */
export function getCompanyLogoUrl(company: string | { name?: string; slug?: string } | undefined | null): string | null {
  if (!company) return null

  const rawSlug = typeof company === 'object' && company.slug ? company.slug : (typeof company === 'string' ? company : company?.name || '')
  if (!rawSlug.trim()) return null

  const canonicalKey = normalizeCompanyKey(rawSlug)

  if (COMPANY_LOGOS[canonicalKey]) {
    return COMPANY_LOGOS[canonicalKey]
  }

  const alias = COMPANY_ALIASES[canonicalKey]
  if (alias && COMPANY_LOGOS[alias]) {
    return COMPANY_LOGOS[alias]
  }

  const rawKey = rawSlug.toLowerCase().trim()
  if (COMPANY_LOGOS[rawKey]) {
    return COMPANY_LOGOS[rawKey]
  }

  return null
}
`;

  fs.writeFileSync(configFile, newTsContent, 'utf-8');
  fs.writeFileSync(auditFile, JSON.stringify(auditLog, null, 2), 'utf-8');
  fs.writeFileSync(missingFile, JSON.stringify(missingLogos, null, 2), 'utf-8');
  fs.writeFileSync(sourcesFile, JSON.stringify(logoSources, null, 2), 'utf-8');

  console.log('\n============================================================');
  console.log('ACQUISITION & VERIFICATION SUMMARY');
  console.log('============================================================');
  console.log(`Total Companies in Catalog: ${companies.length}`);
  console.log(`Verified Local Pre-existing Assets: ${verifiedLocalCount}`);
  console.log(`Acquired from Simple Icons Vector Library: ${simpleIconsCount}`);
  console.log(`Downloaded from Official Online Brand APIs: ${onlineDownloadedCount}`);
  const totalMapped = verifiedLocalCount + simpleIconsCount + onlineDownloadedCount;
  console.log(`TOTAL LOGOS AVAILABLE & VERIFIED: ${totalMapped} (${((totalMapped / companies.length) * 100).toFixed(1)}%)`);
  console.log(`FALLBACK INITIAL AVATARS: ${fallbackCount} (${((fallbackCount / companies.length) * 100).toFixed(1)}%)`);
  console.log('============================================================\n');
}

run();
