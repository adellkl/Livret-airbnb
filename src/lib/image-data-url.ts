const defaultMaxDataUrlLength = 150_000;

export async function compressImageToDataUrl(
  file: File,
  options: { maxWidth?: number; maxDataUrlLength?: number } = {},
) {
  const maxWidth = options.maxWidth ?? 1_200;
  const maxDataUrlLength = options.maxDataUrlLength ?? defaultMaxDataUrlLength;
  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new window.Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error('image-decode-failed'));
      nextImage.src = sourceUrl;
    });
    let width = Math.min(maxWidth, image.naturalWidth || maxWidth);
    let height = Math.max(1, Math.round((image.naturalHeight || maxWidth) * (width / (image.naturalWidth || maxWidth))));
    let quality = 0.86;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas-unavailable');
      context.drawImage(image, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/webp', quality);
      if (dataUrl.length <= maxDataUrlLength) return dataUrl;
      width = Math.max(180, Math.round(width * 0.78));
      height = Math.max(180, Math.round(height * 0.78));
      quality = Math.max(0.55, quality - 0.05);
    }

    throw new Error('image-too-large-after-compression');
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
