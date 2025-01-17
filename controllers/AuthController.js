const { Buffer } = require('node:buffer');
const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

async function getConnect(req, res) {
  const authHeader = req.headers.authorization;

  const encodedCredentials = authHeader
    .trim()
    .replace(/Basic\s+/i, '');

  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('ascii');

  const [email, password] = decodedCredentials.split(':');

  const users = dbClient.database.collection('users');
  const existingUser = await users.findOne({ email, password: sha1(password) });

  if (!existingUser) {
    return res.status(401).send({
      error: 'Unauthorized',
    });
  }
  const token = uuidv4();

  await redisClient.set(`auth_${token}`, existingUser._id.toString(), 86400);

  return res.status(200).json({ token });
}

async function getDisconnect(req, res) {
  const token = req.headers['x-token'];

  const connectedUser = await redisClient.get(`auth_${token}`);

  if (!connectedUser) {
    res.status(400).json({ error: 'Unauthorized' });
  }

  await redisClient.del(`auth_${token}`);
  res.status(204);
}

module.exports = { getConnect, getDisconnect };
