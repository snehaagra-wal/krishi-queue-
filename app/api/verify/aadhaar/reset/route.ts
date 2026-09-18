import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { farmerId, phone, name } = body;

    let targetDocId = farmerId;

    if (!targetDocId && phone) {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const q = query(collection(db, "farmers"), where("phone", "==", `+91 ${cleanPhone}`));
      const snap = await getDocs(q);
      if (!snap.empty) {
        targetDocId = snap.docs[0].id;
      }
    }

    if (!targetDocId && name) {
      const q = query(collection(db, "farmers"), where("name", "==", name));
      const snap = await getDocs(q);
      if (!snap.empty) {
        targetDocId = snap.docs[0].id;
      }
    }

    if (!targetDocId) {
      // Find the most recently updated farmer or matching "sneha"
      const snap = await getDocs(collection(db, "farmers"));
      const found = snap.docs.find(d => {
        const data = d.data();
        return (data.name && data.name.toLowerCase().includes("sneha")) ||
               (data.phone && data.phone.includes("9201543291"));
      });
      if (found) {
        targetDocId = found.id;
      }
    }

    if (targetDocId) {
      await updateDoc(doc(db, "farmers", targetDocId), {
        aadhaarNumber: "",
        aadhaarVerified: false,
        verified: false,
      });

      return NextResponse.json({
        success: true,
        message: `Aadhaar verification cleared successfully for farmer document ${targetDocId}. You can now test new Aadhaar verification!`,
        farmerId: targetDocId,
      });
    }

    return NextResponse.json({
      success: false,
      error: "No matching farmer found to clear Aadhaar.",
    }, { status: 404 });
  } catch (err: any) {
    console.error("Error resetting Aadhaar:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to reset Aadhaar data.",
    }, { status: 500 });
  }
}
