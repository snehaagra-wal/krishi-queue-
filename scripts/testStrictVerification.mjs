// Test script to verify the fix for:
// 1. Aadhaar number mismatch (friend's number entered instead of card number)
// 2. Name mismatch (name doesn't match Aadhaar card / profile)
// 3. New gatekeeper reverification flow (no camera selfie needed, physical gate verification)

import { verifyAadhaarAndFace } from "../lib/biometricVerification.ts";

async function runTests() {
  console.log("=== Testing Aadhaar & Gatekeeper Verification Rules ===");

  const sampleCard = "data:image/png;base64," + Buffer.from("mock-aadhaar-card-portrait").toString("base64");

  // TEST 1: User typed friend's Aadhaar number (mismatch with card)
  console.log("\n--- TEST 1: Aadhaar Number Mismatch (User entered friend's number) ---");
  const res1 = await verifyAadhaarAndFace({
    aadhaarImageBase64: sampleCard,
    enteredAadhaarNumber: "987654321098", // typed friend's number
    extractedCardNumber: "123456789012",  // actual number on card
    username: "Sneha Agrawal",
    aadhaarName: "Sneha Agrawal",
  });

  console.log("Success:", res1.success);
  console.log("Error:", res1.error);
  console.log("Number Match:", res1.isAadhaarNumberMatch);
  if (!res1.success && res1.error?.includes("Aadhaar number not matched")) {
    console.log("✅ PASSED: Mismatched Aadhaar number was strictly rejected!");
  } else {
    console.error("❌ FAILED: Mismatched Aadhaar number should have been rejected!");
  }

  // TEST 2: Name Mismatch
  console.log("\n--- TEST 2: Name Mismatch ---");
  const res2 = await verifyAadhaarAndFace({
    aadhaarImageBase64: sampleCard,
    enteredAadhaarNumber: "234567890123",
    extractedCardNumber: "234567890123",
    username: "Sneha Agrawal",
    aadhaarName: "Rohan Sharma", // wrong name
  });

  console.log("Success:", res2.success);
  console.log("Error:", res2.error);
  console.log("Name Match:", res2.isNameMatch);
  if (!res2.success && res2.error?.includes("Name not matched")) {
    console.log("✅ PASSED: Mismatched name was strictly rejected!");
  } else {
    console.error("❌ FAILED: Mismatched name should have been rejected!");
  }

  // TEST 3: Successful Verification Without Face Camera (Gatekeeper Re-verification notice)
  console.log("\n--- TEST 3: Verification with Card + Matching Name & Number (No camera scan) ---");
  const res3 = await verifyAadhaarAndFace({
    aadhaarImageBase64: sampleCard,
    enteredAadhaarNumber: "234567890123",
    extractedCardNumber: "234567890123",
    username: "Sneha Agrawal",
    aadhaarName: "Sneha Agrawal",
  });

  console.log("Success:", res3.success);
  console.log("Number Match:", res3.isAadhaarNumberMatch);
  console.log("Name Match:", res3.isNameMatch);
  console.log("Face Match (Gatekeeper reverification):", res3.isFaceMatch);
  if (res3.success && res3.isAadhaarNumberMatch && res3.isNameMatch && res3.isFaceMatch) {
    console.log("✅ PASSED: Card and name verification succeeded smoothly!");
  } else {
    console.error("❌ FAILED: Verification should have succeeded!");
  }
}

runTests().catch(console.error);
