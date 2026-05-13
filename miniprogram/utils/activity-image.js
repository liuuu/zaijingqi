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

async function chooseAndUploadImages(maxCount) {
  const chooseResult = await new Promise((resolve, reject) => {
    wx.chooseMedia({
      count: maxCount,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: resolve,
      fail: reject,
    });
  });

  const files = chooseResult.tempFiles || [];
  const uploadResults = [];

  for (const file of files) {
    const result = await uploadImageFile(file.tempFilePath);
    uploadResults.push(result.fileID);
  }

  return uploadResults;
}

module.exports = {
  chooseAndUploadImages,
  uploadImageFile,
};
