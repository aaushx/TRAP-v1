const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const dbFile = path.resolve(projectRoot, '../backend/all_companies_db.json');
const assetsDir = path.resolve(projectRoot, 'public/assets/company-logos');
const legacyDir = path.resolve(projectRoot, 'public/company-logos');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}
if (!fs.existsSync(legacyDir)) {
  fs.mkdirSync(legacyDir, { recursive: true });
}

const companies = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
console.log(`Loaded ${companies.length} catalog companies.`);
