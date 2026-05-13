import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/services/orchestrator.ts';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('contents: `CaterFlow concierge. Q: "${currentQuestionText}"'));

if (startIdx !== -1) {
    const newContent = [
        '      contents: `CaterFlow concierge. Q: "${currentQuestionText}" | User: "${trimmed}" | Lang: ${language}.',
        '',
        'STRICT VALIDATION RULE:',
        '1. If User input is just a greeting (hi, hello), "ok", "yes/no" (when not asked), or random characters/gibberish, set validation.valid = false.',
        '2. If User input does NOT answer the specific question "${currentQuestionText}", set validation.valid = false with a helpful message in ${language}.',
        '3. Only set intent.type="ANSWER" if the input provides actual catering information.',
        '',
        'Detect intent (ANSWER/LANGUAGE_CHANGE/GENERAL_REQUEST/DONE), validate strictly, give ≤8-word warm reaction.`,',
    ];
    // Replace lines from startIdx to startIdx + 1
    lines.splice(startIdx, 2, ...newContent);
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log("✓ Successfully surgicaly updated processIntake prompt");
}
