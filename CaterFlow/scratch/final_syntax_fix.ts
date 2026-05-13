import fs from 'fs';

const filePath = 'c:/Users/Aron/Desktop/caterFlow/CaterFlow/src/services/orchestrator.ts';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Fix all ai.models calls and template literals in contents
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ai.models.generateContent')) {
        lines[i] = lines[i].replace('ai.models.generateContent', 'ai!.models.generateContent');
    }
    
    // If line has a template literal start that might be problematic
    if (lines[i].includes('contents: `')) {
        // Simple check to see if it's the start of a multiline backtick
        if (lines[i].includes('`') && !lines[i].includes('`,') && !lines[i].includes('`}') && !lines[i].includes('`);')) {
             // It's a multiline backtick. Let's try to make it single line or use standard strings for the failing ones
             if (lines[i].includes('You are the CaterFlow Concierge Agent')) {
                 lines[i] = "      contents: 'You are the CaterFlow Concierge Agent (Phase 1). Analyze this input: \"' + input + '\". CRITICAL RULE 1: If the input is random, gibberish, or completely unrelated to catering (e.g., \"how are you\"), set event_type to \"INVALID_REQUEST\". CRITICAL RULE 2: Respond and extract information in the SAME LANGUAGE as the user\\'s input. Extract ALL fields mentioned: event_type, guests, budget, location, date, dietary_needs, cuisine_preference, service_style, special_requests, food_choice_mode, specific_food_items, menu_composition, portion_control_mode.',";
                 // Skip next lines until the end of the old backtick
                 let j = i + 1;
                 while (j < lines.length && !lines[j].includes('`,')) {
                     lines[j] = "";
                     j++;
                 }
                 if (j < lines.length) lines[j] = ""; // Clear the closing backtick line
             }
        }
    }
}

fs.writeFileSync(filePath, lines.filter(l => l !== "").join('\n'));
console.log("✓ Flattened and fixed problematic template literals in orchestrator.ts");
