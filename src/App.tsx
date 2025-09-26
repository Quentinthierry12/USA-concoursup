import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ContestDetail } from './pages/admin/ContestDetail';
import { ModuleDetail } from './pages/admin/ModuleDetail';
import { ContestCorrection } from './pages/admin/ContestCorrection';
import { ContestLogin } from './pages/contest/ContestLogin';
import { ContestParticipation } from './pages/contest/ContestParticipation';
import { Results } from './pages/Results';
import { AgencyManagement } from './pages/admin/AgencyManagement';
import { AcademyAdminDashboard } from './pages/academy/admin/AcademyAdminDashboard';
import { AcademyAdminAcademies } from './pages/academy/admin/AcademyAdminAcademies';
import { AcademyAdminClasses } from './pages/academy/admin/AcademyAdminClasses';
import { AcademyAdminModules } from './pages/academy/admin/AcademyAdminModules';
import { AcademyAdminResources } from './pages/academy/admin/AcademyAdminResources';
import { AcademyAdminEvaluations } from './pages/academy/admin/AcademyAdminEvaluations';
import { AcademyAdminStudents } from './pages/academy/admin/AcademyAdminStudents';
import { StudentDashboard } from './pages/academy/student/StudentDashboard';
import { StudentContests } from './pages/academy/student/StudentContests';
import { AcademyAdminTeachers } from './pages/academy/admin/AcademyAdminTeachers';
import { TeacherDashboard } from './pages/academy/teacher/TeacherDashboard';
import { TeacherContests } from './pages/academy/teacher/TeacherContests';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/results" element={<Results />} />
              <Route path="/login" element={<Login />} />
              <Route path="/contest/:id" element={<ContestLogin />} />
              <Route path="/contest/:id/participate" element={<ContestParticipation />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute roles={['admin', 'responsable']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/contest/:id" 
                element={
                  <ProtectedRoute roles={['admin', 'responsable']}>
                    <ContestDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/contest/:id/correction" 
                element={
                  <ProtectedRoute roles={['admin', 'responsable']}>
                    <ContestCorrection />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/contest/:contestId/module/:moduleId" 
                element={
                  <ProtectedRoute roles={['admin', 'responsable']}>
                    <ModuleDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/agencies" 
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AgencyManagement />
                  </ProtectedRoute>
                } 
              />
              {/* Academy Admin */}
              <Route 
                path="/academy/admin" 
                element={
                  <ProtectedRoute roles={['admin','responsable']} academyRoles={['staff']}>
                    <AcademyAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/academy/admin/academies" 
                element={
                  <ProtectedRoute roles={['admin','responsable']} academyRoles={['staff']}>
                    <AcademyAdminAcademies />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/academy/admin/classes" 
                element={
                  <ProtectedRoute roles={['admin','responsable']} academyRoles={['staff']}>
                    <AcademyAdminClasses />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/academy/admin/modules" 
                element={
                  <ProtectedRoute roles={['admin','responsable']} academyRoles={['staff']}>
                    <AcademyAdminModules />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/academy/admin/resources" 
                element={
                  <ProtectedRoute roles={['admin','responsable']} academyRoles={['staff']}>
                    <AcademyAdminResources />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/academy/admin/evaluations" 
                element={
                  <ProtectedRoute roles={['admin','responsable']} academyRoles={['staff']}>
                    <AcademyAdminEvaluations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/academy/admin/students" 
                element={
                  <ProtectedRoute roles={['admin','responsable']} academyRoles={['staff']}>
                    <AcademyAdminStudents />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/academy/admin/teachers" 
                element={
                  <ProtectedRoute roles={['admin','responsable']} academyRoles={['staff']}>
                    <AcademyAdminTeachers />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/academy/student" 
                element={
                  <ProtectedRoute roles={['candidat']} academyRoles={['etudiant']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/academy/student/contests" 
                element={
                  <ProtectedRoute roles={['candidat']} academyRoles={['etudiant']}>
                    <StudentContests />
                  </ProtectedRoute>
                } 
              />
              <Route 
                 path="/academy/teacher/contests" 
                 element={
                   <ProtectedRoute
                     academyRoles={['prof']}
                   >
                     <TeacherContests />
                   </ProtectedRoute>
                 } 
               />
              <Route 
                path="/academy/teacher/evaluations" 
                element={
                  <ProtectedRoute academyRoles={['prof']}>
                    <AcademyAdminEvaluations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/academy/teacher" 
                element={
                  <ProtectedRoute academyRoles={['prof']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;