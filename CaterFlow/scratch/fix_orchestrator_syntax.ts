import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/services/orchestrator.ts';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const idx = lines.findIndex(l => l.includes('contents: `CaterFlow concierge. Answered "${questionText}"'));

if (idx !== -1) {
    lines[idx-2] = '    const response = await ai!.models.generateContent({';
    lines[idx] = "      contents: 'CaterFlow concierge. Answered \\'' + questionText + '\\': \\'' + userAnswer + '\\'. Language: ' + language + '. Write ≤8-word warm acknowledgement, then on new line: \\'' + nextQuestion + '\\'. No JSON, plain text only.'";
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log("✓ Fixed syntax in generateConversationalPrompt");
}
