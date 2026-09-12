const sharp = require('sharp');

async function processImage() {
  const imgPath = 'C:/Users/Thanvi/.gemini/antigravity/brain/f4cdede2-86f3-4b93-9f09-375c1869adc3/.user_uploaded/media_1788095934493.png';
  const { data, info } = await sharp(imgPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    const a = data[i+3];
    
    // If it's a semi-transparent edge pixel
    if (a > 0 && a < 255) {
       // If it's dark (the "dark marks")
       if (r < 100 && g < 100 && b < 100) {
          // Erase it!
          data[i+3] = 0;
       }
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile('public/emblem-transparent.png');
    
  console.log('EDGES CLEANED');
}

processImage().catch(console.error);
