// src/components/admin/Dashboard.js
import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Admin Dashboard</h1>
          <p className="text-muted">Welcome, {user?.username}!</p>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Welcome to PushIT Admin Panel</Card.Title>
              <Card.Text>
                This dashboard will display system metrics and deployment statistics in the future.
                Use the navigation menu above to access Projects and Deployments.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;