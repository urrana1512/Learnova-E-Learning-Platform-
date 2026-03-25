import { useState } from "react";
import LearnerSidebar from "./LearnerSidebar";
import ChatPortal from "../learner/ChatPortal";
import { motion } from "framer-motion";

const LearnerLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <LearnerSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />
      <main className="flex-1 overflow-y-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-full"
        >
          {children}
        </motion.div>
        <ChatPortal />
      </main>
    </div>
  );
};

export default LearnerLayout;
