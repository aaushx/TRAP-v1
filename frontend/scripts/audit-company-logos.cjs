#!/usr/bin/env node
/**
 * TRAP — Company Logo Validation & Audit Engine
 * 
 * Verifies 100% of companies in the catalog against the local SVG/PNG asset registry,
 * enforcing identity normalization, local file existence, readability, and zero external runtime URLs.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const dbFile = path.resolve(projectRoot, '../backend/all_companies_db.json');
const registryFile = path.resolve(projectRoot, 'src/config/companyLogoRegistry.ts');
const logoAuditJsonFile = path.resolve(projectRoot, '../backend/logo-audit.json');
const logoAuditJsonFrontend = path.resolve(projectRoot, 'src/config/logo-audit.json');

if (!fs.existsSync(dbFile)) {
  console.error(`[Error] Catalog database file not found at ${dbFile}`);
  process.exit(1);
}

const companies = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));

const manifestFile = path.resolve(projectRoot, 'src/config/company-logo-manifest.json');

let registry = {};
if (fs.existsSync(manifestFile)) {
  const manifestData = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
  for (const entry of manifestData) {
    const slug = (entry.logoFile || '').replace(/\.[^/.]+$/, '').toLowerCase().trim();
    registry[slug] = {
      ...entry,
      slug,
      logoVerified: entry.status === 'VERIFIED',
      assetPath: entry.localPath || `/assets/company-logos/${entry.logoFile}`,
    };
  }
} else {
  console.error(`[Error] Manifest file not found at ${manifestFile}`);
  process.exit(1);
}

console.log('============================================================');
console.log('TRAP — COMPANY LOGO AUDIT REPORT');
console.log('============================================================\n');

let totalCompanies = companies.length;
let verifiedCount = 0;
let fallbackCount = 0;
let missingCount = 0;
let brokenCount = 0;
let duplicateCount = 0;
let suspectedWrongCount = 0;

const brokenAssets = [];
const verifiedLogos = [];
const fallbackList = [];
const assetUsage = new Map();

for (const company of companies) {
  const slug = company.slug.toLowerCase().trim();
  const identity = registry[slug];

  if (!identity) {
    missingCount++;
    continue;
  }

  if (identity.logoVerified && identity.assetPath) {
    // Ensure no external URLs are used
    if (identity.assetPath.startsWith('http://') || identity.assetPath.startsWith('https://')) {
      suspectedWrongCount++;
      brokenAssets.push({ company: company.name, slug, url: identity.assetPath, reason: 'External URL used at runtime' });
      continue;
    }

    const relativeDiskPath = identity.assetPath.replace(/^\//, '');
    const localPath = path.resolve(projectRoot, 'public', relativeDiskPath);

    if (fs.existsSync(localPath)) {
      const stat = fs.statSync(localPath);
      if (stat.size > 20) {
        verifiedCount++;
        verifiedLogos.push(company);

        // Check duplicate asset usage
        if (assetUsage.has(identity.assetPath)) {
          const prevComp = assetUsage.get(identity.assetPath);
          if (prevComp !== company.name) {
            duplicateCount++;
          }
        } else {
          assetUsage.set(identity.assetPath, company.name);
        }
      } else {
        brokenCount++;
        brokenAssets.push({ company: company.name, slug, url: identity.assetPath, reason: 'File empty or corrupted (<20 bytes)' });
      }
    } else {
      brokenCount++;
      brokenAssets.push({ company: company.name, slug, url: identity.assetPath, reason: 'Local asset file not found on disk' });
    }
  } else {
    fallbackCount++;
    fallbackList.push({ company: company.name, slug, questionCount: company.question_count });
  }
}

const auditSummary = {
  totalCompanies,
  verified: verifiedCount,
  missing: missingCount,
  fallback: fallbackCount,
  suspectedWrong: suspectedWrongCount,
  broken: brokenCount,
  duplicate: duplicateCount,
  timestamp: new Date().toISOString(),
  fallbackCompanies: fallbackList
};

fs.writeFileSync(logoAuditJsonFile, JSON.stringify(auditSummary, null, 2), 'utf-8');
fs.writeFileSync(logoAuditJsonFrontend, JSON.stringify(auditSummary, null, 2), 'utf-8');

console.log(`Total Companies in Catalog: ${totalCompanies}`);
console.log(`Verified Real Logos: ${verifiedCount} (${((verifiedCount / totalCompanies) * 100).toFixed(1)}%)`);
console.log(`Fallback Initials: ${fallbackCount} (${((fallbackCount / totalCompanies) * 100).toFixed(1)}%)`);
console.log(`Missing Entries: ${missingCount}`);
console.log(`Broken Assets: ${brokenCount}`);
console.log(`Suspected Wrong / External URLs: ${suspectedWrongCount}`);
console.log(`Duplicate Asset Files: ${duplicateCount}`);

if (brokenAssets.length > 0) {
  console.log('\n[Warning] Broken Assets Found:');
  brokenAssets.forEach(b => console.log(`  ✗ ${b.company} (${b.slug}) -> ${b.url}: ${b.reason}`));
} else {
  console.log('\n✓ 100% of verified logo assets exist on disk, are non-empty, and use zero external URLs.');
}

console.log('\nAudit report successfully written to backend/logo-audit.json & frontend/src/config/logo-audit.json.');
console.log('============================================================');
