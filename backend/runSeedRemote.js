const https = require('https');
const { execSync } = require('child_process');

const options = {
  hostname: 'api.render.com',
  path: '/v1/postgres/dpg-da68ijf10e5c73ei07l0-a/connection-info',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer rnd_AP8X5BSSJJZqPLHIPAeBQiv0YVYg',
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const json = JSON.parse(data);
    const extUrl = json.externalConnectionString;
    
    if (!extUrl) {
       console.error('External connection string not found!');
       return;
    }

    console.log('Found external connection string, running seed script...');
    try {
      execSync('npm run db:seed', { 
          cwd: require('path').join(__dirname),
          env: { ...process.env, DATABASE_URL: extUrl }, 
          stdio: 'inherit' 
      });
      console.log('Seed successful!');
    } catch (e) {
      console.error('Failed to seed:', e.message);
    }
  });
});
req.end();
