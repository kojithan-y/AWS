require('dotenv').config();
const { createApp } = require('./app');
const { connectMongo } = require('./db');

const port = Number(process.env.PORT || 3000);
const uri = process.env.MONGODB_URI;

if (!uri) {
  // eslint-disable-next-line no-console
  console.error('MONGODB_URI is required');
  process.exit(1);
}

connectMongo(uri)
  .then(() => {
    const app = createApp();
    app.listen(port, '0.0.0.0', () => {
      // eslint-disable-next-line no-console
      console.log(`student-service listening on ${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
