import { Link } from 'react-router-dom';
import { Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Fragment } from 'react'
import type { Duplication, ClocResult, ClocFileDetails } from './types';
import { findCommonPrefix, getPotentialRemovals } from './utils'
import { commonOptions } from './constants';


const solutions = [
  {
    name: 'Insights',
    description: 'Measure actions your users take',
    href: '##',
  },
  {
    name: 'Automations',
    description: 'Create your own targeted content',
    href: '##',
  },
  {
    name: 'Reports',
    description: 'Keep track of your growth',
    href: '##',
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function ListPage({ duplications, countLinesOfProjects }: { duplications: Duplication[], countLinesOfProjects: [ClocResult] | [ClocResult, ClocResult] }) {

  const item = duplications.map((duplication) => {
    const date = new Date(duplication.foundDate);
    const createdAt = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}:${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

    let path = findCommonPrefix(duplication.duplicationA.path, duplication.duplicationB.path);
    let duplicationATitle = duplication.duplicationA.path;
    let duplicationBTitle = duplication.duplicationB.path;

    if (duplicationATitle === path) {
      path = ''
    } else {
      duplicationATitle = duplicationATitle.replace(path, '');
      duplicationBTitle = duplicationBTitle.replace(path, '');
    }

    return {
      id: duplication.id,
      path,
      format: duplication.format,
      createdAt,
      duplicationATitle,
      duplicationBTitle,
      potentialRemovals: getPotentialRemovals(duplication.duplicationA)
    }
  }).splice(0, 10)


  const _countLinesOfProjects = countLinesOfProjects.map((countLinesOfProject) => {
    return {
      projectPath: countLinesOfProject.projectPath,
      blank: countLinesOfProject.SUM.blank,
      comment: countLinesOfProject.SUM.comment,
      code: countLinesOfProject.SUM.code,
      nFiles: countLinesOfProject.SUM.nFiles,
      fileDetails: Object.entries(countLinesOfProject).map(([key, value]) => {
        const v = value as ClocFileDetails
        return {
          filePath: key,
          blank: v.blank,
          comment: v.comment,
          code: v.code,
          language: v.language,
        }
      }).filter((v) => v.filePath !== 'SUM' && v.filePath !== 'header' && v.filePath !== 'projectPath').splice(0, 10)
    }
  })


  return (
    <div>
      <div>
        <h3 className="text-2xl font-semibold leading-7 text-gray-900">Count lines of project code</h3>
        <dl className={`grid grid-cols-2 gap-4 mt-5 divide-x divide-gray-200 overflow-hidden rounded-lg bg-white`}>
          {_countLinesOfProjects.map((item, index) => (
            <div key={item.projectPath} className={`px-4 py-5 pl-${index}`}>
              <dt className="text-base font-normal text-gray-900">Project{index + 1}: {item.projectPath}</dt>
              <dd className="mt-5 flex">
                <div className="h-10 flex items-center font-semibold text-gray-700">
                  <span className='underline text-xl'>{item.code} lines</span>
                  <span className="mx-2 text-md font-medium text-gray-700">from </span>
                  <span className='underline text-lg'>{item.nFiles} files</span>
                </div>
                <div className='h-10'>
                  <Popover className={'mt-2 px-4 absolute'}>
                    {({ open }) => (
                      <>
                        <Popover.Button
                          className={`
                ${open ? 'text-white' : 'text-white/90'}
                group inline-flex items-center rounded-md bg-gray-700 px-2 py-1 text-sm hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75`}
                        >
                          <span>Top 10 files by code count</span>
                          <ChevronDownIcon
                            className={`${open ? 'text-gray-300' : 'text-gray-300/70'}
                  ml-2 h-5 w-5 transition duration-150 ease-in-out group-hover:text-gray-300/80`}
                            aria-hidden="true"
                          />
                        </Popover.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="opacity-0 translate-y-1"
                          enterTo="opacity-100 translate-y-0"
                          leave="transition ease-in duration-150"
                          leaveFrom="opacity-100 translate-y-0"
                          leaveTo="opacity-0 translate-y-1"
                        >
                          <Popover.Panel className="absolute left-10 z-10 mt-3 w-screen max-w-md -translate-x-1/2 transform px-4 sm:px-0">
                            <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5 max-h-80 overflow-y-scroll">
                              <div className="grid grid-cols-1 gap-8 bg-white p-7">
                                {item.fileDetails.map((fileDetail, index) => {
                                  const fileName = fileDetail.filePath.split('/').pop()
                                  const path = fileDetail.filePath.replace(item.projectPath, '')
                                  return <div
                                    key={fileDetail.filePath}
                                    className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-gray-500/50"
                                  >
                                    <div className="ml-4">
                                      <p className="text-sm font-medium text-gray-900">
                                        {index + 1}: {fileName} - <span className='text-xs'><span className='text-red-500'>code:{fileDetail.code}</span>, blank: {fileDetail.blank}, comment: {fileDetail.comment}</span>
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {path}
                                      </p>
                                      <a className='text-sm text-blue-600 dark:text-blue-500 hover:underline' href={`vscode://file${fileDetail.filePath}`}
                                      > (Click to open in VSCode)</a>
                                    </div>
                                  </div>
                                })}
                              </div>
                            </div>
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h2 className="mb-2 text-md text-gray-500">Setting:</h2>
        <ul className="space-y-1 text-sm text-gray-500 list-disc list-inside">
          <li>
            ExcludeDirs: {commonOptions.excludeDirs.join(', ')}
          </li>
          <li>
            ExcludeExts: {commonOptions.excludeExts.join(', ')}
          </li>
        </ul>
      </div>

      <div className="border-t border-gray-200 py-5 mt-5 px-4 sm:px-0">
        <h3 className="text-xl font-semibold leading-7 text-gray-900">Duplicated Code Diagnostic Results</h3>
        <p className="mt-1 text-sm leading-6 text-gray-500">Detected
          <span className="mx-1 font-medium text-gray-900 underline">
            {duplications.length}
          </span> instances of duplicate code.(The following items have significant duplicates, displayed in the Top {item.length}.)
          <br />
          If all these duplications are refactored and consolidated, there is potential to reduce the total code by
          <span className="mx-1 font-medium text-gray-900 underline">
            {
              item.reduce((acc, cur) => acc + cur.potentialRemovals, 0)
            } lines
          </span>.
        </p>

      </div>


      <ul role="list" className="divide-y divide-gray-100">
        {item.map((project, index) => (
          <li key={project.id} className="flex items-center justify-between gap-x-6 py-5">
            <div className="min-w-0">
              <Link to={String(project.id)} className="hover:underline flex items-baseline">
                <h2 className="text-md font-medium text-gray-500">
                  {index + 1}: 💥 Duplication Found!
                </h2>
                <span className="ml-2 text-sm text-gray-900 font-medium truncate">
                  {project.id}
                </span>
                {project.duplicationATitle === project.duplicationBTitle &&
                  <p
                    className={'ml-2 text-pink-700 bg-pink-50 ring-pink-600/20 rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset'}>
                    same file
                  </p>}

                <p
                  className={'ml-2 text-gray-700 bg-gray-50 ring-gray-600/20 rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset'}
                >
                  {project.format}
                </p>
              </Link>
              <div className="flex items-start gap-x-3">
                <div className='flex flex-col'>
                  {project.duplicationATitle === project.duplicationBTitle ? (
                    <>
                      <p className="text-sm font-semibold leading-6 text-gray-900">A & B: {project.duplicationATitle}</p>
                    </>) : (
                    <>
                      <p className="text-sm font-semibold leading-6 text-gray-900">A: {project.duplicationATitle} - B: {project.duplicationBTitle}</p>
                      <div className="flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                        <p className="truncate"> {project.path}</p>
                      </div>
                    </>)}

                </div>
              </div>
              <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                <p className="truncate"> Potential Removals: <span className='text-red-500'>{project.potentialRemovals}lines</span></p>
                /
                <p className="truncate"> Scanned at: {project.createdAt}</p>
              </div>
            </div>
            <div className="flex flex-none items-center gap-x-4">
              <Link
                to={String(project.id)}
                className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
              >
                View detail
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div >
  );
}

export default ListPage;