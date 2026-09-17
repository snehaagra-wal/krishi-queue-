import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc } from "firebase/firestore";

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

async function purgeAll() {
  console.log("Checking Firestore collections...");
  
  // 1. Check checkins
  const checkinsRef = collection(db, "checkins");
  const checkinsSnap = await getDocs(checkinsRef);
  console.log(`Found ${checkinsSnap.size} checkins in Firestore.`);
  for (const doc of checkinsSnap.docs) {
    console.log(`Deleting checkin ${doc.id} (${doc.data().farmerName || doc.data().tokenId})`);
    await deleteDoc(doc.ref);
  }

  // 2. Check farmers
  const farmersRef = collection(db, "farmers");
  const farmersSnap = await getDocs(farmersRef);
  console.log(`Found ${farmersSnap.size} farmers in Firestore.`);
  for (const doc of farmersSnap.docs) {
    console.log(`Deleting farmer ${doc.id} (${doc.data().name} - ${doc.data().phone})`);
    await deleteDoc(doc.ref);
  }

  // 3. Check managers
  const managersRef = collection(db, "managers");
  const managersSnap = await getDocs(managersRef);
  console.log(`Found ${managersSnap.size} managers in Firestore.`);

  // 4. Check centers
  const centersRef = collection(db, "centers");
  const centersSnap = await getDocs(centersRef);
  console.log(`Found ${centersSnap.size} centers in Firestore.`);

  console.log("Database purge finished! All mock checkins and farmers removed.");
  process.exit(0);
}

purgeAll().catch(err => {
  console.error("Purge failed:", err);
  process.exit(1);
});
