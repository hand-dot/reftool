import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function prependToFile(filePath, stringToPrepend) {
    try {
        const data = await fs.readFile(filePath, 'utf8');

        const newData = stringToPrepend + data;

        await fs.writeFile(filePath, newData, 'utf8');
    } catch (error) {
        console.error('Error occurred:', error);
    }
}

async function replaceInFile(filePath, originalString, newString) {
    try {
        const data = await fs.readFile(filePath, 'utf8');

        const newData = data.replace(originalString, newString);

        await fs.writeFile(filePath, newData, 'utf8');
    } catch (error) {
        console.error('Error occurred:', error);
    }
}

async function main() {

    const filePath = path.join(__dirname, '/build/server.js');

    const stringToPrepend = `import { fileURLToPath } from 'url';
import path from 'path';`;

    await prependToFile(filePath, stringToPrepend);

    await replaceInFile(filePath, 'server.use(sirv("dist"));', `const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const newDist = path.join(__dirname, '..', "dist");
server.use(sirv(newDist));`);

    await replaceInFile(filePath, 'const { PORT = 3e3 } = process.env;', 'const { PORT = 5840 } = process.env;');
}

main();