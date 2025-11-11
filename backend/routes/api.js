const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const sentimentController = require('../controllers/sentimentController');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/upload-csv', authMiddleware, upload.single('file'), sentimentController.uploadCsv);
router.post('/analyze', authMiddleware, sentimentController.analyzeText);
router.get('/history', authMiddleware, sentimentController.getHistory);

module.exports = router;
