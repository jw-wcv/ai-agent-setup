const fileServices = require('../services/fileServices');

async function getDirectory(req, res) {
    const directoryPath = req.query.path || '/Users/JJ/Documents/Projects/virtual-agent-system/file_outputs/uncompressed_directories';
    try {
        const contents = await fileServices.getDirectoryContents(directoryPath);
        res.json(contents);
    } catch (error) {
        console.error('Error reading directory', error);
        res.status(500).send('Error reading directory');
    }
}

async function getFile(req, res) {
    const filePath = req.query.path;
    if (!filePath) {
        return res.status(400).json({ error: 'A file path is required' });
    }
    try {
        const data = await fileServices.getFileContents(filePath);
        res.send(data);
    } catch (error) {
        console.error(`Error reading file at path ${filePath}:`, error);
        res.status(500).json({ error: `Error reading file at path ${filePath}` });
    }
}

async function saveFile(req, res) {
    const { path, content } = req.body;
    try {
        const message = await fileServices.saveFile(path, content);
        res.json({ message });
    } catch (error) {
        console.error('Failed to save file:', error);
        res.status(500).json({ error: 'Failed to save the file' });
    }
}

async function testFileDownload(req, res) {
    const fileUrl = 'https://fileserviceuploadsperm.blob.core.windows.net/files/file-a0o6Vn15CMv3aDb09etBHX3x?se=2024-04-02T03%3A13%3A53Z&sp=r&sv=2021-08-06&sr=b&rscc=max-age%3D299%2C%20immutable&rscd=attachment%3B%20filename%3DLockEthUpdated.sol&sig=aF5uG7NReMXhJvfqETKBhMCZkjhrDKu%2BSorIoFTI1ac%3D';
    const fileName = 'testFile';
    try {
        const message = await fileServices.downloadFile(fileUrl, fileName);
        res.json({ message });
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send('Error downloading file');
    }
}

module.exports = {
    getDirectory,
    getFile,
    saveFile,
    testFileDownload
};
