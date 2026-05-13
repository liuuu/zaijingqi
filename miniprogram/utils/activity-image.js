function getFileExtension(filePath) {
  const match = String(filePath || "").match(/\.[a-zA-Z0-9]+(?=([?#].*)?$)/);
  return match ? match[0] : ".jpg";
}

function uploadImageFile(tempFilePath) {
  const suffix = getFileExtension(tempFilePath);
  const cloudPath = `activity-images/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}${suffix}`;

  return wx.cloud.uploadFile({
    cloudPath,
    filePath: tempFilePath,
  });
}

function buildUploadFiles(imageUrls) {
  return normalizeImageUrls(imageUrls).map((url) => ({
    url,
    status: "done",
    percent: 100,
  }));
}

function normalizeImageUrl(image) {
  if (typeof image === "string") {
    return image.trim();
  }

  if (image && typeof image === "object") {
    return String(image.url || image.fileID || image.src || "").trim();
  }

  return "";
}

function normalizeImageUrls(imageUrls) {
  return (Array.isArray(imageUrls) ? imageUrls : [])
    .map(normalizeImageUrl)
    .filter(Boolean);
}

function getUploadUrls(files) {
  return normalizeImageUrls(files);
}

module.exports = {
  buildUploadFiles,
  getUploadUrls,
  normalizeImageUrl,
  normalizeImageUrls,
  uploadImageFile,
};
