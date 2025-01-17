import mongodb from 'mongodb';

class DBClient {
  constructor() {
    const DB_HOST = process.env.DB_HOST || 'localhost';
    const DB_PORT = process.env.DB_PORT || '27017';
    const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';

    const { MongoClient } = mongodb;

    this.client = new MongoClient(`mongodb://${DB_HOST}:${DB_PORT}`, { useNewUrlParser: true, useUnifiedTopology: true });

    this.client.connect()
      .then(() => { this.database = this.client.db(DB_DATABASE); })
      .catch((err) => { console.error(err); });
  }

  // isAlive() {
  //   return this.client.isConnected();
  // }

  isAlive() {
    return (this.client.topology && this.client.topology.isConnected()) || false;
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

export default dbClient;
