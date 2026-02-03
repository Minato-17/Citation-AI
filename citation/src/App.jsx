import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import UploadDashboard from './components/UploadDashboard'
import Cloud from './components/Cloud'
import Login from './components/Login'
import { AuthProvider, useAuth } from './context/AuthContext'

function AppContent() {
  const [activeTab, setActiveTab] = useState('upload')
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner-large"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <div className="app-container">
      <Navbar />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'upload' && <UploadDashboard />}
        {activeTab === 'dashboard' && (
          <div className="page-placeholder">
            <h1>📊 Dashboard</h1>
            <p>Dashboard content coming soon...</p>
          </div>
        )}
        {activeTab === 'library' && (
          <div className="page-placeholder">
            <h1>📚 My Library</h1>
            <p>Library content coming soon...</p>
          </div>
        )}
        {activeTab === 'citations' && (
          <div className="page-placeholder">
            <h1>📝 Citations</h1>
            <p>Citations content coming soon...</p>
          </div>
        )}
        {activeTab === 'cloud' && <Cloud />}
        {activeTab === 'favorites' && (
          <div className="page-placeholder">
            <h1>⭐ Favorites</h1>
            <p>Favorites content coming soon...</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="page-placeholder">
            <h1>⚙️ Settings</h1>
            <p>Settings content coming soon...</p>
          </div>
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
