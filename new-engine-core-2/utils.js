import { exec } from 'child_process';
import { existsSync } from 'node:fs';
import { readdir, open, unlink, rm, readFile, lstat, symlink, cp } from 'node:fs/promises';

import archiver from 'archiver';
import GitBranch from 'git-branch';

export const awsExceptions = {
    RESOURCE_NOT_FOUND_EXCEPTION: 'ResourceNotFoundException',
    VALIDATION_EXCEPTION: 'ValidationException',
    NO_CHANGES_POLICY_EXCEPTION: 'No changes detected in policy or policy description',
    NO_SUCH_ENTITY_EXCEPTION: 'NoSuchEntityException',
    NOT_FOUND: 'NotFound',
};
export const getFiles = async (folder, extension) => {
    const items = await readdir(folder, { withFileTypes: true, recursive: true });
    let files = items.filter((item) => item.isFile());

    if (extension) {
        files = files.filter((file) => file.name.toLowerCase().endsWith(extension));
    }

    return files.map((file) => file.name);
};
export const getDirs = async (folder, excludeDirNames) => {
    const items = await readdir(folder, { withFileTypes: true });
    let directories = items.filter(
        (item) => item.isDirectory() && (!excludeDirNames?.length || !excludeDirNames.includes(item.name))
    );
    return directories.map((directory) => directory.name);
};
export const zipDirectory = async (sourceDir, outZipFile) => {
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Open the file for writing
    const fd = await open(outZipFile, 'w'); // Open the file with write permissions

    // Write data in chunks to the file
    archive.pipe(fd.createWriteStream());

    // Add directory contents to the archive
    archive.glob('**/*', {
        cwd: sourceDir,
        follow: true, // follow symbolic links
        dot: true, // allow dot-files (example, .env)
    });

    // Finalize the archive (finish zipping)
    await new Promise((resolve, reject) => {
        archive.on('end', resolve);
        archive.on('error', reject);
        archive.finalize();
    });

    await fd.close(); // Close the file descriptor after writing
};
export const getFile = async (filePath) => {
    return readFile(filePath);
};
export const removeFile = async (filePath) => {
    await unlink(filePath);
};
export const removeDir = async (dirPath) => {
    await rm(dirPath, { recursive: true, force: true });
};
export const execPromise = async (command, options = {}) => {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
};
export const getEnvironment = async () => {
    const currentBranch = await GitBranch();
    console.log('currentBranch:', currentBranch);

    let environment;
    switch (true) {
        case /^stage$|\/stage$/.test(currentBranch):
            environment = 'stage';
            break;
        case /^master$|\/master$/.test(currentBranch):
            environment = 'prod';
            break;
        default:
            environment = 'dev';
    }

    return environment;
};

export const linkDir = async (targetDir, linkDir) => {
    if (await isSymlink(linkDir)) {
        await unlink(linkDir);
    }
    if (existsSync(linkDir)) {
        await removeDir(linkDir);
    }
    await symlink(targetDir, linkDir, 'dir');
};

const isSymlink = async (p) => {
    try {
        const stat = await lstat(p);
        return stat.isSymbolicLink();
    } catch {
        return false;
    }
};

export const copyDir = async (sourceDir, destinationDir) => {
    if (await isSymlink(destinationDir)) {
        await unlink(destinationDir);
    }
    if (existsSync(destinationDir)) {
        await removeDir(destinationDir);
    }
    await cp(sourceDir, destinationDir, { recursive: true });
};
