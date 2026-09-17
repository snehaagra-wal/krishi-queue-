import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCb_jCMZ2yx4po0ddGxJbrny4PGzw5RNTw",
  authDomain: "krishi-queue-full.firebaseapp.com",
  projectId: "krishi-queue-full",
  storageBucket: "krishi-queue-full.firebasestorage.app",
  messagingSenderId: "266215195781",
  appId: "1:266215195781:web:9dc4d3cf66272e704315ec",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const OFFICIAL_CENTERS = [
  {
    id: "apmc_karnal_main",
    code: "APMC-KRN-01",
    name: "APMC Karnal Main Hub",
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
    id: "apmc_taraori_yard",
    code: "APMC-TR-02",
    name: "Taraori Grain Market Hub",
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
    id: "apmc_gharaunda_yard",
    code: "APMC-GHR-03",
    name: "Gharaunda Procurement Yard",
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
    id: "apmc_assandh_yard",
    code: "APMC-ASD-04",
    name: "Assandh Grain Market Hub",
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
    id: "apmc_indri_yard",
    code: "APMC-IND-05",
    name: "Indri Silo & Procurement Center",
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
    id: "apmc_nilokheri_yard",
    code: "APMC-NLK-06",
    name: "Nilokheri APMC Sub-Yard",
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
    id: "apmc_panipat_yard",
    code: "APMC-PNP-07",
    name: "Panipat APMC Grain Market",
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
    id: "apmc_kurukshetra_yard",
    code: "APMC-KRK-08",
    name: "Kurukshetra APMC Grain Market",
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
    id: "apmc_kaithal_yard",
    code: "APMC-KTH-09",
    name: "Kaithal APMC Mandi Complex",
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

async function resetCenters() {
  const centersRef = collection(db, "centers");
  const snap = await getDocs(centersRef);
  console.log(`Deleting ${snap.size} old centers...`);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }

  console.log("Adding official APMC centers with exact District, State, and GPS coordinates...");
  for (const center of OFFICIAL_CENTERS) {
    const { id, ...data } = center;
    await setDoc(doc(db, "centers", id), {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log(`✓ Added: ${center.name} (District: ${center.district}, State: ${center.state})`);
  }
  console.log("All centers initialized cleanly!");
  process.exit(0);
}

resetCenters().catch(err => {
  console.error("Error resetting centers:", err);
  process.exit(1);
});
