import { Link } from 'react-router-dom';
import type { Duplication } from './types';
import { findCommonPrefix } from './utils'

const statuses = {
  Complete: 'text-green-700 bg-green-50 ring-green-600/20',
  'In progress': 'text-gray-600 bg-gray-50 ring-gray-500/10',
  Archived: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function ListPage({ duplications }: { duplications: Duplication[] }) {

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
      status: 'Complete',
      format: duplication.format,
      createdAt,
      duplicationATitle,
      duplicationBTitle,
    }
  });

  return (
    <div>
      <div className="mb-5 px-4 sm:px-0">
        <h3 className="text-2xl font-semibold leading-7 text-gray-900">Diagnosis Results</h3>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">Detected
          <span className="mx-1 font-medium text-gray-900 underline">
            {item.length}
          </span> instances of duplicate code.</p>
      </div>


      <ul role="list" className="divide-y divide-gray-100">
        {item.map((project) => (
          <li key={project.id} className="flex items-center justify-between gap-x-6 py-5">
            <div className="min-w-0">
              <Link to={String(project.id)} className="hover:underline flex items-baseline">
                <h2 className="text-md font-medium text-gray-500">
                  💥 Duplication Found!
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
                {/* TODO 削除可能なコードの行数を出す */}
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