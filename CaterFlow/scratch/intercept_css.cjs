const vite = require('vite');
const tailwindcss = require('@tailwindcss/vite').default;
const react = require('@vitejs/plugin-react');
const path = require('path');

let lastCssCode = '';

vite.build({
  root: '.',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'intercept-css',
      transform(code, id) {
        if (id.includes('index.css')) {
          lastCssCode = code;
        }
        return null;
      }
    }
  ],
  define: {
    'process.env': {},
    'process': { env: {} },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '..'),
    },
  },
  logLevel: 'silent' // suppress output to only see our debug log
}).then(() => {
  console.log('Build succeeded programmatically!');
}).catch(err => {
  console.log('Build failed programmatically!');
  console.log('Error message:', err.message);
  
  // Extract index from error message
  // e.g. "index.css:2:71361: Missed semicolon"
  const match = err.message.match(/:(\d+):(\d+):/);
  let target = 71361;
  if (match) {
    target = parseInt(match[2], 10);
    console.log('Extracted target column index:', target);
  }

  if (lastCssCode) {
    console.log('Last captured CSS length:', lastCssCode.length);
    console.log('=== CSS Content Around Error ===');
    const start = Math.max(0, target - 300);
    const end = Math.min(lastCssCode.length, target + 300);
    
    // Print with a marker at the exact column
    const slice = lastCssCode.substring(start, end);
    const relativeMarkerPos = target - start;
    
    console.log(slice.substring(0, relativeMarkerPos) + " [>>> ERROR HERE <<<] " + slice.substring(relativeMarkerPos));
    console.log('================================');
  } else {
    console.log('No CSS code captured before failure.');
  }
});
