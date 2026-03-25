import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, Crown, Star, TrendingUp, User, ArrowLeft, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LearnerLayout from '../../components/layout/LearnerLayout'
import { learnerAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'

const Leaderboard = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('global') // global, monthly
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    learnerAPI.getLeaderboard()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  }

  if (loading) return (
    <LearnerLayout noFooter>
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Spinner size="xl" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Calculating Ranks...</p>
      </div>
    </LearnerLayout>
  )

  const topThree = data.slice(0, 3)
  const others = data.slice(3)

  return (
    <LearnerLayout noFooter>
      <main className="min-h-screen bg-slate-50/30 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 pt-12 pb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#714B67]/5 rounded-full blur-[100px] -mr-20 -mt-20" />
          <div className="max-w-5xl mx-auto px-6 relative z-10">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 hover:text-[#714B67] transition-colors">
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <div className="flex flex-col md:flex-row items-end justify-between gap-8">
              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 font-sora tracking-tighter leading-tight">
                  Academy <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#714B67] to-[#017E84]">Leaderboard.</span>
                </h1>
                <p className="text-slate-500 mt-4 max-w-md text-sm font-medium">Join the elite circle of learners. Points are earned through module mastery, quiz excellence, and consistent engagement.</p>
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                {['global', 'monthly'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      filter === f ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Podium Section */}
        <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            {/* Rank 2 */}
            {topThree[1] && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 text-center relative pt-12 order-2 md:order-1">
                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-3xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden">
                    {topThree[1].profileImage ? <img src={topThree[1].profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><User size={32} /></div>}
                 </div>
                 <div className="w-8 h-8 rounded-lg bg-slate-300 text-white flex items-center justify-center absolute top-6 right-8 rotate-12 shadow-lg">
                    <Medal size={16} />
                 </div>
                 <h3 className="text-lg font-black text-slate-900 font-sora mt-4">{topThree[1].name}</h3>
                 <p className="text-[10px] font-black text-[#714B67] uppercase tracking-widest mt-1">2nd Position</p>
                 <div className="mt-6 pt-6 border-t border-slate-50">
                    <p className="text-2xl font-black text-slate-900 font-sora">{topThree[1].totalPoints.toLocaleString()}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total XP</p>
                 </div>
              </motion.div>
            )}

            {/* Rank 1 */}
            {topThree[0] && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl shadow-[#714B67]/30 text-center relative pt-16 order-1 md:order-2 border-4 border-[#714B67]/20">
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-[2rem] bg-white border-4 border-[#714B67] shadow-2xl overflow-hidden scale-110">
                    {topThree[0].profileImage ? <img src={topThree[0].profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-white"><User size={40} /></div>}
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center absolute top-6 right-10 rotate-12 shadow-2xl shadow-amber-500/20">
                    <Crown size={24} />
                 </div>
                 <h2 className="text-2xl font-black text-white font-sora mt-4">{topThree[0].name}</h2>
                 <p className="text-[10px] font-black text-[#017E84] uppercase tracking-[0.2em] mt-2">Grandmaster Champion</p>
                 <div className="mt-8 pt-8 border-t border-white/10">
                    <p className="text-4xl font-black text-white font-sora leading-none">{topThree[0].totalPoints.toLocaleString()}</p>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-3">Elite Experience Points</p>
                 </div>
              </motion.div>
            )}

            {/* Rank 3 */}
            {topThree[2] && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 text-center relative pt-12 order-3 md:order-3">
                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-3xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden">
                    {topThree[2].profileImage ? <img src={topThree[2].profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><User size={32} /></div>}
                 </div>
                 <div className="w-8 h-8 rounded-lg bg-orange-300 text-white flex items-center justify-center absolute top-6 right-8 rotate-12 shadow-lg">
                    <Medal size={16} />
                 </div>
                 <h3 className="text-lg font-black text-slate-900 font-sora mt-4">{topThree[2].name}</h3>
                 <p className="text-[10px] font-black text-[#017E84] uppercase tracking-widest mt-1">3rd Position</p>
                 <div className="mt-6 pt-6 border-t border-slate-50">
                    <p className="text-2xl font-black text-slate-900 font-sora">{topThree[2].totalPoints.toLocaleString()}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total XP</p>
                 </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Others Table */}
        <div className="max-w-4xl mx-auto px-6 mt-16">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {others.map((p, idx) => (
              <motion.div 
                key={p._id} 
                variants={item}
                className={`bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-6 shadow-sm hover:shadow-md hover:border-[#714B67]/20 transition-all ${p._id === currentUser.id ? 'bg-[#714B67]/5 border-[#714B67]/20' : ''}`}
              >
                <div className="w-10 text-center text-xs font-black text-slate-400 font-sora">
                  {idx + 4}
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                  {p.profileImage ? <img src={p.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={20} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900 font-sora">{p.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] font-black text-[#714B67] uppercase tracking-widest">Active Member</span>
                    {p._id === currentUser.id && <span className="bg-[#714B67] text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">You</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 font-sora">{p.totalPoints.toLocaleString()}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">XP Points</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <div className="mt-12 p-8 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#017E84]/5 flex items-center justify-center text-[#017E84]">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase">Competitive Spirit</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Engage more, climb faster.</p>
              </div>
            </div>
            <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all">
              Invite Peers
            </button>
          </div>
        </div>
      </main>
    </LearnerLayout>
  )
}

export default Leaderboard
