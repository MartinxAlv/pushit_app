import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Dashboard</h1>
          <p className="text-muted">
            Welcome, {user ? user.username : 'Guest'}!
          </p>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Welcome to PushIT</h5>
            </Card.Header>
            <Card.Body>
              <p>This is your deployment management dashboard. From here you can:</p>
              <ul>
                <li>Manage your deployment projects</li>
                <li>Track deployment status</li>
                <li>Assign technicians to deployments</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;