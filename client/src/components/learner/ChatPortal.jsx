import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  X,
  User,
  Search,
  Paperclip,
  MoreVertical,
  Check,
  CheckCheck,
  Sidebar,
  ChevronLeft,
} from "lucide-react";
import { messageAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ChatPortal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null); // { user, course }
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const { user } = useAuth();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadChats();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeChat) {
      loadMessages();
      // Mark as read
      messageAPI
        .markRead(activeChat.user._id, activeChat.course._id)
        .catch(() => {});
    }
  }, [activeChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const { data: res } = await messageAPI.getChats();
      setChats(res.data || []);
    } catch {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data: res } = await messageAPI.getHistory(
        activeChat.user._id,
        activeChat.course._id,
      );
      setMessages(res.data || []);
    } catch {
      toast.error("Failed to load messages");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const tempMsg = {
      _id: Date.now(),
      sender: { _id: user.id, name: user.name },
      content: newMessage,
      createdAt: new Date().toISOString(),
      sending: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    const text = newMessage;
    setNewMessage("");

    try {
      await messageAPI.send({
        receiverId: activeChat.user._id,
        courseId: activeChat.course._id,
        content: text,
      });
      loadMessages();
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-inter">
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-2xl bg-[#714B67] text-white shadow-2xl flex items-center justify-center relative border-2 border-white/20"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {chats.some((c) => c.unreadCount > 0) && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white text-[10px] font-black flex items-center justify-center">
            {chats.reduce((acc, c) => acc + c.unreadCount, 0)}
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[800px] h-[600px] bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(113,75,103,0.3)] border border-slate-100 flex overflow-hidden max-w-[90vw] max-h-[80vh]"
          >
            {/* Sidebar: Chat List */}
            <AnimatePresence initial={false}>
              {showSidebar && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 300 }}
                  exit={{ width: 0 }}
                  className="border-r border-slate-100 flex flex-col bg-slate-50/50"
                >
                  <div className="p-6 border-b border-slate-100 bg-white">
                    <h3 className="text-sm font-black text-slate-900 font-sora tracking-tight uppercase">
                      Messages
                    </h3>
                    <div className="mt-4 relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={14}
                      />
                      <input
                        type="text"
                        placeholder="Search chats..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-xs font-medium border-none focus:ring-2 focus:ring-[#714B67]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {chats.length === 0 && !loading && (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
                        <MessageSquare
                          size={40}
                          className="mb-4 text-slate-300"
                        />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          No active discussions
                        </p>
                      </div>
                    )}
                    {chats.map((chat) => (
                      <button
                        key={`${chat._id.user._id}-${chat._id.course._id}`}
                        onClick={() =>
                          setActiveChat({
                            user: chat._id.user,
                            course: chat._id.course,
                          })
                        }
                        className={`w-full p-4 rounded-2xl flex items-start gap-3 transition-all ${
                          activeChat?.user?._id === chat._id.user._id &&
                          activeChat?.course?._id === chat._id.course._id
                            ? "bg-[#714B67]/5 shadow-sm"
                            : "hover:bg-slate-100/50"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-200 flex-shrink-0 border border-white shadow-sm overflow-hidden">
                          {chat._id.user.profileImage ? (
                            <img
                              src={chat._id.user.profileImage}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                              <User size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs font-black text-slate-900 truncate">
                              {chat._id.user.name}
                            </p>
                            {chat.unreadCount > 0 && (
                              <span className="w-2 h-2 bg-[#017E84] rounded-full" />
                            )}
                          </div>
                          <p className="text-[10px] items-center text-[#714B67] font-black uppercase tracking-tighter truncate mb-1 opacity-70">
                            {chat._id.course.title}
                          </p>
                          <p
                            className={`text-[11px] truncate ${chat.unreadCount > 0 ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}`}
                          >
                            {chat.lastMessage.content}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
              {activeChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400"
                      >
                        <Sidebar size={18} />
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                          {activeChat.user.profileImage ? (
                            <img src={activeChat.user.profileImage} alt="" />
                          ) : (
                            <User className="p-2 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 truncate font-sora">
                            {activeChat.user.name}
                          </p>
                          <p className="text-[9px] font-black text-[#017E84] uppercase tracking-widest leading-none mt-1">
                            {activeChat.course.title}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400">
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  {/* Messages */}
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/30"
                  >
                    {messages.map((msg, i) => {
                      const isMe = msg.sender._id === user.id;
                      const showAvatar =
                        i === 0 ||
                        messages[i - 1].sender._id !== msg.sender._id;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex gap-3 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                          >
                            {!isMe && (
                              <div className="w-8 h-8 mt-auto rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                                {showAvatar ? (
                                  activeChat.user.profileImage ? (
                                    <img
                                      src={activeChat.user.profileImage}
                                      alt=""
                                    />
                                  ) : (
                                    <User
                                      className="p-1 text-slate-300"
                                      size={16}
                                    />
                                  )
                                ) : (
                                  <div className="p-1" />
                                )}
                              </div>
                            )}
                            <div className="space-y-1">
                              <div
                                className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                                  isMe
                                    ? "bg-[#714B67] text-white rounded-br-none"
                                    : "bg-white border border-slate-100 text-slate-700 rounded-bl-none"
                                }`}
                              >
                                {msg.content}
                              </div>
                              <div
                                className={`flex items-center gap-2 px-1 ${isMe ? "justify-end" : "justify-start"}`}
                              >
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                  {new Date(msg.createdAt).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                                {isMe && (
                                  <span className="text-slate-300">
                                    {msg.isRead ? (
                                      <CheckCheck
                                        size={12}
                                        className="text-[#017E84]"
                                      />
                                    ) : (
                                      <Check size={12} />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input */}
                  <div className="p-6 border-t border-slate-100 bg-white">
                    <form
                      onSubmit={handleSend}
                      className="flex items-center gap-3"
                    >
                      <button
                        type="button"
                        className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#714B67] transition-all"
                      >
                        <Paperclip size={18} />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="w-full h-12 pl-6 pr-12 bg-slate-100 rounded-2xl text-xs font-semibold border-none focus:ring-4 focus:ring-[#714B67]/10 transition-all font-inter"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-[#714B67] text-white flex items-center justify-center shadow-lg shadow-[#714B67]/20 disabled:opacity-50 transition-all"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
                  <div className="w-24 h-24 rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-slate-200 mb-8 border border-slate-50">
                    <MessageSquare size={48} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 font-sora mb-2">
                    Select a Conversation
                  </h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] max-w-xs leading-relaxed">
                    Collaborative learning portal active. <br /> Talk to your
                    instructors for guidance.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPortal;
