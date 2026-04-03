import { Sprout } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { navItems } from '../../config/navigation';

export default function Sidebar() {
  return (
    <aside className="z-10 w-full bg-slate-900 text-slate-300 shadow-xl md:min-h-screen md:w-64">
      <div className="flex items-center gap-3 border-b border-slate-800 p-6">
        <div className="rounded-lg bg-emerald-500 p-2 text-white">
          <Sprout size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight text-white">农棚智脑</h1>
          <p className="text-xs text-slate-400">水肥协同决策平台</p>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-4 py-4 md:flex-col md:overflow-visible md:py-6">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            end={item.end}
            to={item.path}
            className={({ isActive }) =>
              [
                'flex min-w-fit items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 md:w-full',
                isActive
                  ? 'bg-emerald-600/20 font-semibold text-emerald-400'
                  : 'hover:bg-slate-800 hover:text-white',
              ].join(' ')
            }
          >
            <item.icon size={20} />
            <span className="whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
