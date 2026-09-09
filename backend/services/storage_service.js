const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

// Clean and sanitize Supabase URL (strip trailing /rest/v1 if present)
const rawUrl = process.env.SUPABASE_URL || 'https://omkjlsjazonebqiqvqlb.supabase.co';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ta2psc2phem9uZWJxaXF2cWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MDY0MjYsImV4cCI6MjEwMTQ4MjQyNn0.kKVFlQk8EF_XMqFRaglmaPYY-lvtILB6jq2Iqu02s5Y';

const supabase = createClient(cleanUrl, supabaseKey);

const BUCKET_NAME = 'metrolens-uploads';

/**
 * Uploads an image buffer to Supabase Storage and returns public URL.
 * Gracefully falls back to local storage if bucket is missing or unconfigured.
 */
async function uploadImageToCloud(fileBuffer, originalName, mimetype) {
  try {
    const ext = path.extname(originalName).toLowerCase() || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(filename, fileBuffer, {
        contentType: mimetype,
        upsert: false
      });

    if (error) {
      console.warn(`[Storage] Supabase upload failed (${error.message}). Using resilient local fallback.`);
      return saveLocalFallback(fileBuffer, originalName);
    }

    const { data: publicUrlData } = supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn(`[Storage] Cloud storage exception (${err.message}). Using resilient local fallback.`);
    return saveLocalFallback(fileBuffer, originalName);
  }
}

function saveLocalFallback(fileBuffer, originalName) {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const filename = `${randomUUID()}${ext}`;
  const localPath = path.join(uploadDir, filename);
  fs.writeFileSync(localPath, fileBuffer);
  return `/uploads/${filename}`;
}

module.exports = { uploadImageToCloud };
