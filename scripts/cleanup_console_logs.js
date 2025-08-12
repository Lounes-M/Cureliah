#!/usr/bin/env node

/**
 * Script pour nettoyer et remplacer tous les console.log restants par le système de logging centralisé
 * Partie de l'audit de sécurité pour éviter l'exposition de données sensibles
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const srcPath = 'src';
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Patterns à remplacer
const patterns = [
  {
    pattern: /console\.(log|info)\((.*?)\);?/g,
    replacement: (match, method, args) => {
      // Éviter de remplacer les logs dans logger.ts et monitoring.ts
      return `// TODO: Replace with logger.info(${args});`;
    }
  },
  {
    pattern: /console\.warn\((.*?)\);?/g,
    replacement: (match, args) => `// TODO: Replace with logger.warn(${args});`
  },
  {
    pattern: /console\.error\((.*?)\);?/g,
    replacement: (match, args) => `// TODO: Replace with logger.error(${args});`
  }
];

// Fichiers à exclure du remplacement
const excludeFiles = [
  'logger.ts',
  'monitoring.ts',
  'monitoringCache.ts'
];

function getAllFiles(dir) {
  const files = [];
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (extensions.includes(extname(item))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function shouldExcludeFile(filePath) {
  return excludeFiles.some(exclude => filePath.includes(exclude));
}

function processFile(filePath) {
  if (shouldExcludeFile(filePath)) {
    console.log(`⚠️ Skipping ${filePath} (excluded)`);
    return 0;
  }
  
  try {
    const content = readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let replacements = 0;
    
    patterns.forEach(({ pattern, replacement }) => {
      const matches = modifiedContent.match(pattern);
      if (matches) {
        replacements += matches.length;
        modifiedContent = modifiedContent.replace(pattern, replacement);
      }
    });
    
    if (replacements > 0) {
      writeFileSync(filePath, modifiedContent);
      console.log(`✅ ${filePath}: ${replacements} console statements replaced`);
    }
    
    return replacements;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function main() {
  console.log('🧹 Nettoyage des console.log pour sécurité...\n');
  
  const files = getAllFiles(srcPath);
  let totalReplacements = 0;
  
  files.forEach(file => {
    totalReplacements += processFile(file);
  });
  
  console.log(`\n✅ Terminé: ${totalReplacements} console statements traités`);
  console.log('📋 Les TODO comments ont été ajoutés pour migration manuelle vers logger');
  console.log('🔐 Réduction des risques de sécurité par exposition de données');
}

main();
