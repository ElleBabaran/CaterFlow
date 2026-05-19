const fs = require('fs');
const postcss = require('postcss');

const css = fs.readFileSync('src/index.css', 'utf8');

postcss([])
  .process(css, { from: 'src/index.css' })
  .then(result => {
    console.log('PostCSS parsed successfully!');
  })
  .catch(err => {
    console.error('PostCSS error:', err.message);
    if (err.showSourceCode) {
      console.error(err.showSourceCode());
    }
  });
