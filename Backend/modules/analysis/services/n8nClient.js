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

    if (res.status >= 400) {
      const body = await res.text();
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
  const toArr = (v) =>
    Array.isArray(v) ? v
    : v ?
      String(v)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const score = Number(n8n?.fit_score);
  return {
    name: '',
    email: '',
    phone: '',
    skills: toArr(n8n?.key_strengths), // or use missing_skills if you prefer
    experience: [],
    education: [],
    rawData: n8n || {},
    parsedAt: new Date(),
    parserVersion: 'n8n:gpt-oss-20b',
    confidence:
      Number.isFinite(score) ?
        Math.max(0, Math.min(100, score)) / 100
      : undefined,
  };
}

module.exports = { analyzeByText, mapN8nToParsedResume };
