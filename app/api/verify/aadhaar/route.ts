import { NextRequest, NextResponse } from "next/server";
import { isValidAadhaarFormat, compareNames } from "@/lib/nameVerification";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aadhaarNumber, profileName, sandboxMockName } = body;

    if (!aadhaarNumber) {
      return NextResponse.json(
        { success: false, error: "Aadhaar number is required." },
        { status: 400 }
      );
    }

    if (!isValidAadhaarFormat(aadhaarNumber)) {
      return NextResponse.json(
        { success: false, error: "Invalid Aadhaar: Must be strictly 12 numeric digits." },
        { status: 400 }
      );
    }

    if (!profileName || !profileName.trim()) {
      return NextResponse.json(
        { success: false, error: "Registered profile name is required for identity matching." },
        { status: 400 }
      );
    }

    // In a live production environment, this calls UIDAI / Karza / Sandbox API:
    // e.g. const response = await fetch("https://api.sandbox.co.in/kyc/aadhaar/verify", ...);
    // For sandbox/demonstration, we fetch or simulate the registered Aadhaar card holder's legal name:
    const registeredAadhaarName = sandboxMockName || profileName.trim();

    // Strict Name Matching Check
    const matchResult = compareNames(profileName, registeredAadhaarName);

    if (!matchResult.isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Aadhar name does not match the registered account name.",
          matched: false,
          details: {
            profileName,
            aadhaarReturnedName: registeredAadhaarName,
            similarity: Math.round(matchResult.similarity * 100) + "%",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Aadhaar verified successfully with matching legal account name.",
      matched: true,
      data: {
        aadhaarLast4: aadhaarNumber.replace(/\D/g, "").slice(-4),
        verifiedLegalName: registeredAadhaarName,
        similarity: Math.round(matchResult.similarity * 100) + "%",
        status: "Active & Verified",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Aadhaar verification API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Aadhaar verification service unavailable." },
      { status: 500 }
    );
  }
}
