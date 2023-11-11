
import type { ITokenLocation } from '@jscpd/core';

interface DuplicationContent {
    start: ITokenLocation;
    end: ITokenLocation;
    path: string;
    content: string;
}

export interface Duplication {
    id: string;
    format: string;
    foundDate: number,
    duplicationA: DuplicationContent
    duplicationB: DuplicationContent
}