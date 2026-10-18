import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const imageFileFilter = (req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) {
        cb(null, true);
        return;
    }
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only image files are allowed."));
};

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const imageUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
    fileFilter: imageFileFilter
});

export default upload;
