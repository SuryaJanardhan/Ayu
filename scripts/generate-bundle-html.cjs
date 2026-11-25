const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const htmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('dist/index.html not found. Run vite build first.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf8');

// Inline CSS stylesheets
const cssRegex = /<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+)"[^>]*>/g;
html = html.replace(cssRegex, (match, href) => {
  const filePath = path.join(distDir, href);
  if (fs.existsSync(filePath)) {
    const css = fs.readFileSync(filePath, 'utf8');
    return `<style>\n${css}\n</style>`;
  }
  return match;
});

// Inline JS modules
const jsRegex = /<script type="module"[^>]*src="(\/assets\/[^"]+)"[^>]*><\/script>/g;
html = html.replace(jsRegex, (match, src) => {
  const filePath = path.join(distDir, src);
  if (fs.existsSync(filePath)) {
    const js = fs.readFileSync(filePath, 'utf8');
    return `<script type="module">\n${js}\n</script>`;
  }
  return match;
});

// Output bundled HTML export file for React Native
const outputPath = path.resolve(__dirname, '..', 'bundleHtml.js');
const fileContent = `// Auto-generated bundled HTML from Vite build for Expo WebView\nmodule.exports = ${JSON.stringify(html)};\n`;

fs.writeFileSync(outputPath, fileContent, 'utf8');
console.log('Successfully generated bundleHtml.js (Size:', Math.round(fileContent.length / 1024), 'KB)');
