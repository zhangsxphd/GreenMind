import { ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { pageTitleMap } from '../../config/navigation';

export default function Topbar({ currentUser, users, showUserMenu, setShowUserMenu, onSelectUser }) {
  const { pathname } = useLocation();
  const title = pageTitleMap[pathname] ?? '设施农业智能决策平台';

  return (
    <header
      className="sticky top-0 z-10 flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between md:px-8"
      onClick={(event) => event.stopPropagation()}
    >
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>

      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-slate-500">当前园区:</span>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            {currentUser.park}
          </span>
        </div>

        <div className="relative sm:ml-4">
          <button
            onClick={() => setShowUserMenu((visible) => !visible)}
            className="flex w-full items-center justify-between gap-2 rounded-xl p-1.5 transition-colors hover:bg-slate-50 sm:w-auto sm:justify-start"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-100 font-bold text-emerald-700 shadow-sm">
                {currentUser.avatar}
              </div>
              <div className="text-left">
                <span className="block text-sm font-medium leading-tight text-slate-700">{currentUser.name}</span>
                <span className="block text-[10px] text-slate-500">{currentUser.role.split('/')[0].trim()}</span>
              </div>
            </div>
            <ChevronDown size={14} className="ml-1 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 mt-2 w-full min-w-56 rounded-xl border border-slate-100 bg-white py-2 shadow-lg duration-200 sm:w-56">
              <div className="mb-2 border-b border-slate-50 px-4 py-2">
                <p className="text-xs font-bold tracking-wider text-slate-400">切换账号</p>
              </div>
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className={[
                    'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-slate-50',
                    currentUser.id === user.id ? 'bg-emerald-50/50' : '',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'flex h-8 w-8 items-center justify-center rounded-full font-bold',
                      currentUser.id === user.id
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600',
                    ].join(' ')}
                  >
                    {user.avatar}
                  </div>
                  <div>
                    <p className={currentUser.id === user.id ? 'text-sm font-bold text-emerald-700' : 'text-sm font-bold text-slate-700'}>
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500">{user.role.split('/')[0].trim()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
