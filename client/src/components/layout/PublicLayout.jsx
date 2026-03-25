import { useState, useEffect } from "react";
import LearnerNavbar from "./LearnerNavbar";
import { motion } from "framer-motion";

/**
 * PublicLayout — used for public-facing pages (Courses catalog, Course detail,
 * Network profiles, Checkout, etc.). Shows the original top navbar
 * so the site looks like a normal website when NOT inside the student dashboard.
 */
const PublicLayout = ({ children }) => {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-white transition-colors duration-300 dark:bg-slate-950">
      <LearnerNavbar isDark={isDark} toggleDark={() => setIsDark((v) => !v)} />
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default PublicLayout;
