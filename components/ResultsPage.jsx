import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ResultsPage = ({ resumeId }) => {
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);

  useEffect(()=>{
    (async()=>{
      try {
        const { data } = await axios.get(`/api/resumes/${resumeId}`);
        setData(data);
      } catch {
        setError('Failed to load resume results.');
      } finally {
        setLoading(false);
      }
    })();
  },[resumeId]);

  if(loading) return <div className="text-center py-10">Loading...</div>;
  if(error) return <div className="text-center text-red-500 py-10">{error}</div>;

  const recs = JSON.parse(data.recommendations||'[]');
  const sum = JSON.parse(data.summary||'{}');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Resume Check Result</h1>
      <div className="mb-6 p-4 border-l-4 border-blue-500 bg-blue-50">
        <h2 className="text-xl font-semibold">Score: {data.score} / 100</h2>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
        <ul className="list-disc list-inside space-y-1">
          {recs.map((r,i)=><li key={i}>{r}</li>)}
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Summary</h3>
        <p><strong>Name:</strong> {sum.name||'N/A'}</p>
        <p><strong>Education:</strong> {(sum.education||[]).join('; ')}</p>
        <p><strong>Experience:</strong> {(sum.experience||[]).join('; ')}</p>
        <p><strong>Key Skills:</strong> {(sum.keySkills||[]).join(', ')}</p>
      </div>
    </div>
  );
};

export default ResultsPage;
