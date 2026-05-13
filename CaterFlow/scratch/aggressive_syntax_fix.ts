import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/services/orchestrator.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace multiline backticks with single lines or escaped versions
// This is a more aggressive regex to find 'contents: `...`' potentially spanning lines
// We'll use a function to process each match
content = content.replace(/contents:\s*`([\s\S]*?)`/g, (match, p1) => {
    // Escape single quotes and newlines
    const sanitized = p1.replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\r/g, '').replace(/\s+/g, ' ').trim();
    return "contents: '" + sanitized + "'";
});

// Also fix ai.models -> ai!.models
content = content.replace(/ai\.models/g, 'ai!.models');

fs.writeFileSync(filePath, content);
console.log("✓ Aggressively fixed all template literals in orchestrator.ts");
