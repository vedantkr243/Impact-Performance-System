const fs = require("fs");
const path = require("path");
const { uploadImageToCloudinary } = require("../config/cloudinary");

const uploadImage = async (file, folder = "newprd") => {
  // If Cloudinary environment variables are set, use Cloudinary
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      // express-fileupload file has a tempFilePath if useTempFiles is active, or we can use tempFilePath
      const uploadPath = file.tempFilePath || file.path;
      if (uploadPath) {
        const result = await uploadImageToCloudinary(uploadPath, folder);
        return result.secure_url;
      }
    } catch (err) {
      console.warn("Cloudinary upload failed, falling back to local storage:", err.message);
    }
  }

  // Fallback to local file storage
  const uploadDir = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileExtension = path.extname(file.name) || ".png";
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
  const savePath = path.join(uploadDir, uniqueName);

  if (file.mv) {
    await file.mv(savePath);
  } else if (file.data) {
    await fs.promises.writeFile(savePath, file.data);
  } else {
    throw new Error("Unable to save upload file: file contents missing.");
  }

  // Return url relative to the client
  return `/uploads/${uniqueName}`;
};

module.exports = {
  uploadImage
};
