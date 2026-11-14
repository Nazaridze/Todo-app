require('./config/dns');
require('dotenv').config();

const express = require('express');
const { MongoClient } = require('mongodb');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());
app.use(express.static('public'));

async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is not set in the .env file');
    }

    const client = new MongoClient(MONGO_URI);
    await client.connect();

    const db = client.db();
    app.locals.db = db;

    console.log('Connected to MongoDB');

    app.use('/tasks', taskRoutes);

    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Page or route not found'
      });
    });

    app.listen(PORT, () => {
      console.log(`Server is running: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();