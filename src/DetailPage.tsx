import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react'
import type { Duplication } from './types';
import ReactDiffViewer from 'react-diff-viewer';
import { HomeIcon } from '@heroicons/react/20/solid'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

function trimStringToLast30Chars(str: string) {
  if (str.length > 30) {
    return '...' + str.substring(str.length - 30);
  }
  return str;
}

function DetailPage({ duplication }: { duplication: Duplication | undefined }) {

  const [processing, setProcessing] = useState<boolean>(false)
  const [markdown, setMarkdown] = useState<string>('')

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

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

  const leftTitle = `${trimStringToLast30Chars(a.path)}:${a.start.line}:${a.start.column}~${a.end.line}:${a.end.column}`
  const rightTitle = `${trimStringToLast30Chars(b.path)}:${b.start.line}:${b.start.column}~${b.end.line}:${b.end.column}`


  const leftTitleHref = `vscode://file${a.path}:${a.start.line}`
  const rightTitleHref = `vscode://file${b.path}:${b.start.line}`

  const callGpt = () => {
    if (processing) {
      return;
    }
    setProcessing(true)
    fetch('http://localhost:5173/gpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', },
      body: JSON.stringify({
        message: `下記の重複したコードをリファクタリングしてください。
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

  return (
    <div>
      {/* TODO ここから とりあえず表示はできたが思ったよりも使いにくいのでmonacoに切り替える */}
      {/* https://chat.openai.com/share/b0a3860b-7cea-45f0-8a68-5f90a45fa03c */}
      <ReactDiffViewer
        oldValue={a.content}
        newValue={b.content}
        leftTitle={<a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href={leftTitleHref} >{leftTitle}</a>}
        rightTitle={<a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href={rightTitleHref}>{rightTitle}</a>}
        splitView={true}
        extraLinesSurroundingDiff={100}
      />


      <div className="mt-20">
        <h2 className="mx-auto text-center max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Receive GPT's refactoring suggestions
        </h2>

        {markdown ?
          <div className="mt-10 overflow-hidden rounded-lg shadow">
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