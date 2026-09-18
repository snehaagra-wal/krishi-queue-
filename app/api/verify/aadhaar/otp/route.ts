import { NextRequest, NextResponse } from "next/server";
import { validateAadhaarDetails, compareNames } from "@/lib/nameVerification";
import {
  generateSandboxAadhaarOtp,
  verifySandboxAadhaarOtp,
  isSandboxConfigured,
} from "@/lib/sandboxClient";

// Shared cache for OTP simulation (referenceId -> { otp, aadhaar, holderName, expiresAt })
declare global {
  var __KRISHI_AADHAAR_OTP_CACHE: Map<
    string,
    { otp: string; cleanAadhaar: string; holderName?: string; expiresAt: number }
  > | undefined;
}

if (!global.__KRISHI_AADHAAR_OTP_CACHE) {
  global.__KRISHI_AADHAAR_OTP_CACHE = new Map();
}
const aadhaarOtpCache = global.__KRISHI_AADHAAR_OTP_CACHE;

const KNOWN_TEST_AADHAARS: Record<string, string> = {
  "367598342109": "sneha ag",
  "200000000018": "Rameshwar Sharma",
  "543216789019": "XYZ",
  "999999990019": "Baldev Singh",
  "888888880010": "Harpreet Kaur",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      aadhaarNumber,
      referenceId,
      otp,
      profileName,
      phoneNumber,
      aadhaarHolderName,
    } = body;

    // ACTION: GENERATE OTP
    if (action === "generate") {
      if (!aadhaarNumber) {
        return NextResponse.json(
          { success: false, error: "Aadhaar number is required to send OTP." },
          { status: 400 }
        );
      }

      const cleanAadhaar = aadhaarNumber.replace(/\D/g, "");

      // Strict check: Aadhaar cardholder name MUST match username before generating OTP
      if (!aadhaarHolderName || !aadhaarHolderName.trim()) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Legal name on Aadhaar card is required. Aadhaar name should be same as username.",
          },
          { status: 400 }
        );
      }

      if (profileName && profileName.trim()) {
        const preMatch = compareNames(profileName.trim(), aadhaarHolderName.trim());
        if (!preMatch.isMatch) {
          return NextResponse.json(
            {
              success: false,
              error: `Name should be as Aadhaar name. Entered name is "${aadhaarHolderName.trim()}". OTP cannot be sent for another person's Aadhaar.`,
            },
            { status: 400 }
          );
        }
      }

      // 1. Strict Verhoeff Checksum Check
      const formatCheck = validateAadhaarDetails(cleanAadhaar);
      if (!formatCheck.isValid) {
        return NextResponse.json(
          {
            success: false,
            error:
              formatCheck.error ||
              "Invalid Aadhaar number: Failed UIDAI Verhoeff checksum validation.",
          },
          { status: 400 }
        );
      }

      // If live Sandbox.co.in is configured, dispatch via Sandbox
      if (isSandboxConfigured()) {
        const res = await generateSandboxAadhaarOtp(cleanAadhaar);
        if (!res.success) {
          return NextResponse.json(
            { success: false, error: res.error || "Failed to generate UIDAI OTP." },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          referenceId: res.referenceId,
          message:
            res.message ||
            "6-digit Aadhaar OTP dispatched to linked mobile number.",
          isMock: false,
        });
      }

      // In Developer/Demo Mode:
      // Generate a 6-digit test OTP and attempt live SMS delivery via Fast2SMS
      const devOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const generatedRef = `REF_OTP_${Date.now()}_${cleanAadhaar.slice(-4)}`;
      const expiresAt = Date.now() + 10 * 60 * 1000;

      aadhaarOtpCache.set(generatedRef, {
        otp: devOtp,
        cleanAadhaar,
        holderName: aadhaarHolderName?.trim() || undefined,
        expiresAt,
      });

      let smsDelivered = false;
      const fast2smsKey = process.env.FAST2SMS_API_KEY?.trim();
      const targetPhone = (phoneNumber || "").replace(/\D/g, "").slice(-10);

      if (fast2smsKey && targetPhone.length === 10) {
        try {
          const smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
            method: "POST",
            headers: {
              authorization: fast2smsKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              route: "otp",
              variables_values: devOtp,
              numbers: targetPhone,
            }),
          });
          const smsData = await smsRes.json();
          if (smsData.return) {
            smsDelivered = true;
          }
        } catch (smsErr) {
          console.warn("[Aadhaar OTP] Fast2SMS dispatch note:", smsErr);
        }
      }

      return NextResponse.json({
        success: true,
        referenceId: generatedRef,
        message: smsDelivered
          ? `6-digit Aadhaar OTP sent to mobile (+91 ${targetPhone})!`
          : "6-digit UIDAI OTP generated for verification.",
        testOtp: devOtp,
        targetPhone: targetPhone ? `+91 ${targetPhone.slice(0, 2)}••••••${targetPhone.slice(-2)}` : undefined,
        isMock: true,
      });
    }

    // ACTION: VERIFY OTP & MATCH NAME
    if (action === "verify") {
      if (!referenceId || !otp) {
        return NextResponse.json(
          {
            success: false,
            error: "Both referenceId and 6-digit OTP are required.",
          },
          { status: 400 }
        );
      }

      if (!profileName || !profileName.trim()) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Registered farmer profile name is required to verify slot ownership.",
          },
          { status: 400 }
        );
      }

      const cleanAadhaar = (aadhaarNumber || "").replace(/\D/g, "");
      let verifiedName = "";
      let last4 = cleanAadhaar.slice(-4) || "2323";

      if (isSandboxConfigured()) {
        const verifyRes = await verifySandboxAadhaarOtp(
          referenceId,
          otp,
          cleanAadhaar
        );

        if (!verifyRes.success) {
          return NextResponse.json(
            {
              success: false,
              error: verifyRes.error || "Invalid or expired Aadhaar OTP.",
            },
            { status: 400 }
          );
        }
        verifiedName = verifyRes.legalName || aadhaarHolderName || profileName.trim();
        last4 = verifyRes.aadhaarLast4 || last4;
      } else {
        // Dev Mode: check cached OTP or universal bypass 123456
        const cached = aadhaarOtpCache.get(referenceId);
        const isValidCode = (cached && cached.otp === otp.trim()) || otp.trim() === "123456";

        if (!isValidCode) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid Aadhaar OTP. Please enter the 6-digit code received.",
            },
            { status: 400 }
          );
        }

        // Determine legal cardholder name
        const mappedName = KNOWN_TEST_AADHAARS[cleanAadhaar];
        const holderInput = (aadhaarHolderName || cached?.holderName || "").trim();

        if (holderInput) {
          verifiedName = holderInput;
        } else if (mappedName) {
          verifiedName = mappedName;
        } else {
          verifiedName = profileName.trim();
        }
      }

      // Strict Cardholder vs Slot Owner Match
      const matchResult = compareNames(profileName.trim(), verifiedName);

      if (!matchResult.isMatch) {
        return NextResponse.json(
          {
            success: false,
            error: `Aadhaar verification failed: This Aadhaar card belongs to "${verifiedName}", but the booked slot belongs to "${profileName.trim()}". You cannot use another person's Aadhaar card. Please enter correct details of user.`,
            matched: false,
            details: {
              slotFarmerName: profileName.trim(),
              aadhaarOwnerName: verifiedName,
              similarity: `${Math.round(matchResult.similarity * 100)}%`,
            },
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "UIDAI OTP verified successfully! Farmer identity matches booked slot.",
        matched: true,
        data: {
          aadhaarLast4: last4,
          verifiedLegalName: verifiedName,
          similarity: `${Math.round(matchResult.similarity * 100)}%`,
          gateway: isSandboxConfigured()
            ? "Sandbox.co.in Live UIDAI"
            : "UIDAI OTP Simulation Gateway",
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action. Supported actions are 'generate' and 'verify'.",
      },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Aadhaar OTP route error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
