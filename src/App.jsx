import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CarritoProvider } from './contexts/CarritoContext';
import AppRouter from './AppRouter';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CarritoProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <AppRouter />
        </CarritoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;