import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  UserMinus, 
  MessageSquare, 
  Star,
  Clock,
  UserX,
  ShieldCheck,
  Search,
  ExternalLink,
  Users,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { socialAPI } from '../../services/api';
import LearnerLayout from '../../components/layout/LearnerLayout';
import AdminLayout from '../../components/layout/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const FriendsManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('MY_FRIENDS'); // MY_FRIENDS, PENDING, BLOCKED
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState({ incoming: [], outgoing: [] });
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);

  const Layout = (user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') ? AdminLayout : LearnerLayout;

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'MY_FRIENDS') {
        const res = await socialAPI.getFriends();
        setFriends(res.data || []);
      } else if (activeTab === 'PENDING') {
        const res = await socialAPI.getPending();
        setPending(res.data || { incoming: [], outgoing: [] });
      } else if (activeTab === 'BLOCKED') {
        const res = await socialAPI.getBlocked();
        setBlocked(res.data || []);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, status) => {
    try {
      const res = await socialAPI.respondRequest(requestId, status);
      // Ensure the request was successful before showing toast
      if (res.data?.success || res.status === 200 || res.status === 201) {
        toast.success(status === 'ACCEPTED' ? 'Friend request accepted!' : 'Request rejected');
        loadData();
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleToggleFavorite = async (friendshipId) => {
    try {
      await socialAPI.toggleFavorite(friendshipId);
      loadData();
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const handleUnfriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    try {
      await socialAPI.removeFriend(friendId);
      toast.success('Friend removed');
      loadData();
    } catch (error) {
      toast.error('Failed to remove friend');
    }
  };

  const handleUnblock = async (targetId) => {
    try {
      await socialAPI.unblock(targetId);
      toast.success('User unblocked');
      loadData();
    } catch (error) {
      toast.error('Failed to unblock');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50/50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 pt-12 pb-8 px-6 sm:px-10">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
              Connections
            </h1>
            
            {/* Tabs */}
            <div className="flex items-center gap-6 mt-8 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: 'MY_FRIENDS', label: 'My Friends', icon: Users },
                { id: 'PENDING', label: 'Pending Requests', icon: Clock },
                { id: 'BLOCKED', label: 'Blocked Users', icon: UserX },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative
                    ${activeTab === tab.id ? 'text-[#714B67]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#714B67] rounded-full" />
                  )}
                  {tab.id === 'PENDING' && pending.incoming?.length > 0 && (
                     <span className="ml-1 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">
                       {pending.incoming.length}
                     </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
          {loading ? (
             <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <div className="min-h-[400px]">
              {activeTab === 'MY_FRIENDS' && <FriendsList friends={friends} onToggleFav={handleToggleFavorite} onUnfriend={handleUnfriend} onMessage={(id) => navigate(`/learner/messages?userId=${id}`)} />}
              {activeTab === 'PENDING' && <PendingView pending={pending} onRespond={handleResponse} />}
              {activeTab === 'BLOCKED' && <BlockedView blocked={blocked} onUnblock={handleUnblock} />}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const FriendsList = ({ friends, onToggleFav, onUnfriend, onMessage }) => {
  const favorites = friends.filter(f => f.isFavorite);
  const others = friends.filter(f => !f.isFavorite);

  if (friends.length === 0) return <EmptyState icon={Users} title="No Friends Yet" desc="Grow your network by searching for students in the Search Hub." />;

  return (
    <div className="space-y-10">
      {favorites.length > 0 && (
        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Favorites ⭐</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(f => <FriendItem key={f.id} friend={f} onToggleFav={onToggleFav} onUnfriend={onUnfriend} onMessage={onMessage} />)}
          </div>
        </section>
      )}
      <section>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">All Friends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {others.map(f => <FriendItem key={f.id} friend={f} onToggleFav={onToggleFav} onUnfriend={onUnfriend} onMessage={onMessage} />)}
        </div>
      </section>
    </div>
  );
};

const FriendItem = ({ friend, onToggleFav, onUnfriend, onMessage }) => (
  <div className="bg-white border border-slate-200 rounded-[28px] p-5 hover:border-[#714B67]/30 transition-all group shadow-sm hover:shadow-xl hover:shadow-slate-200/50">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
             {friend.avatar ? <img src={friend.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-slate-400">{friend.name[0]}</div>}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${friend.isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900 truncate tracking-tight">{friend.name}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{friend.isOnline ? 'Active Now' : `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}`}</p>
        </div>
      </div>
      
      <button 
        onClick={() => onToggleFav(friend.friendshipId)}
        className={`p-2 rounded-xl transition-all ${friend.isFavorite ? 'bg-yellow-50 text-yellow-500' : 'text-slate-200 hover:text-yellow-400 hover:bg-yellow-50'}`}
      >
        <Star size={18} fill={friend.isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>

    <div className="mt-5 pt-5 border-t border-slate-50 flex items-center gap-2">
      <Button 
        size="sm" 
        onClick={() => onMessage(friend.id)}
        className="flex-1 bg-slate-950 hover:bg-black text-white !rounded-xl text-[10px] font-black uppercase tracking-widest py-2.5"
      >
        <MessageSquare size={14} className="mr-2" />
        Message
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => onUnfriend(friend.id)}
        className="aspect-square p-2.5 !rounded-xl border-slate-100 text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
      >
        <UserMinus size={16} />
      </Button>
    </div>
  </div>
);

const PendingView = ({ pending, onRespond }) => {
  const hasIncoming = pending.incoming?.length > 0;
  const hasOutgoing = pending.outgoing?.length > 0;

  if (!hasIncoming && !hasOutgoing) return <EmptyState icon={Clock} title="No Pending Requests" desc="You don't have any friend requests at the moment." />;

  return (
    <div className="space-y-12">
      {hasIncoming && (
        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 italic">Incoming Requests 📩</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pending.incoming.map(req => (
              <div key={req._id} className="bg-white p-5 rounded-[28px] border-2 border-dashed border-slate-200 hover:border-blue-200 transition-all flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-500 uppercase">{req.sender.name[0]}</div>
                   <div>
                     <p className="text-xs font-black text-slate-900">{req.sender.name}</p>
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{req.sender.role}</p>
                   </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onRespond(req._id, 'ACCEPTED')} className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg shadow-green-200"><UserCheck size={14} /></button>
                  <button onClick={() => onRespond(req._id, 'REJECTED')} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-200"><UserX size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasOutgoing && (
        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 italic">Sent Requests 🚀</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pending.outgoing.map(req => (
              <div key={req._id} className="bg-white/50 p-5 rounded-[28px] border border-slate-200 border-dashed flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 opacity-60">
                   <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 uppercase">{req.receiver.name[0]}</div>
                   <div>
                     <p className="text-xs font-black text-slate-900">{req.receiver.name}</p>
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">Awaiting response...</p>
                   </div>
                </div>
                <button onClick={() => onRespond(req._id, 'CANCEL')} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">Cancel</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const BlockedView = ({ blocked, onUnblock }) => {
  if (blocked.length === 0) return <EmptyState icon={ShieldCheck} title="Clean Slate" desc="You haven't blocked any users yet. Manage your privacy settings here." />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {blocked.map(u => (
        <div key={u.id} className="bg-white p-4 rounded-[24px] border border-slate-200 flex items-center justify-between gap-4 shadow-sm group hover:border-red-200 transition-all">
          <div className="flex items-center gap-3 opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
             <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 uppercase">{u.name[0]}</div>
             <div>
               <p className="text-xs font-black text-slate-900">{u.name}</p>
               <p className="text-[9px] text-red-500 font-black uppercase tracking-[0.2em]">Blocked</p>
             </div>
          </div>
          <button onClick={() => onUnblock(u.id)} className="px-5 py-2 rounded-xl bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all">Unblock</button>
        </div>
      ))}
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mb-6">
       <Icon className="text-slate-300" size={36} />
    </div>
    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">{title}</h3>
    <p className="text-slate-400 max-w-xs mt-2 text-xs font-medium">{desc}</p>
  </div>
);

export default FriendsManager;
