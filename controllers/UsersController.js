const sha1 = require('sha1');
const dbClient = require('../utils/db');

async function postNew(req, res) {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).send({
      message: 'Missing email',
    });
  }

  if (!password) {
    return res.status(400).send({
      message: 'Missing password',
    });
  }

  try {
    // const database = client.db("sample_mflix");
    const users = dbClient.database.collection('users');
    const query = { email };

    const alreadyUser = await users.findOne(query);

    if (alreadyUser) {
      return res.status(400).send({
        error: 'Already exist',
      });
    }
    const hashedPassword = sha1(password);
    const newUser = await users.insertOne({ email, password: hashedPassword });

    return res.status(201).json({ id: newUser.insertedId, email });
  } catch (err) {
    return res.status(500).send({
      error: err,
    });
  }
}

module.exports = { postNew };

// return res.status(400).send({
//     message: 'This is an error!'
//  });
