"use client";

import { useState, useEffect, type FC } from "react";
import { createClient } from "../../utils/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface DonationAccount {
  id: string;
  purpose: string;
  account_name: string;
  account_number: string;
  bank: string;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = {
  purpose: "",
  accountName: "",
  accountNumber: "",
  bank: "",
  sortOrder: 0,
};

const DonationAccountsManager: FC = () => {
  const [accounts, setAccounts] = useState<DonationAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const supabase = createClient();

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/donation-accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: accounts.length });
    setModalOpen(true);
  };

  const openEdit = (acc: DonationAccount) => {
    setEditingId(acc.id);
    setForm({
      purpose: acc.purpose,
      accountName: acc.account_name,
      accountNumber: acc.account_number,
      bank: acc.bank,
      sortOrder: acc.sort_order,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || "";
      if (!accessToken) throw new Error("Please login again");

      if (editingId) {
        const res = await fetch(`/api/donation-accounts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to update account");
        toast.success("Donation account updated");
      } else {
        const res = await fetch("/api/donation-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to add account");
        toast.success("Donation account added");
      }
      closeModal();
      fetchAccounts();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error saving account";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this donation account?")) return;
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || "";
      if (!accessToken) throw new Error("Please login again");

      const res = await fetch(`/api/donation-accounts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete account");
      toast.success("Donation account deleted");
      fetchAccounts();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error deleting account";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-shell">
      <div className="flex items-center justify-between mb-6">
        <h2 className="card-title text-2xl">Donation Accounts</h2>
        <Button onClick={openAdd} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" /> Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-gray-500 text-sm">No donation accounts yet. Add one to get started.</p>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-blue-900">{acc.purpose}</p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-mono">{acc.account_number}</span> — {acc.bank}
                </p>
                <p className="text-sm text-gray-500">{acc.account_name}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(acc)}>
                  <Pencil size={14} />
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(acc.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
            <div className="p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">
                {editingId ? "Edit Donation Account" : "Add Donation Account"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Purpose (e.g. General Offering, Building Project)</label>
                  <Input
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    placeholder="Purpose"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Account Name</label>
                  <Input
                    value={form.accountName}
                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                    placeholder="Account Name"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Account Number</label>
                  <Input
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    placeholder="Account Number"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Bank</label>
                  <Input
                    value={form.bank}
                    onChange={(e) => setForm({ ...form, bank: e.target.value })}
                    placeholder="Bank Name"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label cla
                <div>
                  <label className="text-sm font-medium text-gray-700">Sort Order</label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {loading ? "Saving..." : editingId ? "Update" : "Add"}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeModal} disabled={loading} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationAccountsManager;
