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
app.post('/sendNotification', (req, res) => {
  const { token, title, body } = req.body; 

  if (!token || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields: token, title, body' });
  }

  const message = {
    notification: {
      title: title,
      body: body
    },
    tokens: token 
  };

  admin.messaging().sendEachForMulticast(message)
    .then((response) => {
      console.log('Successfully sent message:', response);
      res.status(200).json({ success: true, response });
    })
    .catch((error) => {
      console.error('Error sending message:', error);
      res.status(500).json({ success: false, error });
    });
});

// Cargar los certificados SSL
const sslOptions = {
  key: fs.readFileSync('./ssl/key.key'), 
  cert: fs.readFileSync('./ssl/cert.crt'), 
};

// Crear el servidor HTTPS
https.createServer(sslOptions, app).listen(3000, () => {
  console.log('HTTPS Server running on port 3000');
});
