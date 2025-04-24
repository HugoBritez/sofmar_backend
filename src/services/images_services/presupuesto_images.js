const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ruta absoluta a la carpeta upload dentro de src
    // Ajusta esta ruta según la estructura real de tu proyecto
    const uploadDir = path.join(__dirname, "../../upload/presupuesto_images");
    
    // Imprimir la ruta para verificar
    console.log("Guardando archivos en:", uploadDir);
    
    // Asegurarse de que el directorio existe
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Determinar el nombre base según el campo del formulario
    let baseName;
    if (file.fieldname === "imagen1") {
      baseName = "header";
    } else if (file.fieldname === "imagen2") {
      baseName = "footer";
    } else {
      return cb(new Error("Nombre de campo no válido"), false);
    }
    
    // Obtener la extensión del archivo original
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Nombre completo del archivo
    const filename = baseName + ext;
    
    // Ruta completa del directorio
    const uploadDir = path.join(__dirname, "../../upload/presupuesto_images");
    
    // Eliminar archivos anteriores con el mismo nombre base
    fs.readdir(uploadDir)
      .then(files => {
        const deletePromises = files
          .filter(existingFile => existingFile.startsWith(baseName) && existingFile !== filename)
          .map(fileToDelete => fs.unlink(path.join(uploadDir, fileToDelete)));
        
        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log("Guardando archivo como:", filename);
        cb(null, filename);
      })
      .catch(error => {
        console.error("Error al procesar el archivo:", error);
        cb(error, false);
      });
  }
});

// Filtro para asegurar que solo se suban imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos de imagen"), false);
  }
};

// Configuración de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de 5MB por archivo
  },
});

// Endpoint para subir una o dos imágenes
router.post(
  "/",
  upload.fields([
    { name: "imagen1", maxCount: 1 },
    { name: "imagen2", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      // Verificar si se recibió al menos una imagen
      if (!req.files || (Object.keys(req.files).length === 0)) {
        return res.status(400).json({
          success: false,
          message: "Se requiere al menos una imagen (header o footer)",
        });
      }

      // Construir la URL base correcta
      // Importante: Usa /uploads/ (con 's') para coincidir con la configuración de Express
      const baseUrl = req.protocol + '://' + req.get('host') + '/uploads/presupuesto_images/';
      
      const response = {
        success: true,
        message: "Imágenes procesadas correctamente",
        data: {}
      };

      // Procesar imagen de header si existe
      if (req.files.imagen1 && req.files.imagen1[0]) {
        const headerImage = req.files.imagen1[0];
        response.data.header = {
          filename: headerImage.filename,
          originalname: headerImage.originalname,
          path: headerImage.path,
          size: headerImage.size,
          url: baseUrl + headerImage.filename
        };
        
        console.log("URL de header generada:", baseUrl + headerImage.filename);
      }

      // Procesar imagen de footer si existe
      if (req.files.imagen2 && req.files.imagen2[0]) {
        const footerImage = req.files.imagen2[0];
        response.data.footer = {
          filename: footerImage.filename,
          originalname: footerImage.originalname,
          path: footerImage.path,
          size: footerImage.size,
          url: baseUrl + footerImage.filename
        };
        
        console.log("URL de footer generada:", baseUrl + footerImage.filename);
      }

      res.status(200).json(response);
    } catch (error) {
      console.error("Error en el endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Error al procesar las imágenes",
        error: error.message,
      });
    }
  }
);

// Endpoint para obtener las imágenes de presupuesto
router.get('/', async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, "../../upload/presupuesto_images");
    
    // Asegurarse de que el directorio existe
    await fs.ensureDir(uploadDir);
    
    // Leer los archivos en el directorio
    const files = await fs.readdir(uploadDir);
    
    // Filtrar y clasificar los archivos
    const headerFile = files.find(file => file.startsWith('header'));
    const footerFile = files.find(file => file.startsWith('footer'));
    
    // Construir las URLs
    const baseUrl = req.protocol + '://' + req.get('host') + '/uploads/presupuesto_images/';
    
    res.status(200).json({
      success: true,
      data: {
        header: headerFile ? {
          filename: headerFile,
          url: baseUrl + headerFile
        } : null,
        footer: footerFile ? {
          filename: footerFile,
          url: baseUrl + footerFile
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener las imágenes de presupuesto",
      error: error.message
    });
  }
});

router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "El endpoint de carga de imágenes está funcionando correctamente",
  });
});

module.exports = router;
