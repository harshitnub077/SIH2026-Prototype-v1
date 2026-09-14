const sharp = require('sharp');

async function processImage() {
  const imgPath = 'public/emblem-transparent-old.png';
  const { data, info } = await sharp(imgPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  
  // Create a copy of the alpha channel to check adjacency
  const oldA = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    oldA[i/4] = data[i+3];
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx+3];
      
      if (a > 0 && a < 255) {
        // Check if adjacent to a fully transparent pixel
        let isEdge = false;
        if (oldA[(y-1)*width + x] === 0) isEdge = true;
        if (oldA[(y+1)*width + x] === 0) isEdge = true;
        if (oldA[y*width + x - 1] === 0) isEdge = true;
        if (oldA[y*width + x + 1] === 0) isEdge = true;
        
        if (isEdge) {
           const r = data[idx];
           const g = data[idx+1];
           const b = data[idx+2];
           // If it's a dark edge pixel, erase it
           if (r < 120 && g < 120 && b < 120) {
              data[idx+3] = 0;
           }
        } else {
           // If it's INSIDE the lion (like the eyes), make it fully opaque so it doesn't show background!
           data[idx+3] = 255;
        }
      }
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile('public/emblem-transparent.png');
    
  console.log('SCARS FIXED');
}

processImage().catch(console.error);
