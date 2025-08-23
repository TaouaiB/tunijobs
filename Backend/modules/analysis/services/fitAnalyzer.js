// Backend/modules/analysis/services/fitAnalyzer.js
let OpenAI;
try { OpenAI = require('openai'); } catch { OpenAI = null; }

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const client = OpenAI && process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function safeJson(s) {
  try { return JSON.parse(s); } catch {}
  const m = typeof s === 'string' ? s.match(/\{[\s\S]*\}/) : null;
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return { fit: '', score: 0, strengths: [], weaknesses: [], suggestions: [], _raw: s };
}

/**
 * Returns: { fit, score, strengths[], weaknesses[], suggestions[] }
 * Throws if OpenAI is not configured; your service layer catches and stores parseError.
 */
async function analyzeResumeFit(resumeText, jobDescription) {
  if (!client) throw new Error('OpenAI not configured');

  const prompt = [
    'You are a recruitment assistant. Compare the resume and job description.',
    'Return ONLY valid JSON with keys: fit (string), score (0-100), strengths (string[]), weaknesses (string[]), suggestions (string[]).',
    'No prose, no markdown, no code fences.',
    `Resume:\n${String(resumeText).slice(0, 80_000)}`,
    `Job Description:\n${String(jobDescription || '').slice(0, 20_000)}`,
  ].join('\n\n');

  const resp = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = resp?.choices?.[0]?.message?.content || '{}';
  return safeJson(raw);
}

module.exports = { analyzeResumeFit, MODEL };
