import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
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
      error: 'Unauthorized',
    });
  }

  if (!name) {
    return res.status(400).send({
      error: 'Missing name',
    });
  }

  if (!type || !acceptedType.includes(type)) {
    return res.status(400).send({
      error: 'Missing type',
    });
  }

  if (!data && type !== 'folder') {
    return res.status(400).send({
      error: 'Missing data',
    });
  }

  try {
    const files = dbClient.database.collection('files');

    if (parentId) {
      const file = await files.findOne({ parentId });

      if (!file) {
        return res.status(400).send({
          error: 'Parent not found',
        });
      }

      if (file && file.type !== 'folder') {
        return res.status(400).send({
          error: 'Parent is not a folder',
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

async function getShow(req, res) {
  const token = req.headers['x-token'];
  const fileId = req.params.id;

  try {
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send({
        error: 'Unauthorized',
      });
    }

    const filesDb = dbClient.database.collection('files');

    const file = await filesDb.findOne({ userId, _id: new ObjectId(fileId) });

    if (!file) {
      return res.status(404).send({
        error: 'Not found',
      });
    }

    const formattedFile = {
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    };

    return res.status(200).send(formattedFile);
  } catch (err) {
    return res.status(500).send({
      error: err,
    });
  }
}

async function getIndex(req, res) {
  const token = req.headers['x-token'];

  try {
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send({
        error: 'Unauthorized',
      });
    }
    const filesDb = dbClient.database.collection('files');

    const page = req.query.page ? parseInt(req.query.page, 10) : 0;
    const parentId = req.query.parentId || 0;

    const query = { userId, parentId };

    const files = await filesDb.aggregate([
      { $match: query },
      { $skip: page * 20 },
      { $limit: 20 },
      {
        $project: {
          id: '$_id', _id: 0, userId: 1, name: 1, type: 1, isPublic: 1, parentId: 1,
        },
      },
    ]).toArray();

    if (files.length === 0) {
      return res.status(404).send({
        error: 'Not found',
      });
    }

    // organize the order so id get first
    const formattedFiles = files.map((file) => {
      const { id, ...rest } = file;
      return { id, ...rest };
    });

    return res.send(formattedFiles);
  } catch (err) {
    return res.status(500).send({
      error: err,
    });
  }
}

export default {
  postUpload, getShow, getIndex,
};
