/**
 * Sandbox.co.in API Client for Aadhaar KYC & Identity Verification
 * Official Developer Documentation: https://developer.sandbox.co.in
 */

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export interface SandboxAuthResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface AadhaarOtpGenerateResult {
  success: boolean;
  referenceId?: string;
  message?: string;
  error?: string;
  isMock?: boolean;
}

export interface AadhaarOtpVerifyResult {
  success: boolean;
  legalName?: string;
  aadhaarLast4?: string;
  dob?: string;
  gender?: string;
  address?: any;
  rawResponse?: any;
  error?: string;
  isMock?: boolean;
}

const SANDBOX_BASE_URL =
  process.env.SANDBOX_BASE_URL || "https://api.sandbox.co.in";

/**
 * Checks whether Sandbox API credentials are configured in environment
 */
export function isSandboxConfigured(): boolean {
  const key = process.env.SANDBOX_API_KEY?.trim();
  const secret = process.env.SANDBOX_API_SECRET?.trim();
  return Boolean(key && secret);
}

/**
 * Authenticates with Sandbox.co.in and retrieves a JWT access token
 */
export async function getSandboxAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  const apiKey = process.env.SANDBOX_API_KEY?.trim();
  const apiSecret = process.env.SANDBOX_API_SECRET?.trim();

  if (!apiKey || !apiSecret) {
    throw new Error(
      "SANDBOX_API_KEY and SANDBOX_API_SECRET are not configured in environment variables."
    );
  }

  const response = await fetch(`${SANDBOX_BASE_URL}/authenticate`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "x-api-secret": apiSecret,
      "x-api-version": "1.0",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Sandbox authentication failed (${response.status}): ${errorBody}`
    );
  }

  const data: SandboxAuthResponse = await response.json();
  const token = data.access_token;
  // Default expire in 23 hours if not specified
  const expiresInMs = (data.expires_in || 82800) * 1000;

  cachedAccessToken = {
    token,
    expiresAt: Date.now() + expiresInMs - 60000, // 1 minute safety buffer
  };

  return token;
}

/**
 * Triggers UIDAI Aadhaar OTP to citizen's registered mobile number via Sandbox
 */
export async function generateSandboxAadhaarOtp(
  aadhaarNumber: string
): Promise<AadhaarOtpGenerateResult> {
  const cleanAadhaar = aadhaarNumber.replace(/\D/g, "");

  if (!isSandboxConfigured()) {
    // Development / Offline Simulation
    return {
      success: true,
      referenceId: `REF_MOCK_${Date.now()}_${cleanAadhaar.slice(-4)}`,
      message: "Sandbox test OTP sent to registered Aadhaar mobile (Demo mode)",
      isMock: true,
    };
  }

  try {
    const token = await getSandboxAccessToken();
    const apiKey = process.env.SANDBOX_API_KEY!.trim();

    const response = await fetch(
      `${SANDBOX_BASE_URL}/kyc/aadhaar/okyc/otp/generate`,
      {
        method: "POST",
        headers: {
          Authorization: token,
          "x-api-key": apiKey,
          "x-api-version": "1.0",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
          aadhaar_number: cleanAadhaar,
          consent: "Y",
          reason: "Farmer Identity Verification for Krishi-Queue Mandi Allocation",
        }),
      }
    );

    const json = await response.json();

    if (!response.ok || json.code !== 200) {
      return {
        success: false,
        error:
          json.message ||
          json.error?.message ||
          `Aadhaar OTP request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      referenceId: json.data?.reference_id,
      message:
        json.data?.message ||
        "OTP dispatched successfully to Aadhaar-registered mobile.",
      isMock: false,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to communicate with Sandbox Aadhaar gateway.",
    };
  }
}

/**
 * Submits OTP to Sandbox.co.in to fetch verified UIDAI citizen demographic details
 */
export async function verifySandboxAadhaarOtp(
  referenceId: string,
  otp: string,
  aadhaarNumber?: string
): Promise<AadhaarOtpVerifyResult> {
  if (!isSandboxConfigured()) {
    // In developer simulation mode
    return {
      success: true,
      legalName: undefined, // Let the caller check against slot owner or demo catalog
      aadhaarLast4: (aadhaarNumber || "0000").slice(-4),
      isMock: true,
    };
  }

  try {
    const token = await getSandboxAccessToken();
    const apiKey = process.env.SANDBOX_API_KEY!.trim();

    const response = await fetch(
      `${SANDBOX_BASE_URL}/kyc/aadhaar/okyc/otp/verify`,
      {
        method: "POST",
        headers: {
          Authorization: token,
          "x-api-key": apiKey,
          "x-api-version": "1.0",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
          reference_id: referenceId,
          otp: otp.trim(),
        }),
      }
    );

    const json = await response.json();

    if (!response.ok || json.code !== 200) {
      return {
        success: false,
        error:
          json.message ||
          json.error?.message ||
          "Invalid OTP or Aadhaar verification rejected by UIDAI.",
      };
    }

    const userData = json.data || {};
    return {
      success: true,
      legalName: userData.full_name || userData.name,
      aadhaarLast4: userData.aadhaar_number?.slice(-4) || aadhaarNumber?.slice(-4),
      dob: userData.date_of_birth || userData.dob,
      gender: userData.gender,
      address: userData.address,
      rawResponse: userData,
      isMock: false,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Error validating Aadhaar OTP with Sandbox.",
    };
  }
}
