import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  CheckCircle, 
  MessageSquare, 
  BookOpen, 
  Trash2, 
  Sparkles, 
  Clock,
  ChevronRight,
  ShieldCheck,
  Zap,
  Filter
} from 'lucide-react'
import LearnerLayout from '../../components/layout/LearnerLayout'
import AdminLayout from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { userAPI } from '../../services/api'
import toast from 'react-hot-toast'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }
}

const Notifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL') // ALL, UNREAD
  const navigate = useNavigate()

  const Layout = (user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') ? AdminLayout : LearnerLayout;

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const { data } = await userAPI.getNotifications()
      setNotifications(data || [])
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    const tid = toast.loading('Marking all as read...')
    try {
      await userAPI.markNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read', { id: tid })
    } catch {
      toast.error('Failed to update notifications', { id: tid })
    }
  }

  const handleNotificationClick = (n) => {
    if (!n.read) {
      // Optioanlly mark single as read here if backend supports it
    }
    if (n.link) navigate(n.link)
  }

  const filtered = notifications.filter(n => filter === 'ALL' || !n.read)
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Layout noFooter>
      <main className="min-h-screen bg-white pb-20">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white pt-12 pb-10 border-b border-slate-100">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#714B67]/5 to-[#017E84]/5 rounded-full blur-[100px] -mr-20 -mt-20" />
          </div>

          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#714B67]/5 border border-[#714B67]/10 text-[10px] font-bold text-[#714B67] uppercase tracking-widest mb-4"
                >
                  <Bell size={12} className="animate-pulse" /> Activity Feed
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-black text-slate-900 font-sora tracking-tighter"
                >
                  Notifications
                </motion.h1>
                <p className="text-sm font-medium text-slate-500 mt-2 italic">
                  Stay updated with your latest learning progress and community activity.
                </p>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3"
              >
                {unreadCount > 0 && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleMarkAllRead}
                    icon={<CheckCircle size={14} />}
                    className="rounded-xl border-slate-200"
                  >
                    Mark All Read
                  </Button>
                )}
              </motion.div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-4 mt-8">
              {['ALL', 'UNREAD'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === f 
                      ? 'bg-slate-900 text-white shadow-lg' 
                      : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'
                  }`}
                >
                  {f === 'ALL' ? 'All Alerts' : `Unread (${unreadCount})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-6 py-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <Spinner size="xl" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrieving pulse...</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2.5rem]"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <ShieldCheck size={28} className="text-slate-200" />
              </div>
              <h3 className="text-lg font-black text-slate-700 font-sora tracking-tight">Everything is clear</h3>
              <p className="text-slate-400 text-sm mt-1">You're all caught up with your notifications.</p>
            </motion.div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {filtered.map((n, idx) => (
                <motion.div
                  key={n._id || idx}
                  variants={item}
                  onClick={() => handleNotificationClick(n)}
                  className={`group relative flex items-start gap-4 p-5 sm:p-6 rounded-[2rem] border transition-all cursor-pointer overflow-hidden ${
                    !n.read 
                      ? 'bg-white border-[#714B67]/20 shadow-xl shadow-[#714B67]/5' 
                      : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-slate-200'
                  }`}
                >
                  {!n.read && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#714B67]" />
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 ${
                    !n.read 
                      ? 'bg-[#714B67]/10 border-[#714B67]/20 text-[#714B67]' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {n.type === 'MESSAGE' ? <MessageSquare size={20} /> :
                     n.type === 'COURSE' ? <BookOpen size={20} /> :
                     n.type === 'ACHIEVEMENT' ? <Trophy size={20} /> :
                     <Zap size={20} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className={`text-sm leading-relaxed ${!n.read ? 'font-black text-slate-900' : 'font-semibold text-slate-600'}`}>
                        {n.message}
                      </p>
                      <ChevronRight size={16} className="text-slate-300 mt-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2">
                       <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                         <Clock size={10} />
                         {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </span>
                       {!n.read && (
                         <span className="w-1.5 h-1.5 rounded-full bg-[#714B67] shadow-sm shadow-[#714B67]/40" />
                       )}
                    </div>
                  </div>

                  {/* Decorative Sparkle for unread */}
                  {!n.read && (
                    <Sparkles size={14} className="absolute top-4 right-4 text-amber-400 opacity-40 animate-pulse" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Tips Section */}
          {!loading && filtered.length > 0 && (
            <div className="mt-12 flex items-center justify-center p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
               <div className="flex items-center gap-3 text-slate-400">
                  <ShieldCheck size={16} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">End of Transmission</p>
               </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  )
}

export default Notifications
