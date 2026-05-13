import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/services/orchestrator.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace ALL backticks with standard string concatenation where possible, 
// or at least ensure they are single-line and sanitized.
// This is very aggressive.
content = content.replace(/`([\s\S]*?)`/g, (match, p1) => {
    // If it contains ${}, we should be careful but let's try to convert to + concatenation if it's causing issues
    // For now, let's just flatten them to single lines first
    const flattened = match.replace(/\n/g, ' ').replace(/\r/g, '').replace(/\s+/g, ' ');
    return flattened;
});

fs.writeFileSync(filePath, content);
console.log("✓ Flattened ALL backticks in orchestrator.ts");
