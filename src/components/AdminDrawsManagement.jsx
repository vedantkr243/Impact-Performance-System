import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Trash2, Calendar, DollarSign, Clock } from "lucide-react";
import { drawService } from "../services/drawService";
import { CountdownDisplay } from "./CountdownDisplay";

export function AdminDrawsManagement({ token }) {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDraws = async () => {
    setLoading(true);
    try {
      const data = await drawService.listAllDraws(token, { limit: 100 });
      setDraws(data.draws || []);
    } catch (error) {
      toast.error("Failed to load draws");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDraws();
  }, [token]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateDraw = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start >= end) {
      toast.error("Start date must be before end date");
      return;
    }

    setSubmitting(true);
    try {
      await drawService.createDraw(token, {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        prizeBreakdown: [
          { name: "Jackpot (5 matches)", value: 40, color: "#0F766E" },
          { name: "4-Number Match", value: 35, color: "#14B8A6" },
          { name: "3-Number Match", value: 25, color: "#22C55E" }
        ]
      });
      toast.success("Draw created successfully!");
      setFormData({ title: "", description: "", startDate: "", endDate: "" });
      setShowForm(false);
      await fetchDraws();
    } catch (error) {
      toast.error(error.message || "Failed to create draw");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDraw = async (drawId) => {
    if (!window.confirm("Are you sure you want to delete this draw?")) return;

    try {
      await drawService.deleteDraw(token, drawId);
      toast.success("Draw deleted successfully!");
      await fetchDraws();
    } catch (error) {
      toast.error(error.message || "Failed to delete draw");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manage Draws</h2>
          <p className="mt-1 text-sm text-slate-500">Create and manage monthly draws for users</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          <span>Create Draw</span>
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Create New Draw</h3>
          <form onSubmit={handleCreateDraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Draw Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="e.g., July 2026 Monthly Draw"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Draw description (optional)"
                rows="2"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Start Date *</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">End Date *</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
              <strong>ℹ️ Prize Pool is Auto-Calculated:</strong> The prize pool is dynamically determined by user participations — 80% of each subscription value ($12/month · $124/year). Jackpot: 40% · 4-match: 35% · 3-match: 25%. No manual entry required.
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:bg-slate-400"
              >
                {submitting ? "Creating..." : "Create Draw"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">Loading draws...</p>
        </div>
      ) : draws.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500">No draws yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {draws.map((draw) => (
            <div key={draw._id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{draw.title}</h3>
                  {draw.description && (
                    <p className="mt-1 text-sm text-slate-600">{draw.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteDraw(draw._id)}
                  className="rounded-lg p-2 hover:bg-red-50"
                  title="Delete draw"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>

              <div className="mb-4 space-y-2 border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span>Live Prize Pool: <strong className="text-emerald-700">{draw.prize || "$0.00"}</strong> <span className="text-xs text-slate-400">(auto-calculated)</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(draw.drawDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span className="inline-block rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize">
                    {draw.status}
                  </span>
                </div>
                {draw.randomNumber && (
                  <div className="space-y-2 bg-yellow-50 px-3 py-3 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 text-sm font-semibold text-yellow-900">
                      <span className="text-lg">🔐</span>
                      <span>Winning Numbers</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {Array.isArray(draw.randomNumber) && draw.randomNumber.length > 0 ? (
                        draw.randomNumber.map((num) => (
                          <div 
                            key={num}
                            className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-200 text-yellow-900 font-bold text-lg border-2 border-yellow-400"
                          >
                            {num}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-yellow-700">No numbers generated yet</span>
                      )}
                    </div>
                    <p className="text-xs text-yellow-700 mt-2">
                      These numbers will be checked against users' latest 5 scores
                    </p>
                  </div>
                )}
              </div>

              {draw.drawDate && (
                <div className="border-t border-slate-200 pt-4">
                  <p className="mb-2 text-xs font-medium text-slate-600">Time Remaining:</p>
                  <CountdownDisplay targetDate={draw.drawDate} className="gap-2" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
