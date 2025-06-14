import fs from 'node:fs/promises'
import path from 'node:path'

const rootFolder = 'public/images'
const output = {}

async function scanFolder(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })

  const folders = entries.filter(entry => entry.isDirectory())
  const files = entries
    .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
    .map(entry => entry.name)

  // If only files, return array directly
  if (folders.length === 0)
    return files

  // If contains folders (and maybe files), build object
  const result = {}

  if (files.length > 0) {
    result[''] = files
  }

  for (const folder of folders) {
    const fullPath = path.join(dirPath, folder.name)
    result[folder.name] = await scanFolder(fullPath)
  }

  return result
}

try {
  const baseFolders = await fs.readdir(rootFolder, { withFileTypes: true })

  for (const base of baseFolders) {
    if (!base.isDirectory())
      continue

    const basePath = path.join(rootFolder, base.name)
    const scanResult = await scanFolder(basePath)
    output[base.name] = scanResult
  }

  const outputPath = path.join(rootFolder, 'image-manifest.json')
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2))
  console.log(`✅ Image manifest written to ${outputPath}`)
}
catch (err) {
  console.error(`❌ Error generating image manifest`, err)
}