import React, { useState, useEffect } from 'react';
import './UploadDashboard.css';
import { useAuth } from '../context/AuthContext';

const UploadDashboard = () => {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  // Load files from Google Drive when component mounts
  useEffect(() => {
    if (user && user.folderId) {
      loadFilesFromDrive();
    } else {
      setIsLoadingFiles(false);
    }
  }, [user]);

  // Function to load files from Google Drive
  const loadFilesFromDrive = async () => {
    if (!user || !user.folderId) {
      console.log('No user or folder ID available');
      setIsLoadingFiles(false);
      return;
    }

    try {
      setIsLoadingFiles(true);
      console.log('📂 Loading files from Drive folder:', user.folderId);

      const response = await window.gapi.client.drive.files.list({
        q: `'${user.folderId}' in parents and trashed=false`,
        fields: 'files(id, name, size, createdTime, mimeType, webViewLink, webContentLink)',
        orderBy: 'createdTime desc',
      });

      const files = response.result.files || [];
      console.log('✅ Files loaded from Drive:', files.length);

      const formattedFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A',
        type: file.mimeType,
        uploadDate: new Date(file.createdTime).toLocaleDateString(),
        status: 'Completed',
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
      }));

      setUploadedFiles(formattedFiles);
    } catch (error) {
      console.error('❌ Error loading files from Drive:', error);
      alert('Failed to load files from Google Drive. Please try again.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Function to upload file to Google Drive
  const uploadFileToDrive = async (file) => {
    if (!user || !user.folderId) {
      console.error('No user or folder ID available');
      alert('Please log in to upload files.');
      return null;
    }

    try {
      console.log('📤 Uploading file to Drive:', file.name);

      // Create metadata for the file
      const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: [user.folderId],
      };

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', file);

      // Upload file using fetch API
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime,mimeType,webViewLink,webContentLink', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const uploadedFile = await response.json();
      console.log('✅ File uploaded successfully:', uploadedFile);

      return uploadedFile;
    } catch (error) {
      console.error('❌ Error uploading file to Drive:', error);
      throw error;
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    const filesArray = Array.from(files);
    
    // Add files with "Uploading..." status immediately for UI feedback
    const tempFiles = filesArray.map(file => ({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      uploadDate: new Date().toLocaleDateString(),
      status: 'Uploading...',
    }));
    
    setUploadedFiles([...tempFiles, ...uploadedFiles]);

    // Upload each file to Google Drive
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      try {
        const uploadedFile = await uploadFileToDrive(file);
        
        if (uploadedFile) {
          // Update the file status to Completed and add Drive metadata
          setUploadedFiles(prev => 
            prev.map(f => 
              f.name === file.name && f.status === 'Uploading...'
                ? {
                    id: uploadedFile.id,
                    name: uploadedFile.name,
                    size: uploadedFile.size ? (uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB' : f.size,
                    type: uploadedFile.mimeType || f.type,
                    uploadDate: new Date(uploadedFile.createdTime).toLocaleDateString(),
                    status: 'Completed',
                    webViewLink: uploadedFile.webViewLink,
                    webContentLink: uploadedFile.webContentLink,
                  }
                : f
            )
          );
        }
      } catch (error) {
        // Update file status to Failed if upload fails
        setUploadedFiles(prev => 
          prev.map(f => 
            f.name === file.name && f.status === 'Uploading...'
              ? { ...f, status: 'Failed' }
              : f
          )
        );
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }
  };

  const removeFile = async (index) => {
    const fileToDelete = uploadedFiles[index];
    
    if (!fileToDelete.id) {
      // If file doesn't have an ID, just remove from UI
      setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${fileToDelete.name}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting file from Drive:', fileToDelete.id);

      await window.gapi.client.drive.files.delete({
        fileId: fileToDelete.id,
      });

      console.log('✅ File deleted successfully');
      
      // Remove from UI
      setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  return (
    <div className="upload-dashboard">
      <div className="dashboard-header">
        <h1>Upload Research Papers</h1>
        <p>Upload your research papers in PDF format for citation extraction and analysis</p>
      </div>

      <div className="upload-stats">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <h3>{uploadedFiles.length}</h3>
            <p>Papers Uploaded</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{uploadedFiles.filter(f => f.status === 'Completed').length}</h3>
            <p>Processed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{uploadedFiles.filter(f => f.status === 'Uploading...').length}</h3>
            <p>Uploading</p>
          </div>
        </div>
      </div>

      {!user && (
        <div className="no-user-message" style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          margin: '20px 0',
          color: '#856404'
        }}>
          ⚠️ Please log in to upload and view your files.
        </div>
      )}

      {user && (
        <div 
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" className="upload-label">
            <div className="upload-icon">📤</div>
            <h3>Drag & Drop your research papers here</h3>
            <p>or click to browse files</p>
            <div className="supported-formats">
              <span>Supported formats: PDF, DOC, DOCX</span>
            </div>
            <button className="browse-btn" onClick={() => document.getElementById('file-upload').click()}>
              Browse Files
            </button>
          </label>
        </div>
      )}

      {isLoadingFiles && user && (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px' }}>
          ⏳ Loading your files from Google Drive...
        </div>
      )}

      {!isLoadingFiles && uploadedFiles.length > 0 && (
        <div className="uploaded-files-section">
          <h2>Your Papers ({uploadedFiles.length})</h2>
          <div className="files-list">
            {uploadedFiles.map((file, index) => (
              <div key={file.id || index} className="file-card">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <h4>{file.name}</h4>
                  <div className="file-meta">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.uploadDate}</span>
                  </div>
                  <div className={`file-status ${
                    file.status === 'Completed' ? 'completed' : 
                    file.status === 'Failed' ? 'failed' : 'processing'
                  }`}>
                    {file.status}
                  </div>
                </div>
                <div className="file-actions">
                  {file.webViewLink && (
                    <a 
                      href={file.webViewLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="action-btn view-btn" 
                      title="View in Google Drive"
                    >
                      👁️
                    </a>
                  )}
                  {file.webContentLink && (
                    <a 
                      href={file.webContentLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="action-btn download-btn" 
                      title="Download"
                    >
                      ⬇️
                    </a>
                  )}
                  <button 
                    className="action-btn delete-btn" 
                    title="Delete"
                    onClick={() => removeFile(index)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoadingFiles && uploadedFiles.length === 0 && user && (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#666' }}>
          No files uploaded yet. Upload your first research paper!
        </div>
      )}
    </div>
  );
};

export default UploadDashboard;
