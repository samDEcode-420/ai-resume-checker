const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { db, Sequelize } = require('../models');
const { Op } = Sequelize;

const router = express.Router();
const ADMIN_USER = process.env.ADMIN_USERNAME;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

function authMiddleware(req,res,next){
  const h = req.headers.authorization;
  if(!h) return res.status(401).json({error:'Missing token'});
  try {
    req.admin = jwt.verify(h.split(' ')[1],JWT_SECRET);
    next();
  } catch {
    res.status(403).json({error:'Invalid token'});
  }
}

// Login
router.post('/login', express.json(), (req,res)=>{
  const { username,password } = req.body;
  if(username===ADMIN_USER && password===ADMIN_PASS){
    const token = jwt.sign({ username },JWT_SECRET,{expiresIn:'4h'});
    return res.json({ token });
  }
  res.status(401).json({ error:'Invalid credentials' });
});

// List resumes
router.get('/resumes', authMiddleware, async (req,res)=>{
  const { program,course,page=1,limit=50 } = req.query;
  const where = {};
  if(program) where.program=program;
  if(course) where.course=course;
  const { count, rows } = await db.Resumes.findAndCountAll({
    where, order:[['score','DESC']],
    offset:(page-1)*limit, limit:+limit
  });
  res.json({ total:count, resumes:rows });
});

// Stats
router.get('/resumes/stats', authMiddleware, async (_req,res)=>{
  const stats = {};
  for(const prog of ['BBA','MBA']){
    stats[prog] = {
      highest: await db.Resumes.findOne({ where:{program:prog, score:{[Op.ne]:null}}, order:[['score','DESC']] }),
      lowest:  await db.Resumes.findOne({ where:{program:prog, score:{[Op.ne]:null}}, order:[['score','ASC']] })
    };
  }
  stats.courses = {};
  const courses = await db.Resumes.findAll({ attributes:[[Sequelize.fn('DISTINCT',Sequelize.col('course')),'course']] });
  for(const c of courses){
    const name = c.get('course');
    stats.courses[name] = {
      highest: await db.Resumes.findOne({ where:{course:name, score:{[Op.ne]:null}}, order:[['score','DESC']] }),
      lowest:  await db.Resumes.findOne({ where:{course:name, score:{[Op.ne]:null}}, order:[['score','ASC']] })
    };
  }
  res.json(stats);
});

// Bulk upload
const uploadBulk = multer({ storage: multer.diskStorage({
  destination:(r,f,cb)=>cb(null,'uploads/'),
  filename:(r,f,cb)=>cb(null,Date.now()+'-'+Math.round(Math.random()*1e9)+path.extname(f.originalname))
}) }).array('resumes');

router.post('/bulk-resumes', authMiddleware, (req,res)=>{
  uploadBulk(req,res,async err=>{
    if(err) return res.status(400).json({error:err.message});
    const metadata = JSON.parse(req.body.metadata||'[]');
    const results = [];
    for(let i=0;i<req.files.length;i++){
      const file = req.files[i], meta = metadata[i];
      try {
        let rec = await db.Resumes.findOne({ where:{ [Op.or]:[{sapId:meta.sapId},{email:meta.email}] } });
        if(rec) fs.unlinkSync(rec.filePath);
        const saved = rec
          ? await rec.update({ ...meta, filePath:file.path, status:'pending', score:null, recommendations:null, summary:null })
          : await db.Resumes.create({ ...meta, filePath:file.path, status:'pending' });
        await resumeQueue.add({ resumeId: saved.id });
        results.push({ id: saved.id, sapId: meta.sapId, status:'queued' });
      } catch(e){
        results.push({ sapId: meta.sapId, error: e.message });
      }
    }
    res.json({ results });
  });
});

module.exports = router;
