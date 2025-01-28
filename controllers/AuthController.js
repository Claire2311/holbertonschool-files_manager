import { Buffer } from 'node:buffer';
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function getConnect(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const encodedCredentials = authHeader
    .trim()
    .replace(/Basic\s+/i, '');
  try {
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('ascii');

    const [email, password] = decodedCredentials.split(':');

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !email.match(regexEmail) || !password) {
      return res.status(400).json({
        error: 'Email or password are incorrect',
      });
    }

    const users = dbClient.database.collection('users');
    const existingUser = await users.findOne({ email, password: sha1(password) });

    if (!existingUser) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }
    const token = uuidv4();

    await redisClient.set(`auth_${token}`, existingUser._id.toString(), 86400);

    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({
      error: err,
    });
  }
}

async function getDisconnect(req, res) {
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const connectedUser = await redisClient.get(`auth_${token}`);

    if (!connectedUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.del(`auth_${token}`);
    return res.status(204);
  } catch (err) {
    return res.status(500).json({
      error: err,
    });
  }
}

export default { getConnect, getDisconnect };
