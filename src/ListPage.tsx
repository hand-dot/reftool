import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/20/solid'
import type { Duplication } from './types';

const statuses = {
  Complete: 'text-green-700 bg-green-50 ring-green-600/20',
  'In progress': 'text-gray-600 bg-gray-50 ring-gray-500/10',
  Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function findCommonPrefix(str1: string, str2: string) {
  let prefix = "";
  for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
    if (str1[i] === str2[i]) {
      prefix += str1[i];
    } else {
      break;
    }
  }

  return prefix;
}

function ListPage() {
  const [duplications, setDuplications] = useState<Duplication[]>([])

  useEffect(() => {
    fetch('http://localhost:5173/detectClones')
      .then((response) => response.json())
      .then(({ duplications }) => {
        setDuplications(duplications)
      });
    // TODO ボタンを押すと、サーバーにリクエストを送るようにする
  }, [])


  const projects = duplications.map((duplication) => {
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

    if (duplicationATitle === duplicationBTitle) {
      duplicationATitle = duplicationATitle + ' (same file)'
      duplicationBTitle = '';
    }



    return {
      id: duplication.id,
      path,
      status: 'Complete',
      format: duplication.format,
      createdAt,
      duplicationATitle,
      duplicationBTitle,
    }
  });

  return (
    <div>
      <div className="text-center mb-10">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No projects</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
        <div className="mt-6">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New Project
          </button>
        </div>
      </div>
      <div className="relative my-20">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2 text-sm text-gray-500">Continue</span>
        </div>
      </div>
      <ul role="list" className="divide-y divide-gray-100">
        {projects.map((project) => (
          <li key={project.id} className="flex items-center justify-between gap-x-6 py-5">
            <div className="min-w-0">
              <Link to={String(project.id)} className="hover:underline flex items-baseline">
                <h2 className="text-md font-medium text-gray-500">
                  💥 Duplication Found!
                </h2>
                <span className="ml-2 text-sm text-gray-900 font-medium truncate">
                  {project.id}
                </span>
              </Link>
              <div className="flex items-start gap-x-3">
                <div className='flex flex-col'>
                  <p className="text-sm font-semibold leading-6 text-gray-900">{project.duplicationATitle}</p>
                  <p className="text-sm font-semibold leading-6 text-gray-900">{project.duplicationBTitle}</p>
                </div>
                <p
                  className={'text-gray-700 bg-gray-50 ring-gray-600/20 rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset'}
                >
                  {project.format}
                </p>
              </div>
              <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                <p
                  className={classNames(
                    // @ts-ignore
                    statuses[project.status],
                    'rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset'
                  )}
                >
                  {project.status}
                </p>
                /
                <p className="truncate"> {project.createdAt}</p>
                /
                <p className="truncate"> {project.path}</p>
              </div>
            </div>
            <div className="flex flex-none items-center gap-x-4">
              <Link
                to={String(project.id)}
                className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
              >
                View duplication
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ListPage;