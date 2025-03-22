import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Form, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ExcelUploader from './ExcelUploader';

const DeploymentList = () => {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('project');
  
  const [deployments, setDeployments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  
  const [selectedProject, setSelectedProject] = useState(initialProjectId || '');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        // Fetch reference data in parallel
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
        
        // If a project ID is specified, get the project details
        if (selectedProject) {
          try {
            const { data } = await axios.get(`http://localhost:8000/api/projects/${selectedProject}/`);
            setCurrentProject(data);
          } catch (error) {
            console.error('Error fetching project details:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching reference data:', error);
        setError('Failed to load reference data');
      }
    };
    
    fetchReferenceData();
  }, [selectedProject]);
  
  useEffect(() => {
    const fetchDeployments = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Build query params
        let url = 'http://localhost:8000/api/deployments/deployments/';
        const params = new URLSearchParams();
        
        if (selectedProject) {
          params.append('project', selectedProject);
        }
        
        if (selectedStatus) {
          params.append('status', selectedStatus);
        }
        
        if (selectedDepartment) {
          params.append('department', selectedDepartment);
        }
        
        if (selectedTechnician) {
          params.append('technician', selectedTechnician);
        }
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
        
        const { data } = await axios.get(url);
        setDeployments(data);
      } catch (error) {
        console.error('Error fetching deployments:', error);
        setError('Failed to load deployments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeployments();
  }, [selectedProject, selectedStatus, selectedDepartment, selectedTechnician]);
  
  const handleUploadSuccess = async () => {
    // Refresh the deployments list
    try {
      let url = 'http://localhost:8000/api/deployments/deployments/';
      if (selectedProject) {
        url += `?project=${selectedProject}`;
      }
      
      const { data } = await axios.get(url);
      setDeployments(data);
      setShowUploader(false);
    } catch (error) {
      console.error('Error refreshing deployments:', error);
    }
  };
  
  const handleExportExcel = () => {
    if (!selectedProject) {
      setError('Please select a project to export');
      return;
    }
    
    window.location.href = `http://localhost:8000/api/deployments/deployments/export_excel/?project=${selectedProject}`;
  };
  
  // Filter deployments by search term
  const filteredDeployments = deployments.filter(deployment => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      deployment.deployment_id.toLowerCase().includes(term) ||
      deployment.assigned_to?.toLowerCase().includes(term) ||
      deployment.position?.toLowerCase().includes(term) ||
      deployment.location?.toLowerCase().includes(term) ||
      deployment.current_model?.toLowerCase().includes(term) ||
      deployment.current_sn?.toLowerCase().includes(term) ||
      deployment.new_model?.toLowerCase().includes(term) ||
      deployment.new_sn?.toLowerCase().includes(term)
    );
  });
  
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
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>
            Deployments
            {currentProject && (
              <span className="text-muted fs-4 ms-2">
                for {currentProject.name}
              </span>
            )}
          </h1>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button 
            as={Link} 
            to={selectedProject ? `/deployments/new?project=${selectedProject}` : '/deployments/new'}
            variant="primary"
          >
            Add Deployment
          </Button>
          
          {selectedProject && (
            <>
              <Button 
                variant="outline-primary"
                onClick={() => setShowUploader(!showUploader)}
              >
                {showUploader ? 'Hide Excel Uploader' : 'Import Excel'}
              </Button>
              
              <Button 
                variant="outline-secondary"
                onClick={handleExportExcel}
              >
                Export Excel
              </Button>
            </>
          )}
        </Col>
      </Row>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {showUploader && selectedProject && (
        <Row className="mb-4">
          <Col>
            <ExcelUploader 
              projectId={selectedProject} 
              onUploadSuccess={handleUploadSuccess} 
            />
          </Col>
        </Row>
      )}
      
      <Card className="mb-4">
        <Card.Header>Filters</Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Project</Form.Label>
                <Form.Select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Department</Form.Label>
                <Form.Select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Technician</Form.Label>
                <Form.Select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                >
                  <option value="">All Technicians</option>
                  {technicians.map(technician => (
                    <option key={technician.id} value={technician.id}>
                      {technician.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by ID, name, location, model, etc."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading deployments...</p>
        </div>
      ) : (
        <>
          <Card>
            <Card.Body>
              <div className="table-responsive">
                {filteredDeployments.length === 0 ? (
                  <div className="text-center my-4">
                    <p>No deployments found matching your criteria.</p>
                    <Button 
                      as={Link} 
                      to={selectedProject ? `/deployments/new?project=${selectedProject}` : '/deployments/new'}
                      variant="primary"
                    >
                      Create First Deployment
                    </Button>
                  </div>
                ) : (
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Status</th>
                        <th>User</th>
                        <th>Department</th>
                        <th>Current Device</th>
                        <th>New Device</th>
                        <th>Technician</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeployments.map(deployment => (
                        <tr key={deployment.id}>
                          <td>{deployment.deployment_id}</td>
                          <td>
                            <Badge bg={getStatusBadgeVariant(deployment.status_name)}>
                              {deployment.status_name}
                            </Badge>
                          </td>
                          <td>
                            <div>{deployment.assigned_to}</div>
                            <small className="text-muted">{deployment.position}</small>
                          </td>
                          <td>{deployment.department_name}</td>
                          <td>
                            <div>{deployment.current_model}</div>
                            <small className="text-muted">SN: {deployment.current_sn}</small>
                          </td>
                          <td>
                            <div>{deployment.new_model}</div>
                            <small className="text-muted">SN: {deployment.new_sn}</small>
                          </td>
                          <td>{deployment.technician_name}</td>
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
                )}
              </div>
              
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span className="text-muted">
                    Showing {filteredDeployments.length} of {deployments.length} deployments
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};

export default DeploymentList;