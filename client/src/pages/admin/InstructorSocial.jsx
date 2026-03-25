import { useState, useEffect } from "react";
import {
  Users,
  Send,
  MessageSquare,
  Search,
  Filter,
  Mail,
  Bell,
  ArrowRight,
  BookOpen,
  ChevronDown,
  CheckCircle,
  Check,
  Activity,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import { userAPI, courseAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const InstructorSocial = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [broadcastType, setBroadcastType] = useState("FOLLOWERS"); // 'FOLLOWERS' or 'COURSE'
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fRes, cRes] = await Promise.all([
          userAPI.getFollowers(user.id),
          courseAPI.list(),
        ]);
        setFollowers(fRes.data || []);
        setCourses(cRes.data || []);
      } catch (e) {
        console.error("Fetch error", e);
        toast.error("Social data synchronization failed");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const handleBroadcast = async () => {
    if (!message.trim()) return;
    if (broadcastType === "COURSE" && !selectedCourseId) {
      return toast.error("Please select a target course module");
    }

    setSending(true);
    try {
      if (broadcastType === "FOLLOWERS") {
        await userAPI.broadcastMessage({ content: message });
        setSuccess(
          `Broadcast dispatched to all ${followers.length} followers!`,
        );
      } else {
        const course = courses.find((c) => c.id === selectedCourseId);
        await userAPI.broadcastToCourse({
          courseId: selectedCourseId,
          content: message,
        });
        setSuccess(`Announced to all learners in "${course?.title}"`);
      }

      setMessage("");
      setBroadcastMode(false);
      setTimeout(() => setSuccess(null), 5000);
    } catch (e) {
      toast.error(e.response?.data?.message || "Transmission failed");
    } finally {
      setSending(false);
    }
  };

  const filteredFollowers = followers.filter((f) =>
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="p-8 max-w-6xl mx-auto font-inter pb-20">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#017E84]">
              Community Matrix
            </p>
            <h1 className="text-4xl font-black text-[#714B67] font-sora tracking-tight leading-none">
              Social Hub
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setBroadcastMode(!broadcastMode)}
              className={`h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${broadcastMode ? "bg-slate-900" : "bg-[#714B67] shadow-xl shadow-[#714B67]/20 hover:scale-105"}`}
            >
              {broadcastMode ? "Close Terminal" : "Dispatch Broadcast"}
            </Button>
          </div>
        </header>

        {success && (
          <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
              <Check size={16} />
            </div>
            {success}
          </div>
        )}

        {broadcastMode && (
          <div className="mb-12 p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl relative overflow-hidden group animate-in slide-in-from-top-8 duration-500">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
              <Send size={180} />
            </div>

            <div className="flex flex-col lg:flex-row gap-8 mb-8">
              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-900 mb-6 font-sora flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#714B67]/10 flex items-center justify-center text-[#714B67]">
                    <Send size={20} />
                  </div>
                  Broadcast Dispatch Center
                </h3>

                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setBroadcastType("FOLLOWERS")}
                    className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${broadcastType === "FOLLOWERS" ? "border-[#714B67] bg-[#714B67]/5 shadow-inner" : "border-slate-50 bg-white hover:border-slate-200"}`}
                  >
                    <Users
                      size={18}
                      className={
                        broadcastType === "FOLLOWERS"
                          ? "text-[#714B67]"
                          : "text-slate-400"
                      }
                    />
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${broadcastType === "FOLLOWERS" ? "text-slate-900" : "text-slate-400"}`}
                    >
                      Followers
                    </span>
                  </button>
                  <button
                    onClick={() => setBroadcastType("COURSE")}
                    className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${broadcastType === "COURSE" ? "border-[#017E84] bg-[#017E84]/5 shadow-inner" : "border-slate-50 bg-white hover:border-slate-200"}`}
                  >
                    <BookOpen
                      size={18}
                      className={
                        broadcastType === "COURSE"
                          ? "text-[#017E84]"
                          : "text-slate-400"
                      }
                    />
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${broadcastType === "COURSE" ? "text-slate-900" : "text-slate-400"}`}
                    >
                      Target Module
                    </span>
                  </button>
                </div>

                {broadcastType === "COURSE" && (
                  <div className="mb-6 animate-in fade-in slide-in-from-left-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                      Select Target Module
                    </p>
                    <div className="relative">
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-[#017E84]/20 transition-all cursor-pointer"
                      >
                        <option value="">Select a Course Cluster</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        size={16}
                      />
                    </div>
                  </div>
                )}

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    broadcastType === "FOLLOWERS"
                      ? "Broadcast to all network members..."
                      : "Dispatch announcement to module learners..."
                  }
                  className="w-full h-44 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all outline-none resize-none"
                />
              </div>

              <div className="lg:w-80 bg-slate-50 rounded-[2rem] p-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#714B67] border-b border-[#714B67]/10 pb-4">
                    Transmission Specs
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400 italic">Priority</span>
                      <span className="text-[#017E84]">High Signal</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400 italic">Reach</span>
                      <span className="text-slate-900">
                        {broadcastType === "FOLLOWERS"
                          ? `${followers.length} Network Nodes`
                          : "Module Specific"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400 italic">Channel</span>
                      <span className="text-slate-900 flex items-center gap-1">
                        <Bell size={10} /> Push + Feed
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleBroadcast}
                  disabled={sending || !message.trim()}
                  className="h-16 w-full bg-[#714B67] hover:bg-[#54384c] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#714B67]/20 disabled:opacity-50 mt-8"
                >
                  {sending ? <Spinner size="sm" /> : "Deploy Signal"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 group">
                <Search
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#017E84] transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search member registry..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-14 pl-16 pr-6 bg-white border border-slate-100 rounded-[2rem] text-xs font-bold shadow-sm focus:ring-2 focus:ring-[#017E84]/10 transition-all outline-none"
                />
              </div>
              <button className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#017E84] transition-all">
                <Filter size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-4">
                Active Network Connections ({followers.length})
                <div className="flex-1 h-px bg-slate-100" />
              </h2>
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <Spinner size="lg" className="text-[#714B67]" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Recalibrating Matrix...
                  </p>
                </div>
              ) : filteredFollowers.length === 0 ? (
                <div className="py-24 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
                  <Users className="mx-auto mb-6 text-slate-100" size={64} />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    No operational links detected
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredFollowers.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => navigate(`/network/${f.id}`)}
                      className="bg-white p-6 border border-slate-50 rounded-[2.5rem] hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden transform hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-[#714B67] flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-[#714B67]/10 shrink-0 group-hover:rotate-6 transition-transform">
                          {f.avatar ? (
                            <img
                              src={f.avatar}
                              className="w-full h-full object-cover rounded-[1.5rem]"
                            />
                          ) : (
                            f.name?.[0] || "?"
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-900 group-hover:text-[#714B67] transition-colors truncate mb-1">
                            {f.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-50 rounded-md text-[8px] font-black text-[#017E84] uppercase tracking-widest border border-slate-100 group-hover:bg-[#017E84] group-hover:text-white transition-colors">
                              {f.role || "LEARNER"}
                            </span>
                            {f.totalPoints > 1000 && (
                              <CheckCircle
                                className="text-emerald-400"
                                size={10}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-5 relative z-10">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2 group-hover:text-slate-900 transition-colors">
                          <Activity size={10} /> Sync'd Node
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chat?userId=${f.id}`);
                          }}
                          className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#714B67] hover:text-white transition-all transform hover:scale-110 active:scale-95 shadow-sm"
                        >
                          <MessageSquare size={16} />
                        </button>
                      </div>
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0">
                        <ArrowRight size={20} className="text-[#714B67]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#1e1a1d] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 transform scale-150 rotate-45 group-hover:scale-[1.8] group-hover:rotate-12 transition-all duration-700 pointer-events-none">
                <Bell size={120} />
              </div>
              <h3 className="text-2xl font-black font-sora mb-3 tracking-tighter italic">
                Network Signal
              </h3>
              <p className="text-xs font-medium opacity-60 leading-relaxed mb-8">
                Maintain cross-role synchronization and dispatch educational
                benchmarks to your cluster.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex -space-x-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-2xl bg-white/10 border-2 border-[#1e1a1d] flex items-center justify-center text-xs font-black shadow-lg"
                    >
                      {i === 1 ? "S" : i === 2 ? "A" : "L"}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-2xl bg-[#017E84] border-2 border-[#1e1a1d] flex items-center justify-center text-[10px] font-black shadow-lg">
                    +{followers.length}
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                  Active Links
                </span>
              </div>
            </div>

            <div className="bg-white p-10 border border-slate-100 rounded-[3rem] shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#017E84] mb-8 flex items-center gap-2">
                <Activity size={12} /> Strategic Ops
              </h4>
              <div className="space-y-4">
                {[
                  {
                    icon: MessageSquare,
                    label: "Communications",
                    value: "Nexus Active",
                    color: "bg-indigo-50 text-indigo-600",
                    link: "/chat",
                  },
                  {
                    icon: BookOpen,
                    label: "Curriculum Area",
                    value: `${courses.length} Modules`,
                    color: "bg-[#017E84]/10 text-[#017E84]",
                    link: "/admin/courses",
                  },
                  {
                    icon: Users,
                    label: "Active Learners",
                    value: `${followers.length} Total`,
                    color: "bg-[#714B67]/10 text-[#714B67]",
                    link: "/admin/social",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(item.link)}
                    className="flex items-center justify-between p-5 rounded-[2rem] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center ${item.color} group-hover:rotate-12 transition-transform`}
                      >
                        <item.icon size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 leading-none mb-1.5">
                          {item.label}
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {item.value}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default InstructorSocial;
