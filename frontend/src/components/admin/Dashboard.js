// src/components/admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    deployments: 0,
    users: 0,
    pendingDeployments: 0
  });
  
  useEffect(() => {
    // Fetch dashboard statistics
    const fetchStats = async () => {
      try {
        // In a real application, you might have a dedicated endpoint for these stats
        // For now, we'll just get the counts from the list endpoints
        const [projects, deployments, users] = await Promise.all([
          axios.get('http://localhost:8000/api/projects/'),
          axios.get('http://localhost:8000/api/deployments/deployments/'),
          axios.get('http://localhost:8000/api/accounts/users/')
        ]);
        
        // Calculate pending deployments (this is a simplified example)
        const pending = deployments.data.filter(d => d.status_name === 'Pending' || d.status_name === 'In Progress').length;
        
        setStats({
          projects: projects.data.length,
          deployments: deployments.data.length,
          users: users.data.length,
          pendingDeployments: pending
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    
    fetchStats();
  }, []);
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Admin Dashboard</h1>
          <p className="text-muted">Welcome, {user?.username}!</p>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h2>{stats.projects}</h2>
              <p className="text-muted mb-0">Projects</p>
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/projects" variant="outline-primary" size="sm">
                Manage Projects
              </Button>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h2>{stats.deployments}</h2>
              <p className="text-muted mb-0">Total Deployments</p>
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/deployments" variant="outline-primary" size="sm">
                View Deployments
              </Button>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h2>{stats.pendingDeployments}</h2>
              <p className="text-muted mb-0">Pending Deployments</p>
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/deployments" variant="outline-primary" size="sm">
                View Pending
              </Button>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h2>{stats.users}</h2>
              <p className="text-muted mb-0">Users</p>
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/users" variant="outline-primary" size="sm">
                Manage Users
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Recent Activity</h5>
            </Card.Header>
            <Card.Body>
              <p>This dashboard will display recent deployment activities and system notifications in the future.</p>
              <p>Use the navigation menu or cards above to access different sections of the admin panel.</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button as={Link} to="/projects/new" variant="outline-primary">
                  Create New Project
                </Button>
                <Button as={Link} to="/users" variant="outline-primary">
                  Manage User Accounts
                </Button>
                <Button as={Link} to="/deployments" variant="outline-primary">
                  View All Deployments
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;