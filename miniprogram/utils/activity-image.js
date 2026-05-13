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
  return (Array.isArray(imageUrls) ? imageUrls : []).map((url) => ({
    url,
    status: "done",
    percent: 100,
  }));
}

function getUploadUrls(files) {
  return (Array.isArray(files) ? files : [])
    .map((file) => String(file && file.url ? file.url : "").trim())
    .filter(Boolean);
}

module.exports = {
  buildUploadFiles,
  getUploadUrls,
  uploadImageFile,
};
