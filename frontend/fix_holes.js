const sharp = require('sharp');

async function processImage() {
  const imgPath = 'public/emblem-transparent-old.png'; // The original flawed transparent PNG
  const { data, info } = await sharp(imgPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  
  const isBg = new Uint8Array(width * height);
  const stack = [];
  
  // Initialize stack with the absolute borders
  for (let x = 0; x < width; x++) {
    stack.push({x, y: 0});
    stack.push({x, y: height - 1});
  }
  for (let y = 0; y < height; y++) {
    stack.push({x: 0, y});
    stack.push({x: width - 1, y});
  }

  // Flood fill from borders to find the "TRUE BACKGROUND"
  while (stack.length > 0) {
    const {x, y} = stack.pop();
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    
    const idx = y * width + x;
    if (isBg[idx]) continue;
    
    const a = data[idx * 4 + 3];
    // If it's highly transparent, it's background
    if (a < 200) {
      isBg[idx] = 1;
      stack.push({x: x+1, y});
      stack.push({x: x-1, y});
      stack.push({x, y: y+1});
      stack.push({x, y: y-1});
    }
  }

  // Now, any pixel that is highly transparent (a < 200) but is NOT TRUE BACKGROUND is a hole!
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const a = data[idx * 4 + 3];
      
      if (!isBg[idx] && a < 255) {
        // It's a hole! Fill it with white and make it opaque
        data[idx * 4] = 230;     // R
        data[idx * 4 + 1] = 230; // G
        data[idx * 4 + 2] = 230; // B
        data[idx * 4 + 3] = 255; // A
      }
      
      // Also, while we are here, let's fix the dark edges of the TRUE BACKGROUND
      if (isBg[idx] && a > 0) {
        const r = data[idx * 4];
        const g = data[idx * 4 + 1];
        const b = data[idx * 4 + 2];
        if (r < 120 && g < 120 && b < 120) {
          data[idx * 4 + 3] = 0; // Erase dark halos
        }
      }
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile('public/emblem-transparent.png');
    
  console.log('HOLES FILLED AND EDGES CLEANED');
}

processImage().catch(console.error);
