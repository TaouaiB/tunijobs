// Prefer axios when available but fall back to native fetch
let axios;
try {
  axios = require('axios');
} catch {
  axios = null;
}

const N8N_URL = process.env.N8N_WEBHOOK_URL;
const N8N_TIMEOUT_MS = Number(process.env.N8N_TIMEOUT_MS || 30000);

function extractJsonFromText(s) {
  if (typeof s !== 'string') return null;
  // Try whole string first
  try {
    return JSON.parse(s);
  } catch {}
  // Then try to find a {...} block (last match usually the clean JSON)
  const matches = s.match(/\{[\s\S]*\}/g);
  if (matches && matches.length) {
    for (let i = matches.length - 1; i >= 0; i--) {
      try {
        return JSON.parse(matches[i]);
      } catch {}
    }
  }
  return null;
}

function normalizeProviderPayload(payload) {
  // n8n may wrap provider response in an array
  const p = Array.isArray(payload) ? payload[0] : payload;

  // DeepInfra/OpenAI-style
  const choice = p?.choices?.[0];
  const text = choice?.message?.content ?? choice?.text ?? p?.text ?? p;

  if (typeof text === 'object') return text; // already JSON
  const parsed = extractJsonFromText(String(text || ''));
  return (
    parsed ?? {
      fit_score: 0,
      missing_skills: [],
      key_strengths: [],
      suggested_improvements: [],
    }
  );
}

async function analyzeByText(resumeText, jobDescription) {
  if (!N8N_URL) throw new Error('N8N_WEBHOOK_URL not set');

  // Add this function to clean text before sending to n8n
  const cleanResumeText = (text) => {
    return (
      String(text || '')
        // Remove problematic Unicode symbols (, , , etc.)
        .replace(/[\u{E000}-\u{F8FF}]/gu, '')
        // Remove other non-ASCII characters except basic punctuation
        .replace(/[^\x20-\x7E\n\t]/g, '')
        // Replace newlines with commas
        .replace(/\n/g, ', ')
        // Escape quotes and backslashes
        .replace(/"/g, '\\"')
        .replace(/\\/g, '\\\\')
        // Remove extra commas and spaces
        .replace(/, , /g, ', ')
        .replace(/\s+/g, ' ')
        .trim()
        // Limit length
        .slice(0, 10000)
    );
  };

  // Use it in your analyzeByText function:
  const payload = {
    resume: cleanResumeText(resumeText),
    jd: cleanResumeText(jobDescription),
  };

  console.log('[N8N] POST', N8N_URL);

  if (axios) {
    const res = await axios.post(N8N_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: N8N_TIMEOUT_MS,
      validateStatus: () => true,
    });
    console.log('[N8N] status:', res.status);

    // 👀 Helpful during MVP to inspect the raw shape coming back from n8n
    try {
      const preview =
        typeof res.data === 'string' ?
          res.data.slice(0, 400)
        : JSON.stringify(res.data).slice(0, 400);
      console.log('[N8N] raw preview:', preview);
    } catch {}

    if (res.status >= 400) {
      const body =
        typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      console.error('[N8N] error body:', body);
      throw new Error(`n8n request failed (${res.status})`);
    }

    return normalizeProviderPayload(res.data);
  }

  // Fallback to built-in fetch with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);
  const res = await fetch(N8N_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  console.log('[N8N] status:', res.status);

  if (res.status >= 400) {
    console.error('[N8N] error body:', res.data);
    throw new Error(`n8n request failed (${res.status})`);
  }

  const data = await res.json().catch(() => ({}));
  return normalizeProviderPayload(data);
}

function mapN8nToParsedResume(n8n) {
  // Always return an array of strings (coerces object items too)
  const toStrArr = (v) =>
    Array.isArray(v) ?
      v
        .map((x) =>
          typeof x === 'string' ? x.trim()
          : x && typeof x === 'object' ? Object.values(x).join(' ').trim()
          : ''
        )
        .filter(Boolean)
    : v ?
      String(v)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const asStr = (v) => (typeof v === 'string' ? v.trim() : '');

  const score = Number(n8n?.fit_score);
  const name = asStr(n8n?.name);
  const email = asStr(n8n?.email);
  const phone = asStr(n8n?.phone);

  // Map to EXACT schema keys:
  // experience[] -> { title, company, duration, description }
  const mkExp = (it) => {
    if (!it) return null;
    if (typeof it === 'string')
      return { title: '', company: '', duration: '', description: it.trim() };
    if (typeof it === 'object') {
      const title = asStr(it.title || it.role || it.position);
      const company = asStr(it.company || it.employer);
      const duration = asStr(it.duration || it.dates || it.period);
      const description = asStr(it.description || it.summary || it.details);
      const obj = {};
      title && (obj.title = title);
      company && (obj.company = company);
      duration && (obj.duration = duration);
      description && (obj.description = description);
      return Object.keys(obj).length ? obj : null;
    }
    return null;
  };

  // education[] -> { degree, institution, year }
  const mkEdu = (it) => {
    if (!it) return null;
    if (typeof it === 'string')
      return { degree: it.trim(), institution: '', year: '' };
    if (typeof it === 'object') {
      const degree = asStr(it.degree || it.title);
      const institution = asStr(it.institution || it.school || it.university);
      const year = asStr(it.year || it.dates || it.period);
      const obj = {};
      degree && (obj.degree = degree);
      institution && (obj.institution = institution);
      year && (obj.year = year);
      return Object.keys(obj).length ? obj : null;
    }
    return null;
  };

  const experience =
    Array.isArray(n8n?.experience) ?
      n8n.experience.map(mkExp).filter(Boolean)
    : [];
  const education =
    Array.isArray(n8n?.education) ?
      n8n.education.map(mkEdu).filter(Boolean)
    : [];

  return {
    name,
    email,
    phone,
    skills: toStrArr(n8n?.key_strengths), // [String]
    experience, // {title, company, duration, description}
    education, // {degree, institution, year}
    rawData: n8n || {},
    parsedAt: new Date(),
    parserVersion: 'n8n:gpt-oss-20b',
    confidence:
      Number.isFinite(score) ?
        Math.max(0, Math.min(100, score)) / 100
      : undefined,
  };
}

// === Cover Letter analysis (n8n) ===
const N8N_COVERLETTER_URL = process.env.N8N_COVERLETTER_URL;

const cleanCLText = (text) =>
  String(text || '')
    .replace(/[\u{E000}-\u{F8FF}]/gu, '')
    .replace(/[^\x20-\x7E\n\t]/g, '')
    .replace(/\n/g, ', ')
    .replace(/"/g, '\\"')
    .replace(/\\/g, '\\\\')
    .replace(/, , /g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10000);


module.exports = {
  analyzeByText,
  mapN8nToParsedResume,
};
