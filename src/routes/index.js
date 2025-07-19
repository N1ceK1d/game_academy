const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const cors = require('cors');

const app = express();

app.use(express.urlencoded({extended:true}));
app.use(cors());

router.get('/api/get_results', userController.get_results);
router.post('/api/set_result', userController.set_result);


module.exports = router;