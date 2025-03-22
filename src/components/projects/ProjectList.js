import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await axios.get('http://localhost:8000/api/projects/');
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  if (loading) return <div>Loading projects...</div>;
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Projects</h1>
        </Col>
        <Col xs="auto">
          <Button as={Link} to="/projects/new" variant="primary">
            Create New Project
          </Button>
        </Col>
      </Row>
      
      <Row>
        {projects.length === 0 ? (
          <Col>
            <p>No projects found. Create your first project to get started!</p>
          </Col>
        ) : (
          projects.map(project => (
            <Col md={4} key={project.id} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>{project.name}</Card.Title>
                  <Card.Text>{project.description}</Card.Text>
                  <Button as={Link} to={`/projects/${project.id}`} variant="outline-primary">
                    View Project
                  </Button>
                </Card.Body>
                <Card.Footer>
                  <small className="text-muted">Created: {new Date(project.created_date).toLocaleDateString()}</small>
                </Card.Footer>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default ProjectList;