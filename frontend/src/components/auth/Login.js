import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the page the user was trying to access or default to dashboard
  const from = location.state?.from || '/dashboard';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        const response = await axios.post('http://localhost:8000/api/accounts/login/', {
          username,
          password
        });
        
        // Store auth token and user info
        const userData = {
          id: response.data.user_id,
          username: response.data.username,
          isAdmin: response.data.is_admin,
          email: response.data.email || ''
        };
        
        // Use the auth context login function
        login(userData, response.data.token);
        
        // Redirect
        navigate(from);
      } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container className="py-5">
      <div className="d-flex justify-content-center">
        <Card style={{ width: '400px' }}>
          <Card.Header className="text-center bg-primary text-white">
            <h4>PushIT Login</h4>
          </Card.Header>
          <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>
              
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Logging in...</span>
                  </>
                ) : (
                  'Log In'
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Login;