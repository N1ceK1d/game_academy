const express = require('express');
const routes = require('./routes/index');
const app = express();

app.get('/api/get_results', routes);
app.post('/api/set_result', routes);

app.listen(3000);