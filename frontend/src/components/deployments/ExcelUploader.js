import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Table, Modal } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import axios from 'axios';

const ExcelUploader = ({ projectId, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [columnMap, setColumnMap] = useState({});
  const [projectFields, setProjectFields] = useState([]);
  
  useEffect(() => {
    // Fetch project fields
    const fetchProjectFields = async () => {
      try {
        const { data } = await axios.get(`http://localhost:8000/api/projects/${projectId}/`);
        setProjectFields(data.fields);
        
        // Initialize column map with empty values
        const initialMap = {};
        data.fields.forEach(field => {
          initialMap[field.id] = '';
        });
        setColumnMap(initialMap);
      } catch (error) {
        console.error('Error fetching project fields:', error);
        setError('Could not load project fields');
      }
    };
    
    if (projectId) {
      fetchProjectFields();
    }
  }, [projectId]);
  
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
          
          // Get headers and first few rows
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (data && data.length > 0) {
            const headers = data[0];
            const rows = data.slice(1, Math.min(6, data.length)); // Get up to 5 rows for preview
            
            setPreviewData({ headers, rows });
            
            // Auto-map columns if possible
            const newColumnMap = { ...columnMap };
            projectFields.forEach(field => {
              // Try to find a matching header (case-insensitive)
              const matchingHeaderIndex = headers.findIndex(header => 
                header.toLowerCase() === field.name.toLowerCase()
              );
              
              if (matchingHeaderIndex >= 0) {
                newColumnMap[field.id] = headers[matchingHeaderIndex];
              }
            });
            setColumnMap(newColumnMap);
          }
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          setError('Error parsing Excel file. Please ensure it is a valid Excel file.');
        }
      };
      reader.readAsBinaryString(selectedFile);
    } else {
      setFile(null);
      setFileName('');
      setPreviewData(null);
    }
  };
  
  const handleShowPreview = () => {
    if (previewData) {
      setShowPreviewModal(true);
    }
  };
  
  const handleColumnMapChange = (fieldId, headerName) => {
    setColumnMap({
      ...columnMap,
      [fieldId]: headerName
    });
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    // Validate that required fields are mapped
    const requiredFields = projectFields.filter(field => field.is_required);
    const missingMappings = requiredFields.filter(field => !columnMap[field.id]);
    
    if (missingMappings.length > 0) {
      setError(`Please map all required fields: ${missingMappings.map(f => f.name).join(', ')}`);
      return;
    }
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('column_map', JSON.stringify(columnMap));
    
    try {
      const { data } = await axios.post(
        `http://localhost:8000/api/projects/${projectId}/import_excel/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
      
      // Reset form
      setFile(null);
      setFileName('');
      setPreviewData(null);
    } catch (error) {
      console.error('Error uploading Excel:', error);
      setError(error.response?.data?.error || 'Failed to upload Excel file. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadTemplate = async () => {
    try {
      window.location.href = `http://localhost:8000/api/projects/${projectId}/export_template/`;
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Failed to download template');
    }
  };
  
  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Import Deployment Data</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form.Group className="mb-3">
          <Form.Label>Upload Excel File</Form.Label>
          <Form.Control
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          <Form.Text className="text-muted">
            Upload an Excel file containing your deployment data.
          </Form.Text>
        </Form.Group>
        
        {fileName && (
          <Alert variant="info">
            <div className="d-flex justify-content-between align-items-center">
              <span>Selected file: <strong>{fileName}</strong></span>
              {previewData && (
                <Button variant="link" size="sm" onClick={handleShowPreview}>
                  Preview Data
                </Button>
              )}
            </div>
          </Alert>
        )}
        
        {previewData && projectFields.length > 0 && (
          <>
            <h6 className="mt-4 mb-3">Map Excel Columns to Project Fields</h6>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Project Field</th>
                  <th>Excel Column</th>
                </tr>
              </thead>
              <tbody>
                {projectFields.map(field => (
                  <tr key={field.id}>
                    <td>
                      {field.name} {field.is_required && <span className="text-danger">*</span>}
                    </td>
                    <td>
                      <Form.Select
                        value={columnMap[field.id] || ''}
                        onChange={(e) => handleColumnMapChange(field.id, e.target.value)}
                      >
                        <option value="">-- Select Column --</option>
                        {previewData.headers.map(header => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </Form.Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
        
        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-secondary" onClick={handleDownloadTemplate}>
            Download Template
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Uploading...</span>
              </>
            ) : (
              'Upload and Import'
            )}
          </Button>
        </div>
      </Card.Body>
      
      {/* Preview Modal */}
      <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Data Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewData && (
            <div style={{ overflowX: 'auto' }}>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    {previewData.headers.map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {previewData.headers.map((_, colIndex) => (
                        <td key={colIndex}>{row[colIndex]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
              {previewData.rows.length === 5 && (
                <p className="text-muted text-center">Showing first 5 rows only</p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default ExcelUploader;