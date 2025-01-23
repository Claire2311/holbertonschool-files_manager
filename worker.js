import Bull from 'bull';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  if (job.fileId) {
    throw new Error('Missing fileId');
  }

  if (job.userId) {
    throw new Error('Missing userId');
  }

  const filesDb = dbClient.database.collection('files');

  const file = await filesDb.findOne({ userId: job.userId, _id: new ObjectId(job.fileId) });

  if (!file) {
    throw new Error('File not found');
  }

  try {
    const widths = [100, 250, 500];

    // pour éviter un await dans une boucle for
    const thumbnailPromises = widths.map(async (width) => {
      const storagePath = path.join(file.localPath, `_${width}`);
      const thumbnail = await imageThumbnail(job.data, { width });
      fs.writeFileSync(storagePath, thumbnail);
    });

    await Promise.all(thumbnailPromises);
  } catch (err) {
    console.error(err);
  }
});
