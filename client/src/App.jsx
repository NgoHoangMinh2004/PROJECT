import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import ClientLayout from './layouts/ClientLayout';

// Admin Pages
import Dashboard from './pages/Dashboard';
import CoursesPage from './pages/CoursesPage';
import UserPage from './pages/UserPage';
import LessonPage from './pages/LessonPage';
import DifficultyPage from './pages/DifficultyPage';
import ExercisePage from './pages/ExercisePage';
import ProgressPage from './pages/ProgressPage';
import TestPage from './pages/TestPage';

// Client Pages
import LearningPath from './client-page/LearningPath';
import LoginPage from './client-page/LoginPage';
import RegisterPage from './client-page/RegisterPage';
import OnboardingPage from "./client-page/OnboardingPage";
import CurriculumPage from './client-page/CurriculumPage';
import LessonDetailPage from './client-page/LessonDetailPage';
import ProfilePage from './client-page/ProfilePage';
import LessonTestPage from './client-page/LessonTestPage';

// AI Components
import AIChatWidget from './components/AIChatWidget';
// import MingWakeUp from './components/MingWakeUp';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {

  return (
    <BrowserRouter>


      {/* Giao diện Chat AI */}
      <AIChatWidget />

      <Routes>
        {/* --- 1. PUBLIC ROUTES --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* --- 2. CLIENT ROUTES --- */}
        <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
        <Route path="/lesson/:lessonId" element={<PrivateRoute><LessonDetailPage /></PrivateRoute>} />
        <Route path="/test/:testId" element={<PrivateRoute><LessonTestPage /></PrivateRoute>} />

        <Route path="/" element={<PrivateRoute><ClientLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/learn" />} />
          <Route path="learn" element={<LearningPath />} />
          <Route path="curriculum" element={<CurriculumPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* --- 3. ADMIN ROUTES --- */}
        <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="users" element={<UserPage />} />
          <Route path="lessons" element={<LessonPage />} />
          <Route path="difficulties" element={<DifficultyPage />} />
          <Route path="exercises" element={<ExercisePage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="test" element={<TestPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;