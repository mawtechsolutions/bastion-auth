#!/usr/bin/env node
import fs from 'fs';

const file = 'dist/index.js';
const content = fs.readFileSync(file, 'utf8');
fs.writeFileSync(file, '"use client";\n' + content);
console.log('Added "use client" directive to dist/index.js');

