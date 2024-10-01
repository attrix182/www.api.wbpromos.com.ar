const express = require('express');
const cors = require('cors'); // Importar el paquete CORS
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

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
  ],
  methods: ['POST', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Authorization', 'Content-Type'], // Encabezados permitidos
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
  const { token, title, body } = req.body; // Recibe token, title y body desde la solicitud.

  if (!token || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields: token, title, body' });
  }

  const message = {
    notification: {
      title: title,
      body: body
    },
    tokens: token // Token del dispositivo
  };

  // Enviar la notificación a FCM
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

// Escuchar en el puerto 3000
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
