const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Read directory contents
async function getDirectoryContents(directoryPath) {
    // directoryPath = req.query.path || '/Users/JJ/Documents/Projects/virtual-agent-system/file_outputs/uncompressed_directories';
    const files = await fs.readdir(directoryPath);
    return await Promise.all(files.map(async (file) => {
        const filePath = path.join(directoryPath, file);
        const stats = await fs.stat(filePath);
        return {
            name: file,
            isFolder: stats.isDirectory(),
            path: filePath
        };
    }));
}

// Read file contents
async function getFileContents(filePath) {
    return await fs.readFile(filePath, 'utf-8');
}

// Save file contents
async function saveFile(filePath, content) {
    if (filePath.endsWith('/')) {
        throw new Error('The path must include the file name, not just the directory.');
    }
    await fs.writeFile(filePath, content, 'utf8');
    return 'File saved successfully';
}

// Download and save file from URL
async function downloadFile(url, fileName) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const filePath = path.join(__dirname, '..', 'file_outputs', 'downloads', fileName);
    await fs.writeFile(filePath, response.data);
    return 'File downloaded successfully';
}

module.exports = {
    getDirectoryContents,
    getFileContents,
    saveFile,
    downloadFile
};
