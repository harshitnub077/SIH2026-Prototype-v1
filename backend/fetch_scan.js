const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgresql://metrolens:O8P80j7E9XqE5O8wL61N0oFzR0fS9d8v@dpg-cv62u1tds78s73dmv9fg-a.oregon-postgres.render.com/metrolens_dev_db', {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false
});

async function run() {
  try {
    const [results] = await sequelize.query(`
      SELECT * FROM "Scans" 
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `);
    
    if(results.length > 0) {
      console.log(JSON.stringify(results[0], null, 2));
    } else {
      console.log("No scans found.");
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
