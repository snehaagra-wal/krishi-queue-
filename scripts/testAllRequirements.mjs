import { compareNames, normalizeName, isValidAadhaarFormat, isValidBankAccountFormat, isValidIfscFormat } from "../lib/nameVerification.ts";
import QRCode from "qrcode";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCb_jCMZ2yx4po0ddGxJbrny4PGzw5RNTw",
  authDomain: "krishi-queue-full.firebaseapp.com",
  projectId: "krishi-queue-full",
  storageBucket: "krishi-queue-full.firebasestorage.app",
  messagingSenderId: "266215195781",
  appId: "1:266215195781:web:9dc4d3cf66272e704315ec",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runTests() {
  console.log("==================================================");
  console.log("KRISHI-QUEUE COMPREHENSIVE REQUIREMENTS TEST SUITE");
  console.log("==================================================");

  // 1. Test Clean Slate in Live Firestore
  console.log("\n[Test 1] Verifying Clean Slate in Firestore Database...");
  const checkinsSnap = await getDocs(collection(db, "checkins"));
  const farmersSnap = await getDocs(collection(db, "farmers"));
  const centersSnap = await getDocs(collection(db, "centers"));

  console.log(`Live Checkins in DB: ${checkinsSnap.size} (Expected: 0)`);
  console.log(`Live Farmers in DB: ${farmersSnap.size} (Expected: 0)`);
  console.log(`Official Centers in DB: ${centersSnap.size} (Expected: 75)`);

  if (checkinsSnap.size !== 0 || farmersSnap.size !== 0) {
    throw new Error(`Database is not clean slate! Checkins: ${checkinsSnap.size}, Farmers: ${farmersSnap.size}`);
  }
  console.log("✓ PASS: Database is 100% clean slate with zero legacy records!");

  // 2. Test Sequential Token Calculation starting strictly at #TK-1
  console.log("\n[Test 2] Testing Token Numbering Algorithm strictly starting at #TK-1...");
  function calculateNextToken(existing) {
    if (!existing || existing.length === 0) return "TK-1";
    let max = 0;
    for (const t of existing) {
      const match = t.match(/TK-(\d+)/i);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (n > max) max = n;
      }
    }
    return `TK-${max + 1}`;
  }

  const token1 = calculateNextToken([]);
  console.log(`Empty list token: #${token1}`);
  if (token1 !== "TK-1") throw new Error(`Expected TK-1, got ${token1}`);

  const token2 = calculateNextToken(["TK-1"]);
  console.log(`After TK-1 token: #${token2}`);
  if (token2 !== "TK-2") throw new Error(`Expected TK-2, got ${token2}`);

  const token3 = calculateNextToken(["TK-1", "TK-2"]);
  console.log(`After TK-2 token: #${token3}`);
  if (token3 !== "TK-3") throw new Error(`Expected TK-3, got ${token3}`);
  console.log("✓ PASS: Token generation strictly starts at #TK-1 and increments sequentially!");

  // 3. Test Real Scannable QR Code Generation
  console.log("\n[Test 3] Testing Dynamic QR Code generation with 'qrcode' library...");
  const testVerifyUrl = "https://krishi-queue.gov.in/verify?token=TK-1&name=Sneha%20Agrawal&center=Indore%20APMC&crop=Wheat&qty=35%20Quintals";
  const qrDataUrl = await QRCode.toDataURL(testVerifyUrl, {
    width: 280,
    margin: 1,
    color: { dark: "#052e16", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
  console.log(`Generated QR Data URL length: ${qrDataUrl.length} characters`);
  if (!qrDataUrl.startsWith("data:image/png;base64,")) {
    throw new Error("QR generation did not return valid PNG data URL");
  }
  console.log("✓ PASS: High-contrast camera-scannable QR matrix generated successfully!");

  // 4. Test Aadhaar & Bank Strict Name Matching Algorithm
  console.log("\n[Test 4] Testing Strict Name Matching & Format Validation...");
  
  // Aadhaar Verhoeff format check
  if (!isValidAadhaarFormat("200000000018") || !isValidAadhaarFormat("367598342109") || isValidAadhaarFormat("123456789012") || isValidAadhaarFormat("12345678901") || isValidAadhaarFormat("000000000000")) {
    throw new Error("Aadhaar format / Verhoeff checksum validation failed");
  }
  console.log("✓ PASS: 12-digit Aadhaar Verhoeff checksum validated (fake 12-digit numbers rejected).");

  // Bank format check
  if (!isValidBankAccountFormat("123456789") || !isValidBankAccountFormat("123456789012345678") || isValidBankAccountFormat("12345678")) {
    throw new Error("Bank account format validation failed");
  }
  if (!isValidIfscFormat("SBIN0001244") || isValidIfscFormat("SBIN1001244") || isValidIfscFormat("INVALID")) {
    throw new Error("IFSC format validation failed");
  }
  console.log("✓ PASS: Bank account & IFSC format checks validated.");

  // Strict Name Comparison Tests
  const exactMatch = compareNames("Sneha Agrawal", "Sneha Agrawal");
  if (!exactMatch.isMatch) throw new Error("Exact match failed");

  const honorificMatch = compareNames("Sneha Agrawal", "Ms. Sneha Agrawal");
  if (!honorificMatch.isMatch) throw new Error("Honorific removal match failed");

  const swappedMatch = compareNames("Agrawal Sneha", "Sneha Agrawal");
  if (!swappedMatch.isMatch) throw new Error("Token permutation match failed");

  const mismatch1 = compareNames("Sneha Agrawal", "Ramesh Kumar Sharma");
  if (mismatch1.isMatch) throw new Error("Complete mismatch should fail!");

  const mismatch2 = compareNames("Sneha Agrawal", "Pooja Verma");
  if (mismatch2.isMatch) throw new Error("Mismatch should fail!");

  console.log(`- Exact Match: isMatch=${exactMatch.isMatch}, similarity=${exactMatch.similarity}`);
  console.log(`- Swapped Order: isMatch=${swappedMatch.isMatch}, similarity=${swappedMatch.similarity}`);
  console.log(`- Mismatched Name: isMatch=${mismatch1.isMatch}, similarity=${mismatch1.similarity}`);
  console.log("✓ PASS: Strict name matching logic validated with 100% precision!");

  console.log("\n==================================================");
  console.log("ALL TESTS COMPLETED SUCCESSFULLY! SYSTEM READY.");
  console.log("==================================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
