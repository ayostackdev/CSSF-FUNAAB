"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import dynamic from "next/dynamic";

import BannerAdmin from "../component/BannerAdmin";
import DonationAccountsManager from "./components/DonationAccountsManager";
import AnointedSoundsManager from "./components/AnointedSoundsManager";

const ContactSettings = dynamic(() => import("./components/ContactSettings"), { ssr: false });
const SermonManager = dynamic(() => import("./components/SermonManager"), { ssr: false });
const WorshipManager = dynamic(() => import("./components/WorshipManager"), { ssr: false });
const MemoryVerseManager = dynamic(() => import("./components/MemoryVerseManager"), { ssr: false });
const InboxManager = dynamic(() => import("./components/InboxManager"), { ssr: false });
const GroupsManager = dynamic(() => import("./components/GroupsManager"), { ssr: false });

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  let supabase;
  try {
    supabase = createClient();
  } catch {
    supabase = null;
  }

  useEffect(() => {
    if (!supabase) {
      setAuthResolved(true);
      setIsAdmin(false);
      return;
    }
    const checkAdminSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAdmin(Boolean(data?.session?.user));
        setAuthResolved(true);
      } catch (e) {
        setAuthResolved(true);
        setIsAdmin(false);
      }
    };

    checkAdminSession();

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAdmin(Boolean(session?.user));
        setAuthResolved(true);
      });

      return () => subscription.unsubscribe();
    } catch {
      setAuthResolved(true);
    }
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
