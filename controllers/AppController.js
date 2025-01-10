import redisClient from '../utils/redis';
import dbClient from '../utils/db';

function getStatus(req, res) {
  if (redisClient.isAlive() && dbClient.isAlive()) {
    res.status(200).json({ redis: true, db: true });
  } else {
    res.status(500).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }
}

async function getStats(req, res) {
  try {
    const nbUsers = await dbClient.nbUsers();
    const nbFiles = await dbClient.nbFiles();
    res.status(200).json({ users: nbUsers, files: nbFiles });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getStatus,
  getStats,
};
