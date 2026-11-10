
// const http = require('http');
// const app = require('./app')

// const server = http.createServer(app);

// server.listen(process.env.PORT || 2000,()=>console.log(`Server started on port : ${process.env.PORT}`));




require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 1999;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB Atlas');

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`Server started on port: ${PORT}`);
    });

  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();
