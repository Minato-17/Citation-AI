import React, { createContext, useState, useContext, useEffect } from 'react';
import { GOOGLE_CONFIG } from '../config/googleConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gapiReady, setGapiReady] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // Initialize Google API client (for Drive API)
  useEffect(() => {
    const initGapi = () => {
      console.log('🚀 Attempting to initialize Google API client...');
      console.log('  - window.gapi exists:', !!window.gapi);
      
      if (window.gapi) {
        window.gapi.load('client', async () => {
          try {
            console.log('📦 Loading GAPI client with config:', {
              apiKey: GOOGLE_CONFIG.API_KEY ? '***' + GOOGLE_CONFIG.API_KEY.slice(-4) : 'MISSING',
              discoveryDocs: GOOGLE_CONFIG.DISCOVERY_DOCS,
            });
            
            await window.gapi.client.init({
              apiKey: GOOGLE_CONFIG.API_KEY,
              discoveryDocs: GOOGLE_CONFIG.DISCOVERY_DOCS,
            });
            
            console.log('✅ Google API client initialized successfully!');
            console.log('  - Setting gapiReady to TRUE');
            setGapiReady(true);
          } catch (error) {
            console.error('❌ Error initializing GAPI client:', error);
            setGapiReady(false);
          }
        });
      } else {
        console.log('⏳ window.gapi not ready yet, retrying in 500ms...');
        setTimeout(initGapi, 500);
      }
    };

    initGapi();
  }, []);

  // Initialize Google Identity Services (for OAuth)
  useEffect(() => {
    const initGIS = () => {
      if (window.google && window.google.accounts) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          scope: GOOGLE_CONFIG.SCOPES,
          callback: async (response) => {
            if (response.error) {
              console.error('OAuth error:', response);
              return;
            }
            
            setAccessToken(response.access_token);
            window.gapi.client.setToken({ access_token: response.access_token });
            
            // Get user info after successful auth
            await getUserInfo(response.access_token);
          },
        });
        
        setTokenClient(client);
        console.log('✅ Google Identity Services initialized');
        setIsLoading(false);
      } else {
        setTimeout(initGIS, 500);
      }
    };

    initGIS();
  }, []);

  // Get user information
  const getUserInfo = async (token) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userInfo = await response.json();
      const userData = {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        imageUrl: userInfo.picture,
        accessToken: token,
      };

      console.log('📧 User info retrieved:', { name: userData.name, email: userData.email });

      // Set the access token on gapi client
      console.log('🔑 Setting access token on GAPI client...');
      if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken({ access_token: token });
        console.log('✅ Access token set on GAPI client');
      }

      // Wait for GAPI to be ready before creating folder
      console.log('⏳ Waiting for Google API to be ready...');
      await waitForGapiReady();
      
      console.log('🎯 gapiReady check after wait:', gapiReady);
      console.log('🎯 window.gapi.client exists:', !!(window.gapi && window.gapi.client));
      console.log('🎯 window.gapi.client.drive exists:', !!(window.gapi && window.gapi.client && window.gapi.client.drive));
      
      // Create user folder in Google Drive
      console.log('📁 Attempting to create folder for:', userData.name);
      const folderId = await createUserFolder(userData.name);
      
      if (folderId) {
        console.log('✅ Folder created successfully:', folderId);
        userData.folderId = folderId;
      } else {
        console.warn('⚠️ Folder creation returned null');
      }

      setUser(userData);
      setIsAuthenticated(true);

      // Store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', token);
    } catch (error) {
      console.error('❌ Error getting user info:', error);
    }
  };

  // Helper function to wait for GAPI to be ready
  const waitForGapiReady = () => {
    return new Promise((resolve) => {
      // Check if Drive API is actually ready (not just state)
      const isDriveReady = window.gapi && window.gapi.client && window.gapi.client.drive;
      
      console.log('🔍 Checking API availability:');
      console.log('  - window.gapi exists:', !!window.gapi);
      console.log('  - window.gapi.client exists:', !!(window.gapi && window.gapi.client));
      console.log('  - window.gapi.client.drive exists:', !!(window.gapi && window.gapi.client && window.gapi.client.drive));
      console.log('  - gapiReady state:', gapiReady);
      
      if (isDriveReady) {
        console.log('✅ Drive API is already ready!');
        resolve();
        return;
      }
      
      console.log('⏳ Waiting for Drive API... will check every 100ms');
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        const isReady = window.gapi && window.gapi.client && window.gapi.client.drive;
        
        if (attempts % 10 === 0) {
          console.log(`🔄 Attempt ${attempts}: Drive API ready =`, isReady);
        }
        
        if (isReady) {
          clearInterval(checkInterval);
          console.log('✅ Drive API is now ready!');
          resolve();
        }
        
        if (attempts >= 100) { // 10 seconds
          clearInterval(checkInterval);
          console.error('❌ Timeout waiting for Drive API after 10 seconds');
          resolve();
        }
      }, 100);
    });
  };

  // Create user folder in YOUR Google Drive (not user's Drive)
  const createUserFolder = async (userName) => {
    try {
      console.log('🔧 Starting folder creation process...');
      
      // Check if Drive API is ready
      const isDriveReady = window.gapi && window.gapi.client && window.gapi.client.drive;
      console.log('  - Drive API Ready:', isDriveReady);
      console.log('  - Parent Folder ID:', GOOGLE_CONFIG.PARENT_FOLDER_ID);
      console.log('  - User Name:', userName);

      if (!isDriveReady) {
        console.error('❌ Drive API not ready');
        return null;
      }

      // Sanitize username for folder name
      const sanitizedName = userName.replace(/[<>:"/\\|?*]/g, '_');
      console.log('  - Sanitized Name:', sanitizedName);

      // Check if folder already exists for this user
      console.log('🔍 Checking for existing folder...');
      const existingFolder = await window.gapi.client.drive.files.list({
        q: `name contains '${sanitizedName}' and mimeType='application/vnd.google-apps.folder' and '${GOOGLE_CONFIG.PARENT_FOLDER_ID}' in parents and trashed=false`,
        fields: 'files(id, name)',
      });

      console.log('📋 Existing folder search result:', existingFolder.result);

      if (existingFolder.result.files && existingFolder.result.files.length > 0) {
        console.log('✅ User folder already exists:', existingFolder.result.files[0]);
        return existingFolder.result.files[0].id;
      }

      // Create new folder in YOUR Google Drive
      console.log('🆕 Creating new folder...');
      const folderMetadata = {
        name: sanitizedName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [GOOGLE_CONFIG.PARENT_FOLDER_ID],
      };

      console.log('📦 Folder metadata:', folderMetadata);

      const folder = await window.gapi.client.drive.files.create({
        resource: folderMetadata,
        fields: 'id, name, webViewLink',
      });

      console.log('✅ Folder created successfully!');
      console.log('  - Folder ID:', folder.result.id);
      console.log('  - Folder Name:', folder.result.name);
      console.log('  - View Link:', folder.result.webViewLink);
      
      alert(`✅ Folder created successfully!\n\nFolder: ${folder.result.name}\nView it at: ${folder.result.webViewLink}`);
      
      return folder.result.id;
    } catch (error) {
      console.error('❌ Error creating user folder:', error);
      console.error('  - Error message:', error.message);
      console.error('  - Error details:', error.result);
      console.error('  - Full error:', JSON.stringify(error, null, 2));
      
      alert(
        '❌ Failed to create folder in Google Drive.\n\n' +
        'Error: ' + (error.result?.error?.message || error.message) + '\n\n' +
        'Possible issues:\n' +
        '1. Parent folder ID might be incorrect\n' +
        '2. You need to grant Drive permissions\n' +
        '3. Parent folder might not be accessible\n\n' +
        'Check browser console for details.'
      );
      
      return null;
    }
  };

  const login = () => {
    if (!tokenClient) {
      alert('Google Identity Services is still loading. Please wait...');
      return;
    }

    if (!gapiReady) {
      alert('Google API is still loading. Please wait...');
      return;
    }

    // Request access token
    tokenClient.requestAccessToken({ prompt: 'consent' });
  };

  const logout = () => {
    if (accessToken) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        console.log('Access token revoked');
      });
    }
    
    setUser(null);
    setIsAuthenticated(false);
    setAccessToken(null);
    window.gapi.client.setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  };

  // Check localStorage on mount and restore session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');
    
    if (storedUser && storedToken && gapiReady) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
      setAccessToken(storedToken);
      window.gapi.client.setToken({ access_token: storedToken });
    }
  }, [gapiReady]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    gapiReady,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
