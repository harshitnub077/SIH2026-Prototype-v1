const config = require('../config');

const AUDITOR_MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.6-flash'];

async function queryGeminiText(prompt, modelName, apiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function queryGroqText(prompt) {
  const apiKey = config.groq?.apiKey || process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.2
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Groq status ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function generateAIAuditorAnalysis(fieldsMap, violations, rawText) {
  const prompt = `You are an expert Legal Metrology Compliance Auditor in India. 
You are reviewing a product label for compliance with the Legal Metrology (Packaged Commodities) Rules, 2011.

Here is the extracted data from the label:
${JSON.stringify(fieldsMap, null, 2)}

Here are the violations flagged by our deterministic rules engine:
${JSON.stringify(violations.map(v => ({ rule: v.ruleId || v.rule_id, status: v.status, detail: v.detail })), null, 2)}

Write a professional, concise 2-paragraph compliance verdict. 
In paragraph 1, summarize the overall state of the label and the most critical missing mandatory declarations (e.g. MRP, Net Quantity). 
In paragraph 2, cite the specific Legal Metrology rules (e.g. Rule 6, Rule 32) and explain the potential legal consequences for the manufacturer/importer if this is not rectified. 

Do NOT output markdown headers, just return plain text paragraphs separated by a double newline. Be authoritative, precise, and act like a senior legal auditor.`;

  // 1. Try Gemini fast models
  if (config.gemini?.enabled && config.gemini?.apiKey) {
    for (const m of AUDITOR_MODELS) {
      try {
        const text = await queryGeminiText(prompt, m, config.gemini.apiKey);
        if (text) return text;
      } catch (err) {
        console.warn(`[Auditor] ${m} failed (${err.message}), trying next...`);
      }
    }
  }

  // 2. Try Groq fast LLM
  try {
    const text = await queryGroqText(prompt);
    if (text) return text;
  } catch (err) {
    console.warn('[Auditor] Groq fallback failed:', err.message);
  }

  return null;
}

module.exports = { generateAIAuditorAnalysis };
