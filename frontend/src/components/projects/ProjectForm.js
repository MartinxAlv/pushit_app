import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';

const ProjectForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expectedCount, setExpectedCount] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [columnPreview, setColumnPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Excel Preview, 3: Field Mapping
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Custom fields state
  const [customFields, setCustomFields] = useState([]);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      // Preview the Excel file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const workbook = XLSX.read(event.target.result, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (data && data.length > 0) {
            const headers = data[0];
            setColumnPreview(headers.map(header => ({
              originalName: header,
              mappedName: header,
              fieldType: 'text',
              include: true
            })));
          }
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          setError('Error parsing Excel file. Please ensure it is a valid Excel file.');
        }
      };
      reader.readAsBinaryString(selectedFile);
    }
  };
  
  const analyzeExcel = async () => {
    if (!file) return;
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('http://localhost:8000/api/projects/analyze_excel/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { columns } = response.data;
      
      // Update column preview with suggested field types
      setColumnPreview(prevColumns => 
        prevColumns.map((col, index) => ({
          ...col,
          fieldType: columns[index]?.field_type || 'text',
          sampleValues: columns[index]?.sample_values || []
        }))
      );
      
    } catch (err) {
      console.error('Error analyzing Excel file:', err);
      setError('Error analyzing Excel file. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  
  const handleSubmitBasicInfo = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    
    if (file) {
      analyzeExcel();
      setStep(2);
    } else {
      // If no file, go directly to custom fields creation
      setStep(3);
    }
  };
  
  const handleColumnMappingChange = (index, field, value) => {
    const updatedColumns = [...columnPreview];
    updatedColumns[index][field] = value;
    setColumnPreview(updatedColumns);
  };
  
  const handleConfirmMapping = () => {
    // Convert column mapping to custom fields
    const fields = columnPreview
      .filter(col => col.include)
      .map((col, index) => ({
        name: col.mappedName,
        fieldType: col.fieldType,
        isRequired: false,
        order: index,
        options: col.fieldType === 'dropdown' ? col.sampleValues : null
      }));
    
    setCustomFields(fields);
    setStep(3);
  };
  
  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        name: '',
        fieldType: 'text',
        isRequired: false,
        order: customFields.length,
        options: null
      }
    ]);
  };
  
  const removeCustomField = (index) => {
    const updatedFields = customFields.filter((_, i) => i !== index);
    setCustomFields(updatedFields.map((field, i) => ({ ...field, order: i })));
  };
  
  const handleCustomFieldChange = (index, field, value) => {
    const updatedFields = [...customFields];
    updatedFields[index][field] = value;
    setCustomFields(updatedFields);
  };
  
  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      let projectResponse;
      
      if (file) {
        // Create project with Excel
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('expected_count', expectedCount === '' ? 0 : parseInt(expectedCount));
        formData.append('file', file);
        
        projectResponse = await axios.post(
          'http://localhost:8000/api/projects/create_with_excel/',
          formData, 
          { headers: { 'Content-Type': 'multipart/form-data' }}
        );
      } else {
        // Create project without Excel
        projectResponse = await axios.post('http://localhost:8000/api/projects/', {
          name,
          description,
          expected_count: expectedCount === '' ? 0 : parseInt(expectedCount)
        });
      }
      
      const projectId = projectResponse.data.id;
      
      // If we have custom fields and didn't use Excel, create them
      if (customFields.length > 0 && !file) {
        for (const field of customFields) {
          await axios.post(`http://localhost:8000/api/projects/${projectId}/add_field/`, {
            name: field.name,
            field_type: field.fieldType,
            is_required: field.isRequired,
            options: field.options
          });
        }
      }
      
      navigate(`/projects/${projectId}`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Error creating project. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
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
      {error && <Alert variant="danger">{error}</Alert>}
      
      {step === 1 && (
        <>
          <h1>Create New Project</h1>
          <Form onSubmit={handleSubmitBasicInfo}>
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
    onChange={(e) => setExpectedCount(e.target.value)}
    min="0"
    placeholder="0"
  />
</Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Upload Deployment Sheet (Optional)</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
              <Form.Text className="text-muted">
                Upload an Excel file to automatically create fields based on the columns.
              </Form.Text>
            </Form.Group>
            
            <Button variant="primary" type="submit">
              {file ? 'Preview Excel Sheet' : 'Continue to Field Setup'}
            </Button>
          </Form>
        </>
      )}
      
      {step === 2 && (
        <>
          <h1>Excel Sheet Column Mapping</h1>
          <p>Review and customize the columns from your Excel sheet</p>
          
          {loading ? (
            <div className="text-center my-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p>Analyzing Excel columns...</p>
            </div>
          ) : (
            <>
              <Row className="mb-3">
                <Col>
                  <h5>Excel file: {fileName}</h5>
                </Col>
              </Row>
              
              <Card className="mb-4">
                <Card.Header>Column Mapping</Card.Header>
                <Card.Body>
                  <Row className="mb-2 fw-bold">
                    <Col xs={1}>Include</Col>
                    <Col>Original Column Name</Col>
                    <Col>Field Name in Project</Col>
                    <Col>Field Type</Col>
                  </Row>
                  
                  {columnPreview.map((column, index) => (
                    <Row key={index} className="mb-2 align-items-center">
                      <Col xs={1}>
                        <Form.Check
                          type="checkbox"
                          checked={column.include}
                          onChange={(e) => handleColumnMappingChange(index, 'include', e.target.checked)}
                        />
                      </Col>
                      <Col>{column.originalName}</Col>
                      <Col>
                        <Form.Control
                          type="text"
                          value={column.mappedName}
                          onChange={(e) => handleColumnMappingChange(index, 'mappedName', e.target.value)}
                        />
                      </Col>
                      <Col>
                        <Form.Select
                          value={column.fieldType}
                          onChange={(e) => handleColumnMappingChange(index, 'fieldType', e.target.value)}
                        >
                          {fieldTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                    </Row>
                  ))}
                </Card.Body>
              </Card>
              
              <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="primary" onClick={handleConfirmMapping}>
                  Confirm and Continue
                </Button>
              </div>
            </>
          )}
        </>
      )}
      
      {step === 3 && (
        <>
          <h1>Custom Fields Configuration</h1>
          <p>Configure the fields for your deployment project</p>
          
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Project Fields</span>
              <Button variant="outline-primary" size="sm" onClick={addCustomField}>
                Add Field
              </Button>
            </Card.Header>
            <Card.Body>
              {customFields.length === 0 ? (
                <p className="text-muted">No custom fields added yet. Click "Add Field" to create one.</p>
              ) : (
                <>
                  <Row className="mb-2 fw-bold">
                    <Col>Field Name</Col>
                    <Col>Field Type</Col>
                    <Col xs={2}>Required</Col>
                    <Col xs={1}></Col>
                  </Row>
                  
                  {customFields.map((field, index) => (
                    <Row key={index} className="mb-3 align-items-center">
                      <Col>
                        <Form.Control
                          type="text"
                          value={field.name}
                          onChange={(e) => handleCustomFieldChange(index, 'name', e.target.value)}
                          placeholder="Field name"
                        />
                      </Col>
                      <Col>
                        <Form.Select
                          value={field.fieldType}
                          onChange={(e) => handleCustomFieldChange(index, 'fieldType', e.target.value)}
                        >
                          {fieldTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col xs={2}>
                        <Form.Check
                          type="checkbox"
                          label="Required"
                          checked={field.isRequired}
                          onChange={(e) => handleCustomFieldChange(index, 'isRequired', e.target.checked)}
                        />
                      </Col>
                      <Col xs={1}>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeCustomField(index)}
                        >
                          ×
                        </Button>
                      </Col>
                    </Row>
                  ))}
                </>
              )}
            </Card.Body>
          </Card>
          
          <div className="d-flex justify-content-between">
            <Button variant="secondary" onClick={() => file ? setStep(2) : setStep(1)}>
              Back
            </Button>
            <Button 
              variant="primary" 
              onClick={handleFinalSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Creating...</span>
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default ProjectForm;