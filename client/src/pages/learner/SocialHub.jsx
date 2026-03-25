import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  UserCheck, 
  UserMinus, 
  MessageSquare, 
  ShieldAlert,
  SearchX,
  Users,
  GraduationCap,
  Filter,
  Check
} from 'lucide-react';
import { socialAPI } from '../../services/api';
import LearnerLayout from '../../components/layout/LearnerLayout';
import AdminLayout from '../../components/layout/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

const SocialHub = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, INSTRUCTORS, STUDENTS

  const Layout = (user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') ? AdminLayout : LearnerLayout;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await socialAPI.search(query);
      setResults(res.data || []);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetId) => {
    try {
      await socialAPI.sendRequest(targetId); // Overloaded logic in controller handles follow too
      toast.success('Following instructor!');
      handleSearch(); // Refresh
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleAddFriend = async (targetId) => {
    try {
      await socialAPI.sendRequest(targetId);
      toast.success('Friend request sent!');
      handleSearch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleBlock = async (targetId) => {
    if (!window.confirm('Are you sure you want to block this user?')) return;
    try {
      await socialAPI.block(targetId);
      toast.success('User blocked');
      handleSearch();
    } catch (error) {
      toast.error('Failed to block');
    }
  };

  const filteredResults = results.filter(u => {
    if (activeFilter === 'INSTRUCTORS') return u.role === 'INSTRUCTOR';
    if (activeFilter === 'STUDENTS') return u.role === 'LEARNER';
    return true;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50/50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 pt-12 pb-8 px-6 sm:px-10">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Users className="text-[#714B67]" size={32} />
              Social Hub
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Discover and connect with the Learnova community.</p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-8 relative max-w-2xl">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students or instructors by name or email..."
                className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#714B67]/20 transition-all font-medium"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#714B67] text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#4A3143] transition-all"
              >
                Search
              </button>
            </form>

            {/* Filters */}
            <div className="flex items-center gap-2 mt-6">
              {['ALL', 'STUDENTS', 'INSTRUCTORS'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                    ${activeFilter === f 
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Spinner size="lg" />
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Finding matches...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResults.map((u) => (
                <UserCard 
                  key={u.id} 
                  user={u} 
                  onFollow={handleFollow} 
                  onAddFriend={handleAddFriend}
                  onBlock={handleBlock}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                <SearchX className="text-slate-300" size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Users Found</h3>
              <p className="text-slate-500 max-w-xs mt-2 font-medium">Try searching for different names or roles to grow your network.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const UserCard = ({ user, onFollow, onAddFriend, onBlock }) => {
  const { relationship, role, name, avatar, bio, isOnline } = user;

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 p-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
      {/* Role Badge */}
      <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border
        ${role === 'INSTRUCTOR' 
          ? 'bg-purple-50 text-purple-600 border-purple-100' 
          : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
        {role}
      </div>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden border-2 border-white shadow-md">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-black text-slate-400 uppercase">
                {name[0]}
              </div>
            )}
          </div>
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-black text-slate-900 group-hover:text-[#714B67] transition-colors truncate">
            {name}
          </h4>
          <p className="text-slate-400 text-xs font-semibold truncate mt-0.5">{role}</p>
        </div>
      </div>

      <p className="mt-4 text-slate-500 text-xs leading-relaxed line-clamp-2 min-h-[32px]">
        {bio || "This user is busy learning and hasn't added a bio yet."}
      </p>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        {relationship.isFriend ? (
          <Button size="sm" variant="outline" className="flex-1 bg-green-50 border-green-100 text-green-600 !rounded-xl pointer-events-none">
            <UserCheck size={14} className="mr-2" />
            Friends
          </Button>
        ) : relationship.requestStatus === 'PENDING' ? (
          <Button size="sm" variant="outline" className="flex-1 bg-slate-50 border-slate-200 text-slate-400 !rounded-xl pointer-events-none italic">
            {relationship.amSender ? 'Pending...' : 'Request Recieved'}
          </Button>
        ) : role === 'INSTRUCTOR' ? (
          <Button 
            size="sm" 
            onClick={() => onFollow(user.id)}
            className="flex-1 bg-[#714B67] hover:bg-[#4A3143] text-white !rounded-xl"
          >
            {relationship.isFollowing ? 'Unfollow' : 'Follow'}
          </Button>
        ) : (
          <Button 
            size="sm" 
            onClick={() => onAddFriend(user.id)}
            className="flex-1 bg-slate-900 hover:bg-black text-white !rounded-xl"
          >
            <UserPlus size={14} className="mr-2" />
            Add Friend
          </Button>
        )}

        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onBlock(user.id)}
          className="aspect-square p-0 border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 !rounded-xl"
          title="Block User"
        >
          <ShieldAlert size={14} />
        </Button>
      </div>
    </div>
  );
};

export default SocialHub;
