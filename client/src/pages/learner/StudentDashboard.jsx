import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Trophy,
  Target,
  BookOpen,
  Play,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle,
  TrendingUp,
  Star,
  GraduationCap,
  Layout,
} from "lucide-react";
import LearnerLayout from "../../components/layout/LearnerLayout";
import Spinner from "../../components/ui/Spinner";
import Button from "../../components/ui/Button";
import { learnerAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getBadge } from "../../utils/badge";
import toast from "react-hot-toast";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 120 },
  },
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    learnerAPI
      .getDashboardStats()
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to sync learning data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <LearnerLayout noFooter>
        <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
          <Spinner size="xl" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
            Syncing Academy Metrics...
          </p>
        </div>
      </LearnerLayout>
    );

  const { stats, activity, recommendations, recentCourse } = data || {};
  const badge = getBadge(stats?.totalXP || 0);

  return (
    <LearnerLayout noFooter>
      <main className="min-h-screen bg-white pb-20">
        {/* === HERO SECTION === */}
        <div className="relative overflow-hidden bg-white pt-12 pb-16 border-b border-slate-100">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#714B67]/10 to-[#017E84]/10 rounded-full blur-[120px] -mr-40 -mt-40" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#017E84]/5 rounded-full blur-[100px] -ml-20 -mb-20" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-end justify-between gap-8">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#714B67]/5 border border-[#714B67]/10 text-[10px] font-bold text-[#714B67] uppercase tracking-widest mb-6"
                >
                  <Sparkles size={12} /> Student Intelligence Hub
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl sm:text-5xl font-black text-slate-900 font-sora tracking-tighter leading-tight"
                >
                  Welcome back, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#714B67] to-[#017E84]">
                    {user?.name}.
                  </span>
                </motion.h1>
              </div>

              {/* Profile Overview Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex items-center gap-6 min-w-[320px]"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[#714B67] flex items-center justify-center text-2xl font-black text-white shadow-lg">
                    {user?.name?.[0]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#017E84] flex items-center justify-center text-white border-2 border-white">
                    <Trophy size={10} fill="currentColor" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-slate-900">
                      {badge.name}
                    </span>
                    <span className="text-lg">{badge.emoji}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {stats?.totalXP} Total XP
                    </p>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <p className="text-[10px] font-black text-[#017E84] uppercase tracking-widest">
                      Rank {stats?.rank || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="ml-auto w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-[#714B67]">
                    {stats?.streak}
                  </span>
                  <span className="text-[8px] font-black text-slate-400 uppercase">
                    Streak
                  </span>
                </div>
              </motion.div>

              <motion.button
                whileHover={{ y: -5 }}
                onClick={() => navigate("/learner/leaderboard")}
                className="hidden lg:flex flex-col items-center justify-center bg-[#017E84] text-white p-6 rounded-[2.5rem] shadow-xl shadow-[#017E84]/20 min-w-[200px] border border-white/20 group"
              >
                <Trophy
                  size={20}
                  className="mb-2 group-hover:rotate-12 transition-transform"
                />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  Global Ranking
                </p>
                <p className="text-xl font-black font-sora mt-1">
                  # {stats?.rank?.split("/")[0] || "?"}
                </p>
                <div className="mt-4 flex items-center gap-1 text-[9px] font-black uppercase bg-white/10 px-3 py-1 rounded-full">
                  Compare Skills <ArrowRight size={10} />
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* === MAIN COLUMN === */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Resume Card */}
              <motion.section
                variants={container}
                initial="hidden"
                animate="show"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Play size={14} className="text-[#714B67]" /> Resume
                    Training
                  </h3>
                </div>

                {recentCourse ? (
                  <motion.div
                    variants={item}
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/learner/courses/${recentCourse.id}`)}
                    className="group relative bg-slate-900 rounded-[2.5rem] overflow-hidden p-8 text-white shadow-2xl shadow-[#714B67]/20 cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#714B67]/40 to-[#017E84]/40 rounded-full blur-[80px] -mr-20 -mt-20 opacity-50 group-hover:opacity-80 transition-opacity" />

                    <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-center">
                      <div className="w-32 h-32 rounded-3xl overflow-hidden shrink-0 border-2 border-white/10">
                        <img
                          src={
                            recentCourse.coverImage ||
                            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop"
                          }
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <span className="px-3 py-1 rounded-full bg-white/10 text-[9px] font-bold uppercase tracking-widest text-white/60 mb-3 inline-block">
                          Recently Accessed
                        </span>
                        <h4 className="text-2xl font-black font-sora mb-2 group-hover:text-white transition-colors">
                          {recentCourse.title}
                        </h4>
                        <div className="flex items-center justify-center sm:justify-start gap-4 text-white/50 text-[10px] font-bold uppercase tracking-widest mt-4">
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} />{" "}
                            {recentCourse.totalDuration || 45} mins
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Layout size={12} /> {recentCourse.status}
                          </span>
                        </div>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <Play size={24} fill="currentColor" className="ml-1" />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center">
                    <BookOpen
                      size={40}
                      className="mx-auto text-slate-300 mb-4"
                    />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      No active sessions found.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => navigate("/learner/catalog")}
                      className="mt-4"
                    >
                      Browse Catalog
                    </Button>
                  </div>
                )}
              </motion.section>

              {/* Weekly Activity Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      <TrendingUp size={14} className="text-[#017E84]" /> Weekly
                      Momentum
                    </h3>
                  </div>
                  <div className="flex items-end justify-between h-32 gap-2 px-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => {
                      const val = data?.weeklyXP?.[i] || 0;
                      const max = Math.max(...(data?.weeklyXP || [1000]));
                      const height = max > 0 ? (val / max) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-3 group"
                        >
                          <div className="relative w-full flex justify-center items-end h-full">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              className="w-full max-w-[12px] bg-slate-100 rounded-full group-hover:bg-[#017E84] transition-colors relative"
                            >
                              {val > 0 && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded font-black">
                                  {val} XP
                                </div>
                              )}
                            </motion.div>
                          </div>
                          <span className="text-[9px] font-black text-slate-400">
                            {day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Weak Areas section */}
                <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Target size={14} className="text-red-500" /> Improvement
                      Areas
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Skill Focus
                    </p>
                  </div>
                  <div className="space-y-6">
                    {data?.insights?.length > 0 ? (
                      data.insights.slice(0, 3).map((insight, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-600 truncate">
                              {insight.category}
                            </span>
                            <span
                              className={
                                insight.averageScore < 70
                                  ? "text-red-500"
                                  : "text-emerald-500"
                              }
                            >
                              {insight.averageScore}% Accuracy
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${insight.averageScore}%` }}
                              className={`h-full ${insight.averageScore < 70 ? "bg-red-500" : "bg-emerald-500"}`}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-24 flex flex-col items-center justify-center text-center opacity-40">
                        <Target size={24} className="mb-2 text-slate-300" />
                        <p className="text-[8px] font-black uppercase tracking-widest">
                          Complete more quizzes <br /> to unlock performance
                          insights
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Recommendations */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Target size={14} className="text-[#017E84]" /> Suggested
                    Protocols
                  </h3>
                  <button
                    onClick={() => navigate("/learner/catalog")}
                    className="text-[10px] font-black text-[#017E84] uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Explore All <ArrowRight size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <AnimatePresence>
                    {recommendations?.map((course, idx) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        onClick={() => navigate(`/learner/courses/${course.id}`)}
                        className="group bg-white border border-slate-200 rounded-[2rem] p-4 flex gap-4 cursor-pointer hover:border-[#017E84]/30 hover:shadow-xl hover:shadow-[#017E84]/5 transition-all"
                      >
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                          <img
                            src={
                              course.coverImage ||
                              "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200&auto=format&fit=crop"
                            }
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            alt=""
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h5 className="text-sm font-black text-slate-900 truncate mb-1 group-hover:text-[#017E84] transition-colors">
                            {course.title}
                          </h5>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {course.instructor || "Academy Expert"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-0.5">
                              <Star
                                size={10}
                                fill="#f59e0b"
                                className="text-amber-500"
                              />
                              <span className="text-[9px] font-black text-slate-700">
                                4.9
                              </span>
                            </div>
                            <span className="text-[9px] font-black text-[#017E84] bg-[#017E84]/5 px-2 py-0.5 rounded-full uppercase tracking-widest">
                              {course.accessRule === "ON_PAYMENT"
                                ? "Premium"
                                : "Free"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            </div>

            {/* === SIDEBAR COLUMN === */}
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Completed",
                    value: stats?.completed,
                    icon: <CheckCircle size={18} />,
                    color: "text-emerald-500",
                    bg: "bg-emerald-50",
                  },
                  {
                    label: "In Progress",
                    value: stats?.inProgress,
                    icon: <TrendingUp size={18} />,
                    color: "text-[#714B67]",
                    bg: "bg-[#714B67]/5",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-4`}
                    >
                      {s.icon}
                    </div>
                    <p className="text-2xl font-black text-slate-900 font-sora">
                      {s.value}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Activity Timeline */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" /> Digital
                  Activity
                </h3>
                <div className="space-y-8">
                  {activity?.length > 0 ? (
                    activity.map((act, i) => (
                      <div key={i} className="flex gap-4 group">
                        <div className="relative">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 ${act.isCompleted ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-slate-50 border-slate-100 text-slate-400"}`}
                          >
                            {act.type === "VIDEO" ? (
                              <Play size={16} />
                            ) : act.type === "QUIZ" ? (
                              <Trophy size={16} />
                            ) : (
                              <BookOpen size={16} />
                            )}
                          </div>
                          {i < activity.length - 1 && (
                            <div className="absolute top-10 left-5 w-px h-8 bg-slate-100" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-black text-slate-900 truncate uppercase tracking-widest group-hover:text-[#714B67] transition-colors">
                              {act.title}
                            </p>
                            {act.score !== null && (
                              <span className="text-[10px] font-black text-[#017E84] font-sora">
                                {act.score}%
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                            {act.course}
                          </p>
                          <p className="text-[8px] font-black text-slate-300 mt-2 uppercase">
                            {new Date(act.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        Awaiting First Pulse...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Academy Badge */}
              <div className="bg-gradient-to-br from-[#714B67] to-[#017E84] rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl">
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl">
                    {badge.emoji}
                  </div>
                  <h4 className="text-xl font-black font-sora mb-1">
                    {badge.name}
                  </h4>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60 mb-8">
                    Official Academy Rank
                  </p>
                  <button
                    onClick={() => navigate("/learner/my-learning")}
                    className="w-full py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    View Credentials
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </LearnerLayout>
  );
};

export default StudentDashboard;
