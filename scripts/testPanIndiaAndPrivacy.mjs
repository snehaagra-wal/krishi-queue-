import {
  PAN_INDIA_LOCALITIES,
  PAN_INDIA_MANDI_CENTERS,
  ALL_INDIAN_STATES,
  searchIndianLocations,
  lookupPincode,
  findNearestLocality,
} from "../lib/panIndiaLocations.ts";

console.log("==========================================");
console.log("TESTING PAN-INDIA LOCATIONS & PINCODE ENGINE");
console.log("==========================================");

// 1. Test Naini & Pincode 211008
console.log("\n[Test 1] Searching for 'Naini'...");
const nainiResults = searchIndianLocations("Naini");
console.log(`Results found: ${nainiResults.length}`);
if (nainiResults.length === 0) {
  throw new Error("FAIL: 'Naini' not found in search results!");
}
const naini = nainiResults[0];
console.log(`Top result: ${naini.fullName}`);
console.log(`Pincode: ${naini.pincode}`);
console.log(`District: ${naini.district}, State: ${naini.state}`);
if (naini.pincode !== "211008") {
  throw new Error(`FAIL: Expected 211008 for Naini, got ${naini.pincode}`);
}
console.log("✓ PASS: 'Naini' resolves to 'Naini, Prayagraj (Uttar Pradesh)' with PIN 211008.");

// 2. Direct Pincode Lookup for 211008
console.log("\n[Test 2] Direct lookup for 6-digit Pincode '211008'...");
const pinLookup = lookupPincode("211008");
if (!pinLookup) {
  throw new Error("FAIL: 211008 direct lookup failed!");
}
console.log(`Resolved locality: ${pinLookup.fullName} (Dist. ${pinLookup.district}, ${pinLookup.state})`);
if (pinLookup.name !== "Naini") {
  throw new Error(`FAIL: Expected Naini, got ${pinLookup.name}`);
}
console.log("✓ PASS: Direct 6-digit lookup '211008' maps to Naini.");

// 3. Pan-India Localities across key agricultural hubs
console.log("\n[Test 3] Testing Pan-India locality searches across states...");
const testCases = [
  { query: "Adhartal", expectedState: "Madhya Pradesh", expectedPin: "482004" },
  { query: "Lasalgaon", expectedState: "Maharashtra", expectedPin: "422306" },
  { query: "Unjha", expectedState: "Gujarat", expectedPin: "384170" },
  { query: "Gulabbagh", expectedState: "Bihar", expectedPin: "854326" },
  { query: "Yeshwantpur", expectedState: "Karnataka", expectedPin: "560022" },
  { query: "Koyambedu", expectedState: "Tamil Nadu", expectedPin: "600092" },
  { query: "Guntur", expectedState: "Andhra Pradesh", expectedPin: "522004" },
  { query: "Kalyani", expectedState: "West Bengal", expectedPin: "741235" },
  { query: "Guwahati", expectedState: "Assam", expectedPin: "781035" },
];

for (const tc of testCases) {
  const res = searchIndianLocations(tc.query);
  if (res.length === 0) {
    throw new Error(`FAIL: Query '${tc.query}' produced no results!`);
  }
  const top = res[0];
  console.log(`  • '${tc.query}' -> ${top.fullName} | PIN: ${top.pincode} | State: ${top.state}`);
  if (top.state !== tc.expectedState) {
    throw new Error(`FAIL: For '${tc.query}', expected state ${tc.expectedState} but got ${top.state}`);
  }
  if (top.pincode !== tc.expectedPin) {
    throw new Error(`FAIL: For '${tc.query}', expected pincode ${tc.expectedPin} but got ${top.pincode}`);
  }
}
console.log("✓ PASS: All Pan-India agricultural localities accurately mapped.");

// 4. Test Total Centers and State Coverage
console.log("\n[Test 4] Total Pan-India Centers & States Coverage...");
console.log(`Total indexed localities: ${PAN_INDIA_LOCALITIES.length}`);
console.log(`Total Pan-India APMC centers: ${PAN_INDIA_MANDI_CENTERS.length}`);
console.log(`States & UTs supported in dropdown: ${ALL_INDIAN_STATES.length}`);

// 5. Test Nearest Locality from coordinates (Prayagraj coords)
console.log("\n[Test 5] Testing GPS coordinate snapping to nearest locality...");
// Coordinates near Naini (25.3850, 81.8710)
const nearestToNaini = findNearestLocality(25.3850, 81.8710);
console.log(`Coords (25.3850, 81.8710) snapped to: ${nearestToNaini?.fullName} (PIN: ${nearestToNaini?.pincode})`);
if (nearestToNaini?.pincode !== "211008") {
  throw new Error(`FAIL: Expected 211008, got ${nearestToNaini?.pincode}`);
}
console.log("✓ PASS: GPS coordinate snapping accurately detects Naini and 211008.");

console.log("\n==========================================");
console.log("ALL TESTS PASSED SUCCESSFULLY! 🎯");
console.log("==========================================");
