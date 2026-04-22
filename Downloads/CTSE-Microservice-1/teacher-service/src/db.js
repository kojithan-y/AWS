const mongoose = require('mongoose');

/**
 * When MONGODB_USER and MONGODB_PASSWORD are set, rebuild the URI so special
 * characters in the password are encoded (avoids "bad auth" from hand-edited URIs).
 * @param {string} uri
 * @returns {string}
 */
function resolveMongoUri(uri) {
  const user = process.env.MONGODB_USER;
  const pass = process.env.MONGODB_PASSWORD;
  if (!user || !pass) return uri;
  try {
    const u = new URL(uri);
    u.username = user;
    u.password = pass;
    return u.href;
  } catch {
    return uri;
  }
}

/**
 * @param {string} uri
 * @returns {Promise<typeof mongoose>}
 */
async function connectMongo(uri) {
  mongoose.set('strictQuery', true);
  return mongoose.connect(resolveMongoUri(uri));
}

async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = { connectMongo, disconnectMongo };
