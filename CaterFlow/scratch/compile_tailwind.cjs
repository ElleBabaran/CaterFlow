const fs = require('fs');
const postcss = require('postcss');

try {
  const css = fs.readFileSync('src/index.css', 'utf8');
  // In Tailwind v4, postcss plugin is @tailwindcss/postcss
  const tailwindcss = require('@tailwindcss/postcss');

  postcss([tailwindcss])
    .process(css, { from: 'src/index.css' })
    .then(result => {
      fs.writeFileSync('scratch/output.css', result.css);
      console.log('Success compiling with PostCSS + Tailwind!');
    })
    .catch(err => {
      console.error('PostCSS compilation error:');
      console.error(err.message);
      if (err.showSourceCode) {
        console.error(err.showSourceCode());
      }
    });
} catch (e) {
  console.error('Script error:', e);
}
