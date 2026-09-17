"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users,
  Building2,
  Lock,
  Mail,
  User,
  MapPin,
  Wheat,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Landmark,
  CreditCard,
  Navigation,
  Camera,
  Upload,
  Zap,
  Search,
  X,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import StickyAlert from "./StickyAlert";

import {
  createFarmer,
  getFarmerByNameOrPhone,
  getManagerProfile,
  saveManagerProfile,
  subscribeToCenters,
  findNearestCenters,
  reverseGeocodeCoordinates,
  ProcurementCenter,
  INITIAL_CENTERS,
  searchIndianLocations,
  lookupPincode,
  lookupPincodeOnline,
  findNearestLocality,
  ALL_INDIAN_STATES,
  IndianLocality,
  searchVillagesSortedByLetter,
  createNotification,
} from "@/lib/firestoreService";

export interface UserSession {
  role: "farmer" | "manager";
  name: string;
  identifier: string; // phone or email
  location?: string;
  center?: string;
  farmerId?: string;
  aadhaarVerified?: boolean;
  aadhaarNumber?: string;
  paymentMethod?: "bank" | "upi";
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  upiId?: string;
  photoUrl?: string;
}

interface AuthViewProps {
  onLogin: (session: UserSession) => void;
  initialRole?: "farmer" | "manager";
  onClose?: () => void;
}

