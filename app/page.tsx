"use client";

import React, { useState, useEffect } from "react";
import TopNavbar from "@/components/TopNavbar";
import WelcomeHeader from "@/components/WelcomeHeader";
import MetricsGrid from "@/components/MetricsGrid";
import CropInflowChart from "@/components/CropInflowChart";
import LiveQueueProgression from "@/components/LiveQueueProgression";
import RecentFarmerCheckins from "@/components/RecentFarmerCheckins";
import SettingsView from "@/components/SettingsView";
import AnalyticsView from "@/components/AnalyticsView";
import SlotsQueueView from "@/components/SlotsQueueView";
import FarmersView from "@/components/FarmersView";
import CentersView from "@/components/CentersView";
import AuthView, { UserSession } from "@/components/AuthView";
import FarmerPortalView from "@/components/FarmerPortalView";
import LandingPageView from "@/components/LandingPageView";
import {
  CheckCircle2,
  Info,
  Layers,
  Sparkles,
  RefreshCw,
  BellRing,
  Activity,
  Sliders,
  Users,
  Building2,
  CalendarCheck,
  BarChart3,
} from "lucide-react";

import {
  subscribeToCheckins,
  subscribeToFarmers,
  seedInitialDataIfEmpty,
  CheckinItem,
  Farmer,
} from "@/lib/firestoreService";

