import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const DeploymentForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(!!id);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [deploymentId, setDeploymentId] = useState('');
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [currentModel, setCurrentModel] = useState('');
  const [currentSn, setCurrentSn] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newSn, setNewSn] = useState('');
  const [technician, setTechnician] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [deploymentDate, setDeploymentDate] = useState('');
  
  // Reference data
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  
  // Custom fields
  const [customFields, setCustomFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        // Fetch projects, statuses, departments, and technicians in parallel
        const [
          projectsResponse, 
          statusesResponse, 
          departmentsResponse, 
          techniciansResponse
        ] = await Promise.all([
          axios.get('http://localhost:8000/api/projects/'),
          axios.get('http://localhost:8000/api/deployments/statuses/'),
          axios.get('http://localhost:8000/api/deployments/departments/'),
          axios.get('http://localhost:8000/api/deployments/technicians/')
        ]);
        
        setProjects(projectsResponse.data);
        setStatuses(statusesResponse.data);
        setDepartments(departmentsResponse.data);
        setTechnicians(techniciansResponse.data);
        
        // Set default values for new deployment
        if (!isEditing) {
          // Default status (first one)
          if (statusesResponse.data.length > 0) {
            setStatus(statusesResponse.data[0].id);
          }
          
          // If project ID is provided in URL, set it
          if (projectId) {
            setProject(projectId);
            
            // Fetch project fields
            try {
              const projectResponse = await axios.get(`http://localhost:8000/api/projects/${projectId}/`);
              if (projectResponse.data.fields) {
                setCustomFields(projectResponse.data.fields);
              }
            } catch (error) {
              console.error('Error fetching project fields:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching reference data:', error);
        setError('Failed to load reference data');
      } finally {
        if (!isEditing) {
          setLoading(false);
        }
      }
    };
    
    const fetchDeploymentData = async () => {
      if (isEditing && id) {
        try {
          const { data } = await axios.get(`http://localhost:8000/api/deployments/deployments/${id}/`);
          
          // Set form data
          setDeploymentId(data.deployment_id);
          setProject(data.project);
          setStatus(data.status);
          setAssignedTo(data.assigned_to || '');
          setPosition(data.position || '');
          setDepartment(data.department || '');
          setLocation(data.location || '');
          setCurrentModel(data.current_model || '');
          setCurrentSn(data.current_sn || '');
          setNewModel(data.new_model || '');
          setNewSn(data.new_sn || '');
          setTechnician(data.technician || '');
          setTechnicianNotes(data.technician_notes || '');
          
          if (data.deployment_date) {
            // Format date as YYYY-MM-DD for input field
            const date = new Date(data.deployment_date);
            setDeploymentDate(date.toISOString().split('T')[0]);
          }
          
          // Fetch project fields
          try {
            const projectResponse = await axios.get(`http://localhost:8000/api/projects/${data.project}/`);
            if (projectResponse.data.fields) {
              setCustomFields(projectResponse.data.fields);
            }
          } catch (error) {
            console.error('Error fetching project fields:', error);
          }
          
          // Set custom field values
          const values = {};
          data.fields.forEach(field => {
            values[field.field] = field.value;
          });
          setFieldValues(values);
          
        } catch (error) {
          console.error('Error fetching deployment:', error);
          setError('Failed to load deployment data');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchReferenceData();
    if (isEditing) {
      fetchDeploymentData();
    }
  }, [id, isEditing, projectId]);
  
  const handleCustomFieldChange = (fieldId, value) => {
    setFieldValues({
      ...fieldValues,
      [fieldId]: value
    });
  };
  
  const handleProjectChange = async (selectedProjectId) => {
    setProject(selectedProjectId);
    
    if (selectedProjectId) {
      try {
        const { data } = await axios.get(`http://localhost:8000/api/projects/${selectedProjectId}/`);
        if (data.fields) {
          setCustomFields(data.fields);
          
          // Reset field values when project changes
          setFieldValues({});
        }
      } catch (error) {
        console.error('Error fetching project fields:', error);
      }
    } else {
      setCustomFields([]);
      setFieldValues({});
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!project) {
      setError('Please select a project');
      return;
    }
    
    if (!status) {
      setError('Please select a status');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    const formData = {
      project,
      status,
      assigned_to: assignedTo,
      position,
      department: department || null,
      location,
      current_model: currentModel,
      current_sn: currentSn,
      new_model: newModel,
      new_sn: newSn,
      technician: technician || null,
      technician_notes: technicianNotes,
      deployment_date: deploymentDate || null,
      custom_fields: fieldValues
    };
    
    // For new deployments, add deployment_id if provided
    if (!isEditing && deploymentId) {
      formData.deployment_id = deploymentId;
    }
    
    try {
      let response;
      
      if (isEditing) {
        response = await axios.put(
          `http://localhost:8000/api/deployments/deployments/${id}/`, 
          formData
        );
      } else {
        response = await axios.post(
          'http://localhost:8000/api/deployments/deployments/', 
          formData
        );
      }
      
      // Navigate to deployment details
      navigate(`/deployments/${response.data.id}`);
    } catch (error) {
      console.error('Error saving deployment:', error);
      setError('Failed to save deployment. Please check your inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading...</p>
      </Container>
    );
  }
  
  return (
    <Container>
      <h1>{isEditing ? 'Edit Deployment' : 'Create New Deployment'}</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Header>Basic Information</Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Project *</Form.Label>
                  <Form.Select
                    value={project || ''}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    required
                    disabled={isEditing}
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    value={status || ''}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    <option value="">Select Status</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            {!isEditing && (
              <Form.Group className="mb-3">
                <Form.Label>Deployment ID (Optional - will be auto-generated if empty)</Form.Label>
                <Form.Control
                  type="text"
                  value={deploymentId}
                  onChange={(e) => setDeploymentId(e.target.value)}
                  placeholder="E.g., DEP-001"
                />
              </Form.Group>
            )}
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assigned To</Form.Label>
                  <Form.Control
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="Person's name"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Position</Form.Label>
                  <Form.Control
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Person's job title"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    value={department || ''}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Office, building, etc."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        <Card className="mb-4">
          <Card.Header>Device Information</Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Model</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentModel}
                    onChange={(e) => setCurrentModel(e.target.value)}
                    placeholder="Current device model"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Serial Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentSn}
                    onChange={(e) => setCurrentSn(e.target.value)}
                    placeholder="Current device SN"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>New Model</Form.Label>
                  <Form.Control
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="New device model"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>New Serial Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={newSn}
                    onChange={(e) => setNewSn(e.target.value)}
                    placeholder="New device SN"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {customFields.length > 0 && (
          <Card className="mb-4">
            <Card.Header>Custom Fields</Card.Header>
            <Card.Body>
              <Row>
                {customFields.map(field => (
                  <Col md={6} key={field.id} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        {field.name} {field.is_required && <span className="text-danger">*</span>}
                      </Form.Label>
                      
                      {field.field_type === 'text' && (
                        <Form.Control
                          type="text"
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          required={field.is_required}
                        />
                      )}
                      
                      {field.field_type === 'number' && (
                        <Form.Control
                          type="number"
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          required={field.is_required}
                        />
                      )}
                      
                      {field.field_type === 'date' && (
                        <Form.Control
                          type="date"
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          required={field.is_required}
                        />
                      )}
                      
                      {field.field_type === 'dropdown' && (
                        <Form.Select
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          required={field.is_required}
                        >
                          <option value="">Select Option</option>
                          {field.options && field.options.map((option, index) => (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          ))}
                        </Form.Select>
                      )}
                      
                      {field.field_type === 'checkbox' && (
                        <Form.Check
                          type="checkbox"
                          label={field.name}
                          checked={fieldValues[field.id] === 'true'}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.checked ? 'true' : 'false')}
                        />
                      )}
                    </Form.Group>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        )}
        
        <Card className="mb-4">
          <Card.Header>Assignment & Scheduling</Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Technician</Form.Label>
                  <Form.Select
                    value={technician || ''}
                    onChange={(e) => setTechnician(e.target.value)}
                  >
                    <option value="">Select Technician</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Deployment Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={deploymentDate}
                    onChange={(e) => setDeploymentDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Technician Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                placeholder="Additional notes or instructions"
              />
            </Form.Group>
          </Card.Body>
        </Card>
        
        <div className="d-flex justify-content-between mb-5">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Saving...</span>
              </>
            ) : (
              isEditing ? 'Update Deployment' : 'Create Deployment'
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default DeploymentForm;