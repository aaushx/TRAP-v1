/**
 * TRAP — Company Logo Migration Script
 * 
 * Safely moves existing unverified local logo assets to _legacy/
 * without deleting them, recording an inventory of legacy assets.
 */
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../frontend/public/assets/company-logos');
const legacyDir = path.join(baseDir, '_legacy');

if (!fs.existsSync(legacyDir)) {
  fs.mkdirSync(legacyDir, { recursive: true });
}

// 1. Inventory current files
const files = fs.readdirSync(baseDir).filter(f => f !== '_legacy' && fs.statSync(path.join(baseDir, f)).isFile());
console.log(`Found ${files.length} assets to migrate to _legacy.`);

const inventory = [];

for (const file of files) {
  const src = path.join(baseDir, file);
  const dest = path.join(legacyDir, file);
  
  const stats = fs.statSync(src);
  inventory.push({
    file,
    size: stats.size,
    legacyPath: `/assets/company-logos/_legacy/${file}`,
    migratedAt: new Date().toISOString()
  });

  // Copy to legacy if not already present
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
  
  // Remove from unapproved root dir
  fs.unlinkSync(src);
}

// Save inventory
const inventoryPath = path.resolve(__dirname, '../frontend/public/assets/company-logos/_legacy/inventory.json');
fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));

console.log(`Successfully migrated ${files.length} assets to _legacy. Saved inventory to ${inventoryPath}.`);
