const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const DB_HOST = process.env.DB_HOST || 'localhost';
    const DB_PORT = process.env.DB_PORT || '27017';
    const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';

    this.client = new MongoClient(`mongodb://${DB_HOST}:${DB_PORT}`, { useNewUrlParser: true, useUnifiedTopology: true });

    this.client.connect((err) => {
      if (err) {
        console.error('Failed to connect to MongoDB', err);
      } else {
        this.database = this.client.db(DB_DATABASE);
      }
    });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const nbUsers = await this.database.collection('users').countDocuments();
    return nbUsers;
  }

  async nbFiles() {
    const nbFiles = await this.database.collection('files').countDocuments();
    return nbFiles;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
