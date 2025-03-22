import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import ProjectList from './components/projects/ProjectList';
import ProjectForm from './components/projects/ProjectForm';
import ProjectDetail from './components/projects/ProjectDetail';
import Navigation from './components/common/Navigation';
import DeploymentForm from './components/deployments/DeploymentForm';
import DeploymentList from './components/deployments/DeploymentList';
import DeploymentDetail from './components/deployments/DeploymentDetail';

function App() {
  return (
    <Router>
      <Navigation />
      <div className="py-4">
        <Routes>
          {/* Home route */}
          <Route path="/" element={<ProjectList />} />
          
          {/* Project routes */}
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/new" element={<ProjectForm />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          
          {/* Deployment routes */}
          <Route path="/deployments" element={<DeploymentList />} />
          <Route path="/deployments/new" element={<DeploymentForm />} />
          <Route path="/deployments/:id" element={<DeploymentDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;