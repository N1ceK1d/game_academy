const express = require('express');
const routes = require('./routes/index');
const app = express();
const cors = require('cors');

const allowedOrigins = [
  'http://retr0raven.temp.swtest.ru',
  'https://retr0raven.temp.swtest.ru', // Если будет HTTPS
  'http://localhost:3000'              // Для локальной разработки
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());          
app.use(express.urlencoded());   

app.get('/api/get_results', routes);
app.post('/api/set_result', routes);

app.listen(3000);
