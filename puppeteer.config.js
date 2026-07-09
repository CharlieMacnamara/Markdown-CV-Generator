export default {
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR || undefined,
  defaultBrowser: 'firefox',
  firefox: {
    skipDownload: false,
  },
  chrome: {
    skipDownload: true,
  },
}
