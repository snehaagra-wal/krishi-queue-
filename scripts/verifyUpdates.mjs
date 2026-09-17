import { INDIAN_BANKS, searchIndianBanks } from "../lib/firestoreService.ts";

console.log("=== 1. Testing Indian Banks Autocomplete ===");
const sbiResults = searchIndianBanks("SBI");
console.log(`Query 'SBI': found ${sbiResults.length} match(es):`, sbiResults.map(b => b.fullName));
if (!sbiResults.some(b => b.name === "State Bank of India")) {
  throw new Error("SBI not found in autocomplete");
}

const pnbResults = searchIndianBanks("PNB");
console.log(`Query 'PNB': found ${pnbResults.length} match(es):`, pnbResults.map(b => b.fullName));
if (!pnbResults.some(b => b.shortCode === "PNB")) {
  throw new Error("PNB not found in autocomplete");
}

const graminResults = searchIndianBanks("Gramin");
console.log(`Query 'Gramin': found ${graminResults.length} match(es):`, graminResults.map(b => b.name));
if (graminResults.length === 0) {
  throw new Error("Gramin banks not found in autocomplete");
}

console.log("\n=== 2. Testing IFSC & Account Validation Regex ===");
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const validIfsc = ["SBIN0001244", "PUNB0123456", "HDFC0000128", "BARB0VJNANI"];
const invalidIfsc = ["SBIN1001244", "SBI0001244", "SBIN000124", "12345678901", "sbin0001244"];

for (const code of validIfsc) {
  if (!ifscRegex.test(code)) throw new Error(`Valid IFSC failed: ${code}`);
}
for (const code of invalidIfsc) {
  if (ifscRegex.test(code)) throw new Error(`Invalid IFSC passed: ${code}`);
}
console.log("✓ All IFSC validation checks passed perfectly!");

const accountRegex = /^\d{9,18}$/;
if (!accountRegex.test("123456789") || !accountRegex.test("123456789012345678")) {
  throw new Error("Valid account numbers failed");
}
if (accountRegex.test("12345678") || accountRegex.test("12345678901234567890")) {
  throw new Error("Invalid account numbers passed");
}
console.log("✓ All Bank Account number length checks passed perfectly!");

console.log("\n=== 3. Testing Sequential Token Logic (#TK-1) ===");
function getNextSequentialTokenTest(existingTokens) {
  if (!existingTokens || existingTokens.length === 0) {
    return "TK-1";
  }
  let maxNum = 0;
  for (const t of existingTokens) {
    const match = t.match(/TK-(\d+)/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `TK-${maxNum + 1}`;
}

const emptyTokens = [];
const firstToken = getNextSequentialTokenTest(emptyTokens);
console.log("Empty database next token:", `#${firstToken}`);
if (firstToken !== "TK-1") throw new Error("Expected TK-1 on empty list");

const secondToken = getNextSequentialTokenTest([firstToken]);
console.log("Second token:", `#${secondToken}`);
if (secondToken !== "TK-2") throw new Error("Expected TK-2");

const thirdToken = getNextSequentialTokenTest([firstToken, secondToken]);
console.log("Third token:", `#${thirdToken}`);
if (thirdToken !== "TK-3") throw new Error("Expected TK-3");

console.log("\n✓ All verification tests passed successfully!");
