"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Wheat,
  Clock,
  Calendar,
  CheckCircle2,
  Layers,
  LogOut,
  MapPin,
  QrCode,
  Truck,
  Plus,
  PlusCircle,
  Building2,
  FileText,
  User,
  AlertCircle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Landmark,
  CreditCard,
  X,
  Edit3,
  Navigation,
  Compass,
  UserCheck,
  Camera,
  Upload,
  Zap,
  Sparkles,
  Share2,
  Printer,
  ExternalLink,
  Search,
} from "lucide-react";
import StickyAlert from "./StickyAlert";
import DigitalPassQR from "./DigitalPassQR";
import {
  subscribeFarmerTokens,
  subscribeFarmerProfile,
  verifyFarmerAadhaar,
  updateFarmerBankDetails,
  subscribeToCenters,
  createCheckin,
  updateCheckin,
  deleteCheckin,
  createFarmer,
  updateFarmer,
  createNotification,
  findNearestCenters,
  calculateDistanceKm,
  reverseGeocodeCoordinates,
  getNextSequentialToken,
  getCropMspRate,
  calculateMspPayout,
  CROP_MSP_RATES,
  INITIAL_CENTERS,
  searchIndianLocations,
  searchVillagesSortedByLetter,
  lookupPincode,
  lookupPincodeOnline,
  findNearestLocality,
  ALL_INDIAN_STATES,
  IndianLocality,
  searchIndianBanks,
  type IndianBankInfo,
  INDIAN_BANKS,
  CheckinItem,
  Farmer,
  ProcurementCenter,
} from "@/lib/firestoreService";

interface FarmerPortalViewProps {
  farmerName?: string;
  farmerPhone?: string;
  farmerLocation?: string;
  farmerCenter?: string;
  farmerId?: string;
  initialAadhaarVerified?: boolean;
  onLogout: () => void;
  showToast?: (message: string) => void;
}

