import { Link } from 'react-router-dom';
import { Routes, Route, useLocation } from 'react-router-dom';
import ListPage from './ListPage';
import DetailPage from './DetailPage';
import type { AppData, Duplication, ClocResult } from './types';
import { BASEURL } from './constants';
import { useEffect, useState } from 'react'
import { Disclosure, } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { HomeIcon } from '@heroicons/react/20/solid'
import toast, { Toaster } from 'react-hot-toast';

const navigation: { name: string; href: string; current: boolean }[] = [
  { name: 'GitHub', href: 'https://github.com/hand-dot/my-refactoring-tool', current: false },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function App() {

  const location = useLocation();
  const currentPath = location.pathname;
  const [_, currentPathId] = currentPath.split('/');

  const [pages, setPages] = useState<{ name: string; href: string; current: boolean }[]>([])
  const [duplications, setDuplications] = useState<Duplication[]>([])
  const [countLinesOfProjects, setCountLinesOfProjects] = useState<[ClocResult] | [ClocResult, ClocResult]>([{ projectPath: "", SUM: { blank: 0, comment: 0, code: 0, nFiles: 0, } }])

  const analyze = () => {
    toast.promise(fetch(`${BASEURL}/init`)
      .then((response) => response.json())
      .then(({ duplications, countLinesOfProjects }: AppData) => {
        setDuplications(duplications)
        setCountLinesOfProjects(countLinesOfProjects)
      }), {
      loading: 'Analyzing your codebase, please wait...',
      success: 'Analysis complete.',
      error: 'An error occurred during analysis.',
    });
  }

  useEffect(() => {
    analyze()
    const timerId = setInterval(() => {
      fetch(`${BASEURL}/isFileChanged`)
        .then((response) => response.json())
        .then(({ changed }: { changed: boolean }) => {
          if (changed) {
            console.log('changed')
            analyze();
          }
        });

    }, 1000)

    return () => {
      clearInterval(timerId)
    }
  }, [])


  useEffect(() => {

    if (!currentPathId || duplications.length === 0) {
      setPages([])
      return;
    }
    const currentDuplication = duplications.find((duplication) => duplication.id === currentPathId);
    if (currentDuplication) {
      const name = 'Duplicated Code Diagnostic Result'
      setPages([{ name, href: `/${currentPathId}`, current: true }])
    } else {
      setPages([])
    }
  }, [currentPath, duplications])

  return (
    <div>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
      />
      <Disclosure as="nav" className="bg-gray-800">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 items-center justify-between">
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  {/* Mobile menu button*/}
                  <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex flex-shrink-0 items-center">
                    <Link to="/">
                      <p className="text-white font-bold text-2xl">My Refactoring Tool</p>
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:block">
                    <div className="flex space-x-4">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                            'rounded-md px-3 py-2 text-sm font-medium'
                          )}
                          aria-current={item.current ? 'page' : undefined}
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    className={classNames(
                      item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'block rounded-md px-3 py-2 text-base font-medium'
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      <nav className="flex border-b border-gray-200 bg-white" aria-label="Breadcrumb">
        <ol role="list" className="mx-auto flex items-center w-full max-w-screen-xl space-x-4 px-4 sm:px-6 lg:px-8">
          <li className="flex items-center h-12">
            <div className="flex items-center">
              <Link to="/" className="text-gray-400 hover:text-gray-500">
                <HomeIcon className="h-full w-5 flex-shrink-0" aria-hidden="true" />
                <span className="sr-only">Home</span>
              </Link>
            </div>
          </li>
          {pages.map((page) => (
            <li key={page.name} className="flex">
              <div className="flex items-center">
                <svg
                  className="h-full w-6 flex-shrink-0 text-gray-200"
                  viewBox="0 0 24 44"
                  preserveAspectRatio="none"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
                </svg>
                <a
                  href={page.href}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                  aria-current={page.current ? 'page' : undefined}
                >
                  {page.name}
                </a>
              </div>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-5">
        <Routes>
          <Route path="/" element={<ListPage duplications={duplications} countLinesOfProjects={countLinesOfProjects} />} />
          <Route path="/:id" element={
            <DetailPage
              duplication={duplications.find((duplication) => duplication.id === currentPathId)}
            />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;