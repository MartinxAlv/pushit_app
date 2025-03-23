import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import ProjectList from './components/projects/ProjectList';
import ProjectForm from './components/projects/ProjectForm';
import ProjectDetail from './components/projects/ProjectDetail';
import Navigation from './components/common/Navigation';
import DeploymentForm from './components/deployments/DeploymentForm';
import DeploymentList from './components/deployments/DeploymentList';
import DeploymentDetail from './components/deployments/DeploymentDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <div className="py-4">
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Home route */}
            <Route path="/" element={<ProjectList />} />
            
            {/* Project routes */}
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/new" element={
              <ProtectedRoute requireAdmin={true}>
                <ProjectForm />
              </ProtectedRoute>
            } />
            <Route path="/projects/:id" element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            } />
            
            {/* Deployment routes */}
            <Route path="/deployments" element={
              <ProtectedRoute>
                <DeploymentList />
              </ProtectedRoute>
            } />
            <Route path="/deployments/new" element={
              <ProtectedRoute>
                <DeploymentForm />
              </ProtectedRoute>
            } />
            <Route path="/deployments/:id" element={
              <ProtectedRoute>
                <DeploymentDetail />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;