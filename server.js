import express from 'express';
import router from './routes/index';

const PORT = parseInt(process.env.APP_PORT || '1245', 10);

const app = express();

app.use(express.json());

app.listen(PORT, (err) => {
  if (err) {
    console.error('Something bad happened');
  } else {
    console.log(`app is listening on port ${PORT}`);
  }
});

// load all routes from the file routes/index.js
app.use(router);

export default app;
