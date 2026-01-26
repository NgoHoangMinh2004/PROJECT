import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import ClientLayout from './layouts/ClientLayout';
import Dashboard from './pages/Dashboard';
import CoursesPage from './pages/CoursesPage';
import UserPage from './pages/UserPage';
import LessonPage from './pages/LessonPage';
import DifficultyPage from './pages/DifficultyPage';
import ExercisePage from './pages/ExercisePage';
import ProgressPage from './pages/ProgressPage';
import TestPage from './pages/TestPage';
import LearningPath from './client-page/LearningPath';
import LoginPage from './client-page/LoginPage';
import RegisterPage from './client-page/RegisterPage';
import OnboardingPage from "./client-page/OnboardingPage";
import CurriculumPage from './client-page/CurriculumPage';
import LessonDetailPage from './client-page/LessonDetailPage';
import ProfilePage from './client-page/ProfilePage';
import LessonTestPage from './client-page/LessonTestPage'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
        <Route path="/lesson/:lessonId" element={<PrivateRoute><LessonDetailPage /></PrivateRoute>} />

        <Route path="profile" element={<ProfilePage />} />

        <Route path="/" element={<PrivateRoute><ClientLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/learn" />} />
          <Route path="learn" element={<LearningPath />} />
          <Route path="curriculum" element={<CurriculumPage />} />
          <Route path="lesson/:lessonId" element={<LessonDetailPage />} />
          {/*Router bai kiem tra*/}
          <Route path="/test/:testId" element={<LessonTestPage />} />
        </Route>


        {/* ADMIN ROUTES */}
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
      </Routes >
    </BrowserRouter >
  );
}

export default App;