import { NextResponse } from "next/server";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const interfaces = os.networkInterfaces();
    let lanIp = "";

    // Look for non-internal IPv4 address (e.g. en0 Wi-Fi or eth0)
    for (const ifaceName of Object.keys(interfaces)) {
      const ifaceList = interfaces[ifaceName];
      if (!ifaceList) continue;
      for (const iface of ifaceList) {
        if (iface.family === "IPv4" && !iface.internal) {
          lanIp = iface.address;
          break;
        }
      }
      if (lanIp) break;
    }

    return NextResponse.json({
      success: true,
      lanIp: lanIp || "127.0.0.1",
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      lanIp: "127.0.0.1",
      error: err.message,
    });
  }
}
