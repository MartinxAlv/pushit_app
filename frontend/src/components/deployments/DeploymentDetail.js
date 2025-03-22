import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Table, Form, Modal, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const DeploymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Status update
  const [statuses, setStatuses] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Technician assignment
  const [technicians, setTechnicians] = useState([]);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [updatingTechnician, setUpdatingTechnician] = useState(false);
  
  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  useEffect(() => {
    const fetchDeploymentData = async () => {
      try {
        const [deploymentResponse, statusesResponse, techniciansResponse] = await Promise.all([
          axios.get(`http://localhost:8000/api/deployments/deployments/${id}/`),
          axios.get('http://localhost:8000/api/deployments/statuses/'),
          axios.get('http://localhost:8000/api/deployments/technicians/')
        ]);
        
        setDeployment(deploymentResponse.data);
        setStatuses(statusesResponse.data);
        setTechnicians(techniciansResponse.data);
        
        // Initialize selected values
        setSelectedStatus(deploymentResponse.data.status);
        setSelectedTechnician(deploymentResponse.data.technician || '');
      } catch (error) {
        console.error('Error fetching deployment details:', error);
        setError('Failed to load deployment details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeploymentData();
  }, [id]);
  
  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;
    
    setUpdatingStatus(true);
    
    try {
      const { data } = await axios.post(
        `http://localhost:8000/api/deployments/deployments/${id}/update_status/`,
        { status: selectedStatus }
      );
      
      setDeployment(data);
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  const handleAssignTechnician = async () => {
    setUpdatingTechnician(true);
    
    try {
      const { data } = await axios.post(
        `http://localhost:8000/api/deployments/deployments/${id}/assign_technician/`,
        { technician: selectedTechnician }
      );
      
      setDeployment(data);
      setShowTechnicianModal(false);
    } catch (error) {
      console.error('Error assigning technician:', error);
      setError('Failed to assign technician');
    } finally {
      setUpdatingTechnician(false);
    }
  };
  
  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      await axios.delete(`http://localhost:8000/api/deployments/deployments/${id}/`);
      navigate('/deployments');
    } catch (error) {
      console.error('Error deleting deployment:', error);
      setError('Failed to delete deployment');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };
  
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
        <p>Loading deployment details...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button as={Link} to="/deployments" variant="secondary">
          Back to Deployments
        </Button>
      </Container>
    );
  }
  
  if (!deployment) {
    return (
      <Container className="my-5">
        <Alert variant="warning">Deployment not found</Alert>
        <Button as={Link} to="/deployments" variant="secondary">
          Back to Deployments
        </Button>
      </Container>
    );
  }
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center">
            <h1 className="mb-0">{deployment.deployment_id}</h1>
            <Badge 
              bg={getStatusBadgeVariant(deployment.status_name)}
              className="ms-3 fs-6"
            >
              {deployment.status_name}
            </Badge>
          </div>
          <p className="text-muted">
            From project: <Link to={`/projects/${deployment.project}`}>{deployment.project_name}</Link>
          </p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            onClick={() => setShowStatusModal(true)}
          >
            Update Status
          </Button>
          <Button 
            as={Link} 
            to={`/deployments/${id}/edit`} 
            variant="outline-secondary"
          >
            Edit
          </Button>
          <Button 
            variant="outline-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>Assignment Details</Card.Header>
            <Card.Body>
              <Table borderless>
                <tbody>
                  <tr>
                    <th style={{ width: '30%' }}>Assigned To</th>
                    <td>{deployment.assigned_to || '-'}</td>
                  </tr>
                  <tr>
                    <th>Position</th>
                    <td>{deployment.position || '-'}</td>
                  </tr>
                  <tr>
                    <th>Department</th>
                    <td>{deployment.department_name || '-'}</td>
                  </tr>
                  <tr>
                    <th>Location</th>
                    <td>{deployment.location || '-'}</td>
                  </tr>
                  <tr>
                    <th>Created Date</th>
                    <td>{new Date(deployment.created_date).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th>Deployment Date</th>
                    <td>
                      {deployment.deployment_date 
                        ? new Date(deployment.deployment_date).toLocaleDateString() 
                        : '-'}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Technician Assignment</span>
              <Button 
                variant="link" 
                className="p-0"
                onClick={() => setShowTechnicianModal(true)}
              >
                {deployment.technician ? 'Change Technician' : 'Assign Technician'}
              </Button>
            </Card.Header>
            <Card.Body>
              {deployment.technician ? (
                <div>
                  <h5>{deployment.technician_name}</h5>
                  <p className="text-muted mb-3">Assigned Technician</p>
                  
                  <h6>Notes</h6>
                  <p>{deployment.technician_notes || 'No notes available'}</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No technician assigned yet</p>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => setShowTechnicianModal(true)}
                  >
                    Assign Technician
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>Current Device</Card.Header>
            <Card.Body>
              <Table borderless>
                <tbody>
                  <tr>
                    <th style={{ width: '30%' }}>Model</th>
                    <td>{deployment.current_model || '-'}</td>
                  </tr>
                  <tr>
                    <th>Serial Number</th>
                    <td>{deployment.current_sn || '-'}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>New Device</Card.Header>
            <Card.Body>
              <Table borderless>
                <tbody>
                  <tr>
                    <th style={{ width: '30%' }}>Model</th>
                    <td>{deployment.new_model || '-'}</td>
                  </tr>
                  <tr>
                    <th>Serial Number</th>
                    <td>{deployment.new_sn || '-'}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {deployment.fields && deployment.fields.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>Custom Fields</Card.Header>
              <Card.Body>
                <Table borderless>
                  <tbody>
                    {deployment.fields.map(field => (
                      <tr key={field.id}>
                        <th style={{ width: '30%' }}>{field.field_name}</th>
                        <td>{field.value || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Select New Status</Form.Label>
            <Form.Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Select Status</option>
              {statuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateStatus}
            disabled={!selectedStatus || updatingStatus}
          >
            {updatingStatus ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Updating...</span>
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Technician Assignment Modal */}
      <Modal show={showTechnicianModal} onHide={() => setShowTechnicianModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Technician</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Select Technician</Form.Label>
            <Form.Select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
            >
              <option value="">None (Remove Assignment)</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTechnicianModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAssignTechnician}
            disabled={updatingTechnician}
          >
            {updatingTechnician ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Assigning...</span>
              </>
            ) : (
              'Assign Technician'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this deployment?</p>
          <p className="text-danger fw-bold">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Deleting...</span>
              </>
            ) : (
              'Delete Permanently'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DeploymentDetail;