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
  }).then(async (result) => {
    const tempFileURL = await resolveCloudImageUrl(result.fileID);
    return {
      ...result,
      tempFileURL,
    };
  });
}

function isCloudFileID(url) {
  return /^cloud:\/\//.test(String(url || "").trim());
}

async function resolveCloudImageUrls(imageUrls) {
  const urls = normalizeImageUrls(imageUrls);
  const cloudUrls = urls.filter(isCloudFileID);

  if (
    !cloudUrls.length ||
    typeof wx === "undefined" ||
    !wx.cloud ||
    typeof wx.cloud.getTempFileURL !== "function"
  ) {
    return urls;
  }

  try {
    const result = await wx.cloud.getTempFileURL({
      fileList: cloudUrls,
    });
    const tempUrlMap = (result.fileList || []).reduce((map, file) => {
      if (file.fileID && file.tempFileURL) {
        map[file.fileID] = file.tempFileURL;
      }
      return map;
    }, {});

    return urls.map((url) => tempUrlMap[url] || url);
  } catch (error) {
    console.warn("resolve cloud image urls failed", error);
    return urls;
  }
}

async function resolveCloudImageUrl(imageUrl) {
  const [resolvedUrl] = await resolveCloudImageUrls([imageUrl]);
  return resolvedUrl || normalizeImageUrl(imageUrl);
}

function buildUploadFiles(imageUrls, displayUrls) {
  const storageUrls = normalizeImageUrls(imageUrls);
  const previewUrls = normalizeImageUrls(displayUrls);

  return storageUrls.map((url, index) => ({
    url: previewUrls[index] || url,
    fileID: isCloudFileID(url) ? url : "",
    status: "done",
    percent: 100,
  }));
}

function normalizeImageUrl(image) {
  if (typeof image === "string") {
    return image.trim();
  }

  if (image && typeof image === "object") {
    return String(image.fileID || image.url || image.src || "").trim();
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
  isCloudFileID,
  normalizeImageUrl,
  normalizeImageUrls,
  resolveCloudImageUrl,
  resolveCloudImageUrls,
  uploadImageFile,
};
