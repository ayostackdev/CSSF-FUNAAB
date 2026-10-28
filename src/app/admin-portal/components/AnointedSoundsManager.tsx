"use client";

import { useState, useEffect, type FC } from "react";
import { createClient } from "../../utils/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface AnointedSound {
  id: string;
  title: string;
  youtube_id: string;
  sort_order: number;
  created_at: string;
}

const emptyForm = {
  title: "",
  youtubeUrl: "",
  sortOrder: 0,
};

const AnointedSoundsManager: FC = () => {
  const [sounds, setSounds] = useState<AnointedSound[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const supabase = createClient();

  const fetchSounds = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/anointed-sounds");
      const data = await res.json();
      setSounds(data.sounds || []);
    } catch {
      setSounds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSounds();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: sounds.length });
    setModalOpen(true);
  };

  const openEdit = (sound: AnointedSound) => {
    setEditingId(sound.id);
    setForm({
      title: sound.title,
      youtubeUrl: `https://www.youtube.com/watch?v=${sound.youtube_id}`,
      sortOrder: sound.sort_order,
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
        const res = await fetch(`/api/anointed-sounds/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to update");
        toast.success("Anointed Sound updated");
      } else {
        const res = await fetch("/api/anointed-sounds", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to add");
        toast.success("Anointed Sound added");
      }
      closeModal();
      fetchSounds();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error saving";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this Anointed Sound?")) return;
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || "";
      if (!accessToken) throw new Error("Please login again");

      const res = await fetch(`/api/anointed-sounds/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
      toast.success("Anointed Sound deleted");
      fetchSounds();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error deleting";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-shell">
      <div className="flex items-center justify-between mb-6">
        <h2 className="card-title text-2xl">Anointed Sounds</h2>
        <Button onClick={openAdd} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" /> Add Video
        </Button>
      </div>

      {sounds.length === 0 ? (
        <p className="text-gray-500 text-sm">No videos yet. Add one from YouTube.</p>
      ) : (
        <div className="space-y-3">
          {sounds.map((sound) => (
            <div key={sound.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-blue-900">{sound.title}</p>
                <p className="text-xs text-gray-400 mt-1">YouTube ID: {sound.youtube_id}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(sound)}>
                  <Pencil size={14} />
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(sound.id)}>
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
                {editingId ? "Edit Anointed Sound" : "Add Anointed Sound"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Praise"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">YouTube URL or ID</label>
                  <Input
                    value={form.youtubeUrl}
                    onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                    placeholder="https://youtu.be/..."
                    required
                    disabled={loading}
                  />
                </div>
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

export default AnointedSoundsManager;
