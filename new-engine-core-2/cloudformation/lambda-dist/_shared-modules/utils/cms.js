export const isCmsRootFolder = (folder) => !folder || folder === '/';

export const areCmsFoldersEqual = (folderA, folderB) =>
    (isCmsRootFolder(folderA) && isCmsRootFolder(folderB)) || folderA === folderB;
