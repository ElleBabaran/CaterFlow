import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/services/orchestrator.ts';
let content = fs.readFileSync(filePath, 'utf8');

const oldPrompt = 'contents: `Q: "${questionText}" A: "${normalizedAnswer}". Is A gibberish/meaningless? Reply only: VALID or INVALID: <short message in ${lang}>`,';
const newPrompt = 'contents: `You are a strict validator for a catering planner.\n' +
  'Q: "${questionText}"\n' +
  'User Answer: "${normalizedAnswer}"\n\n' +
  'Is the User\'s answer actually answering the question or providing relevant context? \n' +
  '- If the user says "hi", "hello", "keyboard smash", or something unrelated to catering/the question, it is INVALID.\n' +
  '- If it\'s a valid answer or provides new catering info, it is VALID.\n\n' +
  'Reply only: VALID or INVALID: <short helpful message in ${lang} explaining why and asking again>`,';

if (content.includes(oldPrompt)) {
    content = content.replace(oldPrompt, newPrompt);
}

fs.writeFileSync(filePath, content);
console.log("✓ Successfully hardened validateUserResponse prompt in orchestrator.ts");
