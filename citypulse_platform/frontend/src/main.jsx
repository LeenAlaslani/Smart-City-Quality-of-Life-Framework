import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ProfileProvider } from './lib/store'
import { WorkspaceProvider } from './lib/workspace'
import './styles/tokens.css'
import './styles/base.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProfileProvider>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </ProfileProvider>
    </BrowserRouter>
  </React.StrictMode>
)
