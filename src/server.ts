import { IClone } from '@jscpd/core';
import { detectClones } from 'jscpd';
import OpenAI from 'openai';
import express from 'express';
import type { AppData, Duplication, ClocResult } from './types';
import { uuid, getPotentialRemovals } from './utils';
import { commonOptions } from './constants';
import { readFileSync } from 'fs';
import { ITokenLocation } from '@jscpd/core';
import path from 'path';
import { execa } from 'execa';
import which from 'which';
import dotenv from 'dotenv';
import chokidar from 'chokidar';

// ---------------SETUP------------------------

dotenv.config();
const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express()
app.use(express.json());

// --------------SHARED VARIABLE---------------

const DB: AppData = {
    ready: false,
    countLinesOfProjects: [{ projectPath: "", SUM: { blank: 0, comment: 0, code: 0, nFiles: 0, } }],
    duplications: []
}

// --------------FUNCTIONS---------------------

const onWatchFileChanges = (cb: (path: string) => void) => {
    const isExcluded = (path: string) => {
        const ext = path.split('.').pop()!;
        const base = path.split('/').pop()!;
        return commonOptions.excludeDirs.includes(base) || commonOptions.excludeExts.includes(ext);
    }
    const dirPath = '/path/to/your/directory';
    const watcher = chokidar.watch(dirPath, {
        ignored: (path) => isExcluded(path),
        persistent: true
    });

    watcher
        .on('add', path => {
            console.log(`File ${path} has been added`)
            cb(path);
        })
        .on('change', path => {
            console.log(`File ${path} has been changed`)
            cb(path);
        })
        .on('unlink', path => {
            console.log(`File ${path} has been removed`)
            cb(path);
        });
}



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

    const result = JSON.parse(stdout) as ClocResult

    result.projectPath = folder;

    return result;
}

const jscpd = async (path: string[]): Promise<Duplication[]> => {
    const ignore = [
        ...commonOptions.excludeDirs.map(dir => `**/${dir}/**`),
        ...commonOptions.excludeExts.map(ext => `**/*.${ext}`)
    ];

    const clones = await detectClones({ path: path.filter(Boolean), silent: true, gitignore: true, ignore, });

    return clones.map((clone: IClone) => ({
        id: uuid(),
        format: clone.format,
        foundDate: clone.foundDate || 0,
        duplicationA: extractDuplicationDetails(clone.duplicationA),
        duplicationB: extractDuplicationDetails(clone.duplicationB)
    })).sort((a, b) => getPotentialRemovals(b.duplicationA) - getPotentialRemovals(a.duplicationA));
}


const scan = async () => {
    const projectPaths: string[] = [import.meta.env.VITE_PARAM1, import.meta.env.VITE_PARAM2];
    if (projectPaths.length === 0) {
        projectPaths.push(process.cwd());
    }

    const promises: [Promise<Duplication[]>, Promise<ClocResult>] = [jscpd(projectPaths), cloc(projectPaths[0])]
    if (projectPaths[1]) {
        promises.push(cloc(projectPaths[1]))
    }

    const [jscpdResult, ...clocResults] = await Promise.all(promises);
    return { jscpdResult, clocResults };
}

// --------------APIS-----------------------

app.get('/init', async (req, res) => {
    // FIXME むしろ変更があれば勝手にリフレッシュする
    if (DB.ready) {
        res.json({ ...DB })
        return;
    }

    const { jscpdResult, clocResults } = await scan();

    DB.duplications = jscpdResult;
    DB.countLinesOfProjects = clocResults;
    DB.ready = true;

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

app.get('/isFileChanged', (req, res) => {
    res.json({ changed: !DB.ready })
});


// --------------START-----------------------

export const handler = app

onWatchFileChanges(() => {
    DB.ready = false;
})

