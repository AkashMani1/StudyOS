/**
 * StudyOS Strapi Setup Utility
 * 
 * This script automates the creation of a Strapi project with the 
 * required content types for StudyOS performance optimization.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const STRAPI_DIR = path.join(PROJECT_ROOT, 'cms-strapi');
const SCHEMAS_FILE = path.join(PROJECT_ROOT, 'strapi', 'schemas.json');

console.log('🚀 Starting StudyOS Strapi Setup...');

// 1. Create Strapi Project (Quickstart)
if (!fs.existsSync(STRAPI_DIR)) {
  console.log('📂 Creating new Strapi project in ./cms-strapi...');
  try {
    execSync(`npx create-strapi-app@latest ${STRAPI_DIR} --quickstart --no-run`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to create Strapi app:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Strapi project already exists.');
}

// 2. Load Schemas
if (!fs.existsSync(SCHEMAS_FILE)) {
  console.error('❌ Schemas file not found at:', SCHEMAS_FILE);
  process.exit(1);
}

const schemas = JSON.parse(fs.readFileSync(SCHEMAS_FILE, 'utf8'));

console.log('🛠️ Registering StudyOS Schemas...');
console.log('ℹ️  Note: This script currently provides the schemas to assist manual setup in Strapi Admin.');
console.log('   In a future update, this will automatically inject schemas into the Strapi file system.');

console.log('\n--- Content Types to Create ---');
Object.keys(schemas).forEach(key => {
  console.log(`- ${key} (${schemas[key].kind})`);
});

console.log('\n✅ Setup partial. Next steps:');
console.log('1. cd cms-strapi');
console.log('2. npm run dev');
// console.log('3. Open http://localhost:1337/admin and create the Content Types using the provided schemas.json.');
console.log('3. Use the Content-Type Builder in Strapi to create these models with the attributes defined in /strapi/schemas.json.');
console.log('\nHappy Coding!');
