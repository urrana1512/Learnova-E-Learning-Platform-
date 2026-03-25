import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import { LoadingScreen } from "./components/ui/Spinner";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Instructor Pages
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import CoursesDashboard from "./pages/instructor/CoursesDashboard";
import CourseForm from "./pages/instructor/CourseForm";
import QuizBuilder from "./pages/instructor/QuizBuilder";
import InstructorRevenue from "./pages/instructor/InstructorRevenue";
import CourseAttendees from "./pages/instructor/CourseAttendees";
import InstructorSocial from "./pages/instructor/InstructorSocial";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import PlatformReporting from "./pages/admin/PlatformReporting";

// Learner Pages
import CoursesPage from "./pages/learner/CoursesPage";
import MyCourses from "./pages/learner/MyCourses";
import StudentDashboard from "./pages/learner/StudentDashboard";
import CourseDetail from "./pages/learner/CourseDetail";
import LessonPlayer from "./pages/learner/LessonPlayer";
import QuizPlayerPage from "./pages/learner/QuizPlayer";
import NetworkProfile from "./pages/learner/NetworkProfile";
import Checkout from "./pages/learner/Checkout";
import PaymentSuccess from "./pages/learner/PaymentSuccess";
import MobileGateway from "./pages/learner/MobileGateway";
import Leaderboard from "./pages/learner/Leaderboard";
import Notifications from "./pages/learner/Notifications";
import ChatPage from "./pages/learner/ChatPage";
import FollowersManager from "./pages/instructor/FollowersManager";
import SocialHub from "./pages/learner/SocialHub";
import NetworkManager from "./pages/learner/NetworkManager";

const ProtectedRoute = ({ roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/courses" replace />;
  return <Outlet />;
};

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.99, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 1.01, y: -10 }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    className="min-h-screen"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user, loading } = useAuth(); // Access user and loading from AuthContext

  if (loading) return <LoadingScreen />; // Handle loading state for the entire app

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route
          path="/"
          element={
            user ? (
              user.role === "ADMIN" ? (
                <Navigate to="/admin/dashboard" replace />
              ) : user.role === "INSTRUCTOR" ? (
                <Navigate to="/instructor/dashboard" replace />
              ) : (
                <Navigate to="/learner/dashboard" replace />
              )
            ) : (
              <Navigate to="/learner/catalog" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            <PageWrapper>
              <Login />
            </PageWrapper>
          }
        />
        <Route
          path="/register"
          element={
            <PageWrapper>
              <Register />
            </PageWrapper>
          }
        />

        {/* Learner Namespace */}
        <Route element={<ProtectedRoute roles={["LEARNER", "INSTRUCTOR", "ADMIN"]} />}>
          <Route path="/learner/dashboard" element={<PageWrapper><StudentDashboard /></PageWrapper>} />
          <Route path="/learner/my-learning" element={<PageWrapper><MyCourses /></PageWrapper>} />
          <Route path="/learner/catalog" element={<PageWrapper><CoursesPage /></PageWrapper>} />
          <Route path="/learner/social-hub" element={<PageWrapper><SocialHub /></PageWrapper>} />
          <Route path="/learner/network" element={<PageWrapper><NetworkManager /></PageWrapper>} />
          <Route path="/learner/leaderboard" element={<PageWrapper><Leaderboard /></PageWrapper>} />
          <Route path="/learner/notifications" element={<PageWrapper><Notifications /></PageWrapper>} />
          <Route path="/learner/messages" element={<PageWrapper><ChatPage /></PageWrapper>} />
          <Route path="/learner/profile/:id" element={<PageWrapper><NetworkProfile /></PageWrapper>} />
          
          {/* Course Specifics */}
          <Route path="/learner/courses/:id" element={<PageWrapper><CourseDetail /></PageWrapper>} />
          <Route path="/learner/courses/:id/learn/:lessonId" element={<LessonPlayer />} />
          <Route path="/learner/courses/:id/quiz/:quizId" element={<PageWrapper><QuizPlayerPage /></PageWrapper>} />
          <Route path="/learner/checkout/:id" element={<PageWrapper><Checkout /></PageWrapper>} />
          <Route path="/learner/payment/success" element={<PageWrapper><PaymentSuccess /></PageWrapper>} />
          <Route path="/learner/payment/mobile" element={<MobileGateway />} />
        </Route>

        {/* Instructor Namespace */}
        <Route element={<ProtectedRoute roles={["INSTRUCTOR", "ADMIN"]} />}>
          <Route path="/instructor/dashboard" element={<PageWrapper><InstructorDashboard /></PageWrapper>} />
          <Route path="/instructor/curriculum" element={<PageWrapper><CoursesDashboard /></PageWrapper>} />
          <Route path="/instructor/curriculum/:id/edit" element={<PageWrapper><CourseForm /></PageWrapper>} />
          <Route path="/instructor/curriculum/:id/attendees" element={<PageWrapper><CourseAttendees /></PageWrapper>} />
          <Route path="/instructor/curriculum/:id/quiz/:quizId" element={<PageWrapper><QuizBuilder /></PageWrapper>} />
          <Route path="/instructor/revenue" element={<PageWrapper><InstructorRevenue /></PageWrapper>} />
          <Route path="/instructor/analytics" element={<PageWrapper><PlatformReporting /></PageWrapper>} />
          <Route path="/instructor/social" element={<PageWrapper><InstructorSocial /></PageWrapper>} />
          <Route path="/instructor/audience" element={<PageWrapper><FollowersManager /></PageWrapper>} />
          <Route path="/instructor/messages" element={<PageWrapper><ChatPage /></PageWrapper>} />
          <Route path="/instructor/notifications" element={<PageWrapper><Notifications /></PageWrapper>} />
          <Route path="/instructor/profile/:id" element={<PageWrapper><NetworkProfile /></PageWrapper>} />
        </Route>

        {/* Admin Namespace */}
        <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
          <Route path="/admin/dashboard" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
          <Route path="/admin/users" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
          <Route path="/admin/user-management" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
          <Route path="/admin/course-management" element={<PageWrapper><CoursesDashboard /></PageWrapper>} />
          <Route path="/admin/analytics" element={<PageWrapper><PlatformReporting /></PageWrapper>} />
          <Route path="/admin/messages" element={<PageWrapper><ChatPage /></PageWrapper>} />
          <Route path="/admin/notifications" element={<PageWrapper><Notifications /></PageWrapper>} />
        </Route>

        {/* Compatibility & Fallbacks */}
        <Route path="/courses" element={<Navigate to="/learner/catalog" replace />} />
        <Route path="/dashboard" element={<Navigate to="/learner/dashboard" replace />} />
        <Route path="/chat" element={<Navigate to="/learner/messages" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
};

export default App;
