import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProjectForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expectedCount, setExpectedCount] = useState(0);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { data } = await axios.post('http://localhost:8000/api/projects/', {
        name,
        description,
        expected_count: expectedCount
      });
      
      navigate(`/projects/${data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      // Add error handling here
    }
  };
  
  return (
    <Container>
      <h1>Create New Project</h1>
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Project Name</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Expected Number of Deployments</Form.Label>
          <Form.Control
            type="number"
            value={expectedCount}
            onChange={(e) => setExpectedCount(parseInt(e.target.value) || 0)}
          />
        </Form.Group>
        
        <Button variant="primary" type="submit">
          Create Project
        </Button>
      </Form>
    </Container>
  );
};

export default ProjectForm;