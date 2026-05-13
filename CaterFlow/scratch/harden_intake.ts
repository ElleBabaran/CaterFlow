import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/services/orchestrator.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update processIntake AI Prompt
const oldIntakePrompt = 'contents: `CaterFlow concierge. Q: "${currentQuestionText}" | User: "${trimmed}" | Lang: ${language}.\nDetect intent (ANSWER/LANGUAGE_CHANGE/GENERAL_REQUEST/DONE), validate (not gibberish), give ≤8-word reaction.`,';
const newIntakePrompt = 'contents: `CaterFlow concierge. Q: "${currentQuestionText}" | User: "${trimmed}" | Lang: ${language}.\n\n' +
  'STRICT VALIDATION RULE:\n' +
  '1. If User input is just a greeting (hi, hello), "ok", "yes/no" (when not asked), or random characters/gibberish, set validation.valid = false.\n' +
  '2. If User input does NOT answer the specific question "${currentQuestionText}", set validation.valid = false with a helpful message in ${language}.\n' +
  '3. Only set intent.type="ANSWER" if the input provides actual catering information.\n\n' +
  'Detect intent (ANSWER/LANGUAGE_CHANGE/GENERAL_REQUEST/DONE), validate strictly, give ≤8-word warm reaction.`,';

content = content.replace(oldIntakePrompt, newIntakePrompt);

// 2. Update validateAnswerDeterministically
const oldValidationBody = `function validateAnswerDeterministically(questionKey: string, questionText: string, answer: string, preferredLanguage: string) {
  const lang = (preferredLanguage || "english").toLowerCase();
  if (!answer || answer.length < 2) {
    return { valid: false, message: "Please give a bit more detail so I can continue.", confident: true };
  }

  if (/^(.)\\1{4,}$/.test(answer) || /asdf|qwerty|zxczxc|lorem|12345/i.test(answer)) {
    return { valid: false, message: "That looks unclear. Please send a meaningful answer so I can proceed.", confident: true };
  }

  const clean = answer.replace(/[\\s\\p{P}\\p{S}]/gu, "");
  if (clean.length >= 6 && !/[aeiou0-9]/i.test(clean) && !lang.includes("chinese")) {
    return { valid: false, message: "I could not understand that response. Please answer in words or numbers.", confident: true };
  }

  if (questionKey === 'guest_count') {
    const hasNumber = /\\d+/.test(answer);
    if (!hasNumber) return { valid: false, message: "Please include the guest count (number).", confident: true };
    if (answer.trim().match(/^\\d+$/)) return { valid: true, confident: true };
  }

  if (questionKey === 'budget') {
    const hasNumber = /\\d/.test(answer);
    if (!hasNumber) return { valid: false, message: "Please include a numeric budget amount.", confident: true };
  }

  // If it's a very simple answer and we are not in a complex question
  if (answer.length < 15 && !/food|cuisine|dietary/i.test(questionText)) {
     return { valid: true, confident: true };
  }

  return { valid: true, confident: false };
}`;

const newValidationBody = `function validateAnswerDeterministically(questionKey: string, questionText: string, answer: string, preferredLanguage: string) {
  const lang = (preferredLanguage || "english").toLowerCase();
  const trimmed = answer.trim();

  // Basic Length/Gibberish Checks
  if (!trimmed || trimmed.length < 2) {
    return { valid: false, message: "Please give a bit more detail so I can continue.", confident: true };
  }

  if (/^(.)\\1{4,}$/.test(trimmed) || /asdf|qwerty|zxczxc|lorem|12345/i.test(trimmed)) {
    return { valid: false, message: "That looks unclear. Please send a meaningful answer so I can proceed.", confident: true };
  }

  // Common unrelated greetings/phrases
  if (/^(hi|hello|hey|test|testing|yo|sup|hola|greeting)$/i.test(trimmed)) {
     return { valid: false, message: "I heard your greeting! But could you please answer the question so we can start planning?", confident: true };
  }

  // Question-Specific Deterministic Validation
  if (questionKey === 'preferred_language') {
    const validLangs = ['english', 'tagalog', 'filipino', 'spanish', 'japanese', 'chinese', 'mandarin', 'itallian', 'french', 'german'];
    const matches = validLangs.some(l => trimmed.toLowerCase().includes(l));
    if (!matches) return { valid: false, message: "Please choose a language: English, Tagalog, Spanish, Japanese, or Chinese.", confident: false };
  }

  if (questionKey === 'guest_count') {
    const hasNumber = /\\d+/.test(trimmed);
    if (!hasNumber) return { valid: false, message: "Please include the guest count (number).", confident: true };
    if (trimmed.match(/^\\d+$/)) return { valid: true, confident: true };
  }

  if (questionKey === 'budget') {
    const hasNumber = /\\d/.test(trimmed);
    if (!hasNumber) return { valid: false, message: "Please include a numeric budget amount.", confident: true };
  }

  if (questionKey === 'nearby_suggestions') {
    const isYesNo = /^(yes|no|oo|hindi|si|no|y|n|ok|okay)$/i.test(trimmed);
    if (!isYesNo) return { valid: false, message: "Please answer with Yes or No.", confident: false };
  }

  // Fallback for general text
  return { valid: true, confident: false };
}`;

content = content.replace(oldValidationBody, newValidationBody);

fs.writeFileSync(filePath, content);
console.log("✓ Successfully hardened Intake Validation in orchestrator.ts");
