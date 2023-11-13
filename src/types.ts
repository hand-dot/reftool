
import type { ITokenLocation } from '@jscpd/core';

export interface DuplicationContent {
    start: ITokenLocation;
    end: ITokenLocation;
    path: string;
    fragment: string;
    content: string;
}

export interface Duplication {
    id: string;
    format: string;
    foundDate: number,
    duplicationA: DuplicationContent
    duplicationB: DuplicationContent
}


export interface ClocFileDetails {
    blank: number;
    comment: number;
    code: number;
    language: string;
}


interface ClocSummary {
    blank: number;
    comment: number;
    code: number;
    nFiles: number;
}

export interface ClocResult {
    projectPath: string;
    SUM: ClocSummary;
    [filePath: string]: string | ClocFileDetails | ClocSummary;
}

export interface AppData {
    time: number | string,
    ready: boolean,
    countLinesOfProjects: [ClocResult] | [ClocResult, ClocResult],
    duplications: Duplication[]
    options: {
        excludeDirs: string[],
        excludeExts: string[],
    }
}