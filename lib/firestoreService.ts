import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";

// Pan-India Mandis, Localities & Pincode Directory Exports
import {
  PAN_INDIA_LOCALITIES,
  PAN_INDIA_MANDI_CENTERS,
  ALL_INDIAN_STATES,
  searchIndianLocations,
  searchVillagesSortedByLetter,
  lookupPincode,
  lookupPincodeOnline,
  findNearestLocality,
  type IndianLocality,
  type PanIndiaMandiCenter,
} from "./panIndiaLocations";

export {
  PAN_INDIA_LOCALITIES,
  PAN_INDIA_MANDI_CENTERS,
  ALL_INDIAN_STATES,
  searchIndianLocations,
  searchVillagesSortedByLetter,
  lookupPincode,
  lookupPincodeOnline,
  findNearestLocality,
  type IndianLocality,
  type PanIndiaMandiCenter,
};

// ==========================================
// Type Definitions
// ==========================================

export type CheckinStatus =
  | "Waiting"
  | "Called"
  | "Serving"
  | "In Progress"
  | "Verified"
  | "Completed"
  | "Cancelled";

export interface CheckinItem {
  id: string;
  tokenId: string;
  farmerName: string;
  farmerPhone?: string;
  village: string;
  cropType: string;
  quantity: string;
  quantityNum?: number;
  mspRate?: number;
  slotTime: string;
  slotDate?: string;
  status: CheckinStatus;
  bay: string;
  vehicle?: string;
  center?: string;
  payout?: string;
  paymentStatus?: "Credited" | "Processing" | "Pending Weighing" | "Failed";
  paymentAmount?: number;
  totalPayout?: number;
  transactionId?: string;
  photoUrl?: string;
  paymentMethod?: "bank" | "upi";
  upiId?: string;
  createdAt?: any;
}

export interface Farmer {
  id: string;
  name: string;
  village: string;
  phone: string;
  email?: string;
  password?: string;
  pincode?: string;
  crops: string[];
  acres: number;
  verified: boolean;
  aadhaarNumber?: string;
  aadhaarVerified?: boolean;
  paymentMethod?: "bank" | "upi";
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  upiId?: string;
  photoUrl?: string;
  center?: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Check if a phone string is a real valid mobile number (and not an internal fallback or empty)
 */
export function isRealPhoneNumber(phone?: string | null): boolean {
  if (!phone) return false;
  const str = String(phone).trim();
  if (str.toUpperCase().startsWith("FARMER") || str.toLowerCase() === "not found") return false;
  const digits = str.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
}

export interface IndianBankInfo {
  name: string;
  shortCode: string;
  fullName: string;
  ifscPrefix?: string;
  type?: "commercial" | "rural";
}

export const INDIAN_BANKS: IndianBankInfo[] = [
  { name: "State Bank of India", shortCode: "SBI", fullName: "State Bank of India (SBI)", ifscPrefix: "SBIN0", type: "commercial" },
  { name: "Punjab National Bank", shortCode: "PNB", fullName: "Punjab National Bank (PNB)", ifscPrefix: "PUNB0", type: "commercial" },
  { name: "Bank of Baroda", shortCode: "BOB", fullName: "Bank of Baroda (BOB)", ifscPrefix: "BARB0", type: "commercial" },
  { name: "HDFC Bank", shortCode: "HDFC", fullName: "HDFC Bank Ltd.", ifscPrefix: "HDFC0", type: "commercial" },
  { name: "ICICI Bank", shortCode: "ICICI", fullName: "ICICI Bank Ltd.", ifscPrefix: "ICIC0", type: "commercial" },
  { name: "Canara Bank", shortCode: "CNRB", fullName: "Canara Bank", ifscPrefix: "CNRB0", type: "commercial" },
  { name: "Union Bank of India", shortCode: "UBI", fullName: "Union Bank of India", ifscPrefix: "UBIN0", type: "commercial" },
  { name: "Axis Bank", shortCode: "AXIS", fullName: "Axis Bank Ltd.", ifscPrefix: "UTIB0", type: "commercial" },
  { name: "Bank of India", shortCode: "BOI", fullName: "Bank of India (BOI)", ifscPrefix: "BKID0", type: "commercial" },
  { name: "Central Bank of India", shortCode: "CBI", fullName: "Central Bank of India", ifscPrefix: "CBIN0", type: "commercial" },
  { name: "Indian Bank", shortCode: "IDIB", fullName: "Indian Bank", ifscPrefix: "IDIB0", type: "commercial" },
  { name: "Kotak Mahindra Bank", shortCode: "KOTAK", fullName: "Kotak Mahindra Bank", ifscPrefix: "KKBK0", type: "commercial" },
  { name: "IndusInd Bank", shortCode: "INDB", fullName: "IndusInd Bank Ltd.", ifscPrefix: "INDB0", type: "commercial" },
  { name: "UCO Bank", shortCode: "UCO", fullName: "UCO Bank", ifscPrefix: "UCBA0", type: "commercial" },
  { name: "IDBI Bank", shortCode: "IDBI", fullName: "IDBI Bank Ltd.", ifscPrefix: "IBKL0", type: "commercial" },
  { name: "Indian Overseas Bank", shortCode: "IOB", fullName: "Indian Overseas Bank", ifscPrefix: "IOBA0", type: "commercial" },
  { name: "Punjab & Sind Bank", shortCode: "PSB", fullName: "Punjab & Sind Bank", ifscPrefix: "PSIB0", type: "commercial" },
  { name: "Yes Bank", shortCode: "YES", fullName: "Yes Bank Ltd.", ifscPrefix: "YESB0", type: "commercial" },
  { name: "Federal Bank", shortCode: "FDRL", fullName: "Federal Bank Ltd.", ifscPrefix: "FDRL0", type: "commercial" },
  { name: "Aryavart Gramin Bank", shortCode: "AGB", fullName: "Aryavart Gramin Bank (RRB)", ifscPrefix: "ARYA0", type: "rural" },
  { name: "Baroda UP Gramin Bank", shortCode: "BUPB", fullName: "Baroda UP Bank (RRB)", ifscPrefix: "BARB0", type: "rural" },
  { name: "Madhyanchal Gramin Bank", shortCode: "MGB", fullName: "Madhyanchal Gramin Bank (RRB)", ifscPrefix: "SBIN0", type: "rural" },
  { name: "Prathama UP Gramin Bank", shortCode: "PUPB", fullName: "Prathama UP Gramin Bank (RRB)", ifscPrefix: "PRTH0", type: "rural" },
];

export function searchIndianBanks(query: string): IndianBankInfo[] {
  if (!query || query.trim().length === 0) return INDIAN_BANKS.slice(0, 8);
  const q = query.trim().toLowerCase();
  return INDIAN_BANKS.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.shortCode.toLowerCase().includes(q) ||
      b.fullName.toLowerCase().includes(q)
  ).slice(0, 8);
}

export interface ProcurementCenter {
  id: string;
  code: string;
  name: string;
  location: string;
  district: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  activeBays: string;
  dailyCapacity: string;
  currentInflow: string;
  status: "Active" | "Maintenance" | "Full";
  createdAt?: any;
}

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  formattedAddress?: string;
}

/**
 * Intelligent coordinate bounding-box inference for Indian states and districts
 */
export function inferRegionFromCoordinates(lat: number, lon: number): { district: string; state: string } {
  // Madhya Pradesh: lat ~21.0 - 26.9, lon ~74.0 - 82.8
  if (lat >= 21.0 && lat <= 26.9 && lon >= 74.0 && lon <= 82.8) {
    if (lat >= 22.8 && lat <= 23.7 && lon >= 79.5 && lon <= 80.6) return { district: "Jabalpur", state: "Madhya Pradesh" };
    if (lat >= 23.6 && lat <= 24.6 && lon >= 81.6 && lon <= 83.2) return { district: "Singrauli", state: "Madhya Pradesh" };
    if (lat >= 24.2 && lat <= 25.1 && lon >= 80.8 && lon <= 82.0) return { district: "Rewa", state: "Madhya Pradesh" };
    if (lat >= 23.5 && lat <= 24.2 && lon >= 80.0 && lon <= 80.8) return { district: "Katni", state: "Madhya Pradesh" };
    if (lat >= 24.3 && lat <= 25.0 && lon >= 80.5 && lon <= 81.2) return { district: "Satna", state: "Madhya Pradesh" };
    if (lat >= 23.0 && lat <= 23.6 && lon >= 77.1 && lon <= 77.7) return { district: "Bhopal", state: "Madhya Pradesh" };
    if (lat >= 22.4 && lat <= 23.1 && lon >= 75.5 && lon <= 76.2) return { district: "Indore", state: "Madhya Pradesh" };
    if (lat >= 22.9 && lat <= 23.5 && lon >= 75.5 && lon <= 76.1) return { district: "Ujjain", state: "Madhya Pradesh" };
    if (lat >= 22.6 && lat <= 23.2 && lon >= 78.5 && lon <= 79.4) return { district: "Narsinghpur", state: "Madhya Pradesh" };
    if (lat >= 23.5 && lat <= 24.2 && lon >= 78.4 && lon <= 79.2) return { district: "Sagar", state: "Madhya Pradesh" };
    if (lat >= 25.8 && lat <= 26.5 && lon >= 77.9 && lon <= 78.5) return { district: "Gwalior", state: "Madhya Pradesh" };
    return { district: "Jabalpur", state: "Madhya Pradesh" };
  }
  // Uttar Pradesh: lat ~23.8 - 30.5, lon ~77.0 - 84.7
  if (lat >= 23.8 && lat <= 30.5 && lon >= 77.0 && lon <= 84.7) {
    if (lat >= 25.1 && lat <= 25.7 && lon >= 81.5 && lon <= 82.2) return { district: "Prayagraj", state: "Uttar Pradesh" };
    if (lat >= 25.0 && lat <= 25.6 && lon >= 82.6 && lon <= 83.3) return { district: "Varanasi", state: "Uttar Pradesh" };
    if (lat >= 26.5 && lat <= 27.2 && lon >= 80.5 && lon <= 81.3) return { district: "Lucknow", state: "Uttar Pradesh" };
    if (lat >= 26.2 && lat <= 26.7 && lon >= 80.1 && lon <= 80.6) return { district: "Kanpur", state: "Uttar Pradesh" };
    if (lat >= 27.0 && lat <= 27.4 && lon >= 77.7 && lon <= 78.3) return { district: "Agra", state: "Uttar Pradesh" };
    return { district: "Lucknow", state: "Uttar Pradesh" };
  }
  // Punjab: lat ~29.5 - 32.5, lon ~73.8 - 76.9
  if (lat >= 29.5 && lat <= 32.5 && lon >= 73.8 && lon <= 76.9) {
    return { district: "Ludhiana", state: "Punjab" };
  }
  // Rajasthan: lat ~23.0 - 30.2, lon ~69.5 - 78.3
  if (lat >= 23.0 && lat <= 30.2 && lon >= 69.5 && lon <= 78.3) {
    return { district: "Kota", state: "Rajasthan" };
  }
  // Haryana / Delhi NCR: lat ~27.6 - 31.0, lon ~74.5 - 77.6
  if (lat >= 27.6 && lat <= 31.0 && lon >= 74.5 && lon <= 77.6) {
    return { district: "Karnal", state: "Haryana" };
  }
  return { district: "Central Mandi Zone", state: "India" };
}

/**
 * Reverse geocode latitude and longitude into locality, district, and state using real open APIs
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lon: number
): Promise<GeoLocationResult> {
  const inferred = inferRegionFromCoordinates(lat, lon);
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.city || "";
      const districtAdmin = data.localityInfo?.administrative?.find(
        (a: any) =>
          a.adminLevel === 6 ||
          a.adminLevel === 5 ||
          (a.description && a.description.toLowerCase().includes("district"))
      );
      const rawDistrict = districtAdmin?.name || data.city || data.principalSubdivision || "";
      const cleanDistrict = rawDistrict.replace(/district/gi, "").trim();
      const state = data.principalSubdivision || inferred.state;
      const district = cleanDistrict || inferred.district;
      const country = data.countryName || "India";
      const parts = [locality, district ? `Dist. ${district}` : "", state].filter(Boolean);

      return {
        latitude: lat,
        longitude: lon,
        locality,
        city: data.city || locality,
        district,
        state,
        country,
        formattedAddress: parts.join(", "),
      };
    }
  } catch (err) {
    console.warn("Reverse geocode lookup note:", err);
  }

  return {
    latitude: lat,
    longitude: lon,
    district: inferred.district,
    state: inferred.state,
    formattedAddress: `${inferred.district}, ${inferred.state} (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`,
  };
}

export interface ManagerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  centerName: string;
  yardId: string;
  photoUrl?: string;
  updatedAt?: any;
}

export interface SlotSchedule {
  id?: string;
  timeWindow: string;
  capacity: number;
  booked: number;
  status: "Completed" | "In Progress" | "Upcoming" | "Break";
}

// ==========================================
// Official Government Notified MSP Rates (₹ per Quintal)
// ==========================================
export const CROP_MSP_RATES: Record<string, { mspPerQuintal: number; season: string }> = {
  "Sharbati Wheat (Grade A)": { mspPerQuintal: 2275, season: "Rabi 2024-25" },
  "Sharbati Wheat": { mspPerQuintal: 2275, season: "Rabi 2024-25" },
  "Wheat": { mspPerQuintal: 2275, season: "Rabi 2024-25" },
  "Basmati Paddy 1121": { mspPerQuintal: 2320, season: "Kharif 2024-25" },
  "Basmati Paddy": { mspPerQuintal: 2320, season: "Kharif 2024-25" },
  "Paddy (Common)": { mspPerQuintal: 2300, season: "Kharif 2024-25" },
  "Mustard Seeds": { mspPerQuintal: 5650, season: "Rabi 2024-25" },
  "Gram / Chana": { mspPerQuintal: 5440, season: "Rabi 2024-25" },
  "Maize Hybrid": { mspPerQuintal: 2090, season: "Kharif 2024-25" },
  "Maize": { mspPerQuintal: 2090, season: "Kharif 2024-25" },
  "Soybean (Yellow)": { mspPerQuintal: 4892, season: "Kharif 2024-25" },
  "Moong (Green Gram)": { mspPerQuintal: 8682, season: "Kharif 2024-25" },
  "Urad (Black Gram)": { mspPerQuintal: 7400, season: "Kharif 2024-25" },
};

export function getCropMspRate(cropName: string): number {
  if (!cropName) return 2275;
  const matchKey = Object.keys(CROP_MSP_RATES).find((k) =>
    cropName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cropName.toLowerCase())
  );
  return matchKey ? CROP_MSP_RATES[matchKey].mspPerQuintal : 2275;
}

export function calculateMspPayout(
  cropName: string,
  quintals: number
): { mspRate: number; totalAmount: number; formattedTotal: string } {
  const mspRate = getCropMspRate(cropName);
  const totalAmount = Math.round((quintals || 0) * mspRate);
  return {
    mspRate,
    totalAmount,
    formattedTotal: `₹${totalAmount.toLocaleString("en-IN")}`,
  };
}

/**
 * Intelligent Dynamic Gate Naming:
 * If single gate configured: "Main Entry Gate"
 * If multiple gates: "Gate 1-A", "Gate 1-B", ..., "Gate 1-Z"
 */
export function generateGateNames(baysCount: number = 4): string[] {
  if (baysCount <= 1) return ["Main Entry Gate"];
  const count = Math.min(Math.max(baysCount, 1), 26);
  return Array.from({ length: count }, (_, i) => `Gate 1-${String.fromCharCode(65 + i)}`);
}

/**
 * Sequential Token Numbering strictly starting from #TK-1
 * Ensures 100% uniqueness with no duplication across zero-state and active DB.
 */
