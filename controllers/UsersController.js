import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function postNew(req, res) {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Missing email',
    });
  }

  if (!password) {
    return res.status(400).json({
      error: 'Missing password',
    });
  }

  try {
    const users = dbClient.database.collection('users');
    const query = { email };

    const alreadyUser = await users.findOne(query);

    if (alreadyUser) {
      return res.status(400).json({
        error: 'Already exist',
      });
    }
    const hashedPassword = sha1(password);
    const newUser = await users.insertOne({ email, password: hashedPassword });

    return res.status(201).json({ id: newUser.insertedId, email });
  } catch (err) {
    return res.status(500).json({
      error: err,
    });
  }
}

async function getMe(req, res) {
  const token = req.headers['x-token'];

  const userId = await redisClient.get(`auth_${token}`);

  const users = dbClient.database.collection('users');
  const user = await users.findOne({ _id: new ObjectId(userId) });

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({ id: userId, email: user.email });
}

export default { postNew, getMe };
