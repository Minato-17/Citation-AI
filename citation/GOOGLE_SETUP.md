# Google OAuth & Drive API Setup Guide

Follow these steps to enable Google Sign-In and Google Drive integration for your application.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "Research Paper Dashboard")
4. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   - **Google Drive API**
   - **Google+ API** (for user profile)

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
   - Add test users if needed
4. Application type: **Web application**
5. Name: "Research Dashboard Web Client"
6. **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   http://localhost:3000
   ```
7. **Authorized redirect URIs:**
   ```
   http://localhost:5173
   http://localhost:3000
   ```
8. Click **Create**
9. **Copy the Client ID** - you'll need this!

## Step 4: Create API Key

1. In **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API key**
3. **Copy the API key**
4. (Optional) Click "Restrict Key" and limit to:
   - API restrictions: Google Drive API

## Step 5: Get Your Google Drive Folder ID (Important!)

**This is YOUR folder where all user folders will be created**

1. Login to [Google Drive](https://drive.google.com/) with **YOUR account** (the app owner)
2. Create a folder where all user folders will be stored (e.g., "Research Papers - All Users")
3. Right-click the folder → **Get link** → **Copy link**
4. Extract the folder ID from the URL:
   - URL format: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
   - Copy only the `FOLDER_ID_HERE` part

**Important Notes:**
- This folder is in YOUR Google Drive, not the users' drives
- When users login, a folder with their username will be created inside this folder
- Users authenticate with their Google account only for login purposes
- All their files/folders are stored in YOUR Drive

## Step 6: Configure the Application

1. Open `src/config/googleConfig.js`
2. Replace the placeholder values:
   ```javascript
   CLIENT_ID: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
   API_KEY: 'YOUR_API_KEY_HERE',
   PARENT_FOLDER_ID: 'YOUR_FOLDER_ID_HERE',
   ```

## Step 7: Add Google API Script to HTML

The script is already added in `index.html`:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
<script src="https://apis.google.com/js/api.js"></script>
```Important: How User Folders Work

**Authentication Flow:**
1. User logs in with their Google account → Gets their name and email
2. System creates a folder with their username in **YOUR Google Drive** (not theirs)
3. User uploads papers → Files go to their folder in **YOUR Drive**

**This means:**
- ✅ All user data is centralized in YOUR Google Drive
- ✅ Users don't need Drive storage space
- ✅ You control and own all uploaded papers
- ✅ Users just need a Google account to login

## Troubleshooting

### "OAuth client ID not found"
- Make sure you copied the entire Client ID including `.apps.googleusercontent.com`
- Check that the origin matches your dev server URL exactly

### "Access denied" or "Redirect URI mismatch"
- Add your exact development URL to Authorized JavaScript origins
- Clear browser cache and try again

### "API key not valid"
- Make sure the API key is correctly copied
- Check that Google Drive API is enabled for your project

### "Folder creation fails"
- Verify the PARENT_FOLDER_ID is correct and it's in YOUR Google Drive
- Make sure the folder exists and is accessible
- Check that you granted Drive permissions when users log in
- The app needs Drive access to create folders in your account
### "API key not valid"
- Make sure the API key is correctly copied
- Check that Google Drive API is enabled for your project

### "Folder creation fails"
- Verify the PARENT_FOLDER_ID is correct
- Make sure the folder is accessible/not deleted
- Check that you granted Drive permissions when logging in

## Security Notes

⚠️ **Before deploying to production:**
1. Add your production domain to Authorized JavaScript origins
2. Restrict API key to specific domains
3. Never commit real credentials to git
4. Use environment variables for sensitive data
5. Review OAuth consent screen for public users

## Test Users

During development (before OAuth verification):
- Add test user emails in OAuth consent screen
- Only these users can log in
- After verification, anyone can use the app
