"use client";

import React, { useState } from "react";
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

export default function Home() {
  // Current logged in user session (null = shows Auth/Login page)
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Active navigation tab for Manager view
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // 1. If not logged in, show clean Login/Signup page with role selector
  if (!currentUser) {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        <AuthView onLogin={handleLogin} />
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
          farmerPhone={currentUser.identifier}
          farmerLocation={currentUser.location}
          onLogout={handleLogout}
          showToast={triggerToast}
        />
      </>
    );
  }

  // 3. If logged in as Manager, show Manager Role View (Main Dashboard)
  return (
    <div className="min-h-screen bg-[#edf1ed] text-zinc-900 font-sans flex flex-col antialiased selection:bg-emerald-200 selection:text-emerald-950">
      {/* 1. Top Navigation Bar with Logout */}
      <TopNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
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
                    bookingsCount={142}
                    queueCount={18}
                    procuredQuintals={340}
                    capacityPercent={85}
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
                  <RecentFarmerCheckins />
                </div>
              </div>
            </>
          )}

          {/* Centers View */}
          {activeTab === "Centers" && (
            <CentersView onReturnToDashboard={() => setActiveTab("Overview")} />
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
            <AnalyticsView onReturnToDashboard={() => setActiveTab("Overview")} />
          )}

          {/* Settings View with Logout */}
          {activeTab === "Settings" && (
            <SettingsView
              onReturnToDashboard={() => setActiveTab("Overview")}
              showToast={triggerToast}
              onLogout={handleLogout}
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
