import React, { useState } from 'react';
import StatsPanel from './StatsPanel';
import ResumeTable from './ResumeTable';
import BulkUpload from './BulkUpload';

const tabs = [
  { key:'stats', label:'Stats' },
  { key:'resumes', label:'Resumes' },
  { key:'bulk', label:'Bulk Upload' }
];

const AdminDashboard = () => {
  const [activeTab,setActiveTab]=useState('stats');
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <nav className="flex space-x-4 mb-8">
          {tabs.map(tab=>(
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-2xl font-medium transition-colors ${
                activeTab===tab.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </nav>
        <div>
          {activeTab==='stats' && <StatsPanel />}
          {activeTab==='resumes' && <ResumeTable />}
          {activeTab==='bulk' && <BulkUpload />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
