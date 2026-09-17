import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";

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

async function listCenters() {
  const centersRef = collection(db, "centers");
  const snap = await getDocs(centersRef);
  console.log(`Centers count: ${snap.size}`);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(`${d.id} => ${data.name} | District: ${data.district} | State: ${data.state} | Lat: ${data.latitude}, Lng: ${data.longitude}`);
  });
  process.exit(0);
}

listCenters();
