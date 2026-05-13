import fs from 'fs';
import path from 'path';

const files = [
    'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/services/orchestrator.ts',
    'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/App.tsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Replace \${ with ${
        content = content.replace(/\\\$\{/g, '${');
        // Replace \` with `
        content = content.replace(/\\`/g, '`');
        fs.writeFileSync(file, content);
        console.log(`✓ Cleaned up ${path.basename(file)}`);
    }
});
