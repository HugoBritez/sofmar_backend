const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();


const uploadDir = path.join(__dirname, '../../../uploads/logos/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } 
});

router.post('/upload/logo', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se ha subido ningún archivo.');
    }
    res.status(200).send(`Archivo subido correctamente: ${req.file.filename}`);
});

router.get('/latest/logo', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).send('Error al leer el directorio.');
        }
        if (files.length === 0) {
            return res.status(404).send('No se encontraron imágenes.');
        }
        const latestFile = files.map(file => ({
            name: file,
            time: fs.statSync(path.join(uploadDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)[0].name;
        
        res.sendFile(path.join(uploadDir, latestFile));
    });
});

module.exports = router;