/**
 * Automated Verification Script for Real Aadhaar KYC & Verhoeff Checksum
 */

import {
  isValidAadhaarFormat,
  validateAadhaarDetails,
  validateVerhoeffChecksum,
  generateVerhoeffCheckDigit,
  compareNames,
} from "../lib/nameVerification.ts";

console.log("==================================================================");
console.log("TESTING REAL AADHAAR VERIFICATION & STRICT SLOT-OWNER MATCHING");
console.log("==================================================================\n");

// 1. Verhoeff Checksum Mathematical Tests
console.log("[Test 1] Testing UIDAI Verhoeff Checksum Algorithm...");

const fakeAadhaars = [
  "123456789012", // Arbitrary digits
  "987654321012", // Arbitrary digits
  "111111111111", // Repeated digits
  "012345678901", // Starts with 0
  "12345678901",  // 11 digits
  "1234567890123", // 13 digits
];

for (const fake of fakeAadhaars) {
  const result = validateAadhaarDetails(fake);
  if (result.isValid) {
    throw new Error(`FAIL: Fake Aadhaar "${fake}" was incorrectly accepted!`);
  }
  console.log(`  ✓ Rejected fake number "${fake}": ${result.error}`);
}

// Generate valid numbers using Verhoeff check digits:
const validPrefixes = ["20000000001", "36759834210", "54321678901", "99999999001"];
const validAadhaars = validPrefixes.map(pre => pre + generateVerhoeffCheckDigit(pre));

for (const valid of validAadhaars) {
  const result = validateAadhaarDetails(valid);
  if (!result.isValid) {
    throw new Error(`FAIL: Valid Aadhaar "${valid}" failed validation: ${result.error}`);
  }
  console.log(`  ✓ Accepted genuine Aadhaar checksum "${valid}"`);
}

// 2. Strict Slot Owner Name Matching Tests
console.log("\n[Test 2] Testing Strict Slot Owner Name Matching...");

// Scenario A: Correct slot owner matches Aadhaar card holder
const slotOwner1 = "Rameshwar Sharma";
const aadhaarHolder1 = "Rameshwar Sharma";
const match1 = compareNames(slotOwner1, aadhaarHolder1);
if (!match1.isMatch) {
  throw new Error(`FAIL: Matching names failed comparison: ${slotOwner1} vs ${aadhaarHolder1}`);
}
console.log(`  ✓ PASS: "${slotOwner1}" matches Aadhaar name "${aadhaarHolder1}" (${Math.round(match1.similarity * 100)}%)`);

// Scenario B: Name with honorifics/reversed tokens matches
const slotOwner2 = "Shri Rameshwar Sharma";
const aadhaarHolder2 = "Sharma Rameshwar";
const match2 = compareNames(slotOwner2, aadhaarHolder2);
if (!match2.isMatch) {
  throw new Error(`FAIL: Reversed token names failed comparison: ${slotOwner2} vs ${aadhaarHolder2}`);
}
console.log(`  ✓ PASS: "${slotOwner2}" matches Aadhaar name "${aadhaarHolder2}" (${Math.round(match2.similarity * 100)}%)`);

// Scenario C: Slot booked for "Sneha Agrawal", but user enters Aadhaar belonging to "Rameshwar" or someone else
const slotOwner3 = "Sneha Agrawal";
const someoneElsesAadhaarName = "Baldev Singh";
const match3 = compareNames(slotOwner3, someoneElsesAadhaarName);
if (match3.isMatch) {
  throw new Error(`FAIL: Mismatched slot owner was incorrectly matched!`);
}
console.log(`  ✓ PASS: Correctly rejected mismatched identity: Slot booked for "${slotOwner3}" vs Aadhaar belongs to "${someoneElsesAadhaarName}" (Match: ${match3.isMatch})`);

console.log("\n==================================================================");
console.log("ALL REAL AADHAAR VERIFICATION & CHECKSUM TESTS PASSED SUCCESSFULLY!");
console.log("==================================================================");
