# 🌾 Krishi-Queue (कृषि-कतार)
### Smart Agricultural Mandi Queue & Slot Management System
Direct Link-https://krishi-queue-pink.vercel.app/



[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase_Firestore-Realtime-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

---

## 📌 About The Project

**Krishi-Queue** is an end-to-end digital agricultural queue management and crop procurement platform built to modernize traditional Indian APMC Mandis (कृषि उपज मंडी). 

Long waiting lines, lack of transparent queue progression, and unorganized mandi arrivals frequently result in severe traffic congestion and harvest wastage. **Krishi-Queue** solves this by empowering farmers to pre-book mandi arrival slots from their homes, receive verified digital tokens, and track real-time queue movement directly from their mobile phones.

---

## ✨ Key Features

### 🚜 1. Farmer Portal (किसान सुविधा पोर्टल)
- **Smart Slot Booking**: Select preferred Mandi center, arrival date, unloading bay, and crop type.
- **Official MSP Calculator**: Automatic payout calculation based on notified Minimum Support Price (MSP) rates.
- **Dynamic Digital Gate Pass**: Generates high-contrast QR Matrix passes with unique token IDs (`#TK-X`) for security clearance at mandi gates.
- **Flexible Profile Management**: Register with name and village; mobile number and Aadhaar are completely optional.

### 🏛️ 2. Mandi Manager Hub (मंडी प्रबंधक डैशबोर्ड)
- **Live Queue Progression**: Real-time token caller across multiple unloading bays (Bay 1, Bay 2, etc.) with status progression (`Waiting` ➔ `Serving` ➔ `Completed`).
- **Comprehensive Farmer Directory**: Real-time searchable directory with verification badges, landholdings, crop records, and contact info (displays `Not Found` if phone number was not provided).
- **Check-ins & Weighbridge Log**: Complete archive of arrivals, net weights, crop varieties, and MSP settlement totals.
- **Interactive Analytics**: Crop inflow breakdown, daily arrival volume, and operational metrics.

### 📍 3. Pan-India Mandi & Location Directory
- Integrated directory mapping states, districts, tehsils, and APMC procurement centers across India.
- Instant locality and pincode suggestions for streamlined registration.

### 🔐 4. Digital Verification Gate
- Real-time Gate Pass scanner (`/verify?token=...`) enabling mandi security guards to verify arrival authenticity.
- Automated local IP resolution allowing seamless mobile camera QR scanning on local networks.

---

## 🛠️ Tech Stack

| Domain | Technology / Library |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **Frontend Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Icons & UI** | [Lucide React](https://lucide.dev/) |
| **Database & Realtime** | [Google Firebase Cloud Firestore](https://firebase.google.com/) |
| **QR Code Engine** | [node-qrcode](https://github.com/soldair/node-qrcode) |
| **Micro-Animations** | [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 📁 Project Architecture

```plaintext
krishi-queue-frontend/
├── app/
│   ├── api/
│   │   ├── network-ip/       # LAN IP resolver for mobile QR scanning
│   │   ├── otp/              # Mobile verification route handlers
│   │   └── verify/           # Aadhaar & bank verification APIs
│   ├── verify/               # Digital Gate Pass verification page
│   ├── globals.css           # Global typography & responsive styling
│   ├── layout.tsx            # App root layout
│   └── page.tsx              # Main orchestrator (Landing, Auth, Portals)
├── components/
│   ├── LandingPageView.tsx   # Modern agricultural hero & services landing page
│   ├── AuthView.tsx          # Farmer & Manager authentication portal
│   ├── FarmerPortalView.tsx  # Farmer slot booking, tokens & digital pass
│   ├── FarmersView.tsx       # Mandi farmer directory with real-time status
│   ├── LiveQueueProgression.tsx # Live token queue & bay management
│   ├── RecentFarmerCheckins.tsx # Mandi gate check-in & MSP payout log
│   ├── AnalyticsView.tsx     # Visual metrics, crop influx & volume charts
│   ├── CentersView.tsx       # Mandi procurement centers directory
│   ├── DigitalPassQR.tsx     # Scannable QR code pass generator
│   └── TopNavbar.tsx         # Navigation header & user profile
├── lib/
│   ├── firestoreService.ts   # Real-time Firestore subscriptions & CRUD
│   ├── panIndiaLocations.ts  # Directory of Indian Mandis & Pincodes
│   └── nameVerification.ts   # Aadhaar & bank holder name matching
└── firebase.js               # Firebase initialization & configuration
```

## Author

Developed with ❤️ by **Sneha Agrawal**  
*Krishi-Queue Mandi Management System*
