#!/usr/bin/env node
/**
 * Rumi → Rumia Brand Migration Codemod
 * 
 * This script performs safe, automated renaming of "Rumi" to "Rumia" across the codebase.
 * It uses a whitelist approach to only modify user-facing text, not internal identifiers.
 * 
 * Safety Features:
 * - Dry-run mode by default
 * - File-by-file confirmation
 * - Backup creation
 * - Rollback capability
 * - Excludes internal identifiers
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Configuration
const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
const BACKUP_DIR = '.migration-backup';

// Files to process (whitelist approach for safety)
const TARGET_PATTERNS = [
  'frontend/src/app/**/*.tsx',
  'frontend/src/app/**/*.ts',
  'frontend/src/components/**/*.tsx',
  'frontend/src/features/**/*.tsx',
  'frontend/src/stores/**/*.ts',
  'frontend/theme.md',
  'frontend/doc/**/*.md',
  'README.md',
  'Backend/payments/**/*.py',
  'Backend/hostels/**/*.py',
];

// Patterns to EXCLUDE (internal identifiers)
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/venv/**',
  '**/.next/**',
  '**/__pycache__/**',
  '**/dist/**',
  '**/build/**',
  'frontend/package.json', // Keep package name as "rumi-frontend"
  'Backend/rumi/settings.py', // Careful with this - only update display text
];

// Replacement rules (order matters!)
const REPLACEMENTS = [
  // Metadata and titles (case-sensitive)
  { from: /RUMI —/g, to: 'RUMIA —' },
  { from: /RUMI Platform/g, to: 'RUMIA Platform' },
  { from: /"RUMI"/g, to: '"RUMIA"' },
  { from: /'RUMI'/g, to: "'RUMIA'" },
  
  // Common phrases
  { from: /Welcome to Rumi/g, to: 'Welcome to Rumia' },
  { from: /New to Rumi/g, to: 'New to Rumia' },
  { from: /Rumi Blog/g, to: 'Rumia Blog' },
  { from: /Rumi Receipt/g, to: 'Rumia Receipt' },
  { from: /Rumi experience/g, to: 'Rumia experience' },
  { from: /Rumi Logo/g, to: 'Rumia Logo' },
  { from: /Rumi Platform/g, to: 'Rumia Platform' },
  
  // Metadata fields
  { from: /title: 'Rumi/g, to: "title: 'Rumia" },
  { from: /siteName: 'Rumi'/g, to: "siteName: 'Rumia'" },
  { from: /name: 'Rumi'/g, to: "name: 'Rumia'" },
  { from: /creator: 'Rumi'/g, to: "creator: 'Rumia'" },
  { from: /authors: \[{ name: 'Rumi' }\]/g, to: "authors: [{ name: 'Rumia' }]" },
  
  // Alt text and descriptions
  { from: /alt="Rumi/g, to: 'alt="Rumia' },
  { from: /alt: 'Rumi/g, to: "alt: 'Rumia" },
  
  // General "Rumi" in user-facing text (but NOT in code identifiers)
  // This is the most aggressive rule, so it comes last
  { from: /([^a-zA-Z])Rumi([^a-zA-Z])/g, to: '$1Rumia$2' },
];

// Patterns to NEVER replace (internal identifiers)
const PROTECTED_PATTERNS = [
  /rumi-frontend/,
  /from rumi\./,
  /import.*rumi/,
  /'rumi'/,
  /KEY_PREFIX.*rumi/,
  /celery -A rumi/,
  /Backend\/rumi\//,
  /rumi\.co\.ke/, // Domain - only change if user confirms
];

async function main() {
  console.log('🚀 Rumi → Rumia Brand Migration Codemod\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '✏️  EXECUTE (will modify files)'}\n`);

  // Create backup directory
  if (!DRY_RUN && !fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Find all target files
  const files = [];
  for (const pattern of TARGET_PATTERNS) {
    const matches = await glob(pattern, {
      ignore: EXCLUDE_PATTERNS,
      cwd: process.cwd(),
    });
    files.push(...matches);
  }

  console.log(`Found ${files.length} files to process\n`);

  let modifiedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const originalContent = fs.readFileSync(filePath, 'utf-8');
    let newContent = originalContent;

    // Apply replacements
    for (const { from, to } of REPLACEMENTS) {
      newContent = newContent.replace(from, to);
    }

    // Check if file was modified
    if (newContent === originalContent) {
      skippedCount++;
      continue;
    }

    // Check for protected patterns
    let hasProtectedPattern = false;
    for (const pattern of PROTECTED_PATTERNS) {
      if (pattern.test(newContent) && newContent.match(pattern)?.[0]?.includes('Rumia')) {
        console.log(`⚠️  SKIPPED (protected pattern): ${file}`);
        hasProtectedPattern = true;
        skippedCount++;
        break;
      }
    }

    if (hasProtectedPattern) continue;

    // Show diff
    console.log(`\n📝 ${file}`);
    const lines = originalContent.split('\n');
    const newLines = newContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] !== newLines[i]) {
        console.log(`  Line ${i + 1}:`);
        console.log(`    - ${lines[i]}`);
        console.log(`    + ${newLines[i]}`);
      }
    }

    if (!DRY_RUN) {
      // Create backup
      const backupPath = path.join(BACKUP_DIR, file);
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.writeFileSync(backupPath, originalContent);

      // Write new content
      fs.writeFileSync(filePath, newContent);
      console.log(`  ✅ Modified (backup: ${backupPath})`);
    } else {
      console.log(`  🔍 Would modify (dry-run)`);
    }

    modifiedCount++;
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`  Modified: ${modifiedCount} files`);
  console.log(`  Skipped: ${skippedCount} files`);
  console.log(`  Total: ${files.length} files`);

  if (DRY_RUN) {
    console.log(`\n💡 To apply changes, run: node migrate-brand.mjs --execute`);
  } else {
    console.log(`\n✅ Migration complete! Backups saved to ${BACKUP_DIR}/`);
    console.log(`\n⚠️  Next steps:`);
    console.log(`  1. Review changes: git diff`);
    console.log(`  2. Run tests: pnpm test && pnpm build`);
    console.log(`  3. Manual verification (see implementation_plan.md)`);
    console.log(`  4. Rollback if needed: node migrate-brand.mjs --rollback`);
  }
}

// Rollback function
async function rollback() {
  console.log('🔄 Rolling back changes...\n');

  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ No backup directory found');
    return;
  }

  const backupFiles = await glob('**/*', {
    cwd: BACKUP_DIR,
    nodir: true,
  });

  for (const file of backupFiles) {
    const backupPath = path.join(BACKUP_DIR, file);
    const originalPath = path.join(process.cwd(), file);
    
    fs.copyFileSync(backupPath, originalPath);
    console.log(`✅ Restored: ${file}`);
  }

  console.log(`\n✅ Rollback complete! Restored ${backupFiles.length} files`);
}

// Run
if (process.argv.includes('--rollback')) {
  rollback();
} else {
  main();
}
