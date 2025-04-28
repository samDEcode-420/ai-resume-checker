import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ResumeTable = () => {
  const [resumes,setResumes]=useState([]);
  const [filters,setFilters]=useState({ program:'', course:'' });
  const [page,setPage]=useState(1);
  const [total,setTotal]=useState(0);
  const limit=20;

  const fetchResumes=async()=>{
    const token=localStorage.getItem('adminToken');
    const params={ page, limit, ...filters };
    const { data } = await axios.get('/api/admin/resumes',{
      headers:{ Authorization:`Bearer ${token}` },
      params
    });
    setResumes(data.resumes);
    setTotal(data.total);
  };

  useEffect(()=>{ fetchResumes(); }, [filters,page]);

  const programs=['BBA','MBA'];
  const coursesList={
    BBA:['Analytics & Big Data','Aviation','Digital Business','Foreign Trade','Global','Green Energy & Sustainability','Logistics Management','Oil & Gas','Plain'],
    MBA:['Aviation','Business Analytics','Core','Digital Business','Global','International Business','Logistics & Supply Chain','Metaverse & Web 3.0','Oil & Gas','Power Management','Strategy & Consulting']
  };

  return (
    <div>
      <div className="flex space-x-4 mb-4">
        <select className="p-2 border rounded"
          value={filters.program}
          onChange={e=>{ setFilters({program:e.target.value,course:''}); setPage(1); }}>
          <option value="">All Programs</option>
          {programs.map(p=> <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="p-2 border rounded"
          value={filters.course}
          onChange={e=>setFilters(f=>({...f,course:e.target.value}))}
          disabled={!filters.program}>
          <option value="">All Courses</option>
          {filters.program&&coursesList[filters.program].map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="overflow-auto rounded-2xl shadow">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              {['Name','SAP ID','Program','Course','Score'].map(col=>(
                <th key={col} className="text-left px-4 py-2 text-sm font-medium text-gray-700">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resumes.map((r,i)=>(
              <tr key={r.id} className={i%2===0?'bg-white':'bg-gray-50'}>
                <td className="px-4 py-2 text-sm">{r.name}</td>
                <td className="px-4 py-2 text-sm">{r.sapId}</td>
                <td className="px-4 py-2 text-sm">{r.program}</td>
                <td className="px-4 py-2 text-sm">{r.course}</td>
                <td className="px-4 py-2 text-sm font-semibold">{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <button onClick={()=>setPage(p=>Math.max(p-1,1))}
          disabled={page===1}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Prev</button>
        <span className="text-sm">Page {page} of {Math.ceil(total/limit)}</span>
        <button onClick={()=>setPage(p=>p+1)}
          disabled={page>=Math.ceil(total/limit)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Next</button>
      </div>
    </div>
  );
};

export default ResumeTable;
