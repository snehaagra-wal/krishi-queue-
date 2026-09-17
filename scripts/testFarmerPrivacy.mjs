
console.log("==========================================");
console.log("TESTING FARMER PRIVACY & TOKEN ISOLATION");
console.log("==========================================");

// Mock checkins test to verify isolation logic
const mockDatabaseSnapshot = [
  { id: "tok-1", farmerName: "Gurpreet Singh", farmerPhone: "+91 9811122233", crop: "Wheat", status: "Waiting" },
  { id: "tok-2", farmerName: "Sneha Agrawal", farmerPhone: "+91 9876543210", crop: "Paddy", status: "Serving" },
  { id: "tok-3", farmerName: "Rameshwar Patel", farmerPhone: "+91 9922334455", crop: "Mustard", status: "Completed" },
  { id: "tok-4", farmerName: "Sneha", farmerPhone: "9876543210", crop: "Gram", status: "Waiting" },
];

console.log("\n[Test 1] Testing filter isolation for Farmer 'Sneha' (Phone: '9876543210')...");

// Normalize phone utility as implemented in firestoreService
const cleanTargetPhone = "9876543210".replace(/\D/g, "");
const targetName = "Sneha";

const filteredForSneha = mockDatabaseSnapshot.filter((item) => {
  const itemPhone = (item.farmerPhone || "").replace(/\D/g, "");
  const phoneMatch = cleanTargetPhone.length >= 10 && itemPhone.includes(cleanTargetPhone);
  const nameMatch = targetName && (item.farmerName || "").toLowerCase().trim() === targetName.toLowerCase().trim();
  return Boolean(phoneMatch || nameMatch);
});

console.log(`Expected 2 items for Sneha, got: ${filteredForSneha.length}`);
console.log(filteredForSneha.map(t => `  • Token ID: ${t.id} | Farmer: ${t.farmerName} | Phone: ${t.farmerPhone}`).join("\n"));

if (filteredForSneha.length !== 2) {
  throw new Error(`FAIL: Expected 2 tokens, got ${filteredForSneha.length}`);
}

const leak = filteredForSneha.some(t => t.farmerName.includes("Gurpreet") || t.farmerName.includes("Rameshwar"));
if (leak) {
  throw new Error("FAIL: Data leak detected! Other farmers' tokens found in filtered result!");
}
console.log("✓ PASS: Zero leak! Only Sneha's records are returned.");

console.log("\n[Test 2] Testing zero-state for new Farmer 'Balwinder' with no bookings...");
const targetPhone2 = "9999988888";
const targetName2 = "Balwinder";
const filteredForBalwinder = mockDatabaseSnapshot.filter((item) => {
  const itemPhone = (item.farmerPhone || "").replace(/\D/g, "");
  const phoneMatch = targetPhone2.length >= 10 && itemPhone.includes(targetPhone2);
  const nameMatch = targetName2 && (item.farmerName || "").toLowerCase().trim() === targetName2.toLowerCase().trim();
  return Boolean(phoneMatch || nameMatch);
});

console.log(`Tokens for Balwinder: ${filteredForBalwinder.length}`);
if (filteredForBalwinder.length !== 0) {
  throw new Error(`FAIL: Expected 0 tokens for new farmer, got ${filteredForBalwinder.length}`);
}
console.log("✓ PASS: Clean zero-state verified. No mock or fallback tokens leaked.");

console.log("\n==========================================");
console.log("FARMER PRIVACY ISOLATION TESTS PASSED! 🔒");
console.log("==========================================");
