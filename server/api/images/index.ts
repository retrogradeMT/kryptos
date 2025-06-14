export default defineEventHandler(async (event) => {
  try {
    const manifestModule = await import('~/public/images/image-manifest.json');
    const manifest = manifestModule.default;

    return { images: manifest };
  } catch (err) {
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Failed to load image manifest',
    }));
  }
});