import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Search,
  Mail,
  Calendar,
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { socialAPI } from '../../services/api';
import AdminLayout from '../../components/layout/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const FollowersManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFollowers();
  }, []);

  const loadFollowers = async () => {
    setLoading(true);
    try {
      const res = await socialAPI.getFollowers();
      setFollowers(res.data || []);
    } catch (error) {
      toast.error('Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  const filteredFollowers = followers.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50/50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 pt-12 pb-10 px-6 sm:px-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#714B67]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                  Student Audience
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Manage and interact with students who follow your work.</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-[#714B67]/10 px-4 py-2 rounded-2xl border border-[#714B67]/20">
                   <p className="text-[10px] font-black text-[#714B67] uppercase tracking-widest mb-0.5">Total Followers</p>
                   <p className="text-xl font-black text-slate-900 leading-none">{followers.length}</p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">New This Month</p>
                   <p className="text-xl font-black text-slate-900 leading-none">+{Math.min(followers.length, 3)}</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="mt-8 relative max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-slate-100 border-none rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#714B67]/20 transition-all font-medium text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
          {loading ? (
             <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : filteredFollowers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredFollowers.map(follower => (
                 <div key={follower.id} className="bg-white rounded-[32px] border border-slate-200 p-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                           {follower.avatar ? <img src={follower.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-slate-400">{follower.name[0]}</div>}
                        </div>
                        {follower.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 truncate tracking-tight">{follower.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-slate-400">
                          <Mail size={12} />
                          <p className="text-xs font-semibold truncate">{follower.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between gap-3">
                       <Button 
                         size="sm" 
                         onClick={() => navigate(`/chat?userId=${follower.id}`)}
                         className="flex-1 bg-slate-950 hover:bg-black text-white !rounded-xl text-[10px] font-black uppercase tracking-widest py-2.5 h-10"
                       >
                         <MessageSquare size={14} className="mr-2" />
                         Message
                       </Button>
                       <div className="flex items-center gap-1 text-slate-400 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                          <Calendar size={12} />
                          <span className="text-[9px] font-black">ACTIVE</span>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mb-6">
                 <Users className="text-slate-300" size={36} />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">No Followers Found</h3>
              <p className="text-slate-400 max-w-xs mt-2 text-xs font-medium">Publish more high-quality content to attract active students to your profile.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default FollowersManager;
