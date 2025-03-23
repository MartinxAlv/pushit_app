// src/components/dashboard/TechnicianDashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard data
  const [assignedDeployments, setAssignedDeployments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Find the technician record for the current user
        const techResponse = await axios.get('http://localhost:8000/api/deployments/technicians/');
        const currentTech = techResponse.data.find(tech => tech.username === user.username);
        
        if (!currentTech) {
          setError('Your technician profile is not set up. Please contact an administrator.');
          setLoading(false);
          return;
        }
        
        // Get deployments assigned to this technician
        const deploymentsResponse = await axios.get(
          `http://localhost:8000/api/deployments/deployments/?technician=${currentTech.id}`
        );
        
        const deployments = deploymentsResponse.data;
        setAssignedDeployments(deployments);
        
        // Calculate stats
        const total = deployments.length;
        const pending = deployments.filter(d => d.status_name === 'Pending').length;
        const inProgress = deployments.filter(d => d.status_name === 'In Progress').length;
        const completed = deployments.filter(d => d.status_name === 'Completed').length;
        
        setStats({
          total,
          pending,
          inProgress,
          completed
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  const getStatusBadgeVariant = (statusName) => {
    const statusMap = {
      'Pending': 'warning',
      'In Progress': 'primary',
      'Completed': 'success',
      'Cancelled': 'danger',
      'On Hold': 'secondary'
    };
    
    return statusMap[statusName] || 'info';
  };
  
  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading dashboard...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Technician Dashboard</h1>
          <p className="text-muted">Welcome, {user?.username}!</p>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h2>{stats.total}</h2>
              <p className="text-muted mb-0">Total Assignments</p>
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/deployments" variant="outline-primary" size="sm">
                View All
              </Button>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-warning bg-opacity-10">
            <Card.Body>
              <h2>{stats.pending}</h2>
              <p className="text-muted mb-0">Pending</p>
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/deployments?status=1" variant="outline-warning" size="sm">
                View Pending
              </Button>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-primary bg-opacity-10">
            <Card.Body>
              <h2>{stats.inProgress}</h2>
              <p className="text-muted mb-0">In Progress</p>
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/deployments?status=2" variant="outline-primary" size="sm">
                View In Progress
              </Button>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-success bg-opacity-10">
            <Card.Body>
              <h2>{stats.completed}</h2>
              <p className="text-muted mb-0">Completed</p>
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/deployments?status=4" variant="outline-success" size="sm">
                View Completed
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recent Assignments</h5>
            </Card.Header>
            <Card.Body>
              {assignedDeployments.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No deployments assigned to you yet.</p>
                  <Button as={Link} to="/deployments" variant="primary">
                    View All Deployments
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Project</th>
                        <th>User</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedDeployments.slice(0, 5).map(deployment => (
                        <tr key={deployment.id}>
                          <td>{deployment.deployment_id}</td>
                          <td>{deployment.project_name}</td>
                          <td>{deployment.assigned_to}</td>
                          <td>
                            <Badge bg={getStatusBadgeVariant(deployment.status_name)}>
                              {deployment.status_name}
                            </Badge>
                          </td>
                          <td>
                            {deployment.deployment_date ? 
                              new Date(deployment.deployment_date).toLocaleDateString() : 
                              'Not scheduled'}
                          </td>
                          <td>
                            <Button 
                              as={Link} 
                              to={`/deployments/${deployment.id}`}
                              variant="outline-primary"
                              size="sm"
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  {assignedDeployments.length > 5 && (
                    <div className="text-center mt-3">
                      <Button as={Link} to="/deployments" variant="outline-primary">
                        View All Assignments
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button as={Link} to="/deployments?status=1" variant="outline-primary">
                  View Pending Deployments
                </Button>
                <Button as={Link} to="/deployments?status=2" variant="outline-primary">
                  View In-Progress Deployments
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Resources</h5>
            </Card.Header>
            <Card.Body>
              <p>Access helpful resources for technicians:</p>
              <ul>
                <li>Deployment procedures and checklists</li>
                <li>Hardware inventory system</li>
                <li>IT knowledge base</li>
              </ul>
              <p className="text-muted">
                <small>Contact your administrator to add more resources to this section.</small>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TechnicianDashboard;