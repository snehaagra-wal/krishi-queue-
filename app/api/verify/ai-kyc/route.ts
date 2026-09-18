import { NextRequest, NextResponse } from "next/server";
import { verifyAadhaarAndFace } from "@/lib/biometricVerification";
import { db } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      aadhaarImageBase64,
      faceImageBase64,
      enteredAadhaarNumber,
      username,
      farmerId,
      aadhaarName,
      extractedCardNumber,
      clientFaceScore,
      clientFaceMatched,
    } = body;

    if (!enteredAadhaarNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Aadhaar number not matched: Please enter the 12-digit Aadhaar number.",
          matchedCriteria: { aadhaarNumber: false, name: false, face: false },
        },
        { status: 400 }
      );
    }

    if (!aadhaarImageBase64) {
      return NextResponse.json(
        {
          success: false,
          error: "Please upload your Aadhaar card photo.",
          matchedCriteria: { aadhaarNumber: false, name: false, face: false },
        },
        { status: 400 }
      );
    }

    // Run the AI biometric & document verification (Face will be verified at gate by gatekeeper)
    const verification = await verifyAadhaarAndFace({
      aadhaarImageBase64,
      faceImageBase64,
      enteredAadhaarNumber,
      username: username || "Farmer",
      aadhaarName,
      extractedCardNumber,
      clientFaceScore,
      clientFaceMatched,
    });

    if (!verification.success) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || "Verification failed: Identity criteria not satisfied.",
          matchedCriteria: verification.matchedCriteria,
          isAadhaarNumberMatch: verification.isAadhaarNumberMatch,
          isNameMatch: verification.isNameMatch,
          isFaceMatch: verification.isFaceMatch,
          faceMatchScore: verification.faceMatchScore,
          details: verification.details,
        },
        { status: 400 }
      );
    }

    // If verified and farmerId is provided, save to Firestore
    if (farmerId && typeof farmerId === "string") {
      try {
        const farmerRef = doc(db, "farmers", farmerId);
        await updateDoc(farmerRef, {
          aadhaarNumber: enteredAadhaarNumber.replace(/\D/g, ""),
          aadhaarVerified: true,
          verified: true,
          updatedAt: serverTimestamp(),
        });
      } catch (dbErr) {
        console.warn("Could not update Firestore farmer record:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Biometric and Aadhaar verification successful! Identity confirmed.",
      matchedCriteria: verification.matchedCriteria,
      isAadhaarNumberMatch: true,
      isNameMatch: true,
      isFaceMatch: true,
      faceMatchScore: verification.faceMatchScore,
      extractedName: verification.extractedName,
      extractedAadhaarNumber: verification.extractedAadhaarNumber,
      details: verification.details,
    });
  } catch (err: any) {
    console.error("AI KYC API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error during verification." },
      { status: 500 }
    );
  }
}
