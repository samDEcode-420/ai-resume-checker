const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Bull = require('bull');
const { db, Sequelize } = require('./models');
const { Op } = Sequelize;

const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedExt = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(ext && allowedExt.includes(ext) ? null : new Error('Only PDF, DOC, DOCX allowed'), ext && allowedExt.includes(ext));
  }
});

const resumeQueue = new Bull('resume-processing', { redis: { port: 6379, host: '127.0.0.1' } });

function deleteFile(fp) { if (fs.existsSync(fp)) fs.unlinkSync(fp); }

// Create or update resume
app.post(
  '/api/resumes',
  upload.single('resume'),
  [
    body('name').notEmpty(),
    body('sapId').matches(/^5\d{8}$/),
    body('email').isEmail().matches(/@stu\.upes\.ac\.in$/),
    body('program').isIn(['BBA','MBA']),
    body('course').notEmpty()
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ errors: errs.array() });
    }
    const { name, sapId, email, program, course } = req.body;
    const filePath = req.file.path;
    try {
      let record = await db.Resumes.findOne({ where:{ [Op.or]:[{ sapId},{ email }] } });
      let isUpdate=false, previousScore=null;
      if (record) {
        deleteFile(record.filePath);
        previousScore=record.score;
        Object.assign(record,{ name,sapId,email,program,course,filePath,status:'pending',score:null,recommendations:null,summary:null });
        await record.save();
        isUpdate=true;
      } else {
        record = await db.Resumes.create({ name,sapId,email,program,course,filePath,status:'pending' });
      }
      await resumeQueue.add({ resumeId: record.id });
      res.status(201).json({ id: record.id, isUpdate, previousScore });
    } catch (err) {
      console.error(err);
      if (req.file) deleteFile(req.file.path);
      res.status(500).json({ error:'Server error' });
    }
  }
);

// Fetch processed resume
app.get('/api/resumes/:id', async (req, res) => {
  try {
    const rec = await db.Resumes.findByPk(req.params.id);
    if (!rec) return res.status(404).json({ error:'Not found' });
    res.json({
      id: rec.id,
      status: rec.status,
      score: rec.score,
      recommendations: rec.recommendations,
      summary: rec.summary
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:'Server error' });
  }
});

// Admin routes mounted below…

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
