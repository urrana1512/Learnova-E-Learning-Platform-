import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  Trophy,
  MessageSquare,
  Heart,
  User,
  LogOut,
  Bell,
  Shield,
  Zap,
  CheckCircle,
  BookMarked,
  Globe,
  Users,
  Network
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getBadge, getProgressToNextBadge } from "../../utils/badge";
import { userAPI } from "../../services/api";

const getNavLinks = (userId) => [
  { to: "/learner/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/learner/my-learning", icon: BookMarked, label: "My Learning" },
  { to: "/learner/my-learning?tab=wishlist", icon: Heart, label: "Wishlist" },
  { to: "/learner/leaderboard", icon: Trophy, label: "Leaderboard" },
  { to: "/learner/social-hub", icon: Globe, label: "Social Hub" },
  { to: "/learner/network", icon: Network, label: "Network" },
  { to: "/learner/notifications", icon: Bell, label: "Notifications" },
  { to: "/learner/messages", icon: MessageSquare, label: "Messages" },
  { to: `/learner/profile/${userId}`, icon: User, label: "My Profile" },
];

const LearnerSidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const { socket }       = useSocket();
  const navigate         = useNavigate();

  const [notifications, setNotifications] = useState([]);

  const badge         = user ? getBadge(user.totalPoints || 0) : null;
  const progressToNext = user ? getProgressToNextBadge(user.totalPoints || 0) : 0;
  const unreadCount   = notifications.filter((n) => !n.read).length;

  /* Load notifications */
  useEffect(() => {
    if (user) {
      userAPI.getNotifications().then((r) => setNotifications(r.data || [])).catch(() => {});
    }
  }, [user]);

  /* Live notifications via socket */
  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => setNotifications((prev) => [notif, ...prev]);
    socket.on("new_notification", handler);
    return () => socket.off("new_notification", handler);
  }, [socket]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className={`flex flex-col h-full border-r border-slate-200 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white z-[100] relative overflow-visible shrink-0
        ${collapsed ? "w-24" : "w-[280px]"}`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-4 top-10 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-[#714B67] hover:border-[#714B67]/30 shadow-xl shadow-slate-200/50 transition-all z-[110] group"
      >
        <ChevronLeft
          size={14}
          className={`transition-transform duration-500 ${collapsed ? "rotate-180" : ""} group-hover:scale-125`}
        />
      </button>

      {/* Logo */}
      <div className={`flex items-center h-24 border-b border-slate-50 transition-all duration-300 ${collapsed ? "justify-center" : "px-8 gap-4"}`}>
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-[#714B67] to-[#4A3143] flex items-center justify-center shrink-0 shadow-xl shadow-[#714B67]/20 border border-white/20 transition-all duration-500 ${collapsed ? "scale-90 rotate-[5deg]" : ""}`}
        >
          <GraduationCap size={24} className="text-white" />
        </div>

        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 min-w-0"
          >
            <span className="font-black text-slate-900 font-sora text-xl block leading-none mb-1.5 tracking-tighter italic">
              Learnova
            </span>
            <div className="flex items-center gap-1.5 opacity-90 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-[#017E84] animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none text-[#017E84]">
                Learning Hub
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* XP Progress (expanded only) */}
      {!collapsed && user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-5 mt-6 p-4 bg-gradient-to-r from-[#714B67]/5 to-[#017E84]/5 rounded-2xl border border-[#714B67]/10"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{badge?.emoji}</span>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{badge?.name}</span>
            </div>
            <span className="text-[10px] font-black text-[#714B67]">{user.totalPoints || 0} XP</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#714B67] to-[#017E84] rounded-full"
            />
          </div>
          {badge?.next && (
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 text-right">
              {badge.next - (user.totalPoints || 0)} XP to next level
            </p>
          )}
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {!collapsed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic"
          >
            Navigation
          </motion.p>
        )}

        {getNavLinks(user?.id).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/learner/dashboard" || to === `/network/${user?.id}`}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-4 rounded-[20px] transition-all duration-300 group relative
               ${collapsed ? "justify-center p-3 h-14 w-14 mx-auto" : "px-6 py-3.5"}
               ${isActive
                 ? "bg-slate-950 text-white shadow-2xl shadow-slate-900/20"
                 : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
               }`
            }
          >
            <Icon size={20} className="shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:stroke-[2.5px]" />
            {!collapsed && (
              <span className="text-xs font-black uppercase tracking-widest truncate">{label}</span>
            )}
            {label === "Notifications" && unreadCount > 0 && (
              <span className={`absolute bg-red-500 text-white flex items-center justify-center font-black rounded-full border-2 border-white
                ${collapsed ? "-top-1 -right-1 w-4 h-4 text-[8px]" : "right-6 w-5 h-5 text-[9px]"}`}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer: Notifications + User + Logout */}
      <div className="p-4 space-y-3 border-t border-slate-100">



        {/* User card + Logout */}
        <div className={`p-1 bg-slate-100 rounded-[24px] ${collapsed ? "flex flex-col items-center gap-1" : "space-y-1"}`}>
          {/* User info */}
          <div className={`flex items-center gap-3 rounded-[20px] transition-all bg-white border border-slate-200/50 shadow-sm ${collapsed ? "p-1.5 h-12 w-12 justify-center" : "px-4 py-3"}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#714B67] to-[#4A3143] flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-950 truncate uppercase tracking-widest italic">
                  {user?.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle size={8} className="text-[#017E84]" />
                  <p className="text-[8px] text-[#017E84] font-bold uppercase tracking-widest">Student</p>
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed ? "Sign Out" : undefined}
            className={`flex items-center gap-4 rounded-[20px] transition-all text-red-500 hover:bg-red-50 hover:text-red-600 group ${collapsed ? "justify-center p-3 h-12 w-12 mx-auto" : "px-6 py-4 w-full"}`}
          >
            <LogOut size={18} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
            {!collapsed && (
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sign Out</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default LearnerSidebar;
