import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function postUpload(req, res) {
  const token = req.headers['x-token'];
  const {
    name, type, data, parentId, isPublic,
  } = req.body;

  const acceptedType = ['folder', 'file', 'image'];

  let storagePath = process.env.FOLDER_PATH || '/tmp/files_manager';

  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) {
    return res.status(401).send({
      message: 'Unauthorized',
    });
  }

  if (!name) {
    return res.status(400).send({
      message: 'Missing name',
    });
  }

  if (!type || !acceptedType.includes(type)) {
    return res.status(400).send({
      message: 'Missing type',
    });
  }

  if (!data && type !== 'folder') {
    return res.status(400).send({
      message: 'Missing data',
    });
  }

  try {
    const files = dbClient.database.collection('files');

    if (parentId) {
      const file = await files.findOne({ parentId });

      if (!file) {
        return res.status(400).send({
          message: 'Parent not found',
        });
      }

      if (file && file.type !== 'folder') {
        return res.status(400).send({
          message: 'Parent is not a folder',
        });
      }
    }

    const localPathFile = uuidv4();

    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }

    if (type === 'file' || type === 'image') {
      storagePath = path.join(storagePath, localPathFile);
    }

    if (data) {
      const decodedData = Buffer.from(data, 'base64').toString('utf-8');
      fs.writeFileSync(storagePath, decodedData);
    }

    const newFile = await files.insertOne({
      userId,
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || 0,
      localPath: storagePath,
    });

    return res.status(201).json({
      id: newFile.insertedId,
      userId,
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || 0,
    });
  } catch (err) {
    return res.status(500).send({
      error: err,
    });
  }
}

export default { postUpload };