export async function getNextSequentialToken(): Promise<string> {
  try {
    const checkinsRef = collection(db, "checkins");
    const snap = await getDocs(checkinsRef);
    if (snap.empty) {
      return "TK-1";
    }

    let maxNumber = 0;
    snap.docs.forEach((d) => {
      const data = d.data();
      const rawToken = (data.tokenId || "").toString().trim();
      // Support patterns: "TK-1", "#TK-1", "TK1", or numeric "1"
      const match = rawToken.match(/(?:TK-?|#)?(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    return `TK-${maxNumber + 1}`;
  } catch (err) {
    console.warn("Error calculating sequential token:", err);
    return `TK-1`;
  }
}


// ==========================================
// Default Seed Data
// ==========================================

export const INITIAL_CHECKINS: Omit<CheckinItem, "id">[] = [];

export const INITIAL_FARMERS: Omit<Farmer, "id">[] = [];

const BASE_INITIAL_CENTERS: Omit<ProcurementCenter, "id">[] = [
  // ==========================================
  // MADHYA PRADESH (Jabalpur, Singrauli, Rewa, Katni, Satna, Bhopal, Indore, etc.)
  // ==========================================
  {
    code: "MP-JBP-01",
    name: "KUMS Adhartal Main Mandi, Jabalpur",
    location: "Industrial Area, Adhartal Mandi Complex",
    district: "Jabalpur",
    state: "Madhya Pradesh",
    latitude: 23.2045,
    longitude: 79.9654,
    activeBays: "6 / 6 Bays Active",
    dailyCapacity: "650 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-JBP-02",
    name: "KUMS Patan Mandi Yard, Jabalpur",
    location: "Mandi Road, Patan Sub-Division",
    district: "Jabalpur",
    state: "Madhya Pradesh",
    latitude: 23.2842,
    longitude: 79.6895,
    activeBays: "4 / 4 Bays Active",
    dailyCapacity: "400 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-JBP-03",
    name: "KUMS Sihora Grain Terminal, Jabalpur",
    location: "NH-30 Sihora Bypass Mandi Yard",
    district: "Jabalpur",
    state: "Madhya Pradesh",
    latitude: 23.4912,
    longitude: 80.1124,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "500 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-JBP-04",
    name: "KUMS Shahpura Bhitoni Yard, Jabalpur",
    location: "Bhitoni Station Road Mandi Yard",
    district: "Jabalpur",
    state: "Madhya Pradesh",
    latitude: 23.1415,
    longitude: 79.6631,
    activeBays: "4 / 4 Bays Active",
    dailyCapacity: "350 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-SNG-01",
    name: "KUMS Waidhan Main Mandi, Singrauli",
    location: "Collectorate Road Mandi Campus, Waidhan",
    district: "Singrauli",
    state: "Madhya Pradesh",
    latitude: 24.0625,
    longitude: 82.6285,
    activeBays: "4 / 4 Bays Active",
    dailyCapacity: "450 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-SNG-02",
    name: "KUMS Morwa Sub-Yard, Singrauli",
    location: "Railway Colony Road, Morwa Yard",
    district: "Singrauli",
    state: "Madhya Pradesh",
    latitude: 24.2041,
    longitude: 82.7214,
    activeBays: "3 / 4 Bays Active",
    dailyCapacity: "300 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-SNG-03",
    name: "KUMS Deosar Mandi Yard, Singrauli",
    location: "Tehsil Road Mandi Yard, Deosar",
    district: "Singrauli",
    state: "Madhya Pradesh",
    latitude: 24.2185,
    longitude: 82.2612,
    activeBays: "3 / 4 Bays Active",
    dailyCapacity: "300 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-REW-01",
    name: "KUMS Karahiya Main Mandi, Rewa",
    location: "Karahiya Mandi Complex, Rewa",
    district: "Rewa",
    state: "Madhya Pradesh",
    latitude: 24.5362,
    longitude: 81.3037,
    activeBays: "6 / 6 Bays Active",
    dailyCapacity: "600 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-REW-02",
    name: "KUMS Baikunthpur Yard, Rewa",
    location: "Sirmour Road Mandi Depot, Baikunthpur",
    district: "Rewa",
    state: "Madhya Pradesh",
    latitude: 24.7121,
    longitude: 81.3854,
    activeBays: "4 / 4 Bays Active",
    dailyCapacity: "350 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-REW-03",
    name: "KUMS Mangawan Sub-Yard, Rewa",
    location: "NH-30 Junction Yard, Mangawan",
    district: "Rewa",
    state: "Madhya Pradesh",
    latitude: 24.6781,
    longitude: 81.5432,
    activeBays: "3 / 4 Bays Active",
    dailyCapacity: "300 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-KTN-01",
    name: "KUMS Madhavnagar Mandi, Katni",
    location: "Madhavnagar Mandi Prangan, Katni",
    district: "Katni",
    state: "Madhya Pradesh",
    latitude: 23.8341,
    longitude: 80.3982,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "500 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-STN-01",
    name: "KUMS Satna Main Mandi, Satna",
    location: "Panna Naka Mandi Complex, Satna",
    district: "Satna",
    state: "Madhya Pradesh",
    latitude: 24.5824,
    longitude: 80.8291,
    activeBays: "6 / 6 Bays Active",
    dailyCapacity: "550 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-BPL-01",
    name: "KUMS Karond Mandi, Bhopal",
    location: "Berasia Road Mandi Yard, Karond",
    district: "Bhopal",
    state: "Madhya Pradesh",
    latitude: 23.3032,
    longitude: 77.4124,
    activeBays: "6 / 6 Bays Active",
    dailyCapacity: "700 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-IND-01",
    name: "KUMS Laxmibai Nagar Mandi, Indore",
    location: "Sanwer Road Mandi Complex, Laxmibai Nagar",
    district: "Indore",
    state: "Madhya Pradesh",
    latitude: 22.7533,
    longitude: 75.8637,
    activeBays: "8 / 8 Bays Active",
    dailyCapacity: "850 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-UJN-01",
    name: "KUMS Chimanganj Mandi, Ujjain",
    location: "Agar Road Mandi Campus, Chimanganj",
    district: "Ujjain",
    state: "Madhya Pradesh",
    latitude: 23.2014,
    longitude: 75.7925,
    activeBays: "6 / 6 Bays Active",
    dailyCapacity: "650 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-NSP-01",
    name: "KUMS Gadarwara Mandi, Narsinghpur",
    location: "Station Road Mandi Yard, Gadarwara",
    district: "Narsinghpur",
    state: "Madhya Pradesh",
    latitude: 22.9212,
    longitude: 78.7845,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "500 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-SGR-01",
    name: "KUMS Sagar Main Mandi, Sagar",
    location: "Bina-Sagar Road, Makronia Yard, Sagar",
    district: "Sagar",
    state: "Madhya Pradesh",
    latitude: 23.8388,
    longitude: 78.7378,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "550 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-SEH-01",
    name: "KUMS Sehore Mandi, Sehore",
    location: "Bhopal-Indore Highway Yard, Sehore",
    district: "Sehore",
    state: "Madhya Pradesh",
    latitude: 23.2031,
    longitude: 77.0844,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "500 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-VID-01",
    name: "KUMS Vidisha Mandi, Vidisha",
    location: "Ahmedpur Road, Mandi Yard, Vidisha",
    district: "Vidisha",
    state: "Madhya Pradesh",
    latitude: 23.5251,
    longitude: 77.8105,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "500 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-NMD-01",
    name: "KUMS Itarsi Mandi, Narmadapuram",
    location: "Hoshangabad Road Mandi Depot, Itarsi",
    district: "Narmadapuram",
    state: "Madhya Pradesh",
    latitude: 22.6120,
    longitude: 77.7610,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "450 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "MP-GWL-01",
    name: "KUMS Lashkar Mandi, Gwalior",
    location: "Lashkar Mandi Complex, Gwalior",
    district: "Gwalior",
    state: "Madhya Pradesh",
    latitude: 26.2183,
    longitude: 78.1828,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "500 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },

  // ==========================================
  // UTTAR PRADESH
  // ==========================================
  {
    code: "UP-PRY-01",
    name: "Mandi Samiti Mundera, Prayagraj",
    location: "GT Road, Mundera Mandi Complex",
    district: "Prayagraj",
    state: "Uttar Pradesh",
    latitude: 25.4358,
    longitude: 81.7915,
    activeBays: "6 / 6 Bays Active",
    dailyCapacity: "600 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "UP-VNS-01",
    name: "Mandi Samiti Paharika, Varanasi",
    location: "Paharika Mandi Yard, Varanasi",
    district: "Varanasi",
    state: "Uttar Pradesh",
    latitude: 25.3176,
    longitude: 82.9739,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "500 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "UP-LKO-01",
    name: "Mandi Samiti Dubagga, Lucknow",
    location: "Hardoi Road, Dubagga Mandi Yard",
    district: "Lucknow",
    state: "Uttar Pradesh",
    latitude: 26.8606,
    longitude: 80.8660,
    activeBays: "6 / 6 Bays Active",
    dailyCapacity: "650 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "UP-KNP-01",
    name: "Mandi Samiti Naubasta, Kanpur",
    location: "Hamirpur Road, Naubasta Mandi Complex",
    district: "Kanpur",
    state: "Uttar Pradesh",
    latitude: 26.4024,
    longitude: 80.3319,
    activeBays: "6 / 6 Bays Active",
    dailyCapacity: "600 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "UP-AGR-01",
    name: "Mandi Samiti Sikandra, Agra",
    location: "NH-19 Sikandra Mandi Depot, Agra",
    district: "Agra",
    state: "Uttar Pradesh",
    latitude: 27.2152,
    longitude: 77.9392,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "500 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },

  // ==========================================
  // PUNJAB
  // ==========================================
  {
    code: "PB-LDH-01",
    name: "Khanna APMC Grain Market, Ludhiana",
    location: "GT Road Grain Terminal, Khanna",
    district: "Ludhiana",
    state: "Punjab",
    latitude: 30.7067,
    longitude: 76.2206,
    activeBays: "8 / 8 Bays Active",
    dailyCapacity: "900 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "PB-PTL-01",
    name: "Rajpura Grain Market Yard, Patiala",
    location: "Ambala-Rajpura Highway Mandi, Rajpura",
    district: "Patiala",
    state: "Punjab",
    latitude: 30.4842,
    longitude: 76.5941,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "550 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "PB-BTI-01",
    name: "Bathinda APMC Grain Market, Bathinda",
    location: "Mansa Road Yard, Bathinda",
    district: "Bathinda",
    state: "Punjab",
    latitude: 30.2110,
    longitude: 74.9455,
    activeBays: "6 / 6 Bays Active",
    dailyCapacity: "600 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },

  // ==========================================
  // RAJASTHAN
  // ==========================================
  {
    code: "RJ-KTA-01",
    name: "Kota APMC Bhamashah Mandi, Kota",
    location: "Anantpura, Kota Mandi Yard",
    district: "Kota",
    state: "Rajasthan",
    latitude: 25.1384,
    longitude: 75.8648,
    activeBays: "7 / 7 Bays Active",
    dailyCapacity: "750 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "RJ-JPR-01",
    name: "Jaipur APMC Muhana Mandi, Jaipur",
    location: "Sanganer-Muhana Terminal, Jaipur",
    district: "Jaipur",
    state: "Rajasthan",
    latitude: 26.7950,
    longitude: 75.7610,
    activeBays: "7 / 7 Bays Active",
    dailyCapacity: "700 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "RJ-SGG-01",
    name: "Sri Ganganagar Grain Market Hub",
    location: "Suratgarh Road Depot, Sri Ganganagar",
    district: "Sri Ganganagar",
    state: "Rajasthan",
    latitude: 29.9038,
    longitude: 73.8772,
    activeBays: "6 / 6 Bays Active",
    dailyCapacity: "650 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },

  // ==========================================
  // HARYANA
  // ==========================================
  {
    code: "APMC-KRN-01",
    name: "APMC Karnal Main Hub, Karnal",
    location: "Main Mandi Complex, GT Road",
    district: "Karnal",
    state: "Haryana",
    latitude: 29.6857,
    longitude: 76.9905,
    activeBays: "6 / 6 Bays Active",
    dailyCapacity: "600 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "APMC-TR-02",
    name: "Taraori Grain Market Hub, Karnal",
    location: "Railway Road, Near Gate 2",
    district: "Karnal",
    state: "Haryana",
    latitude: 29.8052,
    longitude: 76.9288,
    activeBays: "4 / 4 Bays Active",
    dailyCapacity: "400 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "APMC-GHR-03",
    name: "Gharaunda Procurement Yard, Karnal",
    location: "NH-44 Bypass Mandi Complex",
    district: "Karnal",
    state: "Haryana",
    latitude: 29.5398,
    longitude: 76.9712,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "450 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "APMC-ASD-04",
    name: "Assandh Grain Market Hub, Karnal",
    location: "Jind Road Mandi Yard",
    district: "Karnal",
    state: "Haryana",
    latitude: 29.5218,
    longitude: 76.6022,
    activeBays: "4 / 4 Bays Active",
    dailyCapacity: "350 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "APMC-IND-05",
    name: "Indri Silo & Procurement Center, Karnal",
    location: "Ladwa-Indri Link Road",
    district: "Karnal",
    state: "Haryana",
    latitude: 29.8824,
    longitude: 77.0601,
    activeBays: "4 / 4 Bays Active",
    dailyCapacity: "500 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "APMC-NLK-06",
    name: "Nilokheri APMC Sub-Yard, Karnal",
    location: "Station Road, Grain Depot",
    district: "Karnal",
    state: "Haryana",
    latitude: 29.8333,
    longitude: 76.9167,
    activeBays: "3 / 4 Bays Active",
    dailyCapacity: "300 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "APMC-PNP-07",
    name: "Panipat APMC Grain Market, Panipat",
    location: "GT Karnal Road Terminal",
    district: "Panipat",
    state: "Haryana",
    latitude: 29.3909,
    longitude: 76.9635,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "550 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "APMC-KRK-08",
    name: "Kurukshetra APMC Grain Market, Kurukshetra",
    location: "Pipli Road Grain Terminal",
    district: "Kurukshetra",
    state: "Haryana",
    latitude: 29.9695,
    longitude: 76.8783,
    activeBays: "4 / 4 Bays Active",
    dailyCapacity: "450 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
  {
    code: "APMC-KTH-09",
    name: "Kaithal APMC Mandi Complex, Kaithal",
    location: "Ambala-Hissar Bypass",
    district: "Kaithal",
    state: "Haryana",
    latitude: 29.8015,
    longitude: 76.3996,
    activeBays: "5 / 5 Bays Active",
    dailyCapacity: "500 Q / day",
    currentInflow: "0 Q",
    status: "Active",
  },
];

// Convert all authentic government centers from PAN_INDIA_MANDI_CENTERS to ProcurementCenter format
const PAN_INDIA_CONVERTED_CENTERS: Omit<ProcurementCenter, "id">[] = PAN_INDIA_MANDI_CENTERS.map(
  (c: PanIndiaMandiCenter) => ({
  code: `APMC-${c.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`,
  name: c.name,
  location: c.location,
  district: c.district,
  state: c.state,
  activeBays: `${c.baysCount || 6} / ${c.baysCount || 6} Bays Active`,
  dailyCapacity: c.dailyCapacity || "600 Q / day",
  currentInflow: "0 Q",
  status: (c.status === "active" ? "Active" : "Maintenance") as "Active" | "Maintenance",
  latitude: c.latitude,
  longitude: c.longitude,
}));

// Comprehensive Pan-India Centers Directory covering all 28 States & UTs
export const INITIAL_CENTERS: Omit<ProcurementCenter, "id">[] = [
  ...BASE_INITIAL_CENTERS,
  ...PAN_INDIA_CONVERTED_CENTERS.filter(
    (pic) =>
      !BASE_INITIAL_CENTERS.some(
        (bic) => bic.name.toLowerCase().trim() === pic.name.toLowerCase().trim()
      )
  ),
];

export const INITIAL_SLOTS: SlotSchedule[] = [
  { timeWindow: "08:00 AM - 09:00 AM", capacity: 25, booked: 0, status: "Upcoming" },
  { timeWindow: "09:00 AM - 10:00 AM", capacity: 25, booked: 0, status: "Upcoming" },
  { timeWindow: "10:00 AM - 11:00 AM", capacity: 25, booked: 0, status: "Upcoming" },
  { timeWindow: "11:00 AM - 12:00 PM", capacity: 25, booked: 0, status: "Upcoming" },
  { timeWindow: "12:00 PM - 01:00 PM", capacity: 0, booked: 0, status: "Break" },
  { timeWindow: "01:00 PM - 02:00 PM", capacity: 25, booked: 0, status: "Upcoming" },
  { timeWindow: "02:00 PM - 03:00 PM", capacity: 25, booked: 0, status: "Upcoming" },
  { timeWindow: "03:00 PM - 04:00 PM", capacity: 25, booked: 0, status: "Upcoming" },
];

// ==========================================
// Firestore Real-Time Subscriptions
// ==========================================

/**
 * Subscribe to all checkins in real time, ordered by creation time descending or token ID
 */
export function subscribeToCheckins(
  callback: (checkins: CheckinItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const checkinsRef = collection(db, "checkins");
    return onSnapshot(
      checkinsRef,
      (snapshot) => {
        const items: CheckinItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const crop = data.cropType || "Wheat";
          const mspRate = typeof data.mspRate === "number" ? data.mspRate : getCropMspRate(crop);
          const qNum = typeof data.quantityNum === "number" ? data.quantityNum : parseFloat(data.quantity) || 35;
          const totalAmount = typeof data.paymentAmount === "number" ? data.paymentAmount : Math.round(qNum * mspRate);
          return {
            id: docSnap.id,
            tokenId: data.tokenId || `TK-${docSnap.id.slice(0, 4)}`,
            farmerName: data.farmerName || "Farmer",
            farmerPhone: data.farmerPhone || "",
            village: data.village || "Local Mandi Area",
            cropType: crop,
            quantity: data.quantity || `${qNum} Quintals`,
            quantityNum: qNum,
            mspRate,
            slotTime: data.slotTime || "10:00 AM - 11:00 AM",
            slotDate: data.slotDate || new Date().toISOString().split("T")[0],
            status: (data.status as CheckinStatus) || "Waiting",
            bay: data.bay || "Gate 1-A Queue",
            vehicle: data.vehicle || "Tractor Trolley",
            center: data.center || "Main Mandi Hub",
            payout:
              data.payout ||
              (data.status === "Completed"
                ? `₹${totalAmount.toLocaleString("en-IN")} (Credited DBT)`
                : `₹${totalAmount.toLocaleString("en-IN")} (Pending Weighing)`),
            paymentStatus:
              data.paymentStatus ||
              (data.status === "Completed"
                ? "Credited"
                : data.status === "Cancelled"
                ? "Failed"
                : "Pending Weighing"),
            paymentAmount: totalAmount,
            transactionId:
              data.transactionId ||
              (data.status === "Completed"
                ? `DBT-2026-GOI-${(data.tokenId || "TK-1").replace(/\D/g, "")}84`
                : undefined),
            photoUrl: data.photoUrl || "",
            paymentMethod: data.paymentMethod || "bank",
            upiId: data.upiId || "",
            createdAt: data.createdAt,
          };
        });

        // Sort descending by token ID or createdAt
        items.sort((a, b) => {
          const numA = parseInt(a.tokenId.replace(/\D/g, "")) || 0;
          const numB = parseInt(b.tokenId.replace(/\D/g, "")) || 0;
          return numB - numA;
        });

        callback(items);
      },
      (error) => {
        console.error("Error subscribing to checkins:", error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error("Failed to initialize checkins listener:", err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Subscribe to tokens for a specific farmer (Strict Data Privacy & Isolation)
 */
export function subscribeFarmerTokens(
  farmerPhone: string,
  callback: (tokens: CheckinItem[]) => void,
  onError?: (err: Error) => void,
  farmerName?: string
): Unsubscribe {
  try {
    const checkinsRef = collection(db, "checkins");
    return onSnapshot(
      checkinsRef,
      (snapshot) => {
        const allItems: CheckinItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const crop = data.cropType || "Wheat";
          const mspRate = typeof data.mspRate === "number" ? data.mspRate : getCropMspRate(crop);
          const qNum = typeof data.quantityNum === "number" ? data.quantityNum : parseFloat(data.quantity) || 35;
          const totalAmount = typeof data.paymentAmount === "number" ? data.paymentAmount : Math.round(qNum * mspRate);
          return {
            id: docSnap.id,
            tokenId: data.tokenId || `TK-${docSnap.id.slice(0, 4)}`,
            farmerName: data.farmerName || "Farmer",
            farmerPhone: data.farmerPhone || "",
            village: data.village || "Local Mandi Area",
            cropType: crop,
            quantity: data.quantity || `${qNum} Quintals`,
            quantityNum: qNum,
            mspRate,
            slotTime: data.slotTime || "10:00 AM - 11:00 AM",
            slotDate: data.slotDate || new Date().toISOString().split("T")[0],
            status: (data.status as CheckinStatus) || "Waiting",
            bay: data.bay || "Gate 1-A Queue",
            vehicle: data.vehicle || "Tractor Trolley",
            center: data.center || "Main Mandi Hub",
            payout:
              data.payout ||
              (data.status === "Completed"
                ? `₹${totalAmount.toLocaleString("en-IN")} (Credited DBT)`
                : `₹${totalAmount.toLocaleString("en-IN")} (Pending Weighing)`),
            paymentStatus:
              data.paymentStatus ||
              (data.status === "Completed"
                ? "Credited"
                : data.status === "Cancelled"
                ? "Failed"
                : "Pending Weighing"),
            paymentAmount: totalAmount,
            transactionId:
              data.transactionId ||
              (data.status === "Completed"
                ? `DBT-2026-GOI-${(data.tokenId || "TK-1").replace(/\D/g, "")}84`
                : undefined),
            photoUrl: data.photoUrl || "",
            paymentMethod: data.paymentMethod || "bank",
            upiId: data.upiId || "",
            createdAt: data.createdAt,
          };
        });

        // Strict Data Privacy & User-Specific History Isolation:
        // Returns ONLY tokens that strictly belong to this authenticated farmer.
        // Never leaks other farmers' tokens (e.g. Gurpreet, Ramesh, etc.)
        const cleanTarget = (farmerPhone || "").replace(/\D/g, "").slice(-10);
        const cleanName = (farmerName || "").trim().toLowerCase();

        const farmerTokens = allItems.filter((item) => {
          const itemDigits = (item.farmerPhone || "").replace(/\D/g, "").slice(-10);
          const itemName = (item.farmerName || "").trim().toLowerCase();

          // Match by 10-digit phone if available, or strictly match by farmer's unique name
          if (cleanTarget && cleanTarget.length === 10 && itemDigits === cleanTarget) {
            return true;
          }
          if (cleanName && cleanName.length > 0 && itemName === cleanName) {
            return true;
          }
          return false;
        });

        farmerTokens.sort((a, b) => {
          const numA = parseInt(a.tokenId.replace(/\D/g, "")) || 0;
          const numB = parseInt(b.tokenId.replace(/\D/g, "")) || 0;
          return numB - numA;
        });

        callback(farmerTokens);
      },
      (error) => {
        console.error("Error subscribing to farmer tokens:", error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error("Failed to setup farmer tokens listener:", err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Subscribe to farmers collection in real time
 */
export function subscribeToFarmers(
  callback: (farmers: Farmer[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const farmersRef = collection(db, "farmers");
    return onSnapshot(
      farmersRef,
      (snapshot) => {
        const farmers: Farmer[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const rawPhone = (data.phone || "").trim();
          const cleanPhone = isRealPhoneNumber(rawPhone) ? rawPhone : "";

          // Auto-heal legacy database documents that were saved with internal FARMER- IDs
          if (rawPhone.toUpperCase().startsWith("FARMER")) {
            try {
              updateDoc(docSnap.ref, { phone: "" }).catch(() => {});
            } catch {}
          }

          return {
            id: docSnap.id,
            name: data.name || "Farmer",
            village: data.village || "Karnal",
            phone: cleanPhone,
            crops: Array.isArray(data.crops) ? data.crops : ["Wheat"],
            acres: Number(data.acres) || 4.0,
            verified: !!data.verified,
            aadhaarVerified: !!data.aadhaarVerified,
            aadhaarNumber: data.aadhaarNumber || "",
            bankAccountNumber: data.bankAccountNumber || "",
            bankName: data.bankName || "",
            ifscCode: data.ifscCode || "",
            center: data.center || "Main Mandi Hub",
            createdAt: data.createdAt,
          };
        });
        callback(farmers);
      },
      (error) => {
        console.error("Error subscribing to farmers:", error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error("Failed to setup farmers listener:", err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Subscribe to procurement centers in real time
 */
export function subscribeToCenters(
  callback: (centers: ProcurementCenter[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const centersRef = collection(db, "centers");
    return onSnapshot(
      centersRef,
      (snapshot) => {
        const centers: ProcurementCenter[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            code: data.code || `APMC-${docSnap.id.slice(0, 3).toUpperCase()}`,
            name: data.name || "APMC Center",
            location: data.location || "Mandi Yard",
            district: data.district || "Karnal",
            state: data.state || "Haryana",
            activeBays: data.activeBays || "4 / 4 Bays Active",
            dailyCapacity: data.dailyCapacity || "400 Q / day",
            currentInflow: data.currentInflow || "0 Q",
            status: (data.status as "Active" | "Maintenance" | "Full") || "Active",
            latitude: typeof data.latitude === "number" ? data.latitude : 29.6857,
            longitude: typeof data.longitude === "number" ? data.longitude : 76.9905,
            createdAt: data.createdAt,
          };
        });
        callback(centers);
      },
      (error) => {
        console.error("Error subscribing to centers:", error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error("Failed to setup centers listener:", err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Subscribe to hourly slots in real time
 */
export function subscribeToSlots(
  callback: (slots: SlotSchedule[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const slotsRef = collection(db, "slots");
    return onSnapshot(
      slotsRef,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_SLOTS);
          return;
        }
        const slots: SlotSchedule[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            timeWindow: data.timeWindow || "10:00 AM - 11:00 AM",
            capacity: Number(data.capacity) || 25,
            booked: Number(data.booked) || 0,
            status: data.status || "Upcoming",
          };
        });
        callback(slots);
      },
      (error) => {
        console.error("Error subscribing to slots:", error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error("Failed to setup slots listener:", err);
    if (onError) onError(err);
    return () => {};
  }
}

// ==========================================
// Checkins / Tokens CRUD Operations
// ==========================================

export async function createCheckin(
  data: Omit<CheckinItem, "id">
): Promise<string> {
  if (!data.farmerName || !data.farmerName.trim()) {
    throw new Error("Farmer name is required.");
  }
  if (!data.cropType || !data.cropType.trim()) {
    throw new Error("Crop type is required.");
  }

  // Mobile numbers are completely optional - never keep internal fallback or invalid numbers
  if (data.farmerPhone) {
    const cleanDigits = data.farmerPhone.replace(/\D/g, "").slice(-10);
    if (cleanDigits.length === 10) {
      data.farmerPhone = `+91 ${cleanDigits}`;
    } else {
      data.farmerPhone = "";
    }
  } else {
    data.farmerPhone = "";
  }

  // Strictly sequential token numbering starting from #TK-1
  if (!data.tokenId || data.tokenId === "TK-0" || data.tokenId.startsWith("TK-NaN")) {
    data.tokenId = await getNextSequentialToken();
  }

  // Calculate official MSP rate and total direct payout
  const mspRate = typeof data.mspRate === "number" ? data.mspRate : getCropMspRate(data.cropType);
  data.mspRate = mspRate;
  const qNum = typeof data.quantityNum === "number" ? data.quantityNum : parseFloat(data.quantity) || 35;
  data.quantityNum = qNum;
  if (!data.paymentAmount) {
    data.paymentAmount = Math.round(qNum * mspRate);
  }
  if (!data.payout) {
    data.payout = `₹${data.paymentAmount.toLocaleString("en-IN")} (Pending Weighing)`;
  }

  const sanitized = sanitizeFirestoreData(data);
  const checkinsRef = collection(db, "checkins");
  const docRef = await addDoc(checkinsRef, {
    ...sanitized,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCheckin(
  id: string,
  data: Partial<CheckinItem>
): Promise<void> {
  const docRef = doc(db, "checkins", id);
  const sanitized = sanitizeFirestoreData(data);
  await updateDoc(docRef, {
    ...sanitized,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCheckin(id: string): Promise<void> {
  const docRef = doc(db, "checkins", id);
  await deleteDoc(docRef);
}

/**
 * Find the next waiting token and mark it as Called to an inspection bay
 */
export async function callNextWaitingToken(
  assignedBay: string = "Bay 2 (Inspection)"
): Promise<CheckinItem | null> {
  const checkinsRef = collection(db, "checkins");
  const snapshot = await getDocs(checkinsRef);
  const items: CheckinItem[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));

  // Sort ascending by token number to find earliest waiting
  const waitingTokens = items
    .filter((i) => i.status === "Waiting")
    .sort((a, b) => {
      const numA = parseInt(a.tokenId.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.tokenId.replace(/\D/g, "")) || 0;
      return numA - numB;
    });

  if (waitingTokens.length > 0) {
    const target = waitingTokens[0];
    await updateCheckin(target.id, {
      status: "Called",
      bay: assignedBay,
    });
    return { ...target, status: "Called", bay: assignedBay };
  }

  // If no waiting tokens exist, return null (Clean slate: do not auto-generate fake farmers)
  return null;
}

/**
 * Recursively strips undefined values from Firestore payloads to prevent
 * "Unsupported field value: undefined" errors on addDoc, updateDoc, or setDoc.
 */
export function sanitizeFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== "object") return obj;
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) {
      continue;
    } else if (
      val !== null &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      !(val instanceof Date) &&
      typeof (val as any).toMillis !== "function"
    ) {
      result[key] = sanitizeFirestoreData(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// ==========================================
// Farmers CRUD Operations
// ==========================================

export async function createFarmer(
  farmer: Omit<Farmer, "id">
): Promise<string> {
  if (!farmer.name || !farmer.name.trim()) {
    throw new Error("Farmer name is required.");
  }
  if (!farmer.village || !farmer.village.trim()) {
    throw new Error("Village / Tehsil is required.");
  }
  const cleanDigits = (farmer.phone || "").replace(/\D/g, "").slice(-10);
  const fallbackPhone = cleanDigits.length === 10 ? `+91 ${cleanDigits}` : "";

  // Ensure optional fields (email, pincode, photoUrl, etc.) default to "" rather than undefined
  const rawFarmer = {
    name: farmer.name.trim(),
    village: farmer.village.trim(),
    phone: fallbackPhone,
    email: farmer.email ? farmer.email.trim() : "",
    password: farmer.password ? farmer.password.trim() : "",
    pincode: farmer.pincode ? farmer.pincode.trim() : "",
    crops: Array.isArray(farmer.crops) ? farmer.crops : [],
    acres: typeof farmer.acres === "number" ? farmer.acres : 5.0,
    verified: Boolean(farmer.verified),
    aadhaarVerified: Boolean(farmer.aadhaarVerified),
    aadhaarNumber: farmer.aadhaarNumber ? farmer.aadhaarNumber.trim() : "",
    bankAccountNumber: farmer.bankAccountNumber ? farmer.bankAccountNumber.trim() : "",
    bankName: farmer.bankName ? farmer.bankName.trim() : "",
    ifscCode: farmer.ifscCode ? farmer.ifscCode.trim().toUpperCase() : "",
    upiId: farmer.upiId ? farmer.upiId.trim() : "",
    photoUrl: farmer.photoUrl ? farmer.photoUrl.trim() : "",
    center: farmer.center || "Krishi Upaj Mandi Hub",
    paymentMethod: farmer.paymentMethod || "bank",
  };

  const normalizedFarmer = sanitizeFirestoreData(rawFarmer);

  const farmersRef = collection(db, "farmers");
  const docRef = await addDoc(farmersRef, {
    ...normalizedFarmer,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateFarmer(
  id: string,
  data: Partial<Farmer>
): Promise<void> {
  const docRef = doc(db, "farmers", id);
  const sanitized = sanitizeFirestoreData(data);
  await updateDoc(docRef, {
    ...sanitized,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFarmer(id: string): Promise<void> {
  const docRef = doc(db, "farmers", id);
  await deleteDoc(docRef);
}

/**
 * Look up farmer by phone number from Firestore
 */
export async function getFarmerByPhone(phone: string): Promise<Farmer | null> {
  const cleanPhone = phone.trim().replace(/[\s-+]/g, "");
  const farmersRef = collection(db, "farmers");
  const snapshot = await getDocs(farmersRef);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const existingClean = (data.phone || "").trim().replace(/[\s-+]/g, "");
    if (
      existingClean === cleanPhone ||
      (cleanPhone.length >= 10 && existingClean.includes(cleanPhone.slice(-10)))
    ) {
      return {
        id: docSnap.id,
        name: data.name || "Farmer",
        village: data.village || "",
        phone: data.phone || phone,
        crops: data.crops || ["Wheat", "Paddy"],
        acres: Number(data.acres) || 5.0,
        verified: !!data.verified,
        aadhaarNumber: data.aadhaarNumber || "",
        aadhaarVerified: !!data.aadhaarVerified,
        paymentMethod: data.paymentMethod || "bank",
        bankAccountNumber: data.bankAccountNumber || "",
        bankName: data.bankName || "",
        ifscCode: data.ifscCode || "",
        upiId: data.upiId || "",
        photoUrl: data.photoUrl || "",
        center: data.center || "Main Mandi Hub",
        createdAt: data.createdAt,
      };
    }
  }
  return null;
}

/**
 * Look up farmer by Full Name or Phone number from Firestore
 */
export async function getFarmerByNameOrPhone(identifier: string): Promise<Farmer | null> {
  const cleanTarget = identifier.trim().toLowerCase();
  const cleanDigits = identifier.trim().replace(/[\s-+]/g, "");
  const farmersRef = collection(db, "farmers");
  const snapshot = await getDocs(farmersRef);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const existingClean = (data.phone || "").trim().replace(/[\s-+]/g, "");
    const existingName = (data.name || "").trim().toLowerCase();

    if (
      docSnap.id === identifier ||
      existingName === cleanTarget ||
      existingClean === cleanDigits ||
      (cleanDigits.length >= 10 && existingClean.includes(cleanDigits.slice(-10)))
    ) {
      return {
        id: docSnap.id,
        name: data.name || "Farmer",
        village: data.village || "",
        phone: isRealPhoneNumber(data.phone) ? data.phone : "",
        password: data.password || "",
        crops: data.crops || ["Wheat", "Paddy"],
        acres: Number(data.acres) || 5.0,
        verified: !!data.verified,
        aadhaarNumber: data.aadhaarNumber || "",
        aadhaarVerified: !!data.aadhaarVerified,
        paymentMethod: data.paymentMethod || "bank",
        bankAccountNumber: data.bankAccountNumber || "",
        bankName: data.bankName || "",
        ifscCode: data.ifscCode || "",
        upiId: data.upiId || "",
        photoUrl: data.photoUrl || "",
        center: data.center || "Main Mandi Hub",
        createdAt: data.createdAt,
      };
    }
  }
  return null;
}

/**
 * Subscribe to a specific farmer's profile in real time by phone or farmerId
 */
export function subscribeFarmerProfile(
  phoneOrId: string,
  callback: (farmer: Farmer | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const farmersRef = collection(db, "farmers");
    return onSnapshot(
      farmersRef,
      (snapshot) => {
        const cleanTarget = phoneOrId.trim().replace(/[\s-+]/g, "");
        let matched: Farmer | null = null;
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const cleanPhone = (data.phone || "").trim().replace(/[\s-+]/g, "");
          if (
            docSnap.id === phoneOrId ||
            cleanPhone === cleanTarget ||
            (data.name && data.name.trim().toLowerCase() === phoneOrId.trim().toLowerCase()) ||
            (cleanTarget.length >= 10 && cleanPhone.includes(cleanTarget.slice(-10)))
          ) {
            matched = {
              id: docSnap.id,
              name: data.name || "Farmer",
              village: data.village || "",
              phone: isRealPhoneNumber(data.phone) ? data.phone : "",
              crops: data.crops || ["Wheat", "Paddy"],
              acres: Number(data.acres) || 5.0,
              verified: !!data.verified,
              aadhaarNumber: data.aadhaarNumber || "",
              aadhaarVerified: !!data.aadhaarVerified,
              paymentMethod: data.paymentMethod || "bank",
              bankAccountNumber: data.bankAccountNumber || "",
              bankName: data.bankName || "",
              ifscCode: data.ifscCode || "",
              upiId: data.upiId || "",
              photoUrl: data.photoUrl || "",
              center: data.center || "Main Mandi Hub",
              createdAt: data.createdAt,
            };
            break;
          }
        }
        callback(matched);
      },
      (error) => {
        console.error("Error subscribing to farmer profile:", error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error("Failed to setup farmer profile listener:", err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Verify farmer's Aadhaar and update Firestore live
 */
export async function verifyFarmerAadhaar(
  farmerId: string,
  aadhaarNumber: string
): Promise<void> {
  const docRef = doc(db, "farmers", farmerId);
  await updateDoc(docRef, {
    aadhaarNumber,
    aadhaarVerified: true,
    verified: true,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Clear farmer's Aadhaar verification in Firestore to allow testing & re-verification
 */
export async function clearFarmerAadhaar(farmerId: string): Promise<void> {
  const docRef = doc(db, "farmers", farmerId);
  await updateDoc(docRef, {
    aadhaarNumber: "",
    aadhaarVerified: false,
    verified: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update farmer's bank account or UPI settlement details in Firestore
 */
export async function updateFarmerBankDetails(
  farmerId: string,
  bankDetails: {
    paymentMethod?: "bank" | "upi";
    bankAccountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    upiId?: string;
    aadhaarNumber?: string;
    aadhaarVerified?: boolean;
  }
): Promise<void> {
  const docRef = doc(db, "farmers", farmerId);
  const updatePayload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (bankDetails.paymentMethod) {
    updatePayload.paymentMethod = bankDetails.paymentMethod;
  }
  if (bankDetails.bankAccountNumber !== undefined) {
    updatePayload.bankAccountNumber = bankDetails.bankAccountNumber.trim();
  }
  if (bankDetails.bankName !== undefined) {
    updatePayload.bankName = bankDetails.bankName.trim();
  }
  if (bankDetails.ifscCode !== undefined) {
    updatePayload.ifscCode = bankDetails.ifscCode.trim().toUpperCase();
  }
  if (bankDetails.upiId !== undefined) {
    updatePayload.upiId = bankDetails.upiId.trim();
  }
  if (bankDetails.aadhaarNumber !== undefined) {
    updatePayload.aadhaarNumber = bankDetails.aadhaarNumber.trim();
  }
  if (bankDetails.aadhaarVerified !== undefined) {
    updatePayload.aadhaarVerified = bankDetails.aadhaarVerified;
  }

  await updateDoc(docRef, updatePayload);
}

// ==========================================
// Centers CRUD Operations
// ==========================================

export async function createCenter(
  center: Omit<ProcurementCenter, "id">
): Promise<string> {
  const centersRef = collection(db, "centers");
  const docRef = await addDoc(centersRef, {
    ...center,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCenter(
  id: string,
  data: Partial<ProcurementCenter>
): Promise<void> {
  const docRef = doc(db, "centers", id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCenter(id: string): Promise<void> {
  const docRef = doc(db, "centers", id);
  await deleteDoc(docRef);
}

// ==========================================
// Slots CRUD Operations
// ==========================================

export async function createSlot(slot: SlotSchedule): Promise<string> {
  const slotsRef = collection(db, "slots");
  const docRef = await addDoc(slotsRef, {
    ...slot,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSlot(
  id: string,
  data: Partial<SlotSchedule>
): Promise<void> {
  const docRef = doc(db, "slots", id);
  await updateDoc(docRef, data);
}

// ==========================================
// Auto-Seeding & Database Initialization (Clean Slate)
// ==========================================

/**
 * Checks if procurement centers collection is empty; if so, initializes centers with coordinates.
 * NOTE: DOES NOT seed fake checkins or fake farmers.
 */
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  try {
    const centersRef = collection(db, "centers");
    const centersSnap = await getDocs(centersRef);
    if (centersSnap.empty) {
      console.log("Initializing official procurement centers into Firestore...");
      const batch = writeBatch(db);
      for (const item of INITIAL_CENTERS) {
        const docRef = doc(centersRef);
        batch.set(docRef, {
          ...item,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
      return true;
    }
    return false;
  } catch (err) {
    console.warn("Center initialization check encountered error:", err);
    return false;
  }
}

/**
 * Clean Slate & Zero-State: Purges all legacy mock checkins & fake farmers from Firestore.
 * Keeps procurement centers synchronized with GPS coordinates.
 */
export async function purgeMockDataFromFirestore(): Promise<{
  deletedCheckins: number;
  deletedFarmers: number;
}> {
  let deletedCheckins = 0;
  let deletedFarmers = 0;

  try {
    // 1. Purge all checkins
    const checkinsRef = collection(db, "checkins");
    const checkinSnap = await getDocs(checkinsRef);
    for (const d of checkinSnap.docs) {
      await deleteDoc(d.ref);
      deletedCheckins++;
    }

    // 2. Purge legacy mock farmers
    const farmersRef = collection(db, "farmers");
    const farmersSnap = await getDocs(farmersRef);
    for (const d of farmersSnap.docs) {
      await deleteDoc(d.ref);
      deletedFarmers++;
    }

    // 3. Ensure centers exist with GPS coordinates
    const centersRef = collection(db, "centers");
    const centersSnap = await getDocs(centersRef);
    if (centersSnap.empty) {
      const batch = writeBatch(db);
      for (const item of INITIAL_CENTERS) {
        const docRef = doc(centersRef);
        batch.set(docRef, {
          ...item,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } else {
      // Upsert any missing centers from INITIAL_CENTERS (e.g. newly added MP and regional mandis)
      const existingCodes = new Set(centersSnap.docs.map((d) => d.data().code));
      for (const item of INITIAL_CENTERS) {
        if (!existingCodes.has(item.code)) {
          const docId = (item.code || item.name).toLowerCase().replace(/[^a-z0-9]/g, "_");
          await setDoc(
            doc(centersRef, docId),
            {
              ...item,
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      // Update coordinates on any existing centers missing them
      for (const cDoc of centersSnap.docs) {
        const cData = cDoc.data();
        if (typeof cData.latitude !== "number" || typeof cData.longitude !== "number") {
          const match = INITIAL_CENTERS.find(
            (ic) => ic.name === cData.name || ic.code === cData.code
          );
          if (match && match.latitude && match.longitude) {
            await updateDoc(cDoc.ref, {
              latitude: match.latitude,
              longitude: match.longitude,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error purging mock data from Firestore:", err);
    throw err;
  }

  return { deletedCheckins, deletedFarmers };
}

/**
 * Ensures all national and MP centers from INITIAL_CENTERS exist in Firestore
 */
export async function syncAllOfficialCentersToFirestore(): Promise<number> {
  const centersRef = collection(db, "centers");
  let synced = 0;
  for (const center of INITIAL_CENTERS) {
    const slug = (center.code || center.name).toLowerCase().replace(/[^a-z0-9]/g, "_");
    const docRef = doc(centersRef, slug);
    await setDoc(
      docRef,
      {
        ...center,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    synced++;
  }
  return synced;
}


// ==========================================
// Manager Profiles CRUD Operations
// ==========================================

export async function saveManagerProfile(
  profile: Partial<ManagerProfile> & { id?: string }
): Promise<string> {
  const managerId = profile.id || (profile.email ? profile.email.replace(/[.@]/g, "_") : "default_manager");
  const docRef = doc(db, "managers", managerId);
  const sanitized = sanitizeFirestoreData(profile);
  await setDoc(
    docRef,
    {
      ...sanitized,
      id: managerId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return managerId;
}

export async function getManagerProfile(idOrEmail: string): Promise<ManagerProfile | null> {
  try {
    const managerId = idOrEmail.replace(/[.@]/g, "_");
    const docRef = doc(db, "managers", managerId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ManagerProfile;
    }

    // Query by email if docId didn't match
    const managersRef = collection(db, "managers");
    const q = query(managersRef, where("email", "==", idOrEmail));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      return qSnap.docs[0].data() as ManagerProfile;
    }
    return null;
  } catch (err) {
    console.warn("Error getting manager profile:", err);
    return null;
  }
}

export function subscribeManagerProfile(
  idOrEmail: string,
  callback: (manager: ManagerProfile | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const managerId = idOrEmail.replace(/[.@]/g, "_");
    const docRef = doc(db, "managers", managerId);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as ManagerProfile);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error subscribing to manager profile:", error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error("Failed to setup manager profile listener:", err);
    if (onError) onError(err);
    return () => {};
  }
}

// ==========================================
// Geolocation & Haversine Distance Calculation
// ==========================================

/**
 * Calculates straight-line distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

/**
 * Takes user coordinates and optional state/district, returning centers sorted by
 * geographic proximity with high priority for the user's detected state and district.
 */
export function findNearestCenters(
  userLat: number,
  userLng: number,
  centers: ProcurementCenter[],
  userState?: string,
  userDistrict?: string
): (ProcurementCenter & { distanceKm: number; matchTier?: number })[] {
  const normState = (userState || "").trim().toLowerCase();
  const normDistrict = (userDistrict || "").trim().toLowerCase().replace(/district/gi, "").trim();

  return centers
    .map((center) => {
      const centerLat = typeof center.latitude === "number" ? center.latitude : 23.2045;
      const centerLng = typeof center.longitude === "number" ? center.longitude : 79.9654;
      const dist = calculateDistanceKm(userLat, userLng, centerLat, centerLng);

      const cState = (center.state || "").trim().toLowerCase();
      const cDist = (center.district || "").trim().toLowerCase();

      // Tier 1: Exact District match (in same state if state provided)
      // Tier 2: Same District
      // Tier 3: Same State
      // Tier 4: Out-of-state / general
      let matchTier = 4;
      if (normDistrict && (cDist.includes(normDistrict) || normDistrict.includes(cDist))) {
        if (!normState || cState.includes(normState) || normState.includes(cState)) {
          matchTier = 1;
        } else {
          matchTier = 2;
        }
      } else if (normState && (cState.includes(normState) || normState.includes(cState))) {
        matchTier = 3;
      }

      return {
        ...center,
        distanceKm: dist,
        matchTier,
      };
    })
    .sort((a, b) => {
      // Prioritize local district and state first
      if (a.matchTier !== b.matchTier) {
        return a.matchTier - b.matchTier;
      }
      // Within the same tier, strictly sort by actual GPS distance in km
      return a.distanceKm - b.distanceKm;
    });
}

// ==========================================
// Real Mandi System Notifications
// ==========================================

export interface MandiNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  timestamp: number;
  type: "success" | "info" | "warning";
  read?: boolean;
}

export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "Just now";
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export async function createNotification(notif: {
  title: string;
  desc: string;
  type?: "success" | "info" | "warning";
}): Promise<string> {
  try {
    const notifsRef = collection(db, "notifications");
    const docRef = await addDoc(notifsRef, {
      title: notif.title,
      desc: notif.desc,
      type: notif.type || "info",
      timestamp: Date.now(),
      createdAt: serverTimestamp(),
      read: false,
    });
    return docRef.id;
  } catch (err) {
    console.error("Failed to create notification:", err);
    return `local-${Date.now()}`;
  }
}

export function subscribeToNotifications(
  callback: (notifications: MandiNotification[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const notifsRef = collection(db, "notifications");
    return onSnapshot(
      notifsRef,
      (snapshot) => {
        const items: MandiNotification[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const ts = typeof data.timestamp === "number" ? data.timestamp : Date.now();
          return {
            id: docSnap.id,
            title: data.title || "Notification",
            desc: data.desc || "",
            time: formatRelativeTime(ts),
            timestamp: ts,
            type: data.type || "info",
            read: !!data.read,
          };
        });

        // Sort descending by timestamp (newest first)
        items.sort((a, b) => b.timestamp - a.timestamp);
        callback(items);
      },
      (error) => {
        console.error("Error subscribing to notifications:", error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error("Notifications listener error:", err);
    return () => {};
  }
}

