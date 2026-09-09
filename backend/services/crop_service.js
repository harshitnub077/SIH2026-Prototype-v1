const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const config = require('../config');

async function getBoundingBoxes(imagePath) {
  if (!config.gemini?.apiKey) return null;
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  const payload = {
    contents: [
      {
        parts: [
          { text: "Detect EVERY individual packaged product (like chips, biscuits, bottles) in this image. If there are multiple products side-by-side, you MUST return a separate bounding box for each one. Return ONLY a valid JSON array of objects. Format: [ { \"ymin\": 0, \"xmin\": 0, \"ymax\": 1000, \"xmax\": 1000 } ]. Do not include markdown." },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
        ]
      }
    ],
    generationConfig: { temperature: 0.0, responseMimeType: "application/json" }
  };

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${config.gemini.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    
    const cleanedText = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
    const boxes = JSON.parse(cleanedText);
    return Array.isArray(boxes) ? boxes : null;
  } catch (err) {
    console.error('[CropService] Error fetching boxes:', err.message);
    return null;
  }
}

async function detectAndCropProducts(imagePath) {
  try {
    const boxes = await getBoundingBoxes(imagePath);
    if (!boxes || boxes.length <= 1) {
      return [imagePath];
    }
    
    const metadata = await sharp(imagePath).metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    const cropPaths = [];
    let i = 0;
    for (const box of boxes) {
      const left = Math.floor((box.xmin / 1000) * width);
      const top = Math.floor((box.ymin / 1000) * height);
      const cropWidth = Math.floor(((box.xmax - box.xmin) / 1000) * width);
      const cropHeight = Math.floor(((box.ymax - box.ymin) / 1000) * height);
      
      const safeLeft = Math.max(0, left);
      const safeTop = Math.max(0, top);
      const safeWidth = Math.min(width - safeLeft, cropWidth);
      const safeHeight = Math.min(height - safeTop, cropHeight);
      
      if (safeWidth > 50 && safeHeight > 50) {
        const ext = path.extname(imagePath);
        const name = path.basename(imagePath, ext);
        const cropPath = path.join(path.dirname(imagePath), `${name}_crop_${i}${ext}`);
        
        await sharp(imagePath)
          .extract({ left: safeLeft, top: safeTop, width: safeWidth, height: safeHeight })
          .toFile(cropPath);
          
        cropPaths.push(cropPath);
        i++;
      }
    }
    
    return cropPaths.length > 0 ? cropPaths : [imagePath];
  } catch (err) {
    console.error('[CropService] Error cropping products:', err.message);
    return [imagePath];
  }
}

module.exports = { detectAndCropProducts };
