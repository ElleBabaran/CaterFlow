import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/services/orchestrator.ts';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('function validateAnswerDeterministically'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.trim() === '}');

if (startIdx !== -1 && endIdx !== -1) {
    const newBody = [
        'function validateAnswerDeterministically(questionKey: string, questionText: string, answer: string, preferredLanguage: string) {',
        '  const lang = (preferredLanguage || "english").toLowerCase();',
        '  const trimmed = answer.trim();',
        '',
        '  // Basic Length/Gibberish Checks',
        '  if (!trimmed || trimmed.length < 2) {',
        '    return { valid: false, message: "Please give a bit more detail so I can continue.", confident: true };',
        '  }',
        '',
        '  if (/^(.)\\1{4,}$/.test(trimmed) || /asdf|qwerty|zxczxc|lorem|12345/i.test(trimmed)) {',
        '    return { valid: false, message: "That looks unclear. Please send a meaningful answer so I can proceed.", confident: true };',
        '  }',
        '',
        '  // Common unrelated greetings/phrases',
        '  if (/^(hi|hello|hey|test|testing|yo|sup|hola|greeting)$/i.test(trimmed)) {',
        '     return { valid: false, message: "I heard your greeting! But could you please answer the question so we can start planning?", confident: true };',
        '  }',
        '',
        '  // Question-Specific Deterministic Validation',
        "  if (questionKey === 'preferred_language') {",
        "    const validLangs = ['english', 'tagalog', 'filipino', 'spanish', 'japanese', 'chinese', 'mandarin', 'itallian', 'french', 'german'];",
        '    const matches = validLangs.some(l => trimmed.toLowerCase().includes(l));',
        '    if (!matches) return { valid: false, message: "Please choose a language: English, Tagalog, Spanish, Japanese, or Chinese.", confident: false };',
        '  }',
        '',
        "  if (questionKey === 'guest_count') {",
        '    const hasNumber = /\\d+/.test(trimmed);',
        '    if (!hasNumber) return { valid: false, message: "Please include the guest count (number).", confident: true };',
        '    if (trimmed.match(/^\\d+$/)) return { valid: true, confident: true };',
        '  }',
        '',
        "  if (questionKey === 'budget') {",
        '    const hasNumber = /\\d/.test(trimmed);',
        '    if (!hasNumber) return { valid: false, message: "Please include a numeric budget amount.", confident: true };',
        '  }',
        '',
        "  if (questionKey === 'nearby_suggestions') {",
        '    const isYesNo = /^(yes|no|oo|hindi|si|no|y|n|ok|okay)$/i.test(trimmed);',
        '    if (!isYesNo) return { valid: false, message: "Please answer with Yes or No.", confident: false };',
        '  }',
        '',
        '  // Fallback for general text',
        '  return { valid: true, confident: false };',
        '}'
    ];
    lines.splice(startIdx, endIdx - startIdx + 1, ...newBody);
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log("✓ Successfully surgicaly updated validateAnswerDeterministically");
}
