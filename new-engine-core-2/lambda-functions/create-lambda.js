import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyRecursive(src, dest) {
    const stats = await fs.stat(src);
    const isDirectory = stats.isDirectory();
    if (isDirectory) {
        await fs.mkdir(dest);
        const files = await fs.readdir(src);
        for (const file of files) {
            await copyRecursive(path.join(src, file), path.join(dest, file));
        }
    } else {
        await fs.copyFile(src, dest);
    }
}

async function postProcessing(lambdaName, destDir) {
    const packageJsonPath = path.join(destDir, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    packageJson.name = lambdaName;
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 4));
}

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const lambdaName = await new Promise((resolve) => {
        rl.question('Enter the name for the new lambda function: ', resolve);
    });

    if (!lambdaName) {
        console.log('Lambda function name cannot be empty.');
        rl.close();
        return;
    }

    const sourceDir = path.join(__dirname, '_lambda-template');
    const destDir = path.join(__dirname, lambdaName);

    try {
        await fs.access(destDir);
        console.log(`Directory ${lambdaName} already exists.`);
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
        console.log(`Creating directory ${lambdaName} and copying files...`);
        await copyRecursive(sourceDir, destDir);
        await postProcessing(lambdaName, destDir);
        console.log('Done.');
    } finally {
        rl.close();
    }
}

main();
