import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function check() {
  const checkinsSnap = await getDocs(collection(db, "checkins"));
  const farmersSnap = await getDocs(collection(db, "farmers"));
  const managersSnap = await getDocs(collection(db, "managers"));
  const centersSnap = await getDocs(collection(db, "centers"));

  console.log(`Live Checkins: ${checkinsSnap.size}`);
  console.log(`Live Farmers: ${farmersSnap.size}`);
  console.log(`Live Managers: ${managersSnap.size}`);
  console.log(`Official Centers: ${centersSnap.size}`);

  process.exit(0);
}

check();
