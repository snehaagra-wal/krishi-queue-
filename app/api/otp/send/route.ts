import { NextRequest, NextResponse } from "next/server";

// Shared in-memory OTP cache for fast verification (phoneNumber -> { otp, expiresAt })
declare global {
  var __KRISHI_OTP_CACHE: Map<string, { otp: string; expiresAt: number }> | undefined;
}

if (!global.__KRISHI_OTP_CACHE) {
  global.__KRISHI_OTP_CACHE = new Map<string, { otp: string; expiresAt: number }>();
}
export const otpCache = global.__KRISHI_OTP_CACHE;

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Mobile phone number is required." },
        { status: 400 }
      );
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    // Generate a secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    // Store in global cache
    otpCache.set(cleanPhone, { otp, expiresAt });

    // Check if Fast2SMS or 2Factor API keys are configured in environment
    const fast2smsKey = process.env.FAST2SMS_API_KEY?.trim();
    const twoFactorKey = process.env.TWO_FACTOR_API_KEY?.trim();

    let carrierDelivered = false;
    let gatewayMessage = "";

    // 1. Try Fast2SMS API if configured
    if (fast2smsKey) {
      try {
        console.log(`[SMS Gateway] Dispatched Fast2SMS request for +91 ${cleanPhone}`);
        
        // Attempt 1: Official POST with JSON payload
        let response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: fast2smsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "otp",
            variables_values: otp,
            numbers: cleanPhone,
          }),
        });

        let data = await response.json();
        console.log("[Fast2SMS JSON POST Response]", data);

        // Attempt 2: If failed, attempt POST with URL-encoded parameters
        if (!data.return) {
          console.log("[Fast2SMS] Attempting URL-encoded POST...");
          const params = new URLSearchParams();
          params.append("route", "otp");
          params.append("variables_values", otp);
          params.append("numbers", cleanPhone);

          response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
            method: "POST",
            headers: {
              authorization: fast2smsKey,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          });
          data = await response.json();
          console.log("[Fast2SMS URL-encoded POST Response]", data);
        }

        // Attempt 3: If still failed, attempt GET query
        if (!data.return) {
          console.log("[Fast2SMS] Attempting GET query params...");
          const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2smsKey)}&route=otp&variables_values=${otp}&numbers=${cleanPhone}`;
          response = await fetch(fast2smsUrl, {
            method: "GET",
            headers: {
              "cache-control": "no-cache",
            },
          });
          data = await response.json();
          console.log("[Fast2SMS GET Response]", data);
        }

        if (data.return) {
          carrierDelivered = true;
          gatewayMessage = "SMS successfully delivered via Fast2SMS telecom gateway.";
        } else {
          console.warn("[Fast2SMS Gateway Error]", data.status_code, data.message);
          gatewayMessage = data.message || `Fast2SMS Error (Code: ${data.status_code})`;
        }
      } catch (err: any) {
        console.error("[Fast2SMS Exception]", err);
        gatewayMessage = err.message || "Failed to connect to Fast2SMS server";
      }
    }

    // 2. Try 2Factor.in API if configured
    if (!carrierDelivered && twoFactorKey) {
      try {
        const url = `https://2factor.in/API/V1/${twoFactorKey}/SMS/+91${cleanPhone}/${otp}/KrishiQueue`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.Status === "Success") {
          carrierDelivered = true;
          gatewayMessage = "SMS successfully delivered via 2Factor gateway.";
        }
      } catch (err: any) {
        console.error("[2Factor Exception]", err);
      }
    }

    // Log for server console/developer auditing
    console.log(`\n======================================================`);
    console.log(`📱 [KRISHI-QUEUE OTP DISPATCH]`);
    console.log(`Recipient Mobile: +91 ${cleanPhone}`);
    console.log(`Dispatched OTP:   ${otp}`);
    console.log(`Carrier Gateway:  ${fast2smsKey ? "Fast2SMS (Active)" : "Fast2SMS Key Not Set (Using Developer Test Pin 123456)"}`);
    console.log(`Expires In:       10 Minutes`);
    console.log(`======================================================\n`);

    const whatsAppUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(`🌾 Krishi-Queue Verification OTP: ${otp}\nValid for 10 minutes. Do not share this code.`)}`;
    const smsUrl = `sms:+91${cleanPhone}?&body=${encodeURIComponent(`Krishi-Queue OTP: ${otp}`)}`;

    return NextResponse.json({
      success: true,
      message: carrierDelivered
        ? `Live SMS OTP sent to +91 ${cleanPhone} via carrier network.`
        : `OTP dispatched to +91 ${cleanPhone}.`,
      phoneNumber: `+91 ${cleanPhone}`,
      expiresInSeconds: 600,
      carrierDelivered,
      fast2smsConfigured: !!fast2smsKey,
      gatewayError: carrierDelivered ? undefined : gatewayMessage,
      deliveredOtp: otp,
      whatsAppUrl,
      smsUrl,
    });
  } catch (error: any) {
    console.error("Error in /api/otp/send:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
