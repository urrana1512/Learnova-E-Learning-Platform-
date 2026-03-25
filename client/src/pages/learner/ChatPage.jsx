import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Search,
  Check,
  CheckCheck,
  Loader2,
  ArrowLeft,
  User,
  BookOpen,
  X,
  FileText,
  Download,
  Image as ImageIcon,
  Plus,
  Phone,
  Video,
  Info,
  ChevronRight,
  ShieldAlert,
  Clock,
  MessageSquare,
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { messageAPI, userAPI, socialAPI } from "../../services/api";
import LearnerLayout from "../../components/layout/LearnerLayout";
import AdminLayout from "../../components/layout/AdminLayout";
import toast from "react-hot-toast";

const ChatPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Helper for ID comparison
  const isSameId = (id1, id2) => {
    if (!id1 && !id2) return true; // Both null = same (General Chat)
    if (!id1 || !id2) return false;
    const s1 = typeof id1 === "object" ? id1._id || id1.id : id1;
    const s2 = typeof id2 === "object" ? id2._id || id2.id : id2;
    return String(s1) === String(s2);
  };

  // New Direct Messaging States
  const [isNewChatView, setIsNewChatView] = useState(false);
  const [people, setPeople] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const Layout =
    user?.role === "ADMIN" || user?.role === "INSTRUCTOR"
      ? AdminLayout
      : LearnerLayout;

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user?.id]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const allChats = await fetchChats();
      const network = await fetchNetwork();
      setPeople(network.people);
      setEnrollments(network.enrollments);

      const params = new URLSearchParams(window.location.search);
      const userId = params.get("userId");
      const courseId = params.get("courseId");

      if (userId && allChats) {
        const matchingChat = allChats.find(
          (c) =>
            (c._id?.user?._id === userId || c._id?.user?.id === userId) &&
            (!courseId ||
              c._id?.course?._id === courseId ||
              c._id?.course?.id === courseId),
        );
        if (matchingChat) {
          setSelectedChat(matchingChat);
        } else {
          // If no existing chat, try to start a new one with this user
          const person = network.people.find((p) => (p._id || p.id) === userId);
          if (person) handleStartNewChat(person, network.enrollments[0]);
        }
      }
      window.history.replaceState({}, "", window.location.pathname);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchNetwork = async () => {
    try {
      const results = await Promise.allSettled(
        user.role === "LEARNER"
          ? [
              userAPI.getFollowing(user.id),
              socialAPI.getFriends(),
              enrollmentAPI.myEnrollments(),
            ]
          : [socialAPI.getFollowers(), enrollmentAPI.myEnrollments()],
      );

      // Extract results safely
      const getVal = (idx) => {
        const res = results[idx];
        if (res.status === "rejected") {
          console.warn(`fetchNetwork part ${idx} failed:`, res.reason);
          return [];
        }
        return res.value.data?.data || res.value.data || [];
      };

      let peopleRaw = [];
      let enrollments = [];

      if (user.role === "LEARNER") {
        const instructors = getVal(0).filter((u) => u.role === "INSTRUCTOR");
        const friends = getVal(1);
        peopleRaw = [...instructors, ...friends];
        const enrollData = getVal(2);
        enrollments = enrollData
          .map((e) => e.course || e.courseId)
          .filter(Boolean);
      } else {
        peopleRaw = getVal(0);
        const enrollData = getVal(1);
        enrollments = enrollData
          .map((e) => e.course || e.courseId)
          .filter(Boolean);
      }

      // Deduplicate and normalize
      const seen = new Set();
      const uniquePeople = peopleRaw
        .filter((p) => {
          if (!p) return false;
          const pid = String(p._id || p.id);
          if (seen.has(pid)) return false;
          seen.add(pid);
          return true;
        })
        .map((p) => ({ ...p, _id: p._id || p.id }));

      console.log("fetchNetwork Success:", {
        peopleCount: uniquePeople.length,
        enrollCount: enrollments.length,
      });
      return { people: uniquePeople, enrollments };
    } catch (e) {
      console.error("fetchNetwork critical error:", e);
      return { people: [], enrollments: [] };
    }
  };

  useEffect(() => {
    if (selectedChat) {
      const targetUserId =
        selectedChat._id.user._id || selectedChat._id.user.id;
      const courseId =
        selectedChat._id.course?._id || selectedChat._id.course?.id || null;
      fetchHistory(targetUserId, courseId);
      socket?.emit("join_chat", `${targetUserId}-${courseId}`);
      messageAPI.markRead(targetUserId, courseId).catch(() => {});
    }
  }, [selectedChat, socket]);

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    socket.on("new_message", (msg) => {
      setSelectedChat((current) => {
        if (!current) return current;
        const selectedUserId = current._id.user._id || current._id.user.id;
        const selectedCourseId =
          current._id.course?._id || current._id.course?.id || null;

        if (
          (isSameId(msg.sender, selectedUserId) &&
            isSameId(msg.courseId, selectedCourseId)) ||
          (isSameId(msg.receiver, selectedUserId) &&
            isSameId(msg.courseId, selectedCourseId))
        ) {
          setMessages((prev) => [...prev, msg]);
        }
        return current;
      });
      fetchChats();
    });

    socket.on("user_status_change", ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
      setChats((prev) =>
        prev.map((c) => {
          if (c._id.user._id === userId || c._id.user.id === userId) {
            return {
              ...c,
              _id: { ...c._id, user: { ...c._id.user, isOnline } },
            };
          }
          return c;
        }),
      );
    });

    return () => {
      socket.off("new_message");
      socket.off("user_status_change");
    };
  }, [socket, selectedChat]);

  // Global Search Effect for New Chat View
  useEffect(() => {
    if (!isNewChatView || !contactSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchingGlobal(true);
      try {
        const { data } = await socialAPI.search(contactSearch);
        // Exclude the current user from global results
        setSearchResults((data || []).filter(u => String(u._id || u.id) !== String(user.id)));
      } catch (err) {
        console.error("Global search failed:", err);
      } finally {
        setSearchingGlobal(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [contactSearch, isNewChatView, user.id]);

  const fetchChats = async () => {
    try {
      const { data } = await messageAPI.getChats();
      const chatList = data.data || [];
      setChats(chatList);
      const online = new Set();
      chatList.forEach((c) => {
        if (c._id.user.isOnline) online.add(c._id.user._id || c._id.user.id);
      });
      setOnlineUsers(online);
      return chatList;
    } catch (err) {
      toast.error("Failed to load conversations");
      return [];
    }
  };

  const fetchHistory = async (userId, courseId) => {
    try {
      const { data } = await messageAPI.getHistory(userId, courseId);
      setMessages(data.data);
      setTimeout(() => scrollToBottom("auto"), 50);
    } catch (err) {
      toast.error("Failed to load history");
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024)
      return toast.error("File oversized (Max 20MB)");

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await messageAPI.upload(formData);
      setAttachment(data.data);
      toast.success("Attachment ready");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleStartNewChat = (person, course) => {
    const contextCourse = course || { _id: null, title: "General Conversation" };
    const newChat = {
      _id: {
        user: {
          _id: person._id || person.id,
          name: person.name,
          avatar: person.avatar,
          isOnline: person.isOnline,
        },
        course: { 
          _id: contextCourse._id || contextCourse.id || null, 
          title: contextCourse.title || "General Conversation" 
        },
      },
      lastMessage: {
        content: "Start a conversation...",
        createdAt: new Date(),
      },
      unreadCount: 0,
    };
    setSelectedChat(newChat);
    setIsNewChatView(false);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !selectedChat) return;

    setSending(true);
    try {
      const targetUserId =
        selectedChat._id.user._id || selectedChat._id.user.id;
      const courseId =
        selectedChat._id.course?._id || selectedChat._id.course?.id || null;

      const payload = {
        receiverId: targetUserId,
        courseId: courseId,
        content: newMessage.trim() || (attachment ? `Shared attachment` : ""),
        attachments: attachment ? [attachment] : [],
      };

      const { data } = await messageAPI.send(payload);
      setMessages((prev) => [...prev, data.data]);
      setNewMessage("");
      setAttachment(null);
      scrollToBottom();
      fetchChats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const filteredChats = chats.filter(
    (c) =>
      c._id?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c._id?.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredPeople = people.filter((p) =>
    p.name?.toLowerCase().includes(contactSearch.toLowerCase()),
  );

  return (
    <Layout noFooter>
      <div className="flex h-[calc(100vh-64px)] bg-slate-100 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`w-full md:w-[400px] bg-white border-r border-slate-200 flex flex-col ${selectedChat ? "hidden md:flex" : "flex"}`}
        >
          <div className="p-6 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">
                {isNewChatView ? "New Message" : "Inbox"}
              </h1>
              <button
                onClick={() => setIsNewChatView(!isNewChatView)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                  isNewChatView
                    ? "bg-slate-100 text-slate-400 rotate-45"
                    : "bg-[#714B67] text-white shadow-[#714B67]/20 hover:scale-110"
                }`}
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder={
                  isNewChatView
                    ? "Search friends or instructors..."
                    : "Search conversations..."
                }
                value={isNewChatView ? contactSearch : searchTerm}
                onChange={(e) =>
                  isNewChatView
                    ? setContactSearch(e.target.value)
                    : setSearchTerm(e.target.value)
                }
                className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#714B67]/20 transition-all font-sora"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-slate-200" size={32} />
              </div>
            ) : isNewChatView ? (
              /* New Conversation Discovery View */
              <div className="p-2 space-y-1">
                {filteredPeople.length > 0 || searchResults.length > 0 ? (
                  <>
                    {/* Network Results */}
                    {filteredPeople.map((person) => (
                      <button
                        key={person._id || person.id}
                        onClick={() => handleStartNewChat(person, enrollments[0])}
                        className="w-full p-4 flex items-center gap-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group text-left"
                      >
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-[#714B67] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#714B67]/10 group-hover:rotate-6 transition-transform">
                            {person.avatar ? (
                              <img src={person.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              person.name?.[0] || "?"
                            )}
                          </div>
                          {onlineUsers.has(person._id || person.id) && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-slate-900 truncate tracking-tight">{person.name}</h4>
                          <p className="text-[10px] font-black text-[#017E84] uppercase tracking-widest mt-0.5">
                            {person.role === 'INSTRUCTOR' ? 'Instructor' : 'Friend'}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-[#714B67] transition-colors" />
                      </button>
                    ))}

                    {/* Global Results (if any and didn't match local) */}
                    {searchResults.filter(sp => !people.some(lp => isSameId(lp, sp))).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Global Search Results</p>
                        {searchResults
                          .filter(sp => !people.some(lp => isSameId(lp, sp)))
                          .map((person) => (
                            <button
                              key={person._id || person.id}
                              onClick={() => handleStartNewChat(person, enrollments[0])}
                              className="w-full p-4 flex items-center gap-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group text-left"
                            >
                              <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-[#714B67] group-hover:text-white transition-all">
                                  {person.avatar ? <img src={person.avatar} className="w-full h-full object-cover rounded-xl" /> : person.name?.[0] || "?"}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-slate-900 truncate tracking-tight">{person.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{person.role}</p>
                              </div>
                              <Plus size={16} className="text-slate-300 group-hover:text-[#714B67] transition-colors" />
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                ) : searchingGlobal ? (
                  <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Loader2 size={32} className="animate-spin text-[#714B67]/20 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Searching Galaxy...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <User size={48} className="mb-4 text-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Contacts Found</p>
                    <p className="text-[9px] text-slate-400 mt-2 max-w-[200px]">Try searching for their name or email address</p>
                  </div>
                )}
              </div>
            ) : filteredChats.length > 0 ? (
              /* Existing Chat List View */
              filteredChats.map((chat) => (
                <ChatListItem
                  key={`${chat._id.user._id || chat._id.user.id}-${chat._id.course?._id || chat._id.course?.id || "general"}`}
                  chat={chat}
                  isActive={
                    isSameId(selectedChat?._id.user, chat._id.user) &&
                    isSameId(selectedChat?._id.course, chat._id.course)
                  }
                  onClick={() => {
                    setSelectedChat(chat);
                    setIsNewChatView(false);
                  }}
                  isOnline={onlineUsers.has(
                    chat._id.user._id || chat._id.user.id,
                  )}
                  currentUserId={user.id}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                <MessageSquare size={48} className="mb-4 text-slate-200" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  No Transmissions
                </p>
                <button
                  onClick={() => setIsNewChatView(true)}
                  className="mt-4 text-[9px] font-black text-[#714B67] border-b border-[#714B67] uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
                >
                  Start New Conversation
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main: Chat Window */}
        <main
          className={`flex-1 flex flex-col bg-[#efeae2] relative ${selectedChat ? "flex" : "hidden md:flex"}`}
        >
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 shadow-sm">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      {selectedChat._id.user.avatar ? (
                        <img
                          src={selectedChat._id.user.avatar}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-slate-400">
                          {selectedChat._id.user.name[0]}
                        </div>
                      )}
                    </div>
                    {onlineUsers.has(
                      selectedChat._id.user._id || selectedChat._id.user.id,
                    ) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      {selectedChat._id.user.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {onlineUsers.has(
                        selectedChat._id.user._id || selectedChat._id.user.id,
                      )
                        ? "Online Now"
                        : "Offline"}{" "}
                      • {selectedChat._id.course?.title || "General Conversation"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2.5 text-slate-400 hover:text-[#714B67] hover:bg-slate-50 rounded-xl transition-all">
                    <Video size={18} />
                  </button>
                  <button className="p-2.5 text-slate-400 hover:text-[#714B67] hover:bg-slate-50 rounded-xl transition-all">
                    <Phone size={18} />
                  </button>
                  <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </header>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 custom-scrollbar pattern-whatsapp">
                <div className="max-w-4xl mx-auto flex flex-col gap-2">
                  {messages.map((msg, i) => (
                    <MessageBubble
                      key={msg._id}
                      message={msg}
                      isMe={
                        msg.sender._id === user.id || msg.sender === user.id
                      }
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <footer className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-20">
                <div className="max-w-4xl mx-auto flex flex-col gap-3">
                  {attachment && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#714B67] shadow-sm">
                          {attachment.type === "IMAGE" ? (
                            <ImageIcon size={18} />
                          ) : (
                            <FileText size={18} />
                          )}
                        </div>
                        <p className="text-xs font-black text-slate-700 truncate max-w-[200px]">
                          {attachment.name}
                        </p>
                      </div>
                      <button
                        onClick={() => setAttachment(null)}
                        className="p-2 text-slate-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-end gap-3"
                  >
                    <div className="flex-1 bg-slate-100 rounded-[24px] flex items-end p-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#714B67]/10 transition-all border border-transparent focus-within:border-[#714B67]/20">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="p-3 text-slate-400 hover:text-[#714B67] transition-colors"
                      >
                        <Paperclip size={20} />
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </button>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 bg-transparent border-none py-3 px-2 text-sm font-medium focus:ring-0 outline-none resize-none max-h-32"
                      />
                      <button
                        type="button"
                        className="p-3 text-slate-300 hover:text-yellow-500 transition-colors"
                      >
                        <Smile size={20} />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={
                        sending ||
                        uploading ||
                        (!newMessage.trim() && !attachment)
                      }
                      className="w-12 h-12 rounded-full bg-[#714B67] text-white flex items-center justify-center shadow-lg shadow-[#714B67]/30 hover:scale-105 active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all shrink-0"
                    >
                      {sending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={20} className="ml-0.5" />
                      )}
                    </button>
                  </form>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl">
                <MessageSquare size={48} className="text-slate-200" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                Secure Hub
              </h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
                End-to-end encrypted learning communication
              </p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

const ChatListItem = ({ chat, isActive, onClick, isOnline, currentUserId }) => {
  const { user, course } = chat._id;
  const lastMsg = chat.lastMessage;
  const isMe =
    lastMsg.sender === currentUserId || lastMsg.sender?._id === currentUserId;

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-center gap-4 border-b border-slate-50 transition-all relative ${isActive ? "bg-slate-100" : "hover:bg-slate-50"}`}
    >
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
          {user.avatar ? (
            <img src={user.avatar} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-black text-slate-400">
              {user.name[0]}
            </div>
          )}
        </div>
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex justify-between items-start mb-0.5">
          <h4 className="text-sm font-black text-slate-900 truncate tracking-tight">
            {user.name}
          </h4>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {new Date(lastMsg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="text-[9px] font-black text-[#017E84] uppercase tracking-widest truncate mb-1 opacity-70 italic">
          {course?.title || "General Conversation"}
        </p>
        <div className="flex items-center gap-1.5 overflow-hidden">
          {isMe && (
            <CheckCheck
              size={12}
              className={lastMsg.isRead ? "text-blue-500" : "text-slate-300"}
            />
          )}
          <p className="text-xs text-slate-500 truncate font-medium">
            {lastMsg.content}
          </p>
        </div>
      </div>

      {chat.unreadCount > 0 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 min-w-[20px] h-5 px-1.5 bg-[#714B67] rounded-full text-[10px] font-black text-white flex items-center justify-center shadow-lg shadow-[#714B67]/30 border border-white">
          {chat.unreadCount}
        </div>
      )}
    </button>
  );
};

const MessageBubble = ({ message, isMe }) => {
  const hasAttachments = message.attachments?.length > 0;

  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 animate-in fade-in slide-in-from-bottom-1 duration-300`}
    >
      <div
        className={`max-w-[85%] md:max-w-[70%] lg:max-w-[60%] px-4 py-2 rounded-2xl shadow-sm relative ${isMe ? "bg-[#d9fdd3] text-slate-800 rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"}`}
      >
        {hasAttachments && (
          <div className="mb-2 space-y-2">
            {message.attachments.map((at, i) => (
              <div
                key={i}
                className={`rounded-xl overflow-hidden border ${isMe ? "bg-black/5 border-black/5" : "bg-slate-50 border-slate-100"}`}
              >
                {at.type === "IMAGE" ? (
                  <div className="flex flex-col">
                    <img
                      src={at.url}
                      className="w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(at.url, "_blank")}
                    />
                    <div className="p-2 flex items-center justify-between text-[10px] opacity-60 bg-black/5">
                      <span className="truncate max-w-[150px]">{at.name}</span>
                      <a
                        href={at.url}
                        download
                        target="_blank"
                        className="hover:text-[#714B67]"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center text-[#714B67]">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black truncate">
                        {at.name}
                      </p>
                      <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest">
                        Document
                      </p>
                    </div>
                    <a
                      href={at.url}
                      download
                      target="_blank"
                      className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>

        <div
          className={`flex items-center gap-1.5 mt-1 justify-end opacity-40`}
        >
          <span className="text-[9px] font-black tracking-tighter uppercase">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isMe && (
            <CheckCheck
              size={12}
              className={message.isRead ? "text-blue-500" : "text-slate-400"}
            />
          )}
        </div>

        {/* tail SVG for bubble look */}
        <div
          className={`absolute top-0 w-2 h-2 ${isMe ? "-right-1.5 bg-[#d9fdd3] border-t border-r border-[#d9fdd3] [clip-path:polygon(0_0,100%_0,0_100%)] rotate-180" : "-left-1.5 bg-white border-t border-l border-slate-100 [clip-path:polygon(0_0,100%_0,100%_100%)]"}`}
        />
      </div>
    </div>
  );
};

export default ChatPage;
