const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createApp } = require('./app');
const { connectMongo } = require('./db');

const port = Number(process.env.PORT || 3002);
const uri = process.env.MONGODB_URI;

if (!uri) {
  // eslint-disable-next-line no-console
  console.error('MONGODB_URI is required');
  process.exit(1);
}

connectMongo(uri)
  .then((m) => {
    // eslint-disable-next-line no-console
    console.log(`MongoDB connected (database: ${m.connection.name})`);
    const app = createApp();
    app.listen(port, '0.0.0.0', () => {
      // eslint-disable-next-line no-console
      console.log(`exam-service listening on ${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
