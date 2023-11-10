import { Link } from 'react-router-dom';
import ReactDiffViewer from 'react-diff-viewer';
import { HomeIcon } from '@heroicons/react/20/solid'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

const markdown = `\`react-markdown\` をスタイルする際には、主に以下の方法があります：

1. **CSSを使用する**：
   - \`react-markdown\` でレンダリングされる要素には、通常のHTMLタグが使用されるので、これらに対するCSSスタイルを適用できます。
   - 例えば、\`<h1>\` タグや \`<p>\` タグに対して、外部CSSファイルやインラインスタイルでスタイリングを行います。

2. **コンポーネントレベルでのスタイリング**：
   - \`react-markdown\` は \`components\` プロパティを使って、特定のMarkdown要素に対してカスタムのReactコンポーネントを割り当てることができます。
   - これにより、例えば \`h1\` タグをレンダリングする際に特定のスタイルや動作を持つカスタムコンポーネントを使用できます。

3. **Styled Components などのライブラリを使用する**：
   - \`styled-components\` や \`emotion\` のようなCSS-in-JSライブラリを使用して、Markdownコンテンツにスタイルを適用することもできます。
   - これらのライブラリを使用すると、コンポーネントに対してJavaScriptを介して直接スタイルを適用できます。

以下は \`react-markdown\` にCSSスタイルを適用する基本的な例です：

\`\`\`css
/* CSSファイルでのスタイリング */
.markdown {
  font-family: Arial, sans-serif;
}

.markdown h1 {
  color: blue;
}
\`\`\`

\`\`\`jsx
// React コンポーネントでの使用例
import ReactMarkdown from 'react-markdown';
import './App.css'; // CSSファイルのインポート

function App() {
  const markdown = '# これは見出しです\n\nこれは段落です。';

  return (
    <div className="App">
      <ReactMarkdown className="markdown">
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

export default App;
\`\`\`

これらの方法を使って、\`react-markdown\` を使ったMarkdownコンテンツの見た目を自由にカスタマイズできます。`

const oldCode = `
const a = 10
const b = 10
const c = () => console.log('foo')
 
if(a > 10) {
  console.log('bar')
}
 
console.log('done')
`;
const newCode = `
const a = 10
const boo = 10
 
if(a === 10) {
  console.log('bar')
}
`;

function DetailPage() {
  return (
    <div>
      <ReactDiffViewer
        oldValue={oldCode}
        newValue={newCode}
        leftTitle={<a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="#">oldCode</a>}
        rightTitle={<a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="#">newCode</a>}
        splitView={true} />

      <div className="mt-20">
        <h2 className="mx-auto text-center max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Boost your productivity today.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
          Incididunt sint fugiat pariatur cupidatat consectetur sit cillum anim id veniam aliqua proident excepteur
          commodo do ea.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <button
            type="button"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Button text
          </button>
        </div>
        <div className="mt-20 overflow-hidden rounded-lg shadow">
          <div className="text-left px-4 py-5 sm:p-6 markdown-body">
            <Markdown rehypePlugins={[remarkGfm, rehypeHighlight]}>{markdown}</Markdown>
          </div>
        </div>
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