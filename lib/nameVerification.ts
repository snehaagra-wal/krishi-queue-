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

/**
 * Validates 12-digit Aadhaar number format
 */
export function isValidAadhaarFormat(aadhaar: string): boolean {
  const clean = (aadhaar || "").replace(/\D/g, "");
  return clean.length === 12 && !/^(0{12}|1{12}|9{12})$/.test(clean);
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
