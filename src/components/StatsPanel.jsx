import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StatsPanel = () => {
  const [stats,setStats]=useState(null);
  const [error,setError]=useState('');

  useEffect(()=>{
    (async()=>{
      try {
        const token=localStorage.getItem('adminToken');
        const { data } = await axios.get('/api/admin/resumes/stats',{
          headers:{ Authorization:`Bearer ${token}` }
        });
        setStats(data);
      } catch {
        setError('Unable to load statistics');
      }
    })();
  },[]);

  if(error) return <p className="text-red-600">{error}</p>;
  if(!stats) return <p className="text-gray-600">Loading stats...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {['BBA','MBA'].map(prog=>(
        <div key={prog} className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">{prog} Program</h2>
          <p><strong>Highest:</strong> {stats[prog].highest?.name||'N/A'} ({stats[prog].highest?.score||'-'})</p>
          <p><strong>Lowest:</strong> {stats[prog].lowest?.name||'N/A'} ({stats[prog].lowest?.score||'-'})</p>
        </div>
      ))}
      {stats.courses && Object.entries(stats.courses).map(([course,data])=>(
        <div key={course} className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-medium mb-3">{course}</h2>
          <p><strong>Highest:</strong> {data.highest?.name||'N/A'} ({data.highest?.score||'-'})</p>
          <p><strong>Lowest:</strong> {data.lowest?.name||'N/A'} ({data.lowest?.score||'-'})</p>
        </div>
      ))}
    </div>
  );
};

export default StatsPanel;
