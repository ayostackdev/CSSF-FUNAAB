"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import BannerAdmin from "../component/BannerAdmin";
import DonationAccountsManager from "./components/DonationAccountsManager";
import AnointedSoundsManager from "./components/AnointedSoundsManager";
import ContactSettings from "./components/ContactSettings";
import SermonManager from "./components/SermonManager";
import WorshipManager from "./components/WorshipManager";
import MemoryVerseManager from "./components/MemoryVerseManager";
import InboxManager from "./components/InboxManager";
import GroupsManager from "./components/GroupsManager";

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkAdminSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAdmin(Boolean(data?.session?.user));
      setAuthResolved(true);
    };

    checkAdminSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(Boolean(session?.user));
      setAuthResolved(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (!authResolved) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-600">Checking access...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">CSSF Admin Dashboard</h1>
            <p className="text-slate-500">Manage your website content in real-time.</p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              setIsAdmin(false);
              window.location.href = "/admin-login";
            }}
            className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="flex flex-col gap-8">
            <InboxManager />
            <DonationAccountsManager />
            <AnointedSoundsManager />
            <ContactSettings />
            <SermonManager />
            <WorshipManager />
            <MemoryVerseManager />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-2">Event Banners</h3>
            <BannerAdmin />
            <GroupsManager />
          </div>
        </div>
      </div>
    </main>
  );
}