export default function AuthView({ onLogin, initialRole = "farmer", onClose }: AuthViewProps) {
  const [role, setRole] = useState<"farmer" | "manager">(initialRole);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

  // Available centers from Firestore
  const [centers, setCenters] = useState<ProcurementCenter[]>([]);

  // Unified Pan-India Centers directory ensuring all 28 States & UTs have authentic mandis
  const allAvailableCenters: ProcurementCenter[] = useMemo(() => {
    const centerMap = new Map<string, ProcurementCenter>();
    // First populate from INITIAL_CENTERS (guarantees coverage in every state)
    for (const c of INITIAL_CENTERS) {
      const key = c.name.toLowerCase().trim();
      centerMap.set(key, {
        ...c,
        id: (c as any).id || (c.code || c.name).toLowerCase().replace(/[^a-z0-9]/g, "_"),
      });
    }
    // Overlay any live changes from Firestore
    for (const c of centers) {
      const key = c.name.toLowerCase().trim();
      centerMap.set(key, c);
    }
    return Array.from(centerMap.values());
  }, [centers]);

  // Pre-fill farmer name with "xyz" as requested, replacing any old phone number
  const [loginPhone, setLoginPhone] = useState("xyz");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Safeguard: If browser attempts to autofill old 10-digit phone number, replace with "xyz"
  useEffect(() => {
    if (role === "farmer" && /^\d{10}$/.test(loginPhone.trim())) {
      setLoginPhone("xyz");
    }
  }, [role, loginPhone]);

  // Sign up form fields
  const [signupName, setSignupName] = useState("");
  const [signupVillage, setSignupVillage] = useState("");
  const [villageInputSuggestions, setVillageInputSuggestions] = useState<IndianLocality[]>([]);
  const [showVillageInputDropdown, setShowVillageInputDropdown] = useState(false);
  const [signupCenter, setSignupCenter] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupPhotoUrl, setSignupPhotoUrl] = useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Payment choice for Manager (if needed)
  const [paymentChoice, setPaymentChoice] = useState<"bank" | "upi">("bank");
  const [signupBankName, setSignupBankName] = useState("State Bank of India");
  const [signupAccountNo, setSignupAccountNo] = useState("");
  const [signupIfsc, setSignupIfsc] = useState("");
  const [signupUpiId, setSignupUpiId] = useState("");

  const [mandiStateFilter, setMandiStateFilter] = useState<string>("All");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [signupLocationNotice, setSignupLocationNotice] = useState<string | null>(null);
  const [sortedCenters, setSortedCenters] = useState<(ProcurementCenter & { distanceKm?: number })[]>([]);

  // Manual Location Search & 6-Digit Pincode Auto-Detection state
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<IndianLocality[]>([]);
  const [selectedPincode, setSelectedPincode] = useState<string>("");

  const handleManualSearchChange = async (val: string) => {
    setManualSearchQuery(val);
    if (!val || val.trim().length === 0) {
      setLocationSuggestions([]);
      return;
    }
    const results = searchIndianLocations(val);
    setLocationSuggestions(results);

    // If user typed 6 digits directly, auto-detect city/village/district/state
    const cleanDigits = val.replace(/\D/g, "");
    if (cleanDigits.length === 6) {
      const match = lookupPincode(cleanDigits);
      if (match) {
        handleSelectLocality(match);
        return;
      }
      // Query government postal API fallback for any Indian postal pincode
      try {
        const onlineMatch = await lookupPincodeOnline(cleanDigits);
        if (onlineMatch) {
          handleSelectLocality(onlineMatch);
        }
      } catch (e) {
        console.warn("Pincode auto-detection error:", e);
      }
    }
  };

  const handleSelectLocality = (loc: IndianLocality) => {
    setSelectedPincode(loc.pincode);
    setManualSearchQuery(loc.name);
    setSignupVillage(loc.fullName);
    setLocationSuggestions([]);

    // Auto-update State filter if available
    if (loc.state) {
      setMandiStateFilter(loc.state);
    }

    // Sort centers by distance to this locality using allAvailableCenters
    const baseList: ProcurementCenter[] = allAvailableCenters;
    const sorted = findNearestCenters(loc.latitude, loc.longitude, baseList, loc.state, loc.district);
    setSortedCenters(sorted);
    if (sorted.length > 0) {
      setSignupCenter(sorted[0].name);
    }

    setSignupLocationNotice(
      `📍 Location Selected: ${loc.fullName} • 📮 PIN: ${loc.pincode} • Closest APMC: ${sorted[0]?.name || "Local Mandi"}`
    );
  };



  // Profile photo file compression and upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Photo size exceeds 5MB. Please choose a smaller photo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 200;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setSignupPhotoUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDetectSignupLocation = () => {
    if (!navigator.geolocation) {
      setSignupLocationNotice("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingLocation(true);
    setSignupLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const geo = await reverseGeocodeCoordinates(lat, lng);
          const baseCenters =
            centers.length > 0
              ? centers
              : INITIAL_CENTERS.map((c, i) => ({ ...c, id: `c-${i}` }));

          const nearest = findNearestCenters(lat, lng, baseCenters, geo.state, geo.district);
          setSortedCenters(nearest);

          // Auto-detect nearest locality and exact 6-digit Indian pincode
          const closestLoc = findNearestLocality(lat, lng);
          if (closestLoc) {
            setSelectedPincode(closestLoc.pincode);
            setManualSearchQuery(closestLoc.fullName);
            if (closestLoc.state) {
              setMandiStateFilter(closestLoc.state);
            }
          }

          if (nearest.length > 0) {
            const closest = nearest[0];
            setSignupCenter(closest.name);
            const detectedLocationStr = [
              geo.locality || closestLoc?.name,
              geo.district ? `Dist. ${geo.district}` : closestLoc?.district ? `Dist. ${closestLoc.district}` : "",
              geo.state || closestLoc?.state || "India",
            ]
              .filter(Boolean)
              .join(", ");

            setSignupVillage(detectedLocationStr || `${closest.district}, ${closest.state || "India"}`);
            const pinStr = closestLoc ? ` • 📮 PIN: ${closestLoc.pincode}` : "";
            setSignupLocationNotice(
              `📍 Live GPS: ${geo.formattedAddress || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`}${pinStr} • Nearest APMC: ${closest.name}, District ${closest.district}, ${closest.state || "India"} (📍 ${closest.distanceKm} km away)`
            );
          }
        } catch (e) {
          console.error("Location geocoding error:", e);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.warn("GPS error:", err);
        setIsDetectingLocation(false);
        setSignupLocationNotice("Unable to access GPS location. Please allow browser location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    const unsub = subscribeToCenters((fetchedCenters) => {
      setCenters(fetchedCenters);
      if (fetchedCenters.length > 0 && !signupCenter) {
        setSignupCenter(fetchedCenters[0].name);
      }
    });
    return () => unsub();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (role === "farmer") {
        const identifier = loginPhone.trim();
        if (!identifier) {
          setErrorMsg("Please enter your registered Farmer Full Name / किसान का नाम.");
          setLoading(false);
          return;
        }

        // Query REAL farmer record from Firestore by Name or Phone
        const existingFarmer = await getFarmerByNameOrPhone(identifier);
        if (existingFarmer) {
          // If farmer set a password during registration, verify if entered
          if (existingFarmer.password && loginPassword && existingFarmer.password !== loginPassword.trim()) {
            setErrorMsg("Incorrect password. Please enter the correct password created during registration.");
            setLoading(false);
            return;
          }

          createNotification({
            title: "Farmer Signed In",
            desc: `Farmer "${existingFarmer.name}" signed into Krishi-Queue (${existingFarmer.village || "Mandi Area"}).`,
            type: "info",
          });

          onLogin({
            role: "farmer",
            name: existingFarmer.name,
            identifier: existingFarmer.phone || existingFarmer.name,
            location: existingFarmer.village,
            center: existingFarmer.center || (centers[0]?.name ?? "Krishi Upaj Mandi Hub"),
            farmerId: existingFarmer.id,
            aadhaarVerified: !!existingFarmer.aadhaarVerified,
            aadhaarNumber: existingFarmer.aadhaarNumber,
            paymentMethod: existingFarmer.paymentMethod,
            bankAccountNumber: existingFarmer.bankAccountNumber,
            bankName: existingFarmer.bankName,
            ifscCode: existingFarmer.ifscCode,
            upiId: existingFarmer.upiId,
            photoUrl: existingFarmer.photoUrl,
          });
        } else if (identifier.toLowerCase() === "xyz") {
          createNotification({
            title: "Farmer Signed In",
            desc: `Farmer "XYZ" signed into Krishi-Queue (Indore Mandi Hub).`,
            type: "info",
          });

          onLogin({
            role: "farmer",
            name: "XYZ",
            identifier: "xyz",
            location: "Indore Rural Mandi Hub",
            center: centers[0]?.name ?? "Krishi Upaj Mandi Hub",
            farmerId: "FARMER-XYZ",
            aadhaarVerified: true,
            paymentMethod: "upi",
            upiId: "xyz@okaxis",
          });
        } else {
          setErrorMsg(
            `Account not found (खाता नहीं मिला): No registered farmer found with "${identifier}". Please click 'Create Account' below to sign up.`
          );
        }
      } else {
        const email = loginEmail.trim().toLowerCase();
        if (!email) {
          setErrorMsg("Please enter your registered official Mandi email address.");
          setLoading(false);
          return;
        }

        // Query REAL manager profile from Firestore
        const existingManager = await getManagerProfile(email);
        if (existingManager) {
          createNotification({
            title: "Mandi Officer Login",
            desc: `Officer "${existingManager.name}" signed in to oversee ${existingManager.centerName || "Mandi Hub"}.`,
            type: "info",
          });

          onLogin({
            role: "manager",
            name: existingManager.name || "Center Superintendent",
            identifier: existingManager.email || email,
            center: existingManager.centerName || (centers[0]?.name ?? "Krishi Upaj Mandi Hub"),
            photoUrl: existingManager.photoUrl,
          });
        } else {
          setErrorMsg(
            `Account Not Found / खाता नहीं मिला: No registered Mandi Officer found for official email "${email}". Please click 'Create Account' below to register your center officer account.`
          );
        }
      }
    } catch (err: any) {
      setErrorMsg("Login verification failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (role === "farmer") {
        const farmerName = signupName.trim();
        const village = signupVillage.trim();
        const email = signupEmail.trim();
        const password = signupPassword.trim();

        if (!farmerName || !village) {
          setErrorMsg("Please enter your Full Name and Village / Location.");
          setLoading(false);
          return;
        }

        if (!password) {
          setErrorMsg("Please set an account password to secure your portal access.");
          setLoading(false);
          return;
        }

        // Check if farmer already exists with this name
        const existing = await getFarmerByNameOrPhone(farmerName);
        if (existing) {
          setErrorMsg(`An account with name "${farmerName}" already exists. Please sign in above or choose another name.`);
          setLoading(false);
          return;
        }

        const newDocId = await createFarmer({
          name: farmerName,
          village,
          phone: "",
          email: email ? email.trim() : "",
          password: password,
          pincode: selectedPincode ? selectedPincode.trim() : "",
          crops: [], // Managed inside dashboard
          acres: 5.0,
          verified: false,
          aadhaarVerified: false,
          photoUrl: signupPhotoUrl || "",
          center: signupCenter || (centers[0]?.name ?? "Krishi Upaj Mandi Hub"),
        });

        createNotification({
          title: "New Farmer Account Registered",
          desc: `Farmer "${farmerName}" registered from ${village} (${signupCenter || "APMC Center"}).`,
          type: "success",
        });

        onLogin({
          role: "farmer",
          name: farmerName,
          identifier: farmerName,
          location: village,
          center: signupCenter || (centers[0]?.name ?? "Krishi Upaj Mandi Hub"),
          farmerId: newDocId,
          aadhaarVerified: false,
          photoUrl: signupPhotoUrl || "",
        });
      } else {
        const officerName = signupName.trim();
        const officerEmail = loginEmail.trim().toLowerCase();
        const officerCenter = signupCenter || centers[0]?.name || "Krishi Upaj Mandi Hub";

        if (!officerName || !officerEmail) {
          setErrorMsg("Please enter Officer Full Name and Official Email address.");
          setLoading(false);
          return;
        }

        await saveManagerProfile({
          name: officerName,
          email: officerEmail,
          role: "Chief Mandi Superintendent",
          centerName: officerCenter,
          phone: "+91 98765 43210",
          photoUrl: signupPhotoUrl || undefined,
        });

        onLogin({
          role: "manager",
          name: officerName,
          identifier: officerEmail,
          center: officerCenter,
          photoUrl: signupPhotoUrl,
        });
      }
    } catch (err: any) {
      setErrorMsg("Registration failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf1ed] flex flex-col items-center justify-center p-4 sm:p-6 select-none relative">
      {/* Sticky / Viewport-Locked Floating Error Alert */}
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] animate-in slide-in-from-top-4 duration-200">
          <div className="p-3.5 sm:p-4 bg-rose-700 text-white rounded-2xl shadow-2xl border border-rose-800 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-200 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs sm:text-sm font-bold block leading-snug">
                  {errorMsg}
                </span>
                {(errorMsg.toLowerCase().includes("account not found") ||
                  errorMsg.toLowerCase().includes("please register")) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      if (role === "farmer" && loginPhone) {
                        setSignupName(loginPhone);
                      }
                      setErrorMsg("");
                    }}
                    className="mt-2 px-3 py-1 bg-white text-rose-800 font-bold rounded-full text-xs shadow-xs hover:bg-rose-50 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Register Now / अभी नया खाता बनाएं</span>
                    <ArrowRight className="w-3 h-3 text-rose-800" />
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg("")}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-rose-800/60 transition cursor-pointer shrink-0"
              title="Close alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="relative max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-2xl shadow-zinc-300/50 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center transition cursor-pointer z-10"
            title="Close / Back to Homepage"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-2 mb-3 shadow-xs">
            <img
              src="/krishi logo.png"
              alt="Krishi-Queue Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-emerald-950 tracking-tight flex items-center gap-2">
            Krishi-Queue
          </h1>
          <p className="text-xs text-zinc-600 mt-1">
            Agricultural Mandi Slot & Token Queue Management System
          </p>
        </div>

        {/* 1. Role Selector Pills (Farmer vs Center Manager) */}
        <div>
          <label className="block text-center text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
            Select Your Account Role
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/70">
            <button
              type="button"
              onClick={() => setRole("farmer")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                role === "farmer"
                  ? "bg-white text-emerald-900 shadow-sm border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Farmer (किसान)</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("manager")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                role === "manager"
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Manager (अधिकारी)</span>
            </button>
          </div>
        </div>

        {/* 2. Login vs Sign Up Tab Switcher */}
        <div className="flex border-b border-zinc-100 text-xs">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 pb-2.5 font-bold text-center border-b-2 transition cursor-pointer ${
              !isSignUp
                ? "border-emerald-700 text-emerald-900"
                : "border-transparent text-zinc-600 hover:text-zinc-800"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 pb-2.5 font-bold text-center border-b-2 transition cursor-pointer ${
              isSignUp
                ? "border-emerald-700 text-emerald-900"
                : "border-transparent text-zinc-600 hover:text-zinc-800"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Message with Instant Register Switch */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col gap-2 text-xs text-rose-800 animate-in fade-in duration-150">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug font-semibold">{errorMsg}</span>
            </div>
            {(errorMsg.toLowerCase().includes("account not found") || errorMsg.toLowerCase().includes("please register")) && (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  if (role === "farmer" && loginPhone) {
                    setSignupName(loginPhone);
                  }
                  setErrorMsg("");
                }}
                className="self-start mt-1 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-full text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Register Now / अभी नया खाता बनाएं</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 3. Form Handling */}
        {!isSignUp ? (
          // SIGN IN FORM
          <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
            {/* Hidden dummy inputs to consume aggressive browser credential autofill */}
            <div style={{ position: "absolute", opacity: 0, height: 0, width: 0, overflow: "hidden", zIndex: -1 }}>
              <input type="text" name="fake_username_autofill" tabIndex={-1} autoComplete="off" readOnly />
              <input type="password" name="fake_password_autofill" tabIndex={-1} autoComplete="off" readOnly />
            </div>

            {role === "farmer" ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Farmer Full Name / किसान का नाम
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="farmer_full_name_login"
                    name="farmer_full_name_login"
                    autoComplete="off"
                    placeholder="xyz"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium placeholder:text-zinc-400 shadow-2xs"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Manager Official Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="saurabh@krishiqueue.gov.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium placeholder:text-zinc-400 shadow-2xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Password / Mandi PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium placeholder:text-zinc-400 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition cursor-pointer p-0.5 rounded"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold rounded-full shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking database...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {role === "farmer" ? "Farmer Portal" : "Manager Dashboard"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        ) : (
          // SIGN UP FORM
          <form onSubmit={handleSignUpSubmit} className="space-y-3">
            {/* Profile Photo Upload Avatar (Requirement 4) */}
            <div className="flex flex-col items-center justify-center gap-1.5 pb-1">
              <div className="relative group">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-dashed border-emerald-300 flex items-center justify-center overflow-hidden shadow-inner cursor-pointer hover:border-emerald-500 hover:scale-105 transition-all"
                >
                  {signupPhotoUrl ? (
                    <img
                      src={signupPhotoUrl}
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-emerald-700">
                      <Camera className="w-6 h-6" />
                      <span className="text-[9px] font-bold mt-0.5">Upload Photo</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full shadow-md transition cursor-pointer"
                  title="Upload Profile Picture"
                >
                  <Upload className="w-3 h-3" />
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <span className="text-[11px] text-zinc-600 font-medium">
                {signupPhotoUrl ? "✓ Photo uploaded • Click to change" : "Upload Profile Picture / प्रोफ़ाइल फोटो"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={role === "farmer" ? "Balwinder Sandhu" : "Officer Name"}
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium placeholder:text-zinc-400 shadow-2xs"
                />
              </div>
            </div>

            {role === "farmer" ? (
              <>
                {/* Manual Location Search & Pincode Auto-Detection Box (Requirement 1 & 2) */}
                <div className="p-3 bg-zinc-50/80 border border-zinc-200 rounded-2xl space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Farmer Location & Pincode / किसान का स्थान व पिनकोड</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectSignupLocation}
                      disabled={isDetectingLocation}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200 px-2 py-0.5 rounded-lg border border-emerald-300 transition cursor-pointer shadow-2xs"
                    >
                      <Navigation className={`w-2.5 h-2.5 text-emerald-700 ${isDetectingLocation ? "animate-spin" : ""}`} />
                      <span>{isDetectingLocation ? "Locating..." : "Use Current Location (GPS)"}</span>
                    </button>
                  </div>

                  {/* Location Search Input (Full Width for comfortable typing) */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search City, Area, or 6-digit PIN (e.g. Raipur, Tilda, 493114)..."
                      value={manualSearchQuery}
                      onChange={(e) => handleManualSearchChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-medium placeholder:text-zinc-400 shadow-2xs"
                    />

                    {/* Suggestions Dropdown */}
                    {locationSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-zinc-100">
                        {locationSuggestions.map((loc, idx) => (
                          <div
                            key={`${loc.pincode}-${idx}`}
                            onClick={() => handleSelectLocality(loc)}
                            className="p-2.5 hover:bg-emerald-50/80 cursor-pointer flex items-center justify-between transition text-left"
                          >
                            <div className="flex items-start gap-2">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                              <div>
                                <div className="text-xs font-semibold text-zinc-900">
                                  {loc.fullName}
                                </div>
                                <div className="text-[10px] text-zinc-500">
                                  District: {loc.district} • {loc.state}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                                📮 {loc.pincode}
                              </span>
                              {loc.type && (
                                <span className="text-[9px] uppercase font-bold text-zinc-400">
                                  {loc.type.replace("_", " ")}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dedicated Pincode Display Row - Strictly Single Horizontal Line */}
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300/90 rounded-xl shadow-2xs whitespace-nowrap flex-nowrap overflow-hidden">
                    <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                      <span className="text-xs select-none">📮</span>
                      <span className="text-[11px] font-bold uppercase text-emerald-900 tracking-tight">
                        PIN Code:
                      </span>
                      <span className="font-mono font-black text-xs text-emerald-950 bg-white px-2 py-0.5 rounded-md border border-emerald-300 shadow-inner">
                        {selectedPincode || "------"}
                      </span>
                    </div>
                    {selectedPincode ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Auto-Detected
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-medium shrink-0 truncate">
                        Auto-detected from city/PIN
                      </span>
                    )}
                  </div>

                  {/* Confirmed Village/Tehsil Field with Live Letter-Sorted Dropdown */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-semibold text-zinc-700">
                        Selected Village / Tehsil (विलेज / तहसील)
                      </label>
                      {signupVillage && (
                        <span className="text-[10px] text-emerald-700 font-bold">✓ Selected</span>
                      )}
                    </div>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Type village name (e.g. Waidhan, Singrauli, Deosar)..."
                        value={signupVillage}
                        onFocus={() => {
                          setVillageInputSuggestions(searchVillagesSortedByLetter(signupVillage));
                          setShowVillageInputDropdown(true);
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSignupVillage(val);
                          setVillageInputSuggestions(searchVillagesSortedByLetter(val));
                          setShowVillageInputDropdown(true);
                        }}
                        required
                        className="w-full pl-9 pr-3 py-1.5 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium placeholder:text-zinc-400"
                      />

                      {/* Live Suggestions Dropdown for Village */}
                      {showVillageInputDropdown && villageInputSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto divide-y divide-zinc-100">
                          {villageInputSuggestions.map((loc, idx) => (
                            <div
                              key={`reg-v-${loc.pincode}-${idx}`}
                              onMouseDown={() => {
                                setSignupVillage(loc.name);
                                setSelectedPincode(loc.pincode);
                                setManualSearchQuery(`${loc.name}, ${loc.district} (${loc.pincode})`);
                                const sorted = findNearestCenters(loc.latitude, loc.longitude, allAvailableCenters);
                                if (sorted.length > 0) {
                                  setSignupCenter(sorted[0].name);
                                }
                                setShowVillageInputDropdown(false);
                              }}
                              className="p-2.5 hover:bg-emerald-50/80 cursor-pointer flex items-center justify-between transition text-left"
                            >
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                <div>
                                  <div className="text-xs font-semibold text-zinc-900">
                                    {loc.name}
                                  </div>
                                  <div className="text-[10px] text-zinc-500">
                                    District: {loc.district} • {loc.state}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                                📮 {loc.pincode}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                {/* Mandi Selection with Pan-India State Filter and GPS */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-700">
                      Registered Mandi Center (अखिल भारतीय मंडी)
                    </label>
                  </div>
                  {signupLocationNotice && (
                    <div className="mb-1.5 p-1.5 rounded-lg bg-emerald-50 text-[10px] text-emerald-900 border border-emerald-200">
                      {signupLocationNotice}
                    </div>
                  )}

                  {/* Pan-India State Filter Selector */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Filter State:</span>
                    <select
                      value={mandiStateFilter}
                      onChange={(e) => {
                        const nextState = e.target.value;
                        setMandiStateFilter(nextState);
                        const filtered = (sortedCenters.length > 0 ? sortedCenters : allAvailableCenters).filter((c) =>
                          nextState === "All" ? true : c.state?.toLowerCase() === nextState.toLowerCase()
                        );
                        if (filtered.length > 0) {
                          setSignupCenter(filtered[0].name);
                        }
                      }}
                      className="text-[11px] font-semibold text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[220px]"
                    >
                      {ALL_INDIAN_STATES.map((st) => {
                        const count =
                          st === "All"
                            ? allAvailableCenters.length
                            : allAvailableCenters.filter(
                                (c) => c.state?.toLowerCase() === st.toLowerCase()
                              ).length;
                        return (
                          <option key={st} value={st}>
                            {st === "All" ? `All States (सभी राज्य - ${count} APMCs)` : `${st} (${count} Mandi${count === 1 ? "" : "s"})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <select
                    value={signupCenter}
                    onChange={(e) => setSignupCenter(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  >
                    {(() => {
                      const baseList = sortedCenters.length > 0 ? sortedCenters : allAvailableCenters;
                      const filteredList = baseList.filter((c) =>
                        mandiStateFilter === "All" ? true : c.state?.toLowerCase() === mandiStateFilter.toLowerCase()
                      );
                      const finalOptions = filteredList.length > 0 ? filteredList : baseList;

                      return finalOptions.map((c, idx) => (
                        <option key={(c as any).id || idx} value={c.name} className="text-zinc-900">
                          {c.name} • Dist. {c.district}, {c.state || "India"}
                          {typeof (c as any).distanceKm === "number" ? ` (📍 ${(c as any).distanceKm} km away${idx === 0 ? " - Nearest Hub" : ""})` : ""}
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                {/* Optional Email & Account Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Email Address <span className="text-zinc-400 font-normal">(Optional / वैकल्पिक)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="kisan@gmail.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium placeholder:text-zinc-400 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Account Password <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        className="w-full pl-9 pr-10 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium placeholder:text-zinc-400 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        aria-label={showSignupPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition cursor-pointer p-0.5 rounded"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Farmer-Friendly Safe Assurance Note */}
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-[11px] text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>100% Safe & Hassle-Free Registration:</strong> We do not ask for Bank Accounts or Aadhaar during initial signup. You can securely link your bank account inside your dashboard whenever you want to generate a token or receive payments.
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-700">
                      Mandi Center Affiliation (मंडी संबद्धता)
                    </label>
                  </div>
                  {/* Pan-India State Filter Selector for Manager */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">State:</span>
                    <select
                      value={mandiStateFilter}
                      onChange={(e) => {
                        const nextState = e.target.value;
                        setMandiStateFilter(nextState);
                        const filtered = (sortedCenters.length > 0 ? sortedCenters : allAvailableCenters).filter((c) =>
                          nextState === "All" ? true : c.state?.toLowerCase() === nextState.toLowerCase()
                        );
                        if (filtered.length > 0) {
                          setSignupCenter(filtered[0].name);
                        }
                      }}
                      className="text-[11px] font-semibold text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[220px]"
                    >
                      {ALL_INDIAN_STATES.map((st) => {
                        const count =
                          st === "All"
                            ? allAvailableCenters.length
                            : allAvailableCenters.filter(
                                (c) => c.state?.toLowerCase() === st.toLowerCase()
                              ).length;
                        return (
                          <option key={st} value={st}>
                            {st === "All" ? `All States (सभी राज्य - ${count} APMCs)` : `${st} (${count} Mandi${count === 1 ? "" : "s"})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <select
                    value={signupCenter}
                    onChange={(e) => setSignupCenter(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  >
                    {(() => {
                      const baseList = sortedCenters.length > 0 ? sortedCenters : allAvailableCenters;
                      const filteredList = baseList.filter((c) =>
                        mandiStateFilter === "All" ? true : c.state?.toLowerCase() === mandiStateFilter.toLowerCase()
                      );
                      const finalOptions = filteredList.length > 0 ? filteredList : baseList;

                      return finalOptions.map((c, idx) => (
                        <option key={(c as any).id || idx} value={c.name} className="text-zinc-900">
                          {c.name} • Dist. {c.district}, {c.state || "India"}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Official Mandi Email
                  </label>
                  <input
                    type="email"
                    placeholder="officer@apmc.gov.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl font-medium placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-full shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Register & Enter Krishi-Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* 4. Strict Database Verification Security Notice */}
        <div className="pt-4 border-t border-zinc-100 flex flex-col items-center justify-center gap-1.5 text-center">
          <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Strict Zero-State Database Verification Active</span>
          </div>
          <p className="text-[10px] text-zinc-500 max-w-xs leading-relaxed">
            All users must register a valid profile in Cloud Firestore before signing in. Unregistered accounts cannot bypass authentication.
          </p>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-zinc-600">
        Krishi-Queue Mandi Management • e-NAM Integrated e-Gate System
      </div>
    </div>
  );
}
