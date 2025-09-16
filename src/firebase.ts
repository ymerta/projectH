import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase konfigürasyonu - çevre değişkenlerinden alınır
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FB_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET || "demo-project.appspot.com",
  appId: import.meta.env.VITE_FB_APP_ID || "demo-app-id"
};
// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Auth ve Firestore servislerini dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);

// Geliştirme ortamında emulator kullan (gerçek Firebase olmadan çalışmak için)
if (import.meta.env.DEV && firebaseConfig.apiKey === "demo-key") {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    console.log("🔧 Firebase emulators connected for development");
  } catch (error) {
    console.log("Firebase emulators already connected or not available");
  }
}

export default app;

