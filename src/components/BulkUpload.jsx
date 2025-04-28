import React, { useState } from 'react';
import axios from 'axios';

const BulkUpload = () => {
  const [files,setFiles]=useState([]);
  const [metadata,setMetadata]=useState('[]');
  const [result,setResult]=useState(null);
  const [error,setError]=useState('');

  const handleSubmit=async e=>{
    e.preventDefault();
    const form=new FormData();
    files.forEach(f=>form.append('resumes',f));
    form.append('metadata',metadata);
    try {
      const token=localStorage.getItem('adminToken');
      const { data } = await axios.post('/api/admin/bulk-resumes', form,{
        headers:{ Authorization:`Bearer ${token}` }
      });
      setResult(data);
      setError('');
    } catch {
      setError('Bulk upload failed');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-4">Bulk Resume Upload</h2>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select Files</label>
          <input type="file" multiple accept=".pdf,.doc,.docx"
            onChange={e=>setFiles(Array.from(e.target.files))}
            className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Metadata JSON</label>
          <textarea rows={6}
            className="w-full p-2 border rounded"
            value={metadata}
            onChange={e=>setMetadata(e.target.value)}
            placeholder='[ {"name":"...",...}, ... ]' />
        </div>
        <button type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Upload</button>
      </form>
      {result && (
        <pre className="mt-4 bg-gray-100 p-4 rounded overflow-x-auto text-sm">
          {JSON.stringify(result,null,2)}
        </pre>
      )}
    </div>
  );
};

export default BulkUpload;
