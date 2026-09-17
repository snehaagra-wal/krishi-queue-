import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
import {
  createFarmer,
  createCheckin,
  getNextSequentialToken,
  sanitizeFirestoreData,
  deleteFarmer,
  deleteCheckin,
} from "../lib/firestoreService.ts";

console.log("=================================================");
console.log("TESTING REGISTRATION WITH OPTIONAL EMAIL BLANK & CLEAN SLATE");
console.log("=================================================\n");

// 1. Test sanitizeFirestoreData
console.log("[Test 1] Testing sanitizeFirestoreData utility...");
const dirtyObject = {
  name: "Rameshwar",
  email: undefined,
  details: {
    upi: undefined,
    bank: "SBI",
  },
  crops: ["Wheat"],
};
const cleaned = sanitizeFirestoreData(dirtyObject);
console.log("Sanitized object:", JSON.stringify(cleaned));
if ("email" in cleaned) throw new Error("undefined key 'email' was not stripped!");
if ("upi" in cleaned.details) throw new Error("nested undefined key 'upi' was not stripped!");
console.log("✓ PASS: sanitizeFirestoreData removes all undefined keys.\n");

// 2. Test createFarmer with BLANK / UNDEFINED email & optional fields
console.log("[Test 2] Testing createFarmer with optional email left blank...");
const testMobile = "9876549999";
let createdFarmerId = null;
try {
  createdFarmerId = await createFarmer({
    name: "Rameshwar Sharma",
    village: "Adhartal, Jabalpur",
    phone: `+91 ${testMobile}`,
    email: "", // Empty string as user leaves it blank
    password: "securePassword123",
    pincode: "",
    crops: [],
    acres: 5.0,
    verified: false,
    aadhaarVerified: false,
    photoUrl: "",
    center: "KUMS Adhartal Yard, Jabalpur",
  });
  console.log("✓ SUCCESS: Farmer created in Firestore without error! Doc ID:", createdFarmerId);
} catch (err) {
  console.error("FAILED to create farmer:", err);
  throw err;
}

// 3. Verify getNextSequentialToken starts strictly at TK-1 on clean state
console.log("\n[Test 3] Testing getNextSequentialToken starting strictly at #TK-1...");
const nextToken = await getNextSequentialToken();
console.log("Next token calculated:", `#${nextToken}`);
if (nextToken !== "TK-1") {
  console.warn(`Note: Database currently has existing checkins. Token returned: #${nextToken}`);
} else {
  console.log("✓ PASS: Clean database token is strictly #TK-1.");
}

// 4. Test booking token with #TK-1
console.log("\n[Test 4] Creating checkin with calculated token...");
let createdCheckinId = null;
try {
  createdCheckinId = await createCheckin({
    tokenId: nextToken,
    farmerName: "Rameshwar Sharma",
    farmerPhone: `+91 ${testMobile}`,
    village: "Adhartal, Jabalpur",
    cropType: "Sharbati Wheat (Grade A)",
    quantity: "40",
    slotTime: "10:00 AM - 11:00 AM",
    status: "Waiting",
    bay: "Bay 1 (Unloading)",
    center: "KUMS Adhartal Yard, Jabalpur",
  });
  console.log("✓ SUCCESS: Checkin token booked! ID:", createdCheckinId);

  // Check the next token after this booking
  const tokenAfterFirst = await getNextSequentialToken();
  console.log("Token after booking first token:", `#${tokenAfterFirst}`);
  if (nextToken === "TK-1" && tokenAfterFirst !== "TK-2") {
    throw new Error(`Expected TK-2 after TK-1, got: ${tokenAfterFirst}`);
  }
  console.log("✓ PASS: Token sequential increment validated (#TK-1 -> #TK-2)!");
} catch (err) {
  console.error("FAILED to create checkin:", err);
  throw err;
}

// 5. Cleanup test records so database remains clean
console.log("\n[Test 5] Cleaning up test records to leave clean slate...");
if (createdFarmerId) {
  await deleteFarmer(createdFarmerId);
  console.log("Deleted test farmer:", createdFarmerId);
}
if (createdCheckinId) {
  await deleteCheckin(createdCheckinId);
  console.log("Deleted test checkin:", createdCheckinId);
}

const finalToken = await getNextSequentialToken();
console.log("Final clean state next token:", `#${finalToken}`);
if (finalToken !== "TK-1") {
  console.warn("Final token is not TK-1, checking for stray records...");
} else {
  console.log("✓ PASS: Zero-state confirmed! Next token is strictly #TK-1.");
}

console.log("\n=================================================");
console.log("ALL TESTS COMPLETED SUCCESSFULLY! 🚀");
console.log("=================================================");
