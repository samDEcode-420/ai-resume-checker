import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import upesLogo from '../assets/upes_logo.png';

const courses = {
  BBA: [
    'Analytics & Big Data', 'Aviation', 'Digital Business', 'Foreign Trade',
    'Global', 'Green Energy & Sustainability', 'Logistics Management',
    'Oil & Gas', 'Plain'
  ],
  MBA: [
    'Aviation', 'Business Analytics', 'Core', 'Digital Business', 'Global',
    'International Business', 'Logistics & Supply Chain', 'Metaverse & Web 3.0',
    'Oil & Gas', 'Power Management', 'Strategy & Consulting'
  ]
};

const SUPPORTED_FORMATS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  sapId: Yup.string()
    .matches(/^5\d{8}$/, 'SAP ID must be 9 digits starting with 5')
    .required('SAP ID is required'),
  email: Yup.string()
    .email('Enter a valid email')
    .matches(/^[\w._%+-]+@stu\.upes\.ac\.in$/, 'Email must end with @stu.upes.ac.in')
    .required('Email is required'),
  program: Yup.string()
    .oneOf(Object.keys(courses), 'Select a valid program')
    .required('Program is required'),
  course: Yup.string().when('program', {
    is: val => val && courses[val],
    then: Yup.string()
      .oneOf(courses[Yup.ref('program')] || [], 'Select a valid course')
      .required('Course is required')
  }),
  resume: Yup.mixed()
    .required('Resume file is required')
    .test('fileFormat', 'Unsupported Format. Only PDF, DOC, DOCX allowed',
      value => value && SUPPORTED_FORMATS.includes(value.type)
    )
});

const UploadForm = () => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { name: '', sapId: '', email: '', program: '', course: '', resume: null },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => formData.append(k, v));
      try {
        const { data } = await axios.post('/api/resumes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        navigate(`/results/${data.id}`, { state: { isUpdate: data.isUpdate, previousScore: data.previousScore } });
      } catch (err) {
        console.error(err);
        alert('Failed to upload resume. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <img src={upesLogo} alt="UPES Logo" className="mx-auto mb-6 w-32 h-auto" />
      <form onSubmit={formik.handleSubmit}>
        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <input id="name" name="name" type="text"
            onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.name}
            className="w-full p-2 border rounded" />
          {formik.touched.name && formik.errors.name && (
            <div className="text-red-600 text-sm mt-1">{formik.errors.name}</div>
          )}
        </div>
        {/* SAP ID */}
        <div className="mb-4">
          <label htmlFor="sapId" className="block text-sm font-medium mb-1">SAP ID</label>
          <input id="sapId" name="sapId" type="text"
            onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.sapId}
            className="w-full p-2 border rounded" />
          {formik.touched.sapId && formik.errors.sapId && (
            <div className="text-red-600 text-sm mt-1">{formik.errors.sapId}</div>
          )}
        </div>
        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input id="email" name="email" type="email"
            onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.email}
            className="w-full p-2 border rounded" />
          {formik.touched.email && formik.errors.email && (
            <div className="text-red-600 text-sm mt-1">{formik.errors.email}</div>
          )}
        </div>
        {/* Program & Course */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="program" className="block text-sm font-medium mb-1">Program</label>
            <select id="program" name="program"
              onChange={e => { formik.handleChange(e); formik.setFieldValue('course', ''); }}
              onBlur={formik.handleBlur} value={formik.values.program}
              className="w-full p-2 border rounded">
              <option value="">Select Program</option>
              {Object.keys(courses).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {formik.touched.program && formik.errors.program && (
              <div className="text-red-600 text-sm mt-1">{formik.errors.program}</div>
            )}
          </div>
          <div>
            <label htmlFor="course" className="block text-sm font-medium mb-1">Course</label>
            <select id="course" name="course"
              onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.course}
              disabled={!formik.values.program} className="w-full p-2 border rounded">
              <option value="">Select Course</option>
              {formik.values.program && courses[formik.values.program].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {formik.touched.course && formik.errors.course && (
              <div className="text-red-600 text-sm mt-1">{formik.errors.course}</div>
            )}
          </div>
        </div>
        {/* Resume */}
        <div className="mb-6">
          <label htmlFor="resume" className="block text-sm font-medium mb-1">
            Resume (PDF, DOC, DOCX)
          </label>
          <input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx"
            onChange={e => formik.setFieldValue('resume', e.currentTarget.files[0])}
            className="w-full" />
          {formik.touched.resume && formik.errors.resume && (
            <div className="text-red-600 text-sm mt-1">{formik.errors.resume}</div>
          )}
        </div>
        {/* Submit */}
        <button type="submit" disabled={formik.isSubmitting}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
          {formik.isSubmitting ? 'Submitting...' : 'Submit Resume'}
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
