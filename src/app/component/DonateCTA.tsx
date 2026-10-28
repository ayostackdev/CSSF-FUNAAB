"use client";

import { useState, useEffect, type FC } from "react";
import { toast } from "sonner";

interface DonateCTAProps {
  onClose: () => void;
}

interface DonationAccount {
  id: string;
  purpose: string;
  account_name: string;
  account_number: string;
  bank: string;
  is_active: boolean;
  sort_order: number;
}

const DonateCTA: FC<DonateCTAProps> = ({ onClose }) => {
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<DonationAccount[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/donation-accounts");
        const data = await res.json();
        const list = data.accounts || [];
        setAccounts(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
        }
      } catch {
        setAccounts([]);
      }
    };
    fetchAccounts();
  }, []);

  const selected = accounts.find((a) => a.id === selectedId) || accounts[0];

  const copyToClipboard = async (accountNum: string) => {
    if (!accountNum) return;
    try {
      await navigator.clipboard.writeText(accountNum);
      setCopiedAccount(accountNum);
      toast.success("Account number copied!", {
        description: "Send your pledge and share proof with us on any of our social media pages.",
      });
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch (e) {
      toast.error("Failed to copy. Please copy manually.");
      console.error("copy failed", e);
    }
  };

  return (
    <section
      id="give"
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
    >
      <div className="bg-gray-100 p-7 rounded-2xl shadow-2xl max-w-lg w-full text-center relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-2xl"
        >
          ✕
        </button>

        <h2 className="text-3xl font-bold text-gray-700 mb-6">PARTNERSHIP</h2>
        <p className="text-lg text-blue-950 mb-6">
          Give, and it shall be given unto you; good measure, pressed down, and
          shaken together, and running over, shall men give into your bosom.
          (Luke 6:38)
        </p>

        {accounts.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Give Towards</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full max-w-xs mx-auto px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.purpose}
                </option>
              ))}
            </select>
          </div>
        )}

        {accounts.length === 0 ? (
          <p className="text-gray-600 mb-6">Account details not available yet. Please try again later.</p>
        ) : (
          <>
            {accounts.length === 1 && (
              <p className="text-lg font-semibold text-blue-950 mb-2">{selected?.purpose}</p>
            )}
            <div className="mb-6 flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-lg font-semibold text-blue-950">
                Account: <span className="font-bold">{selected?.account_number || "-"}</span> — {selected?.bank || ""} {selected?.account_name || ""}
              </span>
              <button
                onClick={() => copyToClipboard(selected?.account_number || "")}
                className="btn-cta px-8 py-3"
              >
                {copiedAccount === selected?.account_number ? "Copied!" : "Copy"}
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => {
            if (selected?.account_number) {
              copyToClipboard(selected.account_number);
            } else {
              toast.info("Account details not available yet. Please try again later.");
            }
          }}
          className="inline-block px-8 py-3 mt-3 text-lg font-semibold text-black bg-gradient-to-tr from-blue-300 to-teal-50 rounded-full shadow-lg hover:from-blue-900 hover:to-white hover:-translate-y-1 transition"
        >
          Pledge 👆
        </button>
      </div>
    </section>
  );
};

export default DonateCTA;
