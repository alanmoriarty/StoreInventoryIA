const fs = require('fs');
const path = require('path');

const directory = './'; // current dir

const replacements = [
  { regex: /bg-gray-100/g, replacement: 'bg-brand-bg' },
  { regex: /text-gray-[789]00/g, replacement: 'text-brand-darkest' },
  { regex: /text-gray-[56]00/g, replacement: 'text-brand-dark' },
  { regex: /text-gray-[34]00/g, replacement: 'text-brand-base' },
  
  { regex: /bg-(indigo|blue|green)-[56]00/g, replacement: 'bg-brand-base' },
  { regex: /hover:bg-(indigo|blue|green)-[67]00/g, replacement: 'hover:bg-brand-dark' },
  { regex: /text-(indigo|blue|green)-[56]00/g, replacement: 'text-brand-base' },
  
  { regex: /bg-red-[56]00/g, replacement: 'bg-brand-dark' },
  { regex: /hover:bg-red-[67]00/g, replacement: 'hover:bg-brand-darkest' },
  { regex: /text-red-[56]00/g, replacement: 'text-brand-dark' },
  
  { regex: /bg-yellow-[56]00/g, replacement: 'bg-brand-light' },
  { regex: /text-yellow-[56]00/g, replacement: 'text-brand-light' },
  
  { regex: /border-gray-[23]00/g, replacement: 'border-brand-dark/20' },
  { regex: /border-(green|red|yellow)-[23]00/g, replacement: 'border-brand-base/30' },
  
  { regex: /bg-(gray|green|red|yellow)-50/g, replacement: 'bg-brand-muted/20' },
  { regex: /bg-(green|red|yellow)-100/g, replacement: 'bg-brand-muted' },
  
  { regex: /text-(green|red|yellow)-700/g, replacement: 'text-brand-darkest' },
  { regex: /text-(green|red|yellow)-[56]00/g, replacement: 'text-brand-dark' },
  
  { regex: /bg-slate-500/g, replacement: 'bg-brand-darkest' },
  
  { regex: /ring-indigo-[45]00/g, replacement: 'ring-brand-base' },
  { regex: /focus:ring-indigo-[45]00/g, replacement: 'focus:ring-brand-base' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  
  for (const { regex, replacement } of replacements) {
    newContent = newContent.replace(regex, replacement);
  }
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('.git') && !fullPath.includes('.idea') && !fullPath.includes('node_modules')) {
        traverseDir(fullPath);
      }
    } else {
      if (fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
        if (!fullPath.includes('refactor_colors.js')) {
            processFile(fullPath);
        }
      }
    }
  }
}

traverseDir(directory);
console.log("Done refactoring colors.");
