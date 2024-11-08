const express = require('express');
const cors = require('cors'); 
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Inicializar la app de Firebase
const serviceAccount = require('./firebase-config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();

// Configurar CORS
const corsOptions = {
  origin: [
    'http://localhost:4200',
    'https://wbpromos.com.ar',
    'http://localhost:8100',
    'https://wb-promos.netlify.app',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost'
  ],
  methods: ['POST', 'OPTIONS'], 
  allowedHeaders: ['Authorization', 'Content-Type'], 
};

// Usar el middleware CORS
app.use(cors(corsOptions));

// Body parser para manejar JSON
app.use(bodyParser.json());

//ping
app.get('/', (req, res) => {
  res.send('Working!');
});

// Endpoint para enviar notificaciones
app.post('/sendNotification', async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !Array.isArray(token) || token.length === 0 || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields: tokens (array), title, body' });
  }

  const MAX_TOKENS_PER_BATCH = 500;
  const message = {
    notification: {
      title: title,
      body: body
    }
  };

  const chunks = [];
  for (let i = 0; i < token.length; i += MAX_TOKENS_PER_BATCH) {
    chunks.push(token.slice(i, i + MAX_TOKENS_PER_BATCH));
  }

  const responses = [];
  for (const chunk of chunks) {
    try {
      const response = await admin.messaging().sendEachForMulticast({
        ...message,
        tokens: chunk
      });
      responses.push(response);
    } catch (error) {
      console.error('Error sending batch:', error);
      responses.push({ success: false, error });
    }
  }

  res.status(200).json({
    success: true,
    responses
  });
});

// Cargar los certificados SSL
const sslOptions = {
  key: fs.readFileSync('./ssl/key.key'), 
  cert: fs.readFileSync('./ssl/cert.crt'), 
};

// Crear el servidor HTTPS
https.createServer(sslOptions, app).listen(3000 , () => {
  console.log('HTTPS Server running on port 3000');
});
