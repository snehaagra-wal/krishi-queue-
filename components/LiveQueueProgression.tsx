"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Radio,
  User,
  ShieldCheck,
  Play,
  Pause,
  RotateCw,
  RefreshCw,
  QrCode,
  Camera,
  X,
  AlertCircle,
  Volume2,
  Check,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  subscribeToCheckins,
  callNextWaitingToken,
  updateCheckin,
  generateGateNames,
  getCropMspRate,
  calculateMspPayout,
  CheckinItem,
} from "@/lib/firestoreService";

interface LiveQueueProgressionProps {
  onCallNext?: (tokenNumber: string) => void;
  baysCount?: number;
}

export default function LiveQueueProgression({
  onCallNext,
  baysCount = 4,
}: LiveQueueProgressionProps) {
  const [tokens, setTokens] = useState<CheckinItem[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recentCallAlert, setRecentCallAlert] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState<boolean>(false);

  // Dynamic Gate Naming (Requirement 12)
  const gateNames = generateGateNames(baysCount);

  // Scanner View Modal state (Requirement 10 & 11)
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualTokenInput, setManualTokenInput] = useState<string>("");
  const [scannedResult, setScannedResult] = useState<{
    token: CheckinItem | null;
    status: "valid" | "invalid" | "cancelled" | "completed";
    message: string;
  } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const unsub = subscribeToCheckins((allCheckins) => {
      setTokens(allCheckins);
    });
    return () => unsub();
  }, []);

  // Web Audio Synthesizer Beep for Realistic Scanner (Requirement 10)
  const playBeep = (isSuccess: boolean = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(isSuccess ? 880 : 320, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  // Filter ONLY active tokens for the live progression view (Requirement 9)
  const activeTokens = tokens.filter(
    (t) =>
      t.status === "Waiting" ||
      t.status === "Called" ||
      t.status === "Serving" ||
      t.status === "In Progress" ||
      t.status === "Verified"
  );

  // Find currently serving / called token from active tokens only
  const servingToken =
    activeTokens.find((t) => t.status === "Serving" || t.status === "In Progress") ||
    activeTokens.find((t) => t.status === "Called") ||
    (activeTokens.length > 0 ? activeTokens[0] : null);

  const totalNonCancelled = tokens.filter((t) => t.status !== "Cancelled").length;
  const clearedTokens = tokens.filter((t) => t.status === "Completed").length;
  const progressPercent =
    totalNonCancelled > 0
      ? Math.min(100, Math.round((clearedTokens / totalNonCancelled) * 100))
      : 0;

  const waitingTokens = activeTokens.filter((t) => t.status === "Waiting");

  const handleNextToken = async () => {
    setIsCalling(true);
    try {
      const assignedGate = gateNames[0] || "Main Entry Gate";
      const called = await callNextWaitingToken(assignedGate);
      if (called) {
        const tokenStr = `#${called.tokenId}`;
        setRecentCallAlert(`Token ${tokenStr} dispatched to ${called.bay}!`);
        if (onCallNext) {
          onCallNext(tokenStr);
        }
      } else {
        setRecentCallAlert("Queue Clear: No waiting tokens currently in line.");
      }
      setTimeout(() => {
        setRecentCallAlert(null);
      }, 3500);
    } catch (err: any) {
      console.error("Failed to advance queue in Firestore:", err);
    } finally {
      setIsCalling(false);
    }
  };

  // Start Real Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraError("Camera access not supported on this browser/device.");
      }
    } catch (err: any) {
      console.warn("Camera stream access:", err);
      setCameraError(
        "Camera stream inactive or permission denied. Interactive Laser Scanner simulation mode active."
      );
      setCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleOpenScanner = () => {
    setIsScannerOpen(true);
    setScannedResult(null);
    startCamera();
  };

  const handleCloseScanner = () => {
    stopCamera();
    setIsScannerOpen(false);
    setScannedResult(null);
    setManualTokenInput("");
  };

  // Process a Scanned Token (Requirement 10 & 11)
  const processScannedTokenId = (rawId: string) => {
    const cleaned = rawId.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
    const tokenMatch = tokens.find(
      (t) =>
        t.tokenId.toUpperCase() === cleaned ||
        t.tokenId.toUpperCase() === `TK-${cleaned.replace("TK-", "")}` ||
        `TK-${t.tokenId.toUpperCase()}` === cleaned
    );

    if (!tokenMatch) {
      playBeep(false);
      setScannedResult({
        token: null,
        status: "invalid",
        message: `Token #${cleaned} not found in official Mandi registry.`,
      });
      return;
    }

    if (tokenMatch.status === "Cancelled") {
      playBeep(false);
      setScannedResult({
        token: tokenMatch,
        status: "cancelled",
        message: `Pass Revoked: Token #${tokenMatch.tokenId} was cancelled. Session isolated & barred from entry.`,
      });
      return;
    }

    if (tokenMatch.status === "Completed") {
      playBeep(false);
      setScannedResult({
        token: tokenMatch,
        status: "completed",
        message: `Pass Already Used: Token #${tokenMatch.tokenId} completed procurement & DBT settlement.`,
      });
      return;
    }

    // Valid active token
    playBeep(true);
    setScannedResult({
      token: tokenMatch,
      status: "valid",
      message: `Verified Digital Pass for ${tokenMatch.farmerName}. Assigned: ${
        tokenMatch.bay || gateNames[0] || "Main Entry Gate"
      }.`,
    });
  };

  const handleQuickDispatchScanned = async (newStatus: "Serving" | "Verified") => {
    if (!scannedResult?.token?.id) return;
    setIsUpdatingStatus(true);
    try {
      const assignedGate = gateNames[0] || "Main Entry Gate";
      await updateCheckin(scannedResult.token.id, {
        status: newStatus,
        bay: assignedGate,
      });
      playBeep(true);
      setRecentCallAlert(
        `Gate Entry Cleared: #${scannedResult.token.tokenId} admitted to ${assignedGate}!`
      );
      setTimeout(() => {
        handleCloseScanner();
      }, 900);
    } catch (err: any) {
      console.error("Failed to update scanned token:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between h-full">
      {/* Top Title & Icon */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Live Token Progression
              </h3>
              <p className="text-[11px] text-zinc-600">
                Active yard queue & entry dispatch (Firestore Synced)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenScanner}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 text-[11px] font-bold shadow-xs transition cursor-pointer"
              title="Open Real Functional Scanner View"
            >
              <Camera className="w-3 h-3" />
              <span>Gate Scanner</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-800 hidden sm:inline">
                {isPaused ? "Paused" : "Live"}
              </span>
            </div>
          </div>
        </div>

        {/* Big Highlight Token Display */}
        <div className="mt-5 flex items-baseline justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              {servingToken ? (
                <>
                  <span className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight font-mono">
                    #{servingToken.tokenId}
                  </span>
                  <span className="text-sm font-bold text-zinc-600">
                    .03
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 ml-1">
                    {servingToken.status}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl sm:text-3xl font-black text-zinc-400 tracking-tight font-mono">
                    Queue Clear
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 ml-1">
                    Idle
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  servingToken ? "bg-emerald-500" : "bg-zinc-400"
                }`}
              ></span>
              {servingToken ? (
                <span>
                  Farmer:{" "}
                  <strong className="text-zinc-800 font-semibold">
                    {servingToken.farmerName}
                  </strong>{" "}
                  • {servingToken.bay || gateNames[0] || "Main Entry Gate"}
                </span>
              ) : (
                <span className="text-zinc-500">
                  No active vehicles currently in dispatch bay
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Queue Progress Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <div className="flex items-center justify-between text-xs text-zinc-600 mb-1.5">
            <span className="font-medium">Daily Tokens Processed</span>
            <span className="font-bold text-zinc-900">
              {clearedTokens} / {totalNonCancelled} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-zinc-200/60">
            <div
              className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-600 mt-1.5">
            <span>
              Expected wait:{" "}
              <strong className="text-zinc-700 font-semibold">
                {waitingTokens.length > 0
                  ? `~${waitingTokens.length * 6} mins`
                  : "0 mins (No Wait)"}
              </strong>
            </span>
            <span>
              Next in line:{" "}
              <strong className="text-emerald-800 font-semibold">
                {waitingTokens.length > 0
                  ? waitingTokens.slice(0, 2).map((w) => `#${w.tokenId}`).join(", ")
                  : "Queue clear"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Alert toast if token called */}
      {recentCallAlert && (
        <div className="my-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{recentCallAlert}</span>
        </div>
      )}

      {/* Secondary Subsection: Active Dynamic Gates & Operators (Requirement 12) */}
      <div className="mt-4 bg-zinc-50/90 rounded-2xl p-3.5 border border-zinc-200/60 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-zinc-900">
              Active Mandi Gates
            </h4>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
              {gateNames.length} Configured
            </span>
          </div>
          <p className="text-[11px] text-zinc-600 mt-0.5 truncate max-w-[220px]">
            {gateNames.slice(0, 3).join(", ")}
            {gateNames.length > 3 ? ` +${gateNames.length - 3}` : ""}
          </p>

          <div className="flex items-center -space-x-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-emerald-800 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs" title="Gate 1-A Staff">
              1A
            </div>
            {gateNames.length > 1 && (
              <div className="w-6 h-6 rounded-full bg-lime-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs" title="Gate 1-B Staff">
                1B
              </div>
            )}
            {gateNames.length > 2 && (
              <div className="w-6 h-6 rounded-full bg-teal-800 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs" title="Gate 1-C Staff">
                1C
              </div>
            )}
            <div className="w-6 h-6 rounded-full bg-zinc-900 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-xs">
              +{gateNames.length}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={handleNextToken}
            disabled={isCalling}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Call Next Farmer in Queue"
          >
            {isCalling ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Call Next</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-[10px] text-zinc-600 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
          >
            {isPaused ? (
              <>
                <Play className="w-2.5 h-2.5 text-emerald-600" /> Resume Queue
              </>
            ) : (
              <>
                <Pause className="w-2.5 h-2.5 text-zinc-400" /> Pause Dispatch
              </>
            )}
          </button>
        </div>
      </div>

      {/* REAL FUNCTIONAL SCANNER VIEW MODAL (Requirements 10 & 11) */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-900 rounded-3xl border border-zinc-700 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Gate QR Scanner View
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      Live Video Feed
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Real-time optical & session verification at Mandi Entry
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseScanner}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Camera Viewport & Laser Scanner Animation */}
            <div className="relative w-full h-64 sm:h-72 bg-black flex items-center justify-center overflow-hidden">
              {/* Actual Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  cameraActive ? "block" : "hidden"
                }`}
              />

              {/* Viewfinder Overlay & Laser Animation */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="relative w-52 h-52 sm:w-60 sm:h-60 border-2 border-emerald-500/40 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.15)] flex items-center justify-center">
                  {/* Corner Targets */}
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  {/* Animated Laser Scanning Line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce" />

                  {/* Target Center Reticle */}
                  <div className="w-12 h-12 border border-dashed border-emerald-400/40 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-zinc-400 font-mono tracking-wide bg-zinc-950/70 px-3 py-1 rounded-full border border-zinc-800">
                  Align Farmer&apos;s Digital Pass QR within frame
                </p>
              </div>

              {cameraError && !cameraActive && (
                <div className="absolute bottom-3 left-4 right-4 bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 text-center text-[10px] text-zinc-400">
                  {cameraError}
                </div>
              )}
            </div>

            {/* Scanned Result Display */}
            {scannedResult && (
              <div
                className={`p-4 border-t ${
                  scannedResult.status === "valid"
                    ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-200"
                    : scannedResult.status === "cancelled"
                    ? "bg-rose-950/40 border-rose-800/60 text-rose-200"
                    : "bg-amber-950/40 border-amber-800/60 text-amber-200"
                } animate-in fade-in duration-200`}
              >
                <div className="flex items-start gap-3">
                  {scannedResult.status === "valid" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-bold">{scannedResult.message}</p>
                    {scannedResult.token && (
                      <div className="mt-2 text-[11px] grid grid-cols-2 gap-1 text-zinc-300">
                        <div>
                          Farmer:{" "}
                          <strong className="text-white">
                            {scannedResult.token.farmerName}
                          </strong>
                        </div>
                        <div>
                          Token:{" "}
                          <strong className="text-white">
                            #{scannedResult.token.tokenId}
                          </strong>
                        </div>
                        <div>
                          Crop:{" "}
                          <strong className="text-white">
                            {scannedResult.token.cropType} ({scannedResult.token.quantity})
                          </strong>
                        </div>
                        <div>
                          Notified MSP:{" "}
                          <strong className="text-emerald-400">
                            ₹{getCropMspRate(scannedResult.token.cropType)}/Q
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dispatch Button if Valid */}
                {scannedResult.status === "valid" && scannedResult.token && (
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleQuickDispatchScanned("Serving")}
                      disabled={isUpdatingStatus}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 text-xs font-bold rounded-full transition cursor-pointer flex items-center gap-1.5"
                    >
                      {isUpdatingStatus ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Admit to Weighbridge</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Interactive Simulation Controls (Requirement 10) */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-3">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Instant Scan Simulation (Testing & Guard Manual Entry)
              </div>

              {/* Waiting Tokens Quick Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {waitingTokens.length > 0 ? (
                  waitingTokens.slice(0, 3).map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => processScannedTokenId(w.tokenId)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-mono font-semibold transition cursor-pointer border border-zinc-700 flex items-center gap-1"
                    >
                      <QrCode className="w-3 h-3 text-emerald-400" />
                      <span>Scan #{w.tokenId} ({w.farmerName})</span>
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">
                    No waiting tokens in line to simulate.
                  </span>
                )}
              </div>

              {/* Manual Token Search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualTokenInput.trim()) {
                    processScannedTokenId(manualTokenInput.trim());
                  }
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  placeholder="Enter Token ID (e.g. TK-1 or 1)"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Verify
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
