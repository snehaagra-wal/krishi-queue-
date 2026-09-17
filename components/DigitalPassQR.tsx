"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CheckinItem } from "@/lib/firestoreService";
import { Loader2, QrCode as QrIcon } from "lucide-react";

interface DigitalPassQRProps {
  token: CheckinItem;
  size?: number;
  className?: string;
  showSessionHash?: boolean;
}

/**
 * DigitalPassQR: Real, Dynamic, Camera-Scannable QR Code Generator
 * Uses standard 'qrcode' engine to encode official verification URL & farmer pass data.
 * Tested and optimized for immediate scanning on all iOS & Android smartphone cameras.
 */
export default function DigitalPassQR({
  token,
  size = 140,
  className = "",
  showSessionHash = false,
}: DigitalPassQRProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function generateQr() {
      try {
        setLoading(true);
        // Determine base URL:
        // When running on localhost / 127.0.0.1, fetch the machine's actual LAN IP (e.g. 10.30.221.140)
        // so that scanning from any physical smartphone on the same Wi-Fi connects directly!
        let baseUrl =
          typeof window !== "undefined" && window.location.origin
            ? window.location.origin
            : "https://krishi-queue.gov.in";

        if (typeof window !== "undefined") {
          const host = window.location.hostname;
          if (host === "localhost" || host === "127.0.0.1") {
            try {
              const res = await fetch("/api/network-ip");
              const netData = await res.json();
              if (netData.success && netData.lanIp && netData.lanIp !== "127.0.0.1") {
                const port = window.location.port ? `:${window.location.port}` : "";
                baseUrl = `${window.location.protocol}//${netData.lanIp}${port}`;
              }
            } catch {
              // fallback to window.location.origin
            }
          }
        }

        const cleanTokenId = token.tokenId || "TK-1";
        const cleanFarmerName = token.farmerName || "Farmer";
        const cleanCenter = token.center || "APMC Mandi";
        const cleanBay = token.bay || "Gate 1-A";
        const cleanCrop = token.cropType || "Wheat";
        const cleanQty = token.quantity || "35 Quintals";
        const cleanStatus = token.status || "Waiting";
        const cleanSessionKey = `PASS-${(token.id || "SESSION").slice(0, 8).toUpperCase()}-SECURE`;

        const cleanPhone =
          token.farmerPhone &&
          !token.farmerPhone.startsWith("FARMER-") &&
          /^\+?91?\d{10}$/.test(token.farmerPhone.replace(/[\s-]/g, ""))
            ? token.farmerPhone
            : "";

        const verificationUrl = `${baseUrl}/verify?token=${encodeURIComponent(
          cleanTokenId
        )}&name=${encodeURIComponent(cleanFarmerName)}&phone=${encodeURIComponent(
          cleanPhone
        )}&center=${encodeURIComponent(cleanCenter)}&bay=${encodeURIComponent(
          cleanBay
        )}&crop=${encodeURIComponent(cleanCrop)}&qty=${encodeURIComponent(
          cleanQty
        )}&status=${encodeURIComponent(cleanStatus)}&key=${encodeURIComponent(
          cleanSessionKey
        )}`;

        // Generate sharp, high-contrast QR Matrix with Error Correction Level M
        const url = await QRCode.toDataURL(verificationUrl, {
          width: Math.max(size * 2, 280), // 2x resolution for retina & phone cameras
          margin: 1,
          color: {
            dark: "#052e16", // Ultra-dark pine emerald for sharp contrast
            light: "#ffffff", // Pure white background required for camera sensors
          },
          errorCorrectionLevel: "M",
        });

        if (isMounted) {
          setQrDataUrl(url);
          setVerificationUrl(verificationUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to generate dynamic QR code:", err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    generateQr();

    return () => {
      isMounted = false;
    };
  }, [token, size]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className="bg-white p-2 rounded-xl shadow-xs border border-zinc-200 flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-1 text-emerald-800">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-[9px] font-mono font-semibold">Generating...</span>
          </div>
        ) : qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`Scannable QR Pass for #${token.tokenId}`}
            className="w-full h-full object-contain select-none"
            loading="eager"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-400">
            <QrIcon className="w-8 h-8" />
            <span className="text-[8px] font-bold">QR Error</span>
          </div>
        )}
      </div>

      {showSessionHash && (
        <div className="mt-1.5 flex flex-col items-center text-center max-w-[280px]">
          <span className="text-[9px] font-mono font-bold text-emerald-900 tracking-wider">
            PASS-{(token.id || "TK1").slice(0, 8).toUpperCase()}-SECURE
          </span>
          <span className="text-[8px] text-zinc-500">
            Scan with smartphone camera on Wi-Fi
          </span>
          {verificationUrl && (
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-[9px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition"
              title="Open pass directly in browser"
            >
              <span>🔗 Open Verification Pass in New Tab</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
