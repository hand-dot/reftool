
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


interface ClocFileDetails {
    blank: number;
    comment: number;
    code: number;
    language: string;
}

interface ClocHeader {
    cloc_url: string;
    cloc_version: string;
    elapsed_seconds: number;
    n_files: number;
    n_lines: number;
    files_per_second: number;
    lines_per_second: number;
}

interface ClocSummary {
    blank: number;
    comment: number;
    code: number;
    nFiles: number;
}

export interface ClocResult {
    header: ClocHeader;
    SUM: ClocSummary;
    [filePath: string]: ClocFileDetails | ClocHeader | ClocSummary;
}