/**
 * Name Matching and Identity Verification Utilities
 * Used for strict KYC & DBT verification in Krishi-Queue
 */

export function normalizeName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(shri|shrimati|smt|mr|mrs|ms|dr|kumar|kumari|singh|sharma|patel|yadav|ji)\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export function compareNames(registeredName: string, verifiedName: string): {
  isMatch: boolean;
  similarity: number;
  normalizedRegistered: string;
  normalizedVerified: string;
} {
  const normReg = normalizeName(registeredName);
  const normVer = normalizeName(verifiedName);

  if (!normReg || !normVer) {
    return { isMatch: false, similarity: 0, normalizedRegistered: normReg, normalizedVerified: normVer };
  }

  // Exact normalized match
  if (normReg === normVer) {
    return { isMatch: true, similarity: 1.0, normalizedRegistered: normReg, normalizedVerified: normVer };
  }

  // Token set matching (e.g. "Rameshwar Sharma" vs "Sharma Rameshwar")
  const tokensReg = normReg.split(" ").filter(Boolean).sort().join(" ");
  const tokensVer = normVer.split(" ").filter(Boolean).sort().join(" ");
  if (tokensReg === tokensVer) {
    return { isMatch: true, similarity: 0.98, normalizedRegistered: normReg, normalizedVerified: normVer };
  }

  // Containment matching
  if (normReg.includes(normVer) || normVer.includes(normReg)) {
    return { isMatch: true, similarity: 0.90, normalizedRegistered: normReg, normalizedVerified: normVer };
  }

  // Levenshtein similarity calculation
  const longer = normReg.length > normVer.length ? normReg : normVer;
  const shorter = normReg.length > normVer.length ? normVer : normReg;
  const distance = levenshteinDistance(longer, shorter);
  const similarity = (longer.length - distance) / longer.length;

  return {
    isMatch: similarity >= 0.82,
    similarity,
    normalizedRegistered: normReg,
    normalizedVerified: normVer,
  };
}

// ==============================================================================
// UIDAI OFFICIAL VERHOEFF CHECKSUM ALGORITHM
// All genuine 12-digit Indian Aadhaar numbers must satisfy this checksum
// ==============================================================================

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates whether a numeric string satisfies the Verhoeff checksum.
 */
export function validateVerhoeffChecksum(numStr: string): boolean {
  if (!numStr || !/^\d+$/.test(numStr)) return false;
  let c = 0;
  const digits = numStr.split("").map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[i]]];
  }
  return c === 0;
}

/**
 * Generates the Verhoeff check digit for an 11-digit prefix.
 */
export function generateVerhoeffCheckDigit(num11Str: string): number {
  let c = 0;
  const digits = num11Str.split("").map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][digits[i]]];
  }
  return VERHOEFF_INV[c];
}

/**
 * Validates 12-digit Aadhaar number against UIDAI rules:
 * 1. Exactly 12 numeric digits
 * 2. Cannot start with 0 or 1 (UIDAI standard allocation: 2-9)
 * 3. Cannot be 12 identical digits (e.g. 222222222222)
 * 4. Must strictly satisfy the Verhoeff checksum algorithm
 */
export function isValidAadhaarFormat(aadhaar: string): boolean {
  const clean = (aadhaar || "").replace(/\D/g, "");
  if (clean.length !== 12) return false;
  if (/^[01]/.test(clean)) return false;
  if (/^(\d)\1{11}$/.test(clean)) return false;
  return validateVerhoeffChecksum(clean);
}

/**
 * Detailed Aadhaar validator with descriptive error message
 */
export function validateAadhaarDetails(aadhaar: string): {
  isValid: boolean;
  error?: string;
} {
  const clean = (aadhaar || "").replace(/\D/g, "");

  if (clean.length !== 12) {
    return {
      isValid: false,
      error: "Aadhaar card number must be exactly 12 numeric digits.",
    };
  }

  if (/^[01]/.test(clean)) {
    return {
      isValid: false,
      error: "Invalid Aadhaar: UIDAI numbers cannot start with 0 or 1.",
    };
  }

  if (/^(\d)\1{11}$/.test(clean)) {
    return {
      isValid: false,
      error: "Invalid Aadhaar: Number cannot contain 12 identical repeating digits.",
    };
  }

  if (!validateVerhoeffChecksum(clean)) {
    return {
      isValid: false,
      error:
        "Invalid Aadhaar: Number failed UIDAI Verhoeff mathematical checksum verification.",
    };
  }

  return { isValid: true };
}

/**
 * Validates standard 11-character Indian Financial System Code (IFSC)
 */
export function isValidIfscFormat(ifsc: string): boolean {
  const clean = (ifsc || "").trim().toUpperCase();
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean);
}

/**
 * Validates standard Indian Bank Account Number (9 to 18 numeric digits)
 */
export function isValidBankAccountFormat(accountNo: string): boolean {
  const clean = (accountNo || "").replace(/\D/g, "");
  return clean.length >= 9 && clean.length <= 18;
}
