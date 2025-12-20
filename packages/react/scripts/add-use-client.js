#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'dist', 'index.js');

try {
  const content = fs.readFileSync(file, 'utf8');
  
  // Check if already has the directive
  if (!content.startsWith('"use client"')) {
    fs.writeFileSync(file, '"use client";\n' + content);
    console.log('Added "use client" directive to dist/index.js');
  } else {
    console.log('dist/index.js already has "use client" directive');
  }
} catch (error) {
  console.error('Error adding "use client" directive:', error.message);
  process.exit(1);
}
