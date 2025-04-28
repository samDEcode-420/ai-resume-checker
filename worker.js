const Bull = require('bull');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const textract = require('textract');
const { OpenAI } = require('openai');
const { db } = require('./models');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const resumeQueue = new Bull('resume-processing', { redis:{ port:6379, host:'127.0.0.1' } });

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }
  return new Promise((res, rej) => {
    textract.fromFileWithPath(filePath, (err, text) => err ? rej(err) : res(text));
  });
}

async function scoreResume(text) {
  const prompt = `You are an expert resume evaluator… Provide only the numeric score (0–100).\nResume:\n${text}`;
  const r = await openai.chat.completions.create({
    model:'gpt-4o-mini',
    messages:[{role:'user',content:prompt}]
  });
  const sc = parseInt(r.choices[0].message.content.trim(),10);
  return isNaN(sc) ? 0 : sc;
}

async function generateRecommendations(text) {
  const prompt = `You are a career coach. Provide 4 actionable bullet-point recommendations…\nResume:\n${text}`;
  const r = await openai.chat.completions.create({
    model:'gpt-4o-mini',
    messages:[{role:'user',content:prompt}]
  });
  return r.choices[0].message.content
    .trim()
    .split(/\r?\n/)
    .filter(line => line.startsWith('-'));
}

async function extractSummary(text) {
  const prompt = `Extract candidate details into JSON with keys name, education[], experience[], keySkills[]. Output only JSON.\nResume:\n${text}`;
  const r = await openai.chat.completions.create({
    model:'gpt-4o-mini',
    messages:[{role:'user',content:prompt}]
  });
  try { return JSON.parse(r.choices[0].message.content); }
  catch { return { name:'', education:[], experience:[], keySkills:[] }; }
}

resumeQueue.process(async (job, done) => {
  try {
    const { resumeId } = job.data;
    const rec = await db.Resumes.findByPk(resumeId);
    if (!rec) throw new Error(`Resume ${resumeId} not found`);
    const text = await extractText(path.resolve(rec.filePath));
    const score = await scoreResume(text);
    const recommendations = await generateRecommendations(text);
    const summary = await extractSummary(text);
    Object.assign(rec, { status:'processed', score,
      recommendations: JSON.stringify(recommendations),
      summary: JSON.stringify(summary)
    });
    await rec.save();
    console.log(`Processed resume ${resumeId}: score=${score}`);
    done();
  } catch (err) {
    console.error('Processing error:', err);
    done(err);
  }
});
