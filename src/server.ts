import { IClone } from '@jscpd/core';
import { detectClones } from 'jscpd';
import OpenAI from 'openai';
import express from 'express';
import type { Duplication, ClocResult } from './types';
import { uuid, getPotentialRemovals } from './utils';
import { readFileSync } from 'fs';
import { ITokenLocation } from '@jscpd/core';
import path from 'path';
import { execa } from 'execa';
import which from 'which';
import dotenv from 'dotenv';

// ---------------SETUP------------------------

dotenv.config();
const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express()
app.use(express.json());

// --------------SHARED VARIABLE---------------

const DB: { countLinesOfProject: ClocResult[], duplications: Duplication[] } = {
    countLinesOfProject: [],
    duplications: []
}

const commonOptions = {
    excludeDirs: ['node_modules', 'dist', 'build', 'coverage', '__snapshots__', '__fixtures__'],
    excludeExts: ['json', 'md', 'yml', 'yaml', 'lock', 'log', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'ttf', 'woff', 'woff2', 'eot', 'map'],
};

// --------------FUNCTIONS---------------------

const extractDuplicationDetails = (duplication: { start: ITokenLocation, end: ITokenLocation, sourceId: string, fragment?: string, }) => ({
    start: duplication.start,
    end: duplication.end,
    path: duplication.sourceId,
    fragment: duplication.fragment || '',
    content: readFileSync(path.join(duplication.sourceId), 'utf-8')
})

const cloc = async (folder: string): Promise<ClocResult> => {
    const excludeDirs = `--exclude-dir=${commonOptions.excludeDirs.join(',')}`;
    const excludeExts = `--exclude-ext=${commonOptions.excludeExts.join(',')}`;

    const args = [excludeDirs, excludeExts, '--by-file', '--json', folder];

    const clocPath = which.sync('cloc');
    const { stdout, stderr, failed } = await execa(clocPath, args);

    if (stderr !== '') throw new Error(stderr.trim());
    if (failed !== false) throw new Error('Failure');

    return JSON.parse(stdout) as ClocResult;
}

const jscpd = async (path: string[]): Promise<Duplication[]> => {
    const ignore = [
        ...commonOptions.excludeDirs.map(dir => `**/${dir}/**`),
        ...commonOptions.excludeExts.map(ext => `**/*.${ext}`)
    ];

    const clones = await detectClones({ path: path.filter(Boolean), minLines: 10, minTokens: 75, silent: true, gitignore: true, ignore, });

    return clones.map((clone: IClone) => ({
        id: uuid(),
        format: clone.format,
        foundDate: clone.foundDate || 0,
        duplicationA: extractDuplicationDetails(clone.duplicationA),
        duplicationB: extractDuplicationDetails(clone.duplicationB)
    })).sort((a, b) => getPotentialRemovals(b.duplicationA) - getPotentialRemovals(a.duplicationA));
}
// --------------APIS-----------------------

app.get('/init', async (req, res) => {
    const projectPaths: string[] = [import.meta.env.VITE_PARAM1, import.meta.env.VITE_PARAM2];
    if (projectPaths.length === 0) {
        projectPaths.push(process.cwd());
    }

    // FIXME 必要に応じてリフレッシュできるようにする いや、むしろ変更があれば勝手にリフレッシュするべき
    if (DB.duplications.length > 0 || DB.countLinesOfProject.length > 0) {
        res.json({ ...DB })
        return;
    }

    const promises: [Promise<Duplication[]>, Promise<ClocResult>] = [jscpd(projectPaths), cloc(projectPaths[0])]
    if (projectPaths[1]) {
        promises.push(cloc(projectPaths[1]))
    }

    const [jscpdResult, ...clocResults] = await Promise.all(promises);

    DB.duplications = jscpdResult;
    DB.countLinesOfProject = clocResults;

    res.json({ ...DB })
})

app.post('/gpt', async (req, res) => {
    const { message } = req.body;
    const completion = await openAi.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: message }],
    });
    // FIXME ストリームにしたい
    res.json({ message: completion.choices[0].message.content })
});


// --------------START-----------------------

export const handler = app