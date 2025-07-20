const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

const app = express();

router.get('/api/get_results', userController.get_results);
router.post('/api/set_result', userController.set_result);


module.exports = router;
