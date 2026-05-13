import dotenv from 'dotenv';
dotenv.config();

console.log("--- CaterFlow Env Diagnostic ---");
console.log("FOUNDRY_PROJECT_ENDPOINT:", process.env.FOUNDRY_PROJECT_ENDPOINT ? "EXISTS" : "MISSING");
console.log("FOUNDRY_MODEL:", process.env.FOUNDRY_MODEL ? "EXISTS" : "MISSING");
console.log("FOUNDRY_API:", process.env.FOUNDRY_API ? "EXISTS" : "MISSING");
console.log("AZURE_OPENAI_API_KEY:", process.env.AZURE_OPENAI_API_KEY ? "EXISTS" : "MISSING");

const rawKey = process.env.FOUNDRY_API || "";
console.log("Key Length:", rawKey.length);
console.log("Starts with space?", rawKey.startsWith(" "));
console.log("Starts with quote?", rawKey.startsWith("\""));
console.log("---------------------------------");
