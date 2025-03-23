import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Form, Modal, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Field management
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [isRequired, setIsRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState('');
  const [addingField, setAddingField] = useState(false);
  
  // Deployment data
  const [deploymentCount, setDeploymentCount] = useState(0);
  
  // File upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const { data } = await axios.get(`http://localhost:8000/api/projects/${id}/`);
        setProject(data);
        
        // Fetch deployment count in a separate request
        try {
          const deploymentResponse = await axios.get(`http://localhost:8000/api/deployments/deployments/?project=${id}`);
          setDeploymentCount(deploymentResponse.data.length);
        } catch (error) {
          console.error('Error fetching deployments:', error);
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
        setError('Failed to load project details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectDetails();
  }, [id]);
  
  const handleAddField = async () => {
    if (!fieldName.trim()) {
      return;
    }
    
    setAddingField(true);
    
    try {
      // Parse options for dropdown fields
      let parsedOptions = null;
      if (fieldType === 'dropdown' && fieldOptions.trim()) {
        parsedOptions = fieldOptions.split(',').map(opt => opt.trim());
      }
      
      const { data } = await axios.post(`http://localhost:8000/api/projects/${id}/add_field/`, {
        name: fieldName,
        field_type: fieldType,
        is_required: isRequired,
        options: parsedOptions
      });
      
      // Update the project with the new field
      setProject(prev => ({
        ...prev,
        fields: [...prev.fields, data]
      }));
      
      // Reset form
      setFieldName('');
      setFieldType('text');
      setIsRequired(false);
      setFieldOptions('');
      setShowFieldModal(false);
    } catch (error) {
      console.error('Error adding field:', error);
      setError('Failed to add field. Please try again.');
    } finally {
      setAddingField(false);
    }
  };
  
  const handleRemoveField = async (fieldId) => {
    if (!window.confirm('Are you sure you want to remove this field? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:8000/api/projects/${id}/remove-field/${fieldId}/`);
      
      // Update project fields
      setProject(prev => ({
        ...prev,
        fields: prev.fields.filter(field => field.id !== fieldId)
      }));
    } catch (error) {
      console.error('Error removing field:', error);
      setError('Failed to remove field. Please try again.');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone and will delete all associated deployments.')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await axios.delete(`http://localhost:8000/api/projects/${id}/`);
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project. Please try again.');
      setLoading(false);
    }
  };

  const handleImportExcel = async () => {
    if (!uploadFile) {
      return;
    }
    
    setUploading(true);
    setUploadError('');
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    
    try {
      const { data } = await axios.post(
        `http://localhost:8000/api/projects/${id}/import_excel/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Refresh project data after successful import
      const projectResponse = await axios.get(`http://localhost:8000/api/projects/${id}/`);
      setProject(projectResponse.data);
      
      // Refresh deployment count
      // To this
      const deploymentResponse = await axios.get(`http://localhost:8000/api/deployments/deployments/?project=${id}`);
      setDeploymentCount(deploymentResponse.data.length);
      
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error importing Excel:', error);
      setUploadError(error.response?.data?.error || 'Failed to import Excel file. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDownloadTemplate = () => {
    window.location.href = `http://localhost:8000/api/projects/${id}/export_template/`;
  };

  
  
  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading project details...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button as={Link} to="/projects" variant="secondary">
          Back to Projects
        </Button>
      </Container>
    );
  }
  
  if (!project) {
    return (
      <Container className="my-5">
        <Alert variant="warning">Project not found</Alert>
        <Button as={Link} to="/projects" variant="secondary">
          Back to Projects
        </Button>
      </Container>
    );
  }
  
  // Field type options
  const fieldTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' }
  ];
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>{project.name}</h1>
          <p className="text-muted">
            Created on {new Date(project.created_date).toLocaleDateString()}
          </p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button variant="primary" as={Link} to={`/deployments/new?project=${id}`}>
            Add Deployment
          </Button>
          <Button variant="danger" onClick={handleDeleteProject}>
  Delete Project
</Button>
          <Button variant="outline-primary" onClick={() => setShowUploadModal(true)}>
            Import Excel
          </Button>
          <Button variant="outline-secondary" onClick={handleDownloadTemplate}>
            Download Template
          </Button>
        </Col>
      </Row>
      
      {project.description && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Body>
                <Card.Title>Description</Card.Title>
                <Card.Text>{project.description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Project Fields</h5>
              <Button variant="primary" size="sm" onClick={() => setShowFieldModal(true)}>
                Add Field
              </Button>
            </Card.Header>
            <Card.Body>
              {project.fields.length === 0 ? (
                <p className="text-muted">No fields defined yet. Add fields to structure your deployment data.</p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Field Name</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.fields.sort((a, b) => a.order - b.order).map((field, index) => (
                      <tr key={field.id}>
                        <td>{index + 1}</td>
                        <td>{field.name}</td>
                        <td>
                          {fieldTypeOptions.find(opt => opt.value === field.field_type)?.label || field.field_type}
                        </td>
                        <td>{field.is_required ? 'Yes' : 'No'}</td>
                        <td>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleRemoveField(field.id)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Deployments</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">{deploymentCount} Deployment(s)</h6>
                  <p className="text-muted mb-0">
                    {project.expected_count > 0 && 
                      `${Math.round((deploymentCount / project.expected_count) * 100)}% of expected (${project.expected_count})`
                    }
                  </p>
                </div>
                <div>
                  <Button as={Link} to={`/deployments?project=${id}`} variant="outline-primary">
                    View Deployments
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Add Field Modal */}
      <Modal show={showFieldModal} onHide={() => setShowFieldModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Field</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Field Name</Form.Label>
              <Form.Control
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="Enter field name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Field Type</Form.Label>
              <Form.Select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
              >
                {fieldTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Required Field"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
              />
            </Form.Group>
            
            {fieldType === 'dropdown' && (
              <Form.Group className="mb-3">
                <Form.Label>Dropdown Options</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={fieldOptions}
                  onChange={(e) => setFieldOptions(e.target.value)}
                  placeholder="Enter comma-separated options"
                />
                <Form.Text className="text-muted">
                  Enter options separated by commas (e.g. Option 1, Option 2, Option 3)
                </Form.Text>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFieldModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddField}
            disabled={!fieldName.trim() || addingField}
          >
            {addingField ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Adding...</span>
              </>
            ) : (
              'Add Field'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Excel Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Import Deployment Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {uploadError && <Alert variant="danger">{uploadError}</Alert>}
          
          <p>
            Upload an Excel file containing your deployment data. The file should have columns that match your project fields.
          </p>
          
          <Form.Group className="mb-3">
            <Form.Label>Excel File</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setUploadFile(e.target.files[0])}
              required
            />
            <Form.Text className="text-muted">
              Make sure your file has headers that match your project fields.
            </Form.Text>
          </Form.Group>
          
          <div className="d-grid gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={handleDownloadTemplate}
              className="mb-2"
            >
              Download Template First
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleImportExcel}
            disabled={!uploadFile || uploading}
          >
            {uploading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Importing...</span>
              </>
            ) : (
              'Import Data'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProjectDetail;