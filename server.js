require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

app.use(bodyParser.json());
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

app.use('/det', authRoutes);

const PORT = process.env.PORT || 3000;


const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1); 
  } else {
    console.error('Unexpected error:', err);
  }
});

// จัดการการปิดเซิร์ฟเวอร์เมื่อรับสัญญาณ SIGINT หรือ SIGTERM
process.on('SIGINT', () => {
  console.log('Closing server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Closing server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
