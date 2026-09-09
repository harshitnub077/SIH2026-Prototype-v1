
// --- STEP 3B: NVIDIA NIM VISION FALLBACK ---
async function runNvidiaVision(imagePaths, attempt = 1, modelName = 'meta/llama-3.2-90b-vision-instruct') {
  if (!config.nvidia?.enabled || !config.nvidia?.apiKey) {
    throw new Error('NVIDIA API key not configured.');
  }

  const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths];
  const mimeType = 'image/jpeg';
  
  const contentArray = [
    { type: 'text', text: STRUCTURED_PROMPT }
  ];
  
  for (const p of paths) {
    const base64Image = require('fs').readFileSync(p).toString('base64');
    contentArray.push({
      type: 'image_url',
      image_url: { url: 'data:' + mimeType + ';base64,' + base64Image }
    });
  }

  try {
    const payload = {
      model: modelName,
      messages: [
        {
          role: 'user',
          content: contentArray
        }
      ],
      max_tokens: 2048,
      temperature: 0.0
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + config.nvidia.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error('NVIDIA API returned ' + response.status + ': ' + errText);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';
    
    const cleaned = responseText.replace(/\\\(?:json)?\s*/g, '').replace(/\\\\s*$/g, '').trim();

    let structuredData;
    let rawText = '';

    try {
      const jsonMatch = cleaned.match(/[\[\{][\s\S]*[\]\}]/);
      const rawParsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleaned);
      const toValidate = Array.isArray(rawParsed.products) ? rawParsed : { products: Array.isArray(rawParsed) ? rawParsed : [rawParsed] };
      structuredData = AIResponseSchema.parse(toValidate);
    } catch (parseErr) {
      console.warn('[OCR] JSON parse/Zod validation failed (NVIDIA):', parseErr.message);
      throw new Error('AI hallucinated bad JSON schema: ' + parseErr.message);
    }

    rawText = structuredData._raw_text || responseText;
    console.log('[OCR] NVIDIA NIM API extraction complete');

    return {
      text: rawText,
      structuredData,
      confidence: 96,
      engine: 'nvidia'
    };

  } catch (err) {
    if (attempt < 3) {
      err.attemptHistory = (err.attemptHistory || '') + '[Attempt ' + attempt + ' NVIDIA: ' + err.message + '] ';
      console.warn('[OCR] NVIDIA failed (' + err.message + ') - retrying...');
      await new Promise(r => setTimeout(r, 2000));
      return runNvidiaVision(paths, attempt + 1, modelName);
    }
    throw err;
  }
}

