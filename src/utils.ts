import type { DuplicationContent } from './types';

export const uuid = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
export const findCommonPrefix = (path1: string, path2: string) => {
    let prefix = "";
    for (let i = 0; i < Math.min(path1.length, path2.length); i++) {
        if (path1[i] === path2[i]) {
            prefix += path1[i];
        } else {
            let lastSlashIndex = prefix.lastIndexOf('/');
            return prefix.substring(0, lastSlashIndex);
        }
    }

    let lastSlashIndex = prefix.lastIndexOf('/');
    return prefix.substring(0, lastSlashIndex);
}
export const getPotentialRemovals = (duplicationContent: DuplicationContent) => duplicationContent.end.line - duplicationContent.start.line