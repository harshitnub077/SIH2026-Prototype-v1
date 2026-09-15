const sharp = require('sharp');

async function processImage() {
  const imgPath = 'C:/Users/Thanvi/.gemini/antigravity/brain/f4cdede2-86f3-4b93-9f09-375c1869adc3/emblem_white_bg_1788094694523.jpg';
  const { data, info } = await sharp(imgPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  
  // Create a mask array (1 = keep, 0 = transparent)
  const mask = new Uint8Array(width * height);
  
  function isBg(x, y) {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx+1];
    const b = data[idx+2];
    
    // Pure white or very light gray
    if (r > 200 && g > 200 && b > 200) return true;
    
    // Grayscale artifacts (JPEG noise)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    // If it's a gray pixel (low color saturation) and not too dark
    if (diff < 25 && max > 80) {
      return true;
    }
    
    return false;
  }

  const stack = [
    {x: 0, y: 0}, {x: width-1, y: 0}, 
    {x: 0, y: height-1}, {x: width-1, y: height-1}
  ];
  
  const visited = new Uint8Array(width * height);

  while (stack.length > 0) {
    const {x, y} = stack.pop();
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    
    const pIdx = y * width + x;
    if (visited[pIdx]) continue;
    visited[pIdx] = 1;
    
    if (isBg(x, y)) {
      data[pIdx * 4 + 3] = 0; 
      stack.push({x: x+1, y});
      stack.push({x: x-1, y});
      stack.push({x, y: y+1});
      stack.push({x, y: y-1});
    }
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] === 255) {
        let transNeighbors = 0;
        if (data[((y-1)*width + x)*4 + 3] === 0) transNeighbors++;
        if (data[((y+1)*width + x)*4 + 3] === 0) transNeighbors++;
        if (data[(y*width + x-1)*4 + 3] === 0) transNeighbors++;
        if (data[(y*width + x+1)*4 + 3] === 0) transNeighbors++;
        
        if (transNeighbors > 0) {
           data[idx + 3] = 100; 
        }
      }
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile('public/emblem-transparent.png');
    
  console.log('PRO TRANSPARENT PNG CREATED');
}

processImage().catch(console.error);
