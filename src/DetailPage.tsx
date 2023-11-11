import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react'
import type { Duplication } from './types';
import { HomeIcon } from '@heroicons/react/20/solid'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { monaco } from "./editor";
import 'highlight.js/styles/github.css'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'

function getFileName(path: string) {
  return path.split('/').pop();
}

function calculatePercentage(part: number, total: number) {
  return (part / total * 100).toFixed(2) + '%';
}


function DetailPage({ duplication }: { duplication: Duplication | undefined }) {

  const editorElemA = useRef<HTMLDivElement>(null)
  const editorElemB = useRef<HTMLDivElement>(null)
  const [editorA, setEditorA] = useState<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [editorB, setEditorB] = useState<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [processing, setProcessing] = useState<boolean>(false)
  const [markdown, setMarkdown] = useState<string>('')

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

  useEffect(() => {
    if (!duplication) {
      return;
    }
    const a = duplication.duplicationA
    const b = duplication.duplicationB

    if (editorElemA.current && !editorA) {
      const _editor = monaco.editor.create(editorElemA.current, {
        value: a.content,
        language: duplication.format,
        automaticLayout: true,
        fontSize: 14,
      })
      setEditorA(_editor)

      _editor.setPosition({
        lineNumber: a.start.line,
        column: a.start.column || 1,
      })
      _editor.revealRangeInCenter({
        startLineNumber: a.start.line,
        startColumn: a.start.column || 1,
        endLineNumber: a.end.line,
        endColumn: a.end.column || 1,
      });
      _editor.setSelections([{
        selectionStartLineNumber: a.start.line,
        selectionStartColumn: a.start.column || 1,
        positionLineNumber: a.end.line,
        positionColumn: a.end.column || 1,
      }])

      setTimeout(() => {
        _editor.focus();
      }, 100);
    }
    if (editorElemB.current && !editorB) {
      const _editor = monaco.editor.create(editorElemB.current, {
        value: b.content,
        language: duplication.format,
        automaticLayout: true,
        fontSize: 14,
      })
      setEditorB(_editor)

      _editor.setPosition({
        lineNumber: b.start.line,
        column: b.start.column || 1,
      })
      _editor.revealRangeInCenter({
        startLineNumber: b.start.line,
        startColumn: b.start.column || 1,
        endLineNumber: b.end.line,
        endColumn: b.end.column || 1,
      });
      _editor.setSelections([{
        selectionStartLineNumber: b.start.line,
        selectionStartColumn: b.start.column || 1,
        positionLineNumber: b.end.line,
        positionColumn: b.end.column || 1,
      }])
    }
  }, [duplication, editorElemA, editorElemB])


  if (!duplication) {
    return <div className="text-center">
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Loading...</h1>
      <p className="mt-6 text-base leading-7 text-gray-600">If the screen does not switch even after a while, please return to the home screen. </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link to="/" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Go back home</Link>
      </div>
    </div>
  }

  const a = duplication.duplicationA
  const b = duplication.duplicationB

  const callGpt = () => {
    if (processing) {
      return;
    }
    setProcessing(true)
    fetch('http://localhost:5173/gpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', },
      body: JSON.stringify({
        // FIXME プロンプトをちゃんと考える
        message: `Please refactor the following duplicate code. レスポンスは日本語にして。
--${a.path}:${a.start.line}:${a.start.column}~${a.end.line}:${a.end.column}--
${a.content}
--${b.path}:${b.start.line}:${b.start.column}~${b.end.line}:${b.end.column}--
${b.content}
`}),
    })
      .then((response) => response.json())
      .then(({ message }) => {
        setMarkdown(message)
      }).finally(() => {
        setProcessing(false)
      })
  }

  const aPath = `${(a.path)}:${a.start.line}:${a.start.column}~${a.end.line}:${a.end.column}`
  const bPath = `${(b.path)}:${b.start.line}:${b.start.column}~${b.end.line}:${b.end.column}`

  const aHref = `vscode://file${a.path}:${a.start.line}`
  const bHref = `vscode://file${b.path}:${b.start.line}`

  const aContentRow = a.content.split('\n').length
  const bContentRow = b.content.split('\n').length

  const aFragmentRow = a.end.line - a.start.line
  const bFragmentRow = b.end.line - b.start.line

  const stats = [
    { id: 'a', href: aHref, fileName: getFileName(a.path), path: aPath, stat: calculatePercentage(aFragmentRow, aContentRow) },
    { id: 'b', href: bHref, fileName: getFileName(b.path), path: bPath, stat: calculatePercentage(bFragmentRow, bContentRow) },
  ]

  return (
    <div>
      <div>
        <dl className="my-5 grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* TODO 削除可能なコードの行数を出す */}
          {stats.map((item) => (
            <div key={item.id} className="px-4 py-5 sm:p-6">
              <dt className="text-base font-normal text-gray-900">{item.fileName}</dt>
              <span className="text-sm font-medium text-gray-500 break-words">{item.path}</span>
              <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                <div className="flex items-baseline text-xl font-semibold text-indigo-600">
                  Duplicate code ratio in file: {item.stat}
                </div>
                <div
                  className={'inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0'}
                >
                  <a href={item.href} > <button
                    type="button"
                    className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <ArrowTopRightOnSquareIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                    Open in VSCode
                  </button></a>

                </div>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <dl className="my-5 grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:grid-cols-2 md:divide-x md:divide-y-0">
        <div ref={editorElemA} className="h-96" />
        <div ref={editorElemB} className="h-96" />
      </dl>



      <div className="mt-20">
        <h2 className="mx-auto text-center max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Receive GPT's refactoring suggestions
        </h2>

        {markdown ?
          <div className="mt-10 overflow-hidden rounded-lg">
            <div className="text-left px-4 py-5 sm:p-6 markdown-body">
              <Markdown rehypePlugins={[remarkGfm, rehypeHighlight]}>{markdown}</Markdown>
            </div>
          </div>
          :
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button
              onClick={callGpt}
              disabled={processing}
              type="button"
              className="flex items-center justify-center rounded-md border border-transparent bg-blue-500 py-2 px-4 text-base sm:text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Call GPT'}
            </button>
          </div>}
      </div>

      {/* Back to home */}
      <div className="relative my-12">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center">
          <Link to="/" className="inline-flex items-center gap-x-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            <HomeIcon className="-ml-1 -mr-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />
            <span>Back to home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DetailPage;