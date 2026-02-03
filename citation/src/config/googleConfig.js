// Google OAuth and Drive API Configuration
// Follow the setup instructions in GOOGLE_SETUP.md

export const GOOGLE_CONFIG = {
  // Get your Client ID from Google Cloud Console
  // https://console.cloud.google.com/apis/credentials
  CLIENT_ID: '310534403399-m3f65igs6j7pqb38v4178t9a1td4obhs.apps.googleusercontent.com',
  
  // API Key for Google Drive API
  API_KEY: 'AIzaSyCmSaawVWHK2WSMfTOvaatKRJ0yED38wBI',
  
  // OAuth Scopes needed
  SCOPES: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/drive', // Full Drive access to create folders in YOUR Drive
  ].join(' '),
  
  // Discovery docs for Google Drive API
  DISCOVERY_DOCS: [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
  ],
  
  // YOUR Google Drive folder ID where ALL user folders will be created
  // This should be a folder in YOUR Google Drive account (the app owner)
  // Right-click on your folder in Google Drive > Get Link > Extract the ID from URL
  // Example: If URL is https://drive.google.com/drive/folders/1ABC...XYZ
  // Then PARENT_FOLDER_ID is '1ABC...XYZ'
  // 
  // IMPORTANT: 
  // 1. This folder must be in YOUR (app owner's) Google Drive
  // 2. Users will login with their Google accounts for authentication only
  // 3. Their folders will be created in YOUR Drive, not theirs
  PARENT_FOLDER_ID: '1CWSEvtnjjsEx9TjWttfQnoocfcDc21LV',
  
  // CLOUD FOLDER ID - Shared folder accessible to all users
  // Users can add PDFs from their personal folders to this shared cloud folder
  // This should be a publicly accessible folder or shared with all users
  CLOUD_FOLDER_ID: '13eyXizE_UTktUuUCaijkE6N3oOKychkH',
};
