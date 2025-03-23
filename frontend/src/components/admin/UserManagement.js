// src/components/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // User form state
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Password reset state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordResetError, setPasswordResetError] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data } = await axios.get('http://localhost:8000/api/accounts/users/');
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenCreateModal = () => {
    // Reset form
    setUsername('');
    setEmail('');
    setFirstName('');
    setLastName('');
    setPassword('');
    setConfirmPassword('');
    setIsAdmin(false);
    setFormError('');
    setCurrentUser(null);
    setIsEditing(false);
    setShowUserModal(true);
  };
  
  const handleOpenEditModal = (user) => {
    setUsername(user.username);
    setEmail(user.email || '');
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setPassword('');
    setConfirmPassword('');
    setIsAdmin(user.is_staff);
    setFormError('');
    setCurrentUser(user);
    setIsEditing(true);
    setShowUserModal(true);
  };
  
  const handleOpenResetPasswordModal = (user) => {
    setPasswordResetUser(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordResetError('');
    setShowPasswordModal(true);
  };
  
  // User deletion state and handlers
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  const handleOpenDeleteModal = (user) => {
    setUserToDelete(user);
    setDeleteError('');
    setShowDeleteModal(true);
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setDeleting(true);
    setDeleteError('');
    
    try {
      await axios.delete(`http://localhost:8000/api/accounts/users/${userToDelete.id}/`);
      
      // Refresh the user list
      fetchUsers();
      
      // Close the modal
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting user:', err);
      setDeleteError(err.response?.data?.error || 'Failed to delete user. Please try again.');
    } finally {
      setDeleting(false);
    }
  };
  
  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    
    // Validate
    if (!username.trim()) {
      setFormError('Username is required');
      setSubmitting(false);
      return;
    }
    
    if (!isEditing && (!password.trim() || !confirmPassword.trim())) {
      setFormError('Password is required for new users');
      setSubmitting(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      setSubmitting(false);
      return;
    }
    
    try {
      const userData = {
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        is_staff: isAdmin
      };
      
      // Add password only if it's provided (required for new users)
      if (password.trim()) {
        userData.password = password;
      }
      
      let response;
      
      if (isEditing) {
        // Update existing user
        response = await axios.put(`http://localhost:8000/api/accounts/users/${currentUser.id}/`, userData);
      } else {
        // Create new user
        response = await axios.post('http://localhost:8000/api/accounts/users/', userData);
      }
      
      // Refresh the user list
      fetchUsers();
      
      // Close the modal
      setShowUserModal(false);
    } catch (err) {
      console.error('Error saving user:', err);
      setFormError(err.response?.data?.error || 'Failed to save user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPasswordResetError('');
    setResettingPassword(true);
    
    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      setPasswordResetError('Password is required');
      setResettingPassword(false);
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setPasswordResetError('Passwords do not match');
      setResettingPassword(false);
      return;
    }
    
    try {
      await axios.post(`http://localhost:8000/api/accounts/users/${passwordResetUser.id}/reset_password/`, {
        password: newPassword
      });
      
      // Success
      setShowPasswordModal(false);
    } catch (err) {
      console.error('Error resetting password:', err);
      setPasswordResetError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setResettingPassword(false);
    }
  };
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>User Management</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={handleOpenCreateModal}>
            Create User
          </Button>
        </Col>
      </Row>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading users...</p>
        </div>
      ) : (
        <Card>
          <Card.Body>
            {users.length === 0 ? (
              <p className="text-center my-4">No users found.</p>
            ) : (
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>
                        {user.first_name || user.last_name ? 
                          `${user.first_name} ${user.last_name}`.trim() : 
                          '—'}
                      </td>
                      <td>{user.email || '—'}</td>
                      <td>
                        {user.is_staff ? (
                          <span className="badge bg-warning text-dark">Admin</span>
                        ) : (
                          <span className="badge bg-info">Technician</span>
                        )}
                      </td>
                      <td>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          className="me-2"
                          onClick={() => handleOpenEditModal(user)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleOpenResetPasswordModal(user)}
                          className="me-2"
                        >
                          Reset Password
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleOpenDeleteModal(user)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}
      
      {/* User Create/Edit Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit User' : 'Create User'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          
          <Form onSubmit={handleSubmitUser}>
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
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {!isEditing && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isEditing}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!isEditing}
                  />
                </Form.Group>
              </>
            )}
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Administrator Access"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              <Form.Text className="text-muted">
                Administrators can manage projects, users, and all deployments.
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                onClick={() => setShowUserModal(false)}
                className="me-2"
              >
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
                  isEditing ? 'Update User' : 'Create User'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Password Reset Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {passwordResetError && <Alert variant="danger">{passwordResetError}</Alert>}
          
          {passwordResetUser && (
            <p>
              Reset password for user: <strong>{passwordResetUser.username}</strong>
            </p>
          )}
          
          <Form onSubmit={handleResetPassword}>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                onClick={() => setShowPasswordModal(false)}
                className="me-2"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={resettingPassword}
              >
                {resettingPassword ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Resetting...</span>
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Delete User Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && <Alert variant="danger">{deleteError}</Alert>}
          
          {userToDelete && (
            <>
              <p>
                Are you sure you want to delete the user: <strong>{userToDelete.username}</strong>?
              </p>
              <p className="text-danger">
                <strong>Warning:</strong> This action cannot be undone. All user data will be permanently deleted.
              </p>
            </>
          )}
          
          <div className="d-flex justify-content-end">
            <Button 
              variant="secondary" 
              onClick={() => setShowDeleteModal(false)}
              className="me-2"
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteUser}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Deleting...</span>
                </>
              ) : (
                'Delete User'
              )}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default UserManagement;