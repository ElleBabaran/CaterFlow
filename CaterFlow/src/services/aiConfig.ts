// Pool of keys from the user-provided repository to ensure high availability
// Last updated from repository: 2026-05-16 20:37 (UTC+8)

export const NATIVE_GEMINI_KEYS = [
  process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY,
  "AIzaSyDuqRQ5oZesdPvw6iv02xdN0ugqrgR2Id4",
].filter(Boolean) as string[];

export const DEEPSEEK_KEYS = [process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY].filter(Boolean) as string[];

export const GPT_KEYS = [process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY].filter(Boolean) as string[];

export const IMAGE_KEYS = [
  "sk-a2W0I3h4lwd8Y45hQWJNSBfaxHkLdlVDqamMssk5mGsy1ytj",
  "sk-gRUcKK2TjSVi1gww4oeX3Qq4j76j3afQtYKsZSFIu35qwnw9",
  "sk-hIsqrabcQ9bmnNRRRC1qUkKXFOJ8TxOABzJq7A9xUGvll85k"
];

export const THUNDERBIT_API_KEY = "tb_b0fb335ad69c8f50754b65ace26306fd";

export const BASE_URL = "https://aiapiv2.pekpik.com/v1";