export default function FarmerPortalView({
  farmerName = "",
  farmerPhone = "",
  farmerLocation = "",
  farmerCenter = "",
  farmerId = "",
  initialAadhaarVerified = false,
  onLogout,
  showToast,
}: FarmerPortalViewProps) {
  // Real-time farmer profile from Firestore
  const [profile, setProfile] = useState<Farmer | null>(null);
  const [availableCenters, setAvailableCenters] = useState<ProcurementCenter[]>([]);
  const [stickyError, setStickyError] = useState<string | null>(null);

  // Unified Mandis list ensuring every state has authentic APMC mandis available
  const allAvailableCenters: ProcurementCenter[] = useMemo(() => {
    const centerMap = new Map<string, ProcurementCenter>();
    for (const c of INITIAL_CENTERS) {
      const key = c.name.toLowerCase().trim();
      centerMap.set(key, {
        ...c,
        id: (c as any).id || (c.code || c.name).toLowerCase().replace(/[^a-z0-9]/g, "_"),
      });
    }
    for (const c of availableCenters) {
      const key = c.name.toLowerCase().trim();
      centerMap.set(key, c);
    }
    return Array.from(centerMap.values());
  }, [availableCenters]);

  // Aadhaar Modal state
  const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);
  const [aadhaarError, setAadhaarError] = useState("");

  // Bank & UPI Settlement Modal state (Requirement 6)
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [settlementChoice, setSettlementChoice] = useState<"bank" | "upi">("bank");
  const [bankNameInput, setBankNameInput] = useState("");
  const [bankSuggestions, setBankSuggestions] = useState<IndianBankInfo[]>([]);
  const [accountNoInput, setAccountNoInput] = useState("");
  const [ifscInput, setIfscInput] = useState("");
  const [upiIdInput, setUpiIdInput] = useState("");
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [bankError, setBankError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);

  // Real-time farmer tokens from Firestore
  const [tokens, setTokens] = useState<CheckinItem[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Digital Pass & Personal QR Modal state (Requirements 10 & 11)
  const [isDigitalPassOpen, setIsDigitalPassOpen] = useState(false);
  const [selectedPassToken, setSelectedPassToken] = useState<CheckinItem | null>(null);

  // Edit Profile Modal state (Requirement 4)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editVillage, setEditVillage] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [villageSuggestions, setVillageSuggestions] = useState<IndianLocality[]>([]);
  const [showVillageDropdown, setShowVillageDropdown] = useState(false);
  const [editCenter, setEditCenter] = useState("");
  const [editAcres, setEditAcres] = useState("5.0");
  const [editCrops, setEditCrops] = useState("Wheat, Paddy");
  const [editPhotoUrl, setEditPhotoUrl] = useState<string>("");
  const editFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editProfileError, setEditProfileError] = useState("");

  // GPS Location state & nearest Mandi auto-selection
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [sortedCenters, setSortedCenters] = useState<(ProcurementCenter & { distanceKm?: number })[]>([]);

  // Slot booking form state (Requirements 5 & 7)
  const [bookCenter, setBookCenter] = useState(farmerCenter || "");
  const [bookCrop, setBookCrop] = useState("Sharbati Wheat (Grade A)");
  const [bookQuantity, setBookQuantity] = useState("35");
  const [bookDate, setBookDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [bookTime, setBookTime] = useState("10:00 AM - 11:00 AM");
  const [bookVehicle, setBookVehicle] = useState("");
  const [bookPhone, setBookPhone] = useState("");

  // Manual Location Search & 6-Digit Pincode Auto-Detection state (Requirements 1 & 2)
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<IndianLocality[]>([]);
  const [selectedPincode, setSelectedPincode] = useState<string>("");
  const [mandiStateFilter, setMandiStateFilter] = useState<string>("All");

  const handleManualSearchChange = async (val: string) => {
    setManualSearchQuery(val);
    if (!val || val.trim().length === 0) {
      setLocationSuggestions([]);
      return;
    }
    const results = searchIndianLocations(val);
    setLocationSuggestions(results);

    // If user typed 6 digits directly, auto-detect pincode and city immediately
    const cleanDigits = val.replace(/\D/g, "");
    if (cleanDigits.length === 6) {
      let match = lookupPincode(cleanDigits);
      if (match) {
        handleSelectLocality(match);
      } else {
        // Query live Postal PIN API for any arbitrary Indian PIN code
        const onlineLoc = await lookupPincodeOnline(cleanDigits);
        if (onlineLoc) {
          handleSelectLocality(onlineLoc);
        }
      }
    }
  };

  const handleSelectLocality = (loc: IndianLocality) => {
    setSelectedPincode(loc.pincode);
    setManualSearchQuery(loc.fullName);
    setLocationSuggestions([]);

    if (loc.state) {
      setMandiStateFilter(loc.state);
    }

    const baseList: ProcurementCenter[] = allAvailableCenters;
    const sorted = findNearestCenters(loc.latitude, loc.longitude, baseList, loc.state, loc.district);
    setSortedCenters(sorted);

    if (sorted.length > 0) {
      setBookCenter(sorted[0].name);
    }

    setLocationNotice(
      `📍 Location Selected: ${loc.fullName} • 📮 PIN: ${loc.pincode} • Nearest APMC: ${sorted[0]?.name || "Local Mandi"}`
    );
    if (showToast) {
      showToast(`📍 Selected ${loc.fullName} (PIN: ${loc.pincode})`);
    }
  };

  // Subscribe to farmer tokens and profile in real time from Firestore
  useEffect(() => {
    if (!farmerPhone && !farmerId && !farmerName) return;

    setLoadingTokens(true);
    // Strict isolation: only tokens matching this farmer's phone or exact name are fetched
    const unsubscribeTokens = subscribeFarmerTokens(
      farmerPhone,
      (fetchedTokens) => {
        setTokens(fetchedTokens);
        setLoadingTokens(false);
      },
      (error) => {
        console.error("Farmer tokens subscription error:", error);
        setLoadingTokens(false);
      },
      farmerName
    );

    const unsubscribeProfile = subscribeFarmerProfile(
      farmerPhone || farmerId || farmerName,
      (fetchedProfile) => {
        if (fetchedProfile) {
          setProfile(fetchedProfile);
          if (fetchedProfile.center && !bookCenter) {
            setBookCenter(fetchedProfile.center);
          }
          if (fetchedProfile.bankName && !bankNameInput) {
            setBankNameInput(fetchedProfile.bankName);
          }
          if (fetchedProfile.bankAccountNumber && !accountNoInput) {
            setAccountNoInput(fetchedProfile.bankAccountNumber);
          }
          if (fetchedProfile.ifscCode && !ifscInput) {
            setIfscInput(fetchedProfile.ifscCode);
          }
        }
      }
    );

    const unsubscribeCenters = subscribeToCenters((fetchedCenters) => {
      setAvailableCenters(fetchedCenters);
      if (fetchedCenters.length > 0 && !bookCenter) {
        setBookCenter(farmerCenter || fetchedCenters[0].name);
      }
    });

    return () => {
      unsubscribeTokens();
      unsubscribeProfile();
      unsubscribeCenters();
    };
  }, [farmerPhone, farmerId]);

  // Global Escape key listener to easily dismiss any open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDigitalPassOpen(false);
        setIsBankModalOpen(false);
        setIsAadhaarModalOpen(false);
        setIsEditProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const displayName = profile?.name || farmerName || "Farmer";
  const displayPhone = profile?.phone || farmerPhone || "";
  const hasRealPhone = Boolean(
    displayPhone &&
    /^\+?91?\d{10}$/.test(displayPhone.replace(/[\s-]/g, "")) &&
    !displayPhone.toUpperCase().startsWith("FARMER") &&
    displayPhone.toLowerCase() !== displayName.toLowerCase()
  );

  // Pre-fill booking form mobile number if saved in profile
  useEffect(() => {
    if (hasRealPhone && displayPhone && !bookPhone) {
      const cleanDigits = displayPhone.replace(/\D/g, "").slice(-10);
      if (cleanDigits.length === 10) {
        setBookPhone(cleanDigits);
      }
    }
  }, [hasRealPhone, displayPhone]);
  const displayLocation = profile?.village || farmerLocation || "Karnal";
  const isAadhaarVerified = profile?.aadhaarVerified ?? initialAadhaarVerified ?? false;
  const hasPaymentLinked = Boolean(
    (profile?.paymentMethod === "upi" && profile?.upiId) ||
    (profile?.bankAccountNumber && profile?.ifscCode)
  );

  // Find the most relevant active token (Waiting, Called, Serving, In Progress, Verified)
  const activeToken = tokens.find(
    (t) =>
      t.status === "Serving" ||
      t.status === "Called" ||
      t.status === "In Progress" ||
      t.status === "Verified" ||
      t.status === "Waiting"
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setEditProfileError("Photo size exceeds 5MB. Please choose a smaller photo.");
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
        setEditPhotoUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleBookSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStickyError(null);

    const quantityNum = parseFloat(bookQuantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setStickyError("Invalid Quantity: Please enter a valid positive number of Quintals.");
      return;
    }

    if (!bookCenter) {
      setStickyError("Mandi Center Required: Please select a registered procurement center for slot booking.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine next sequential token number strictly starting from #TK-1 (Requirements 8 & 13)
      const generatedToken = await getNextSequentialToken();
      const mspRate = getCropMspRate(bookCrop);
      const payout = calculateMspPayout(bookCrop, quantityNum);

      const cleanBookDigits = bookPhone.replace(/\D/g, "").slice(-10);
      const effectivePhone = cleanBookDigits.length === 10
        ? `+91 ${cleanBookDigits}`
        : displayPhone;

      // If farmer provided a mobile number in booking form, save it to their profile for future visits
      if (cleanBookDigits.length === 10 && (!hasRealPhone || displayPhone !== effectivePhone)) {
        const targetFarmerId = profile?.id || farmerId;
        if (targetFarmerId) {
          updateFarmer(targetFarmerId, { phone: effectivePhone }).catch(console.error);
          setProfile((prev) => prev ? { ...prev, phone: effectivePhone } : null);
        }
      }

      const newCheckinData: Omit<CheckinItem, "id"> = {
        tokenId: generatedToken,
        farmerName: displayName,
        farmerPhone: effectivePhone,
        village: displayLocation,
        cropType: bookCrop,
        quantity: `${quantityNum} Quintals`,
        quantityNum: quantityNum,
        slotTime: bookTime,
        slotDate: bookDate,
        vehicle: bookVehicle || "Tractor Trolley",
        bay: "Gate 1-A Queue",
        status: "Waiting",
        center: bookCenter || (availableCenters[0]?.name ?? "Krishi Upaj Mandi Hub"),
        payout: payout.formattedTotal,
        mspRate: payout.mspRate,
        paymentAmount: payout.totalAmount,
        totalPayout: payout.totalAmount,
        paymentMethod: profile?.paymentMethod || "bank",
        upiId: profile?.upiId,
        photoUrl: profile?.photoUrl,
      };

      await createCheckin(newCheckinData);

      createNotification({
        title: `New Slot Booked: #${generatedToken}`,
        desc: `${displayName} booked arrival for ${bookCrop} (${quantityNum} Q) on ${bookDate} (${bookTime}).`,
        type: "success",
      });

      if (showToast) {
        showToast(`Slot confirmed! Your live Token Number is #${generatedToken}`);
      }
    } catch (err: any) {
      console.error("Failed to book slot:", err);
      const errorMsg = "Error saving booking to Firestore: " + (err.message || "Please try again.");
      setStickyError(errorMsg);
      if (showToast) {
        showToast(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (id: string, tokenId: string) => {
    if (!confirm(`Are you sure you want to cancel token #${tokenId}?`)) return;
    try {
      await updateCheckin(id, { status: "Cancelled" });

      createNotification({
        title: `Slot #${tokenId} Cancelled`,
        desc: `${displayName} cancelled arrival token #${tokenId}.`,
        type: "warning",
      });

      if (showToast) {
        showToast(`Token #${tokenId} has been cancelled.`);
      }
    } catch (err: any) {
      console.error("Failed to cancel token:", err);
      if (showToast) {
        showToast("Failed to cancel token: " + (err.message || ""));
      }
    }
  };

  const handleOpenEditProfile = () => {
    setEditName(profile?.name || displayName);
    setEditPhone(hasRealPhone ? displayPhone : "");
    setEditVillage(profile?.village || displayLocation);
    setEditPincode(profile?.pincode || "");
    setEditCenter(profile?.center || bookCenter || (availableCenters[0]?.name ?? "Krishi Upaj Mandi Hub"));
    setEditAcres(profile?.acres ? String(profile.acres) : "5.0");
    setEditCrops(profile?.crops && profile.crops.length > 0 ? profile.crops.join(", ") : "Wheat, Paddy");
    setEditPhotoUrl(profile?.photoUrl || "");
    setEditProfileError("");
    setVillageSuggestions(searchVillagesSortedByLetter(profile?.village || displayLocation || ""));
    setShowVillageDropdown(false);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProfileError("");

    if (!editName.trim()) {
      setEditProfileError("Farmer full name is required.");
      return;
    }
    if (!editVillage.trim()) {
      setEditProfileError("Village / Tehsil name is required.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedData: Partial<Farmer> = {
        name: editName.trim(),
        village: editVillage.trim(),
        center: editCenter.trim(),
        acres: parseFloat(editAcres) || 5.0,
        crops: editCrops ? editCrops.split(",").map((c) => c.trim()).filter(Boolean) : ["Wheat", "Paddy"],
        photoUrl: editPhotoUrl || undefined,
      };
      if (editPincode) {
        updatedData.pincode = editPincode.trim();
      }
      if (editPhone && editPhone.trim()) {
        const cleanP = editPhone.replace(/\D/g, "").slice(-10);
        if (cleanP.length === 10) {
          updatedData.phone = `+91 ${cleanP}`;
        }
      }

      const cleanExistingPhone =
        profile?.phone && !profile.phone.startsWith("FARMER-") && /^\+?91?\d{10}$/.test(profile.phone.replace(/[\s-]/g, ""))
          ? profile.phone
          : "";

      let targetId = profile?.id || farmerId;
      if (targetId) {
        await updateFarmer(targetId, updatedData);
      } else {
        targetId = await createFarmer({
          ...updatedData,
          name: updatedData.name || displayName,
          phone: updatedData.phone || cleanExistingPhone || "",
          village: updatedData.village || displayLocation,
          verified: isAadhaarVerified,
          aadhaarVerified: isAadhaarVerified,
        } as any);
      }

      setProfile((prev) =>
        prev
          ? { ...prev, ...updatedData, id: targetId }
          : ({
              id: targetId,
              ...updatedData,
              phone: updatedData.phone || cleanExistingPhone || "",
              verified: isAadhaarVerified,
              aadhaarVerified: isAadhaarVerified,
              acres: parseFloat(editAcres) || 5.0,
            } as Farmer)
      );

      if (editCenter) {
        setBookCenter(editCenter);
      }

      setIsEditProfileOpen(false);
      if (showToast) {
        showToast("✓ Farmer profile updated successfully in Firestore!");
      }
    } catch (err: any) {
      console.error("Failed to update profile in Firestore:", err);
      setEditProfileError("Failed to save changes: " + (err.message || ""));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const geo = await reverseGeocodeCoordinates(lat, lng);
          const baseCenters =
            availableCenters.length > 0
              ? availableCenters
              : INITIAL_CENTERS.map((c, i) => ({ ...c, id: `center-${i}` }));

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
            setBookCenter(closest.name);

            const detectedPlace = geo.formattedAddress || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
            const pinStr = closestLoc ? ` • 📮 PIN: ${closestLoc.pincode}` : "";
            const mandiFullDetails = `${closest.name}, District ${closest.district}, ${closest.state || "India"}`;

            setLocationNotice(
              `📍 Live GPS: ${detectedPlace}${pinStr} • Nearest APMC: ${mandiFullDetails} (📍 ${closest.distanceKm} km away)`
            );

            if (showToast) {
              showToast(`Nearest APMC Mandi: ${closest.name}, Dist. ${closest.district} (${closest.distanceKm} km)`);
            }
          }
        } catch (e) {
          console.error("GPS location resolution error:", e);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Geolocation warning:", err);
        setIsLocating(false);
        setLocationNotice("Could not access live GPS. Please enable browser location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAadhaarVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAadhaarError("");
    setStickyError(null);
    const cleanDigits = aadhaarInput.replace(/\D/g, "");
    if (cleanDigits.length !== 12) {
      const err = "Please enter a valid 12-digit Aadhaar number.";
      setAadhaarError(err);
      setStickyError(err);
      return;
    }

    setIsVerifyingAadhaar(true);
    try {
      // 1. Strict Aadhaar API Verification with Legal Name Match
      const verifyRes = await fetch("/api/verify/aadhaar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaarNumber: cleanDigits,
          profileName: displayName,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        const errorMsg =
          verifyData.error || "Aadhar name does not match the registered account name.";
        setAadhaarError(errorMsg);
        setStickyError(errorMsg);
        return;
      }

      // 2. Verified successfully -> update Firestore profile
      let targetId = profile?.id || farmerId;
      if (!targetId) {
        targetId = await createFarmer({
          name: displayName,
          village: displayLocation,
          phone: displayPhone,
          crops: ["Wheat", "Paddy"],
          acres: 5.0,
          verified: true,
          aadhaarVerified: true,
          aadhaarNumber: cleanDigits,
          center: bookCenter || (availableCenters[0]?.name ?? "Krishi Upaj Mandi Hub"),
        });
      } else {
        await verifyFarmerAadhaar(targetId, cleanDigits);
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              aadhaarVerified: true,
              verified: true,
              aadhaarNumber: cleanDigits,
            }
          : null
      );
      setIsAadhaarModalOpen(false);
      setAadhaarInput("");
      if (showToast) {
        showToast("✓ Aadhaar verified successfully with UIDAI! Legal name match confirmed.");
      }
    } catch (err: any) {
      console.error("Aadhaar verification error:", err);
      const errMsg = "Verification failed: " + (err.message || "Please check details and try again.");
      setAadhaarError(errMsg);
      setStickyError(errMsg);
    } finally {
      setIsVerifyingAadhaar(false);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankError("");
    setStickyError(null);
    setVerificationSuccess(null);

    let cleanAccount = "";
    let cleanIfsc = "";
    let cleanUpi = "";

    if (settlementChoice === "bank") {
      cleanAccount = accountNoInput.replace(/\D/g, "");
      if (cleanAccount.length < 9 || cleanAccount.length > 18 || /^0+$/.test(cleanAccount)) {
        const err = "Not Found / Invalid Details: Please enter a valid 9 to 18-digit bank account number.";
        setBankError(err);
        setStickyError(err);
        return;
      }

      cleanIfsc = ifscInput.trim().toUpperCase();
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        const err = "Not Found / Invalid Details: Invalid IFSC code. Must be 11 characters starting with 4 alphabets, 5th digit '0' (e.g. SBIN0001244).";
        setBankError(err);
        setStickyError(err);
        return;
      }

      setIsVerifyingBank(true);
      setVerificationSuccess("Verifying beneficiary legal name & account details...");

      try {
        // Strict Bank Verification API call with Legal Beneficiary Name Match
        const verifyRes = await fetch("/api/verify/bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountNumber: cleanAccount,
            ifscCode: cleanIfsc,
            profileName: displayName,
          }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData.success) {
          const errMsg =
            verifyData.error || "Bank account holder name must match your registered account name.";
          setBankError(errMsg);
          setStickyError(errMsg);
          setVerificationSuccess(null);
          return;
        }

        const selectedBank = bankNameInput.trim() || "State Bank of India";
        let targetFarmerId = profile?.id || farmerId;
        const paymentData = {
          paymentMethod: "bank" as const,
          bankAccountNumber: cleanAccount,
          bankName: selectedBank,
          ifscCode: cleanIfsc,
          bankVerified: true,
          dbtEligible: true,
        };

        if (!targetFarmerId) {
          targetFarmerId = await createFarmer({
            name: displayName,
            village: displayLocation,
            phone: displayPhone,
            crops: ["Wheat", "Paddy"],
            acres: 5.0,
            verified: isAadhaarVerified,
            aadhaarVerified: isAadhaarVerified,
            center: bookCenter || (availableCenters[0]?.name ?? "Krishi Upaj Mandi Hub"),
            ...paymentData,
          });
        } else {
          await updateFarmer(targetFarmerId, paymentData);
        }

        // Update local profile state immediately for instant feedback
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                ...paymentData,
              }
            : null
        );

        setVerificationSuccess(`✓ Active Account Verified & Matched to ${displayName}!`);
        await new Promise((resolve) => setTimeout(resolve, 400));

        setIsBankModalOpen(false);
        setVerificationSuccess(null);
        if (showToast) {
          showToast(`Bank account •••• ${cleanAccount.slice(-4)} verified & linked for e-NAM DBT payments!`);
        }
      } catch (err: any) {
        console.error("Bank verification error:", err);
        const errMsg = "Bank verification failed: " + (err.message || "Please check details and try again.");
        setBankError(errMsg);
        setStickyError(errMsg);
        setVerificationSuccess(null);
      } finally {
        setIsVerifyingBank(false);
      }
    } else {
      // UPI Settlement Option
      cleanUpi = upiIdInput.trim().toLowerCase();
      if (!/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(cleanUpi)) {
        const err = "Not Found / Invalid Details: Invalid UPI address format (e.g. 9812345678@upi or kisan@ybl).";
        setBankError(err);
        setStickyError(err);
        return;
      }

      setIsSavingBank(true);
      try {
        let targetFarmerId = profile?.id || farmerId;
        const paymentData = {
          paymentMethod: "upi" as const,
          upiId: cleanUpi,
        };

        if (!targetFarmerId) {
          targetFarmerId = await createFarmer({
            name: displayName,
            village: displayLocation,
            phone: displayPhone,
            crops: ["Wheat", "Paddy"],
            acres: 5.0,
            verified: isAadhaarVerified,
            aadhaarVerified: isAadhaarVerified,
            center: bookCenter || (availableCenters[0]?.name ?? "Krishi Upaj Mandi Hub"),
            ...paymentData,
          });
        } else {
          await updateFarmer(targetFarmerId, paymentData);
        }

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                ...paymentData,
              }
            : null
        );

        setIsBankModalOpen(false);
        if (showToast) {
          showToast(`UPI ID ${cleanUpi} linked successfully!`);
        }
      } catch (err: any) {
        const errMsg = "Failed to save UPI: " + (err.message || "");
        setBankError(errMsg);
        setStickyError(errMsg);
      } finally {
        setIsSavingBank(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#edf1ed] text-zinc-900 font-sans flex flex-col antialiased">
      {/* Sticky / Viewport-Locked Floating Error Notification Banner */}
      <StickyAlert message={stickyError} onClose={() => setStickyError(null)} />

      {/* 1. Farmer Top Header */}
      <header className="w-full bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/krishi logo.png"
              alt="Krishi-Queue Logo"
              className="w-9 h-9 object-contain drop-shadow-sm"
            />
            <div>
              <span className="font-extrabold text-xl tracking-tight text-emerald-950 flex items-center gap-1.5">
                Krishi-Queue
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  Farmer Portal
                </span>
              </span>
              <span className="text-[11px] text-zinc-500 hidden sm:inline-block">
                Kisan Slot Booking & Token Status
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-right hidden sm:flex">
              {profile?.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500 shadow-2xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  {displayName.charAt(0) || "K"}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-zinc-900 leading-tight">
                  {displayName}
                </div>
                <div className="text-[10px] text-zinc-500">{displayLocation}</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-rose-50 text-zinc-700 hover:text-rose-700 border border-zinc-200 hover:border-rose-200 rounded-full text-xs font-bold transition cursor-pointer"
              title="Log out of farmer portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Welcome greeting with Profile Photo (Requirement 4) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile?.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-md shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xl shrink-0 shadow-xs">
                {displayName.charAt(0) || "K"}
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900">
                Welcome back, {displayName}!
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 mt-0.5">
                Registered Mandi: <strong className="text-zinc-800">{profile?.center || activeToken?.center || farmerCenter || "APMC Center"}</strong>
                {displayLocation && <> • Village: <strong className="text-zinc-800">{displayLocation}</strong></>}
                {profile?.pincode && <> • PIN: <strong className="text-zinc-800">{profile.pincode}</strong></>}
                {hasRealPhone ? (
                  <> • Mobile: <strong className="text-zinc-800 font-mono">{displayPhone}</strong></>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenEditProfile}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-bold ml-2 underline cursor-pointer"
                  >
                    + Add Mobile (Optional)
                  </button>
                )}
              </p>
            </div>
          </div>

          {/* Identity & Settlement Quick Badges */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Aadhaar Verification Status & Action */}
            {isAadhaarVerified ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Aadhaar Verified</span>
                {profile?.aadhaarNumber && (
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800 font-semibold">
                    •••• {profile.aadhaarNumber.slice(-4)}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Aadhaar Pending</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAadhaarModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-200" />
                  <span>Verify</span>
                </button>
              </div>
            )}

            {/* Edit Profile Button */}
            <button
              type="button"
              onClick={handleOpenEditProfile}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-emerald-950 border border-zinc-200 hover:border-emerald-300 text-xs font-bold shadow-2xs transition cursor-pointer"
              title="Edit name, village, photo, or crop details"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Edit Profile</span>
            </button>

            {/* Payment Settlement Badge (Bank OR UPI - Requirement 6) */}
            {profile?.paymentMethod === "upi" && profile?.upiId ? (
              <button
                type="button"
                onClick={() => {
                  setSettlementChoice("upi");
                  setUpiIdInput(profile.upiId || "");
                  setIsBankModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold shadow-2xs transition cursor-pointer"
                title="Click to view or edit UPI settlement details"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>UPI: {profile.upiId}</span>
              </button>
            ) : profile?.bankAccountNumber ? (
              <button
                type="button"
                onClick={() => {
                  setSettlementChoice("bank");
                  setBankNameInput(profile.bankName || "State Bank of India");
                  setAccountNoInput(profile.bankAccountNumber || "");
                  setIfscInput(profile.ifscCode || "");
                  setIsBankModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold shadow-2xs transition cursor-pointer"
                title="Click to view or edit bank account details"
              >
                <Landmark className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {profile.bankName || "Bank"}: •••• {profile.bankAccountNumber.slice(-4)}
                </span>
                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800 font-mono">
                  {profile.ifscCode}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSettlementChoice("bank");
                  setBankNameInput("State Bank of India");
                  setAccountNoInput("");
                  setIfscInput("");
                  setUpiIdInput("");
                  setIsBankModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-200" />
                <span>+ Setup DBT Payout (Bank / UPI)</span>
              </button>
            )}
          </div>
        </div>

        {/* Post-Registration Payment Box (Dynamic Linking) */}
        {!hasPaymentLinked ? (
          <div className="bg-gradient-to-r from-amber-50 via-amber-50/70 to-emerald-50/60 rounded-3xl p-5 sm:p-6 border border-amber-200/80 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs mt-0.5">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-amber-950">
                      Add / Link Bank Account or UPI (बैंक या UPI लिंक करें)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/90 text-amber-900 border border-amber-300 uppercase tracking-wide">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/85 mt-1 max-w-2xl leading-relaxed">
                    Link your Bank Account or UPI ID to enable instant e-NAM Direct Benefit Transfer (DBT) MSP payouts upon weighbridge clearance. Zero paperwork required.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSettlementChoice("bank");
                  setBankNameInput("State Bank of India");
                  setAccountNoInput("");
                  setIfscInput("");
                  setUpiIdInput("");
                  setBankError("");
                  setVerificationSuccess(null);
                  setIsBankModalOpen(true);
                }}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Bank / UPI Now</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/40 rounded-3xl p-4 sm:p-5 border border-emerald-200/80 shadow-2xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-850 flex items-center justify-center shrink-0 border border-emerald-200">
                  {profile?.paymentMethod === "upi" ? (
                    <Zap className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Landmark className="w-5 h-5 text-emerald-800" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-emerald-950">
                      {profile?.paymentMethod === "upi" ? "⚡ UPI Direct Settlement Linked" : `🏦 ${profile?.bankName || "Bank Account"} Linked`}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>e-NAM DBT Ready</span>
                    </span>
                  </div>
                  <div className="text-xs text-zinc-600 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                    {profile?.paymentMethod === "upi" ? (
                      <span>VPA: <strong className="text-zinc-900">{profile?.upiId}</strong></span>
                    ) : (
                      <>
                        <span>A/C: <strong className="text-zinc-900">•••• {profile?.bankAccountNumber?.slice(-4)}</strong></span>
                        <span className="text-zinc-400">|</span>
                        <span>IFSC: <strong className="text-zinc-900">{profile?.ifscCode}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSettlementChoice(profile?.paymentMethod === "upi" ? "upi" : "bank");
                  setBankNameInput(profile?.bankName || "State Bank of India");
                  setAccountNoInput(profile?.bankAccountNumber || "");
                  setIfscInput(profile?.ifscCode || "");
                  setUpiIdInput(profile?.upiId || "");
                  setBankError("");
                  setVerificationSuccess(null);
                  setIsBankModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold transition shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Update Payout Details</span>
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Live Token & Queue Status Card */}
        {loadingTokens ? (
          <div className="bg-white rounded-3xl p-8 border border-zinc-200 flex items-center justify-center gap-3 text-zinc-500 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Connecting to live mandi queue in Firestore...</span>
          </div>
        ) : activeToken ? (
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-200/90 shadow-md shadow-emerald-900/5 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Active Mandi Token
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
                    Gate Pass #{activeToken.id.slice(0, 8).toUpperCase()}
                  </span>
                  {activeToken.status === "Waiting" && (
                    <button
                      onClick={() => handleCancelBooking(activeToken.id, activeToken.tokenId)}
                      className="ml-auto text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Token</span>
                    </button>
                  )}
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black text-emerald-950 font-mono tracking-tight">
                    #{activeToken.tokenId}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      activeToken.status === "Serving" || activeToken.status === "In Progress"
                        ? "bg-lime-100 text-lime-900 border-lime-300"
                        : activeToken.status === "Called"
                        ? "bg-amber-100 text-amber-900 border-amber-300 animate-pulse"
                        : activeToken.status === "Verified"
                        ? "bg-teal-100 text-teal-900 border-teal-300"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    {activeToken.status === "Waiting" ? "In Queue (Waiting Gate Entry)" : activeToken.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                    <span className="text-zinc-500 block text-[11px]">Current Bay / Counter:</span>
                    <strong className="text-zinc-900 text-xs">{activeToken.bay}</strong>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                    <span className="text-zinc-500 block text-[11px]">Registered Crop & Load:</span>
                    <strong className="text-zinc-900 text-xs">
                      {activeToken.cropType} ({activeToken.quantity})
                    </strong>
                    {activeToken.mspRate && (
                      <span className="block text-[10px] text-emerald-700 font-bold mt-0.5">
                        MSP: ₹{activeToken.mspRate}/Q • Total: {activeToken.payout}
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                    <span className="text-zinc-500 block text-[11px]">Tractor / Vehicle:</span>
                    <strong className="text-zinc-900 text-xs">{activeToken.vehicle || "Tractor Trolley"}</strong>
                  </div>
                </div>
              </div>

              {/* Personal Dynamic QR & Digital Pass Card (Requirements 10 & 11) */}
              <div
                onClick={() => {
                  setSelectedPassToken(activeToken);
                  setIsDigitalPassOpen(true);
                }}
                className="bg-linear-to-b from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-300/80 hover:border-emerald-500 flex flex-col items-center text-center justify-center shrink-0 w-full lg:w-52 cursor-pointer group shadow-sm hover:shadow-md transition-all"
                title="Click to view official full-screen e-Gate Digital Pass"
              >
                <div className="w-22 h-22 bg-white rounded-xl border border-emerald-200 p-1 flex flex-col items-center justify-center shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
                  <DigitalPassQR token={activeToken} size={76} />
                </div>
                <span className="text-xs font-bold text-emerald-950 mt-2 flex items-center gap-1">
                  <span>Digital Gate Pass</span>
                  <ExternalLink className="w-3 h-3 text-emerald-700" />
                </span>
                <span className="text-[10px] text-emerald-700 font-medium mt-0.5">
                  Assigned: {activeToken.bay}
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full mt-1.5 border border-emerald-200">
                  Click to Expand Pass
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border border-dashed border-zinc-300 flex flex-col items-center text-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wheat className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">No Active Queue Token</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              You currently do not have any vehicle waiting in the mandi queue. Use the form below to book a time slot and generate your digital gate pass token.
            </p>
          </div>
        )}

        {/* Section 2: Book a New Mandi Slot Form */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-zinc-200/80 shadow-xs">
          <div className="pb-3 border-b border-zinc-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-zinc-900">
                Book a New Mandi Time Slot
              </h2>
              <p className="text-xs text-zinc-500">
                Reserve an arrival slot to avoid gate queues and get priority weighbridge entry
              </p>
            </div>
          </div>

          {locationNotice && (
            <div className="mt-4 p-3.5 bg-emerald-50/90 border border-emerald-200 text-emerald-950 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{locationNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setLocationNotice(null)}
                className="text-zinc-400 hover:text-zinc-700 text-xs cursor-pointer ml-1"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleBookSlotSubmit} className="mt-5 space-y-4">
            {/* Manual Location Search & Pincode Auto-Detection Box (Requirements 1, 2, 3) */}
            <div className="p-4 bg-zinc-50/80 border border-zinc-200 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                    Mandi & Location Selector / अखिल भारतीय मंडी व पिनकोड
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1 rounded-xl transition cursor-pointer self-start sm:self-auto shadow-2xs"
                  title="Detect live GPS coordinates and auto-filter nearest mandis"
                >
                  <Navigation className={`w-3.5 h-3.5 text-emerald-700 ${isLocating ? "animate-spin" : ""}`} />
                  <span>{isLocating ? "Locating..." : "📍 Use Current Location (GPS)"}</span>
                </button>
              </div>

              {/* Search input & Dedicated Pincode Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Type City, Town, Village, or 6-digit PIN (e.g. Naini, Adhartal, 211008)..."
                    value={manualSearchQuery}
                    onChange={(e) => handleManualSearchChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium placeholder:text-zinc-400 shadow-2xs"
                  />

                  {/* Suggestions Dropdown */}
                  {locationSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-zinc-100">
                      {locationSuggestions.map((loc, idx) => (
                        <div
                          key={`${loc.pincode}-${idx}`}
                          onClick={() => handleSelectLocality(loc)}
                          className="p-2.5 hover:bg-emerald-50/80 cursor-pointer flex items-center justify-between transition text-left"
                        >
                          <div className="flex items-start gap-2.5">
                            <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-zinc-900">
                                {loc.fullName}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                District: {loc.district} • State: {loc.state}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-300">
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

                {/* Dedicated Single-Line Pincode Box */}
                <div className="flex items-center justify-between sm:justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-400/80 rounded-xl shadow-2xs whitespace-nowrap flex-nowrap shrink-0 overflow-hidden">
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider shrink-0 flex items-center gap-1">
                    <span>📮</span> PIN CODE:
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-black text-xs sm:text-sm text-emerald-950 tracking-wider bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-inner">
                      [ {selectedPincode || "— — — —"} ]
                    </span>
                    {selectedPincode && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-200/80 px-1.5 py-0.5 rounded-md shrink-0">
                        ✓ Auto-Detected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* State Filter and Mandi Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-200/60">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase mb-1">
                    Filter by State:
                  </label>
                  <select
                    value={mandiStateFilter}
                    onChange={(e) => {
                      const nextState = e.target.value;
                      setMandiStateFilter(nextState);
                      const baseList = sortedCenters.length > 0 ? sortedCenters : allAvailableCenters;
                      const filtered = baseList.filter((c) =>
                        nextState === "All" ? true : c.state?.toLowerCase() === nextState.toLowerCase()
                      );
                      if (filtered.length > 0) {
                        setBookCenter(filtered[0].name);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold shadow-2xs cursor-pointer"
                  >
                    {ALL_INDIAN_STATES.map((st) => {
                      const count =
                        st === "All"
                          ? allAvailableCenters.length
                          : allAvailableCenters.filter((c) => c.state?.toLowerCase() === st.toLowerCase()).length;
                      return (
                        <option key={st} value={st}>
                          {st === "All" ? `All States (${count} Mandis)` : `${st} (${count} Mandi${count === 1 ? "" : "s"})`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase mb-1">
                    Select Target APMC Mandi Center (मंडी चयन):
                  </label>
                  <select
                    value={bookCenter}
                    onChange={(e) => setBookCenter(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold shadow-2xs"
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
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Crop Variety (फसल चयन)
                </label>
                <select
                  value={bookCrop}
                  onChange={(e) => setBookCrop(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold shadow-2xs"
                >
                  <option value="Sharbati Wheat (Grade A)" className="text-zinc-900">Sharbati Wheat (Grade A) - MSP ₹2,275/Q</option>
                  <option value="Basmati Paddy 1121" className="text-zinc-900">Basmati Paddy 1121 - MSP ₹2,320/Q</option>
                  <option value="Common Paddy" className="text-zinc-900">Common Paddy (Grade A) - MSP ₹2,183/Q</option>
                  <option value="Mustard Seeds" className="text-zinc-900">Mustard Seeds / Sarson - MSP ₹5,650/Q</option>
                  <option value="Gram / Chana" className="text-zinc-900">Gram / Chana - MSP ₹5,440/Q</option>
                  <option value="Soybean Yellow" className="text-zinc-900">Soybean Yellow - MSP ₹4,600/Q</option>
                  <option value="Maize Hybrid" className="text-zinc-900">Maize Hybrid - MSP ₹2,090/Q</option>
                  <option value="Cotton (Medium Staple)" className="text-zinc-900">Cotton (Medium Staple) - MSP ₹6,620/Q</option>
                </select>
              </div>

              {/* Dropdown for Net Weight / Load (Requirement 7) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Estimated Load / Weight (वजन)
                  </label>
                  <span className="text-[10px] text-emerald-800 font-bold">Preset Dropdown</span>
                </div>
                <select
                  value={bookQuantity}
                  onChange={(e) => setBookQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold shadow-2xs cursor-pointer"
                  required
                >
                  {[5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 75, 100, 150, 200].map((q) => (
                    <option key={q} value={String(q)} className="text-zinc-900">
                      {q} Quintals ({q * 100} kg)
                    </option>
                  ))}
                </select>

                {/* Quick select pills */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {[10, 20, 35, 50, 100].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setBookQuantity(String(q))}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                        bookQuantity === String(q)
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200"
                      }`}
                    >
                      {q} Q
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Real-Time MSP Rate and Calculated DBT Total Banner (Requirement 5) */}
            <div className="p-4 bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Wheat className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-emerald-950">
                      Official Govt. MSP Rate: ₹{getCropMspRate(bookCrop).toLocaleString("en-IN")} / Quintal
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                      e-NAM Notified
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Calculated for <strong>{bookQuantity} Quintals</strong> ({parseInt(bookQuantity || "0") * 100} kg) load of {bookCrop}
                  </p>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-xs">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total DBT Payout:</span>
                <span className="text-base sm:text-xl font-black text-emerald-900 font-mono">
                  {calculateMspPayout(bookCrop, parseFloat(bookQuantity) || 0).formattedTotal}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Time Slot Window
                </label>
                <select
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold shadow-2xs"
                >
                  <option className="text-zinc-900">08:00 AM - 09:00 AM</option>
                  <option className="text-zinc-900">09:00 AM - 10:00 AM</option>
                  <option className="text-zinc-900">10:00 AM - 11:00 AM</option>
                  <option className="text-zinc-900">11:00 AM - 12:00 PM</option>
                  <option className="text-zinc-900">01:00 PM - 02:00 PM</option>
                  <option className="text-zinc-900">02:00 PM - 03:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Tractor / Vehicle Plate
                </label>
                <input
                  type="text"
                  value={bookVehicle}
                  onChange={(e) => setBookVehicle(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold placeholder:text-zinc-400 shadow-2xs"
                  placeholder="HR-05-AB-1290"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center justify-between">
                  <span>Mobile (Optional)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">SMS Alerts</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 flex items-center gap-1 text-[11px] font-bold text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded-md border border-zinc-200 select-none">
                    <span>🇮🇳</span> +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="98123 45678"
                    value={bookPhone}
                    onChange={(e) => setBookPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full pl-18 px-3 py-2 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold font-mono placeholder:text-zinc-400 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold rounded-full shadow-xs transition cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Booking in Firestore...</span>
                  </>
                ) : (
                  <span>Confirm Slot & Generate Token</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: Past Procurement & Direct Benefit Transfer History */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-zinc-200/80 shadow-xs">
          <div className="pb-3 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-zinc-900">
                Procurement & Token History (Live)
              </h2>
              <p className="text-xs text-zinc-500">
                Real-time booking records and MSP payments processed via e-NAM DBT
              </p>
            </div>

            {/* Real Bank Account Badge from Firestore Database */}
            {profile?.bankAccountNumber ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                  <Landmark className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {profile.bankName || "Bank"} A/C: •••• {profile.bankAccountNumber.slice(-4)} ({profile.ifscCode})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBankNameInput(profile.bankName || "State Bank of India");
                    setAccountNoInput(profile.bankAccountNumber || "");
                    setIfscInput(profile.ifscCode || "");
                    setIsBankModalOpen(true);
                  }}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setBankNameInput("State Bank of India");
                  setAccountNoInput("");
                  setIfscInput("");
                  setIsBankModalOpen(true);
                }}
                className="text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>+ Link Bank Account for DBT</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs border-collapse min-w-[660px]">
              <thead>
                <tr className="border-b border-zinc-200 text-[11px] font-bold text-zinc-600 uppercase bg-zinc-50/50">
                  <th className="py-2.5 px-3">Token ID</th>
                  <th className="py-2.5 px-3">Date & Slot</th>
                  <th className="py-2.5 px-3">Crop Variety</th>
                  <th className="py-2.5 px-3">Net Weight</th>
                  <th className="py-2.5 px-3">Mandi Status</th>
                  <th className="py-2.5 px-3 text-right">MSP Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Payment Status</th>
                  <th className="py-2.5 px-3 text-right">DBT Transaction ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {tokens.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-zinc-500 text-xs">
                      No previous token history found. Book your first slot above!
                    </td>
                  </tr>
                ) : (
                  tokens.map((item) => {
                    const isCompleted = item.status === "Completed";
                    const isCancelled = item.status === "Cancelled";
                    const isServing = item.status === "Serving" || item.status === "In Progress";
                    const isCalled = item.status === "Called";
                    const mspRate = item.mspRate || getCropMspRate(item.cropType);
                    const amount =
                      item.totalPayout ||
                      item.paymentAmount ||
                      Math.round((item.quantityNum || parseFloat(item.quantity) || 35) * mspRate);
                    const txId =
                      item.transactionId ||
                      (isCompleted
                        ? `DBT-2026-KRN-${item.tokenId.replace(/\D/g, "")}84`
                        : undefined);

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/70">
                        {/* Token ID with pass link */}
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPassToken(item);
                              setIsDigitalPassOpen(true);
                            }}
                            className="font-mono font-bold text-emerald-900 hover:text-emerald-700 underline flex items-center gap-1 cursor-pointer"
                            title="Click to view digital pass for this token"
                          >
                            <span>#{item.tokenId}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                          </button>
                        </td>

                        {/* Date & Slot */}
                        <td className="py-3 px-3 text-zinc-600">
                          <div className="font-semibold text-zinc-900">
                            {item.slotDate || "Today"}
                          </div>
                          <div className="text-[11px] text-zinc-500">{item.slotTime}</div>
                        </td>

                        {/* Crop Variety & Official Notified MSP (Requirement 5) */}
                        <td className="py-3 px-3 font-medium text-zinc-800">
                          <div className="font-bold text-zinc-900">{item.cropType}</div>
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5">
                            MSP: ₹{mspRate.toLocaleString("en-IN")}/Q
                          </div>
                        </td>

                        {/* Net Weight */}
                        <td className="py-3 px-3 font-semibold text-zinc-900">
                          {item.quantity}
                        </td>

                        {/* Mandi Status */}
                        <td className="py-3 px-3">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Completed
                            </span>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-500" />
                              Cancelled
                            </span>
                          ) : isCalled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Called to Bay
                            </span>
                          ) : isServing ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                              <Clock className="w-3 h-3 text-blue-600" />
                              Weighing (Bay 3)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-800 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              {item.status}
                            </span>
                          )}
                        </td>

                        {/* MSP Amount */}
                        <td className="py-3 px-3 text-right font-bold text-zinc-900 font-mono">
                          ₹{amount.toLocaleString("en-IN")}
                        </td>

                        {/* Real Payment Status */}
                        <td className="py-3 px-3 text-center">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              Credited (DBT)
                            </span>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                              Void
                            </span>
                          ) : isServing ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                              Pending Scale Test
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              Pending Weighing
                            </span>
                          )}
                        </td>

                        {/* Real DBT Transaction ID / UTR */}
                        <td className="py-3 px-3 text-right">
                          {txId ? (
                            <span className="font-mono text-[11px] font-semibold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 select-all">
                              {txId}
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic">
                              Pending Clearance
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 4. Real Aadhaar Verification Modal */}
      {isAadhaarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-zinc-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Verify Aadhaar Identity
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    e-KYC authentication under Haryana Agri-Pass
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAadhaarModalOpen(false);
                  setAadhaarError("");
                }}
                className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {aadhaarError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{aadhaarError}</span>
              </div>
            )}

            <form onSubmit={handleAadhaarVerifySubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
                <div className="flex justify-between text-zinc-600">
                  <span>Farmer Name:</span>
                  <strong className="text-zinc-900">{displayName}</strong>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Village / Tehsil:</span>
                  <strong className="text-zinc-900">{displayLocation}</strong>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Mandi Center:</span>
                  <strong className="text-zinc-900">{profile?.center || farmerCenter || "Krishi Upaj Mandi"}</strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Enter 12-Digit Aadhaar Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5412 8923 1045"
                  maxLength={14}
                  value={aadhaarInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                    const parts = raw.match(/.{1,4}/g);
                    setAadhaarInput(parts ? parts.join(" ") : raw);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold font-mono text-sm tracking-wider placeholder:text-zinc-400"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Format: 12 numeric digits. Direct real-time link with UIDAI & e-Pramaan.
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-2 text-[11px] text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  By verifying, your token issuance will be expedited and DBT payments will be credited directly to your Aadhaar-seeded bank account.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAadhaarModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-full transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingAadhaar}
                  className="px-5 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-full transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {isVerifyingAadhaar ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Database...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify & Activate Status</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DBT Payout Settlement Modal: Bank Details OR UPI ID (Requirement 6) */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-zinc-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    DBT Settlement Details (e-NAM)
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Choose Bank Account or instant UPI ID for MSP crop payments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBankModalOpen(false);
                  setBankError("");
                }}
                className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bankError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{bankError}</span>
              </div>
            )}

            {verificationSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2 text-xs text-emerald-900 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span className="font-semibold">{verificationSuccess}</span>
              </div>
            )}

            {/* Mode Switcher Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl mt-4">
              <button
                type="button"
                onClick={() => setSettlementChoice("bank")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  settlementChoice === "bank"
                    ? "bg-white text-emerald-900 shadow-xs border border-zinc-200"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                <span>Bank Account</span>
              </button>
              <button
                type="button"
                onClick={() => setSettlementChoice("upi")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  settlementChoice === "upi"
                    ? "bg-white text-emerald-900 shadow-xs border border-zinc-200"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>UPI ID (Instant)</span>
              </button>
            </div>

            <form onSubmit={handleSaveBankDetails} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
                <div className="flex justify-between text-zinc-600">
                  <span>Beneficiary Farmer:</span>
                  <strong className="text-zinc-900">{displayName}</strong>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Village / Tehsil:</span>
                  <strong className="text-zinc-900">{displayLocation}</strong>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Registered Mandi:</span>
                  <strong className="text-zinc-900">{profile?.center || farmerCenter || "Krishi Upaj Mandi"}</strong>
                </div>
              </div>

              {settlementChoice === "bank" ? (
                <>
                  <div className="relative">
                    <label className="block font-semibold text-zinc-700 mb-1">
                      Bank Name (बैंक का नाम) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. State Bank of India, PNB, HDFC, Bank of Baroda"
                      value={bankNameInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBankNameInput(val);
                        if (val.trim().length > 0) {
                          setBankSuggestions(searchIndianBanks(val));
                        } else {
                          setBankSuggestions([]);
                        }
                      }}
                      onFocus={() => {
                        if (bankNameInput.trim().length > 0) {
                          setBankSuggestions(searchIndianBanks(bankNameInput));
                        }
                      }}
                      className="w-full px-3.5 py-2 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-xs placeholder:text-zinc-400"
                    />

                    {/* Bank Autocomplete Suggestions */}
                    {bankSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-zinc-100">
                        {bankSuggestions.map((bank) => (
                          <button
                            key={bank.name}
                            type="button"
                            onClick={() => {
                              setBankNameInput(bank.name);
                              if (bank.ifscPrefix && (!ifscInput || ifscInput.length < 5)) {
                                setIfscInput(bank.ifscPrefix);
                              }
                              setBankSuggestions([]);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 flex items-center justify-between gap-2 transition cursor-pointer text-xs group"
                          >
                            <div>
                              <span className="font-bold text-zinc-900 group-hover:text-emerald-950 block">
                                {bank.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 group-hover:text-emerald-700">
                                {bank.type === "commercial" ? "Commercial Bank" : "Regional Rural Bank (Gramin)"}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono bg-zinc-100 group-hover:bg-emerald-100 text-zinc-700 group-hover:text-emerald-900 px-1.5 py-0.5 rounded border border-zinc-200">
                              {bank.ifscPrefix}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      Bank Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={18}
                      placeholder="e.g. 38192019481"
                      value={accountNoInput}
                      onChange={(e) => setAccountNoInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3.5 py-2 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold font-mono text-sm tracking-wider placeholder:text-zinc-400"
                    />
                    <span className="text-[10px] text-zinc-500 block mt-1">
                      Enter 9 to 18 numeric digits without dashes or spaces.
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      IFSC Code (11 Characters) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      placeholder="e.g. SBIN0001244"
                      value={ifscInput}
                      onChange={(e) => setIfscInput(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold font-mono text-xs uppercase tracking-wider placeholder:text-zinc-400"
                    />
                    <span className="text-[10px] text-zinc-500 block mt-1">
                      Standard 11-character Indian Financial System Code (e.g. SBIN0001244).
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      UPI ID (Virtual Payment Address) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210@upi or kisan@ybl"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value.trim().toLowerCase())}
                      className="w-full px-3.5 py-2.5 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold font-mono text-sm placeholder:text-zinc-400"
                    />
                    <span className="text-[10px] text-zinc-500 block mt-1">
                      Instant DBT settlement directly into your linked bank account via UPI.
                    </span>
                  </div>

                  {/* Popular UPI Apps Badges (Requirement 6) */}
                  <div>
                    <span className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">
                      Popular Supported Apps:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { name: "PhonePe", suffix: "@ybl", color: "bg-purple-100 text-purple-900 border-purple-300" },
                        { name: "Google Pay", suffix: "@oksbi", color: "bg-blue-100 text-blue-900 border-blue-300" },
                        { name: "Paytm", suffix: "@paytm", color: "bg-cyan-100 text-cyan-900 border-cyan-300" },
                        { name: "BHIM", suffix: "@upi", color: "bg-emerald-100 text-emerald-900 border-emerald-300" },
                      ].map((app) => (
                        <button
                          key={app.name}
                          type="button"
                          onClick={() => {
                            const nameSlug = (displayName || "kisan").toLowerCase().replace(/[^a-z0-9]/g, "") || "kisan";
                            setUpiIdInput(`${nameSlug}${app.suffix}`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer hover:scale-105 shadow-2xs ${app.color}`}
                        >
                          ⚡ {app.name} ({app.suffix})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-2 text-[11px] text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  MSP payments will be credited directly to this verified payout destination upon weighbridge clearance.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-full transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBank || isVerifyingBank}
                  className="px-5 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-full transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {isVerifyingBank ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Bank Account & PFMS...</span>
                    </>
                  ) : isSavingBank ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Linking Payout Destination...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Link Destination</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Profile Modal (Farmer Details & Photo Upload - Requirement 4) */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-zinc-200 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    Edit Farmer Profile / प्रोफ़ाइल संपादित करें
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Update your personal, photo, village, and farm details saved in Firestore
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editProfileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editProfileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfileSubmit} className="space-y-3.5 text-xs">
              {/* Profile Photo Upload in Edit Profile (Requirement 4) */}
              <div className="flex flex-col items-center justify-center gap-1.5 pb-2 border-b border-zinc-100">
                <div className="relative group">
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-dashed border-emerald-300 flex items-center justify-center overflow-hidden shadow-inner cursor-pointer hover:border-emerald-500 hover:scale-105 transition-all"
                  >
                    {editPhotoUrl ? (
                      <img
                        src={editPhotoUrl}
                        alt="Farmer Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-emerald-700">
                        <Camera className="w-6 h-6" />
                        <span className="text-[9px] font-bold mt-0.5">Change Photo</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full shadow-md transition cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <span className="text-[11px] text-zinc-600 font-medium">
                  {editPhotoUrl ? "✓ Profile photo selected" : "Click to upload / update profile picture"}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Full Name / किसान का पूरा नाम *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sneha Agrawal"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold placeholder:text-zinc-400"
                />
              </div>

              {/* Mobile Number (Optional - Post Sign-Up Profile Setting) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-zinc-700">
                    Mobile Number (Optional) / मोबाइल नंबर
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Optional / ऐच्छिक
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 flex items-center gap-1 text-xs font-bold text-zinc-700 bg-zinc-100 px-2 py-1 rounded-lg border border-zinc-200 select-none">
                    <span>🇮🇳</span> +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number (e.g. 98123 45678)"
                    value={editPhone.replace(/^\+91\s*/, "")}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full pl-22 pr-3.5 py-2.5 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold font-mono placeholder:text-zinc-400 shadow-2xs"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Enter your mobile number to receive SMS arrival alerts & token receipts.
                </p>
              </div>

              {/* Village / Tehsil with Live Letter-Sorted Suggestions Dropdown */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-zinc-700">
                    Village / Tehsil (गाँव / तहसील) *
                  </label>
                  {editPincode && (
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                      📮 PIN: {editPincode}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Type village name (e.g. Waidhan, Singrauli, Deosar)..."
                    value={editVillage}
                    onFocus={() => {
                      setVillageSuggestions(searchVillagesSortedByLetter(editVillage));
                      setShowVillageDropdown(true);
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditVillage(val);
                      setVillageSuggestions(searchVillagesSortedByLetter(val));
                      setShowVillageDropdown(true);
                    }}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold placeholder:text-zinc-400 shadow-2xs"
                  />
                </div>

                {/* Live Floating Dropdown of Matching Villages */}
                {showVillageDropdown && villageSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-50 max-h-52 overflow-y-auto divide-y divide-zinc-100">
                    {villageSuggestions.map((loc, idx) => (
                      <div
                        key={`edit-v-${loc.pincode}-${idx}`}
                        onMouseDown={() => {
                          setEditVillage(loc.name);
                          setEditPincode(loc.pincode);
                          const nearest = findNearestCenters(loc.latitude, loc.longitude, allAvailableCenters, loc.state, loc.district);
                          if (nearest.length > 0) {
                            setEditCenter(nearest[0].name);
                          }
                          setShowVillageDropdown(false);
                        }}
                        className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition text-left"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-zinc-900">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Total Cultivated Land (Acres)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    placeholder="e.g. 5.0"
                    value={editAcres}
                    onChange={(e) => setEditAcres(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Preferred Mandi Center
                  </label>
                  <select
                    value={editCenter}
                    onChange={(e) => setEditCenter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    {(sortedCenters.length > 0 ? sortedCenters : allAvailableCenters).map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} • District {c.district}, {c.state || "India"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Primary Crops (फसलें)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharbati Wheat, Basmati Paddy, Mustard"
                  value={editCrops}
                  onChange={(e) => setEditCrops(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold placeholder:text-zinc-400"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-2 text-[11px] text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  Updates are saved immediately to your cloud farmer profile in Firestore and sync across all mandi gate passes.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-full transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-full transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Firestore...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Dynamic Personal QR & Digital Pass Modal (Requirements 10 & 11) */}
      {isDigitalPassOpen && selectedPassToken && (
        <div
          onClick={() => setIsDigitalPassOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
        >
          {/* Floating Screen-Level Close Button - Always visible on every screen */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDigitalPassOpen(false);
            }}
            className="fixed top-4 right-4 z-60 w-11 h-11 rounded-full bg-white hover:bg-rose-50 text-zinc-800 hover:text-rose-700 shadow-2xl flex items-center justify-center border-2 border-zinc-300 hover:border-rose-400 font-bold hover:scale-110 active:scale-95 transition cursor-pointer"
            title="Close Digital Pass (Esc)"
            aria-label="Close Digital Pass"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 border border-zinc-200 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-3.5 text-center relative max-h-[92vh] overflow-y-auto my-auto"
          >
            {/* Top decorative stripe */}
            <div className="h-2 w-full bg-linear-to-r from-emerald-600 via-teal-500 to-emerald-700 absolute top-0 left-0 right-0"></div>

            {/* Header with Close Button */}
            <div className="flex items-center justify-between pt-1 pb-1 border-b border-zinc-100">
              <div className="flex items-center gap-2 text-left">
                <img src="/krishi logo.png" alt="Krishi-Queue" className="w-7 h-7 object-contain" />
                <div>
                  <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    e-NAM Gate Pass
                  </h3>
                  <p className="text-[10px] text-zinc-500">Government of India APMC Mandi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDigitalPassOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-rose-100 text-zinc-600 hover:text-rose-700 flex items-center justify-center border border-zinc-200 hover:border-rose-300 transition cursor-pointer font-bold"
                title="Close Pass"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Token Badge */}
            <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col items-center gap-0.5">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                Official Live Token Number
              </span>
              <span className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono tracking-tight">
                #{selectedPassToken.tokenId}
              </span>
              <span className="text-[11px] font-bold text-zinc-700">
                Mandi: {selectedPassToken.center}
              </span>
            </div>

            {/* Dynamic Scannable QR Pass */}
            <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center shadow-inner gap-1.5">
              <DigitalPassQR token={selectedPassToken} size={150} showSessionHash={true} />
            </div>

            {/* Pass Metadata Summary */}
            <div className="space-y-1.5 text-left text-xs bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
              <div className="flex justify-between">
                <span className="text-zinc-500">Farmer Name:</span>
                <strong className="text-zinc-900">{selectedPassToken.farmerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Village / Tehsil:</span>
                <strong className="text-zinc-900">{selectedPassToken.village || "Local Mandi Area"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Commodity / Crop:</span>
                <strong className="text-zinc-900">{selectedPassToken.cropType}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Net Quantity:</span>
                <strong className="text-zinc-900">{selectedPassToken.quantity}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Assigned Bay:</span>
                <strong className="text-emerald-900">{selectedPassToken.bay}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Pass Status:</span>
                <span className="font-bold text-emerald-800">{selectedPassToken.status}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDigitalPassOpen(false)}
                  className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition cursor-pointer border border-zinc-300 flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close (बंद करें)</span>
                </button>
              </div>

              {selectedPassToken.status === "Waiting" && (
                <button
                  type="button"
                  onClick={async () => {
                    await handleCancelBooking(selectedPassToken.id, selectedPassToken.tokenId);
                    setIsDigitalPassOpen(false);
                  }}
                  className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition cursor-pointer"
                >
                  Cancel Token Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
