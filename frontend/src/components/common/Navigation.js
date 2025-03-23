import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navigation = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to={user ? "/" : "/login"}>
          PushIT
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {user && (
              isAdmin() ? (
                // Admin Navigation
                <>
                  <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
                  <Nav.Link as={Link} to="/projects">Projects</Nav.Link>
                  <Nav.Link as={Link} to="/users">Users</Nav.Link>
                  <Nav.Link as={Link} to="/deployments">Deployments</Nav.Link>
                </>
              ) : (
                // Technician Navigation
                <>
                  <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
                  <Nav.Link as={Link} to="/deployments">Deployments</Nav.Link>
                </>
              )
            )}
          </Nav>
          
          <Nav>
            {user ? (
              <>
                <Navbar.Text className="me-3">
                  Logged in as: <span className="text-light">{user.username}</span>
                  {isAdmin() && <span className="badge bg-warning text-dark ms-2">Admin</span>}
                </Navbar.Text>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;