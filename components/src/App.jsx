import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UploadForm from './components/UploadForm';
import ResultsPage from './components/ResultsPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

const PrivateRoute = ({ children }) => (
  localStorage.getItem('adminToken')
    ? children
    : <Navigate to="/admin/login" replace />
);

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<UploadForm />} />
      <Route path="/results/:id" element={<ResultsPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={
        <PrivateRoute><AdminDashboard /></PrivateRoute>
      } />
    </Routes>
  </Router>
);

export default App;
