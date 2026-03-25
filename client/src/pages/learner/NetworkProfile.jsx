import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Users,
  BookOpen,
  Star,
  ArrowLeft,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  Edit3,
  Save,
  X,
  Phone,
  Info,
  Mail,
  Award,
} from "lucide-react";
import LearnerLayout from "../../components/layout/PublicLayout";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { userAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const NetworkProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("courses");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: "",
    contactNo: "",
    information: "",
    name: "",
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    userAPI
      .getProfile(id)
      .then(({ data: d }) => {
        setData(d);
        if (d.profile) {
          setEditForm({
            bio: d.profile.bio || "",
            contactNo: d.contactNo || d.profile.contactNo || "",
            information: d.profile.information || "",
            name: d.profile.name || "",
          });
        }
      })
      .catch(() => {
        toast.error("Identity not found");
        navigate("/courses");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (activeTab === "followers") {
      setSocialLoading(true);
      userAPI
        .getFollowers(id)
        .then(({ data }) => setFollowers(data))
        .finally(() => setSocialLoading(false));
    } else if (activeTab === "following") {
      setSocialLoading(true);
      userAPI
        .getFollowing(id)
        .then(({ data }) => setFollowing(data))
        .finally(() => setSocialLoading(false));
    }
  }, [activeTab, id]);

  const handleFollow = async () => {
    if (!user) return navigate("/login");
    if (user.id === id) return toast.error("Cannot follow yourself");
    try {
      const res = await userAPI.toggleFollow(id);
      setData((prev) => {
        if (!prev || !prev.profile) return prev;
        const currentFollowers = prev.profile._count?.followers || 0;
        return {
          ...prev,
          isFollowing: res.data.following,
          profile: {
            ...prev.profile,
            _count: {
              ...(prev.profile._count || {}),
              followers: Math.max(
                0,
                currentFollowers + (res.data.following ? 1 : -1),
              ),
            },
          },
        };
      });
      toast.success(res.data.following ? "Subscribed to Hub" : "Unsubscribed");
    } catch (err) {
      toast.error("Social sync failed");
    }
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      const res = await userAPI.updateProfile(editForm);
      setData((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...res.data },
      }));
      setIsEditMode(false);
      toast.success("Identity protocols updated");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <LearnerLayout noFooter>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Spinner size="xl" className="text-[#714B67]" />
        </div>
      </LearnerLayout>
    );
  }

  if (!data?.profile) return null;

  const profile = data?.profile || {};
  const courses = data?.courses || [];
  const isFollowing = !!data?.isFollowing;
  const isOwner = user?.id === id;
  const isInstructor = profile?.role === "INSTRUCTOR";

  return (
    <LearnerLayout noFooter>
      <div className="min-h-screen bg-slate-50 font-inter pb-20 overflow-x-hidden">
        {/* Profile Header */}
        <div className="h-96 w-full bg-[#0F172A] relative overflow-hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-0 opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(113,75,103,0.15),transparent)] z-0" />

          <div className="max-w-6xl mx-auto px-6 w-full relative z-10 pb-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
              <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-[3rem] bg-white border-8 border-white flex items-center justify-center text-[#714B67] text-7xl font-black shadow-2xl overflow-hidden shrink-0 translate-y-6 group relative">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                ) : (
                  profile?.name?.[0] || "?"
                )}
                {isOwner && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <Edit3 className="text-white" size={24} />
                  </div>
                )}
              </div>
              <div className="mb-4">
                {isEditMode ? (
                  <input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="text-4xl lg:text-5xl font-black text-white bg-white/10 border-b-2 border-white/30 outline-none font-sora tracking-tight leading-none mb-4 w-full"
                  />
                ) : (
                  <h1 className="text-4xl lg:text-5xl font-black text-white font-sora tracking-tight leading-none mb-2 drop-shadow-lg">
                    {profile?.name || "Member"}
                  </h1>
                )}
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="text-[#017E84] text-[10px] font-black uppercase tracking-[0.4em] bg-[#017E84]/10 px-3 py-1 rounded-full border border-[#017E84]/20">
                    {profile?.role || "LEARNER"}
                  </span>
                  {isInstructor && (
                    <ShieldCheck className="text-emerald-400" size={16} />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              {isOwner ? (
                isEditMode ? (
                  <>
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white px-6 h-12 flex items-center gap-2"
                    >
                      <Save size={16} /> Save Changes
                    </Button>
                    <Button
                      onClick={() => setIsEditMode(false)}
                      className="bg-white/10 border border-white/20 text-white rounded-2xl px-6 h-12 flex items-center gap-2"
                    >
                      <X size={16} /> Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditMode(true)}
                    className="bg-white text-[#714B67] rounded-3xl px-8 h-14 font-black uppercase tracking-widest shadow-2xl flex items-center gap-2"
                  >
                    <Edit3 size={18} /> Manage Identity
                  </Button>
                )
              ) : (
                <Button
                  onClick={() => navigate(-1)}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest h-12 px-6"
                >
                  Return to Nexus
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 mt-20 lg:mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
            <div className="lg:col-span-8 space-y-8">
              <section className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] -rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
                  <GraduationCap size={200} />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#017E84] mb-6 flex items-center gap-2">
                  <Info size={14} /> Personal Codex
                </h2>
                {isEditMode ? (
                  <textarea
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bio: e.target.value })
                    }
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#714B67]/20 transition-all resize-none"
                    placeholder="Write a brief bio..."
                  />
                ) : (
                  <p className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed italic">
                    "
                    {profile?.bio ||
                      `Dedicated ${isInstructor ? "educational architect" : "high-tier learner"} committed to mastery.`}
                    "
                  </p>
                )}

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-[#714B67]/10 group-hover/item:text-[#714B67] transition-all">
                        <Mail size={16} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                          Secure Channel
                        </p>
                        <p className="text-sm font-bold text-slate-800">
                          {profile?.email || "Confidential"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-[#017E84]/10 group-hover/item:text-[#017E84] transition-all">
                        <Phone size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                          Direct Link
                        </p>
                        {isEditMode ? (
                          <input
                            value={editForm.contactNo}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                contactNo: e.target.value,
                              })
                            }
                            placeholder="Contact Number"
                            className="w-full bg-slate-50 font-bold text-slate-800 text-sm outline-none border-b border-transparent focus:border-[#017E84] transition-all"
                          />
                        ) : (
                          <p className="text-sm font-bold text-slate-800">
                            {profile?.contactNo || "Not established"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-amber-50 group-hover/item:text-amber-500 transition-all">
                        <Award size={16} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                          Total Signal
                        </p>
                        <p className="text-sm font-black text-amber-500 font-sora">
                          {profile?.totalPoints || 0} XP
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {isEditMode && (
                  <div className="mt-8 pt-8 border-t border-slate-50">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Extended Protocols (Information)
                    </p>
                    <textarea
                      value={editForm.information}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          information: e.target.value,
                        })
                      }
                      className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#714B67]/20 transition-all resize-none"
                      placeholder="Add extra information about yourself..."
                    />
                  </div>
                )}

                {!isEditMode && profile?.information && (
                  <div className="mt-8 pt-8 border-t border-slate-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 italic">
                      Extended Signal
                    </p>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
                      {profile.information}
                    </p>
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-8 border border-slate-100 shadow-sm rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:bg-[#714B67]/5 transition-colors cursor-default">
                  <span className="text-4xl font-black text-slate-900 font-sora group-hover:scale-110 transition-transform">
                    {profile?._count?.followers || 0}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                    {isInstructor ? "Students" : "Followers"}
                  </span>
                </div>
                <div className="bg-white p-8 border border-slate-100 shadow-sm rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:bg-[#017E84]/5 transition-colors cursor-default">
                  <span className="text-4xl font-black text-slate-900 font-sora group-hover:scale-110 transition-transform">
                    {isInstructor
                      ? (courses || []).length
                      : profile?._count?.following || 0}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                    {isInstructor ? "Modules" : "Following"}
                  </span>
                </div>
              </div>

              {!isOwner && (
                <div className="bg-white p-8 border border-slate-100 rounded-[3rem] shadow-xl space-y-4">
                  <Button
                    onClick={handleFollow}
                    className={`h-16 w-full rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isFollowing ? "bg-slate-900 shadow-inner" : "bg-[#714B67] shadow-xl shadow-[#714B67]/20"}`}
                  >
                    {isFollowing ? "Hub Connected" : "Establish Link"}
                  </Button>
                  <AnimatePresence>
                    {isFollowing && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <Button
                          onClick={() => navigate("/chat")}
                          className="h-16 w-full rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] bg-white border-2 border-slate-100 text-[#714B67] hover:bg-slate-50"
                        >
                          Send Message
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="bg-[#1e1a1d] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-45 transform group-hover:scale-[1.8] group-hover:rotate-12 transition-all duration-700 pointer-events-none">
                  <ShieldCheck size={120} />
                </div>
                <h3 className="text-xl font-black font-sora mb-4 tracking-tighter italic">
                  Learnova ID
                </h3>
                <div className="space-y-3 opacity-80">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span>Status</span>
                    <span className="text-emerald-400">Verified Hub</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span>Member Since</span>
                    <span>{new Date(profile.createdAt).getFullYear()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span>Role Vector</span>
                    <span>{profile.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Interactions Section */}
          <div className="flex items-center gap-10 border-b border-slate-200 mb-12 px-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            {[
              {
                id: "courses",
                label: isInstructor
                  ? `Curriculum (${(courses || []).length})`
                  : `Enrolled Clusters`,
              },
              {
                id: "followers",
                label: `Network Members (${profile?._count?.followers || 0})`,
              },
              {
                id: "following",
                label: `Connections (${profile?._count?.following || 0})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative outline-none ${activeTab === tab.id ? "text-[#714B67]" : "text-slate-400 hover:text-slate-600"}`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#714B67] rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-[500px]">
            {activeTab === "courses" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(courses || []).length === 0 ? (
                  <div className="col-span-full py-28 text-center border-2 border-dashed border-slate-200 rounded-[4rem] bg-white group hover:border-[#714B67]/30 transition-colors">
                    <BookOpen
                      className="mx-auto mb-6 text-slate-100 group-hover:text-[#714B67]/10 transition-colors"
                      size={64}
                    />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
                      No cluster activity detected
                    </p>
                  </div>
                ) : (
                  (courses || []).map((c) => (
                    <div
                      key={c?._id || c?.id}
                      onClick={() => navigate(`/courses/${c?._id || c?.id}`)}
                      className="group bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden cursor-pointer hover:shadow-2xl transition-all flex flex-col h-full transform hover:-translate-y-2"
                    >
                      <div className="h-48 bg-slate-900 relative overflow-hidden">
                        {c?.coverImage || c?.thumbnail ? (
                          <img
                            src={c.coverImage || c.thumbnail}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10">
                            <BookOpen size={48} />
                          </div>
                        )}
                        <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-widest border border-white/10 shadow-xl">
                          {c?._count?.lessons || 10} Units
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-lg font-black text-slate-900 font-sora tracking-tight leading-tight mb-6 group-hover:text-[#714B67] transition-colors line-clamp-2">
                          {c?.title || "Operational Module"}
                        </h3>
                        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-6">
                          <div className="flex items-center gap-2">
                            <Users size={12} className="text-[#017E84]" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              {c?._count?.enrollments || 0} Learners
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#714B67] group-hover:text-white transition-all transform group-hover:rotate-45">
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {(activeTab === "followers" || activeTab === "following") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {socialLoading ? (
                  <div className="col-span-full py-20 flex flex-col items-center gap-4">
                    <Spinner size="lg" className="text-[#714B67]" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Synchronizing Network...
                    </p>
                  </div>
                ) : (activeTab === "followers" ? followers : following)
                    .length === 0 ? (
                  <div className="col-span-full py-28 text-center border-2 border-dashed border-slate-200 rounded-[4rem] bg-white text-slate-300 font-black uppercase tracking-[0.5em] text-[10px]">
                    Registry Empty
                  </div>
                ) : (
                  (activeTab === "followers" ? followers : following).map(
                    (u) => (
                      <div
                        key={u?._id || u?.id}
                        onClick={() => navigate(`/network/${u?._id || u?.id}`)}
                        className="bg-white p-6 border border-slate-50 rounded-[2.5rem] flex flex-col items-center text-center gap-4 cursor-pointer hover:shadow-2xl transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 text-[#714B67]">
                          <ArrowRight size={18} />
                        </div>
                        <div className="w-20 h-20 rounded-[1.75rem] bg-[#714B67] flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-[#714B67]/20 group-hover:rotate-[10deg] transition-all">
                          {u?.avatar ? (
                            <img
                              src={u.avatar}
                              className="w-full h-full object-cover rounded-[1.75rem]"
                            />
                          ) : (
                            u?.name?.[0] || "?"
                          )}
                        </div>
                        <div className="min-w-0 w-full px-2">
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-[#714B67] transition-colors truncate mb-1">
                            {u?.name || "Hub Entity"}
                          </h4>
                          <span className="inline-block px-3 py-1 bg-slate-50 rounded-full text-[8px] font-black text-[#017E84] uppercase tracking-widest group-hover:bg-[#017E84] group-hover:text-white transition-colors">
                            {u?.role || "LEARNER"}
                          </span>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </LearnerLayout>
  );
};

export default NetworkProfile;