export default function Home() {
  // Current logged in user session (null = shows Landing Page with Auth Modal)
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Auth modal toggle & role state for Public Landing Page
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<"farmer" | "manager">("farmer");

  // Active navigation tab for Manager view
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Firestore checkins & farmers for Dashboard metrics
  const [liveCheckins, setLiveCheckins] = useState<CheckinItem[]>([]);
  const [liveFarmers, setLiveFarmers] = useState<Farmer[]>([]);

  // 1. Auto-seed sample data if database is empty on mount & subscribe to live collections
  useEffect(() => {
    seedInitialDataIfEmpty().then((seeded) => {
      if (seeded) {
        console.log("Krishi-Queue: Seeded initial sample data into Firestore.");
      }
    });

    const unsubCheckins = subscribeToCheckins((items) => {
      setLiveCheckins(items);
    });

    const unsubFarmers = subscribeToFarmers((farmersList) => {
      setLiveFarmers(farmersList);
    });

    return () => {
      unsubCheckins();
      unsubFarmers();
    };
  }, []);

  // Compute live dashboard metrics directly from real database documents (Zero mock fallback)
  const liveBookingsCount = liveCheckins.length;
  const liveQueueCount = liveCheckins.filter(
    (c) =>
      c.status === "Waiting" ||
      c.status === "Called" ||
      c.status === "In Progress" ||
      c.status === "Serving"
  ).length;
  const liveProcuredQuintals = Math.round(
    liveCheckins
      .filter((c) => c.status === "Completed" || c.status === "Verified")
      .reduce((sum, c) => sum + (c.quantityNum || parseFloat(c.quantity) || 0), 0)
  );
  const liveCapacityPercent = Math.min(
    100,
    Math.round((liveQueueCount / 24) * 100)
  );
  const liveFarmersCount = liveFarmers.length;

  // Quick action toast handler
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleLogin = (user: UserSession) => {
    setCurrentUser(user);
    setActiveTab("Overview");
    triggerToast(`Welcome, ${user.name}! Logged in as ${user.role === "farmer" ? "Farmer" : "Center Manager"}.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    triggerToast("You have been logged out safely.");
  };

  // 1. If not logged in, show aesthetic Public Agricultural Landing Page with Sign In modal
  if (!currentUser) {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Public Homepage / Landing Page */}
        <LandingPageView
          onOpenAuth={(role = "farmer") => {
            setAuthModalRole(role);
            setIsAuthModalOpen(true);
          }}
          showToast={triggerToast}
          totalCentersCount={68}
          totalCheckinsCount={liveBookingsCount}
          totalGrainQuintals={liveProcuredQuintals}
          activeQueueCount={liveQueueCount}
          registeredFarmersCount={liveFarmersCount}
        />

        {/* Modal Overlay for Sign In / Register */}
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-md my-auto">
              <AuthView
                onLogin={handleLogin}
                initialRole={authModalRole}
                onClose={() => setIsAuthModalOpen(false)}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // 2. If logged in as Farmer, show Farmer Portal View
  if (currentUser.role === "farmer") {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        <FarmerPortalView
          farmerName={currentUser.name}
          farmerPhone={/^\+?\d{10,12}$/.test((currentUser.identifier || "").replace(/[\s-]/g, "")) ? currentUser.identifier : ""}
          farmerLocation={currentUser.location}
          farmerCenter={currentUser.center}
          farmerId={currentUser.farmerId}
          initialAadhaarVerified={currentUser.aadhaarVerified}
          onLogout={handleLogout}
          showToast={triggerToast}
        />
      </>
    );
  }

  // 3. If logged in as Manager, show Manager Role View (Main Dashboard)
  return (
    <div className="min-h-screen bg-[#edf1ed] text-zinc-900 font-sans flex flex-col antialiased selection:bg-emerald-200 selection:text-emerald-950">
      {/* 1. Top Navigation Bar with Logout & Dynamic Manager Profile */}
      <TopNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        managerName={currentUser.name}
        managerEmail={currentUser.identifier}
        managerCenter={currentUser.center}
        managerPhotoUrl={currentUser.photoUrl}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white ml-2 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container - Elevated Modern Frame inspired by Dribbble */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-3 sm:p-5 lg:p-7 flex flex-col">
        {/* Main Dashboard Card Shell */}
        <div className="bg-[#f9faf9] rounded-3xl p-4 sm:p-6 lg:p-8 border border-zinc-200/90 shadow-xl shadow-zinc-300/40 flex-1 flex flex-col gap-6">
          {/* Active Tab Routing View */}
          {activeTab === "Overview" && (
            <>
              {/* 2. Welcome Section */}
              <WelcomeHeader
                managerName={currentUser.name}
                managerCenter={currentUser.center}
                managerId="MGR-501"
                managerPhotoUrl={currentUser.photoUrl}
                onExportReport={() =>
                  triggerToast("Daily Gate Pass & Inflow Summary PDF generated!")
                }
                onViewBays={() =>
                  triggerToast("Switched to APMC Bay Live Monitoring Grid.")
                }
              />

              {/* Main Grid Section: Top Half */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
                {/* 3. Top Metrics Row (4 Cards in 2x2 Grid) - Left Column (5/12) */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <MetricsGrid
                    bookingsCount={liveBookingsCount}
                    queueCount={liveQueueCount}
                    procuredQuintals={liveProcuredQuintals}
                    capacityPercent={liveCapacityPercent}
                    registeredFarmersCount={liveFarmersCount}
                  />
                </div>

                {/* 4. Main Big Graph Section - Right Column (7/12) */}
                <div className="lg:col-span-7 flex flex-col">
                  <CropInflowChart />
                </div>
              </div>

              {/* Main Grid Section: Bottom Half */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
                {/* 5. Secondary Card (Bottom Left - 5/12) */}
                <div className="lg:col-span-5 flex flex-col">
                  <LiveQueueProgression
                    onCallNext={(token) =>
                      triggerToast(
                        `Calling farmer for ${token}! SMS dispatch sent to driver.`
                      )
                    }
                  />
                </div>

                {/* 6. Recent Activity Table (Bottom Right - 7/12) */}
                <div className="lg:col-span-7 flex flex-col">
                  <RecentFarmerCheckins
                    showToast={triggerToast}
                    managerCenter={currentUser?.center}
                  />
                </div>
              </div>
            </>
          )}

          {/* Centers View */}
          {activeTab === "Centers" && (
            <CentersView
              onReturnToDashboard={() => setActiveTab("Overview")}
              showToast={triggerToast}
            />
          )}

          {/* Farmers Directory View */}
          {activeTab === "Farmers" && (
            <FarmersView
              onReturnToDashboard={() => setActiveTab("Overview")}
              showToast={triggerToast}
            />
          )}

          {/* Slots & Queue View */}
          {activeTab === "Slots & Queue" && (
            <SlotsQueueView
              onReturnToDashboard={() => setActiveTab("Overview")}
              showToast={triggerToast}
            />
          )}

          {/* Analytics View */}
          {activeTab === "Analytics" && (
            <AnalyticsView
              checkins={liveCheckins}
              onReturnToDashboard={() => setActiveTab("Overview")}
            />
          )}

          {/* Settings View with Logout */}
          {activeTab === "Settings" && (
            <SettingsView
              onReturnToDashboard={() => setActiveTab("Overview")}
              showToast={triggerToast}
              onLogout={handleLogout}
              managerSession={currentUser}
              onManagerProfileUpdate={(updated) =>
                setCurrentUser((prev) => (prev ? { ...prev, ...updated } : null))
              }
            />
          )}
        </div>
      </main>

      {/* Footer Branding & Mandi Status */}
      <footer className="w-full py-3 px-6 text-center text-xs text-zinc-500 border-t border-zinc-200/60 bg-white/60">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Krishi-Queue Mandi Management System v2.4</span>
          </div>
          <div>
            <span>Ministry of Agriculture & Farmers Welfare • e-NAM Integrated</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
