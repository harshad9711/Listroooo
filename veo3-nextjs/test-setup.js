#!/usr/bin/env node

// Simple test script to verify the Veo 3 Next.js setup
console.log('🧪 Testing Veo 3 Next.js Setup...\n');

// Test 1: Check if all required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'prisma/schema.prisma',
  'src/lib/prisma.ts',
  'src/lib/auth.ts',
  'src/lib/veo-schema.ts',
  'src/lib/veo-llm.ts',
  'src/lib/veo-render.ts',
  'src/lib/veo-storage.ts',
  'src/lib/useApi.tsx',
  'src/app/api/veo/idea-to-json/route.ts',
  'src/app/api/veo/prompts/route.ts',
  'src/app/api/veo/export/route.ts',
  'src/app/api/veo/send/route.ts',
  'src/app/page.tsx'
];

console.log('📁 Checking required files...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n✅ All required files exist!');
} else {
  console.log('\n❌ Some files are missing. Please check the setup.');
  process.exit(1);
}

// Test 2: Check package.json dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  '@prisma/client',
  'prisma',
  '@aws-sdk/client-s3',
  '@aws-sdk/s3-request-presigner',
  '@supabase/auth-helpers-nextjs',
  '@supabase/supabase-js',
  'zod'
];

let allDepsExist = true;
requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    allDepsExist = false;
  }
});

if (allDepsExist) {
  console.log('\n✅ All required dependencies are installed!');
} else {
  console.log('\n❌ Some dependencies are missing. Run: npm install');
  process.exit(1);
}

// Test 3: Check environment file
console.log('\n🔧 Checking environment setup...');
if (fs.existsSync('.env.local')) {
  console.log('✅ .env.local exists');
} else {
  console.log('⚠️  .env.local not found - copy from env.example and configure');
}

console.log('\n🎉 Setup verification complete!');
console.log('\nNext steps:');
console.log('1. Copy env.example to .env.local and configure your environment variables');
console.log('2. Run: npm run db:migrate (to set up the database)');
console.log('3. Run: npm run dev (to start the development server)');
console.log('4. Visit http://localhost:3000 to test the application');
