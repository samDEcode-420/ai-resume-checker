import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const navigate=useNavigate();

  const handleSubmit=async e=>{
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/admin/login', { username, password });
      localStorage.setItem('adminToken', data.token);
      navigate('/admin/dashboard');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1">Username</label>
          <input type="text" value={username}
            onChange={e=>setUsername(e.target.value)}
            className="w-full p-2 border rounded" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Password</label>
          <input type="password" value={password}
            onChange={e=>setPassword(e.target.value)}
            className="w-full p-2 border rounded" required />
        </div>
        <button className="w-full py-2 bg-blue-600 text-white rounded">Login</button>
      </form>
    </div>
  );
};

export default AdminLogin;
