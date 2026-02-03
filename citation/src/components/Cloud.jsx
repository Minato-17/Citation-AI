import React, { useState, useEffect } from 'react';
import './Cloud.css';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_CONFIG } from '../config/googleConfig';

const Cloud = () => {
  const { user } = useAuth();
  const [cloudFiles, setCloudFiles] = useState([]);
  const [userFiles, setUserFiles] = useState([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Cloud folder ID from the shared link
  const CLOUD_FOLDER_ID = '13eyXizE_UTktUuUCaijkE6N3oOKychkH';

  // Load cloud files on component mount
  useEffect(() => {
    if (user) {
      loadCloudFiles();
    }
  }, [user]);

  // Load files from the shared Cloud folder
  const loadCloudFiles = async () => {
    if (!user) {
      console.log('No user logged in');
      setIsLoadingCloud(false);
      return;
    }

    try {
      setIsLoadingCloud(true);
      console.log('☁️ Loading files from Cloud folder:', CLOUD_FOLDER_ID);

      const response = await window.gapi.client.drive.files.list({
        q: `'${CLOUD_FOLDER_ID}' in parents and trashed=false and mimeType='application/pdf'`,
        fields: 'files(id, name, size, createdTime, mimeType, webViewLink, webContentLink, owners)',
        orderBy: 'createdTime desc',
      });

      const files = response.result.files || [];
      console.log('✅ Cloud files loaded:', files.length);

      const formattedFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A',
        uploadDate: new Date(file.createdTime).toLocaleDateString(),
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        owner: file.owners?.[0]?.displayName || 'Unknown',
      }));

      setCloudFiles(formattedFiles);
    } catch (error) {
      console.error('❌ Error loading cloud files:', error);
      alert('Failed to load files from Cloud. Please try again.');
    } finally {
      setIsLoadingCloud(false);
    }
  };

  // Load user's personal files when modal opens
  const loadUserFiles = async () => {
    if (!user || !user.folderId) {
      console.log('No user folder ID available');
      return;
    }

    try {
      setIsLoadingUser(true);
      console.log('📂 Loading user files from folder:', user.folderId);

      const response = await window.gapi.client.drive.files.list({
        q: `'${user.folderId}' in parents and trashed=false and mimeType='application/pdf'`,
        fields: 'files(id, name, size, createdTime, mimeType)',
        orderBy: 'createdTime desc',
      });

      const files = response.result.files || [];
      console.log('✅ User files loaded:', files.length);

      const formattedFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A',
        uploadDate: new Date(file.createdTime).toLocaleDateString(),
      }));

      setUserFiles(formattedFiles);
    } catch (error) {
      console.error('❌ Error loading user files:', error);
      alert('Failed to load your files. Please try again.');
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Copy file from user's folder to cloud folder
  const copyFileToCloud = async (fileId, fileName) => {
    if (!user) {
      alert('Please log in to add files to Cloud.');
      return false;
    }

    try {
      console.log('📤 Copying file to Cloud:', fileName);

      // Copy the file to the cloud folder
      const response = await window.gapi.client.drive.files.copy({
        fileId: fileId,
        resource: {
          parents: [CLOUD_FOLDER_ID],
          name: fileName,
        },
        fields: 'id, name, size, createdTime, mimeType, webViewLink, webContentLink, owners',
      });

      console.log('✅ File copied to Cloud successfully');
      return response.result;
    } catch (error) {
      console.error('❌ Error copying file to Cloud:', error);
      throw error;
    }
  };

  // Handle opening the add modal
  const handleOpenAddModal = () => {
    setShowAddModal(true);
    loadUserFiles();
    setSelectedFiles([]);
  };

  // Handle closing the add modal
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedFiles([]);
  };

  // Toggle file selection
  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Add selected files to cloud
  const handleAddToCloud = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file.');
      return;
    }

    try {
      console.log('📤 Adding files to Cloud:', selectedFiles.length);

      const filesToAdd = userFiles.filter(f => selectedFiles.includes(f.id));
      let successCount = 0;

      for (const file of filesToAdd) {
        try {
          const copiedFile = await copyFileToCloud(file.id, file.name);
          
          // Add to cloud files list
          setCloudFiles(prev => [{
            id: copiedFile.id,
            name: copiedFile.name,
            size: copiedFile.size ? (copiedFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A',
            uploadDate: new Date(copiedFile.createdTime).toLocaleDateString(),
            webViewLink: copiedFile.webViewLink,
            webContentLink: copiedFile.webContentLink,
            owner: copiedFile.owners?.[0]?.displayName || user.name,
          }, ...prev]);

          successCount++;
        } catch (error) {
          console.error(`Failed to add ${file.name}:`, error);
        }
      }

      alert(`✅ Successfully added ${successCount} file(s) to Cloud!`);
      handleCloseAddModal();
    } catch (error) {
      console.error('❌ Error adding files to Cloud:', error);
      alert('Failed to add files to Cloud. Please try again.');
    }
  };

  return (
    <div className="cloud-container">
      <div className="cloud-header">
        <div>
          <h1>Cloud Storage</h1>
          <p>Shared repository of research papers accessible to all users</p>
        </div>
        <button className="add-to-cloud-btn" onClick={handleOpenAddModal}>
          Add to Cloud
        </button>
      </div>

      <div className="cloud-stats">
        <div className="stat-card">
          <div className="stat-content">
            <h3>{cloudFiles.length}</h3>
            <p>Papers in Cloud</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3>{new Set(cloudFiles.map(f => f.owner)).size}</h3>
            <p>Contributors</p>
          </div>
        </div>
      </div>

      {!user && (
        <div className="no-user-message">
          Please log in to view and add files to Cloud.
        </div>
      )}

      {isLoadingCloud && user && (
        <div className="loading-message">
          Loading Cloud files...
        </div>
      )}

      {!isLoadingCloud && cloudFiles.length > 0 && (
        <div className="cloud-files-section">
          <h2>Shared Papers ({cloudFiles.length})</h2>
          <div className="files-grid">
            {cloudFiles.map((file) => (
              <div key={file.id} className="cloud-file-card">
                <div className="file-info">
                  <h4>{file.name}</h4>
                  <div className="file-meta">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.uploadDate}</span>
                  </div>
                  <div className="file-owner">
                    {file.owner}
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
                      View
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
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoadingCloud && cloudFiles.length === 0 && user && (
        <div className="empty-state">
          No files in Cloud yet. Be the first to add a research paper!
        </div>
      )}

      {/* Add to Cloud Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseAddModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add to Cloud from Your Drive</h2>
              <button className="close-btn" onClick={handleCloseAddModal}>✕</button>
            </div>

            {isLoadingUser ? (
              <div className="modal-loading">
                Loading your files...
              </div>
            ) : userFiles.length === 0 ? (
              <div className="modal-empty">
                <p>No PDF files found in your drive.</p>
                <p>Upload files to your drive first, then you can add them to Cloud.</p>
              </div>
            ) : (
              <>
                <div className="modal-body">
                  <p className="modal-description">
                    Select PDF files from your personal drive to share with everyone in Cloud:
                  </p>
                  <div className="user-files-list">
                    {userFiles.map((file) => (
                      <div 
                        key={file.id} 
                        className={`user-file-item ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
                        onClick={() => toggleFileSelection(file.id)}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => {}}
                        />
                        <div className="file-info-small">
                          <div className="file-name">{file.name}</div>
                          <div className="file-details">
                            {file.size} • {file.uploadDate}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="cancel-btn" onClick={handleCloseAddModal}>
                    Cancel
                  </button>
                  <button 
                    className="add-btn" 
                    onClick={handleAddToCloud}
                    disabled={selectedFiles.length === 0}
                  >
                    Add {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''} to Cloud
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cloud;
