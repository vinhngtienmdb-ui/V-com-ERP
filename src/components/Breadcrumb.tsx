import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { navGroups } from '../constants';

const pathMap: Record<string, string> = Object.fromEntries(
  navGroups.flatMap(g => g.items.map(i => [i.path, i.label]))
);
pathMap['/'] = 'Home';

export function Breadcrumb() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; path: string }[] = [{ label: 'Home', path: '/' }];

  let built = '';
  for (const seg of segments) {
    built += '/' + seg;
    crumbs.push({ label: pathMap[built] ?? seg, path: built });
  }

  return (
    <nav className="flex items-center gap-1 mb-4 flex-wrap">
      {crumbs.map((c, i) => (
        <React.Fragment key={c.path}>
          {i > 0 && <ChevronRight className="w-2.5 h-2.5 shrink-0 text-slate-300" />}
          {i === 0
            ? (
              <button
                onClick={() => navigate('/')}
                className="p-0.5 text-slate-400 hover:text-blue-500 transition-colors"
              >
                <Home className="w-3 h-3" />
              </button>
            )
            : i === crumbs.length - 1
              ? (
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 px-1.5 py-0.5 bg-slate-100 border border-slate-200">
                  {c.label}
                </span>
              )
              : (
                <button
                  onClick={() => navigate(c.path)}
                  className="font-mono text-[10px] uppercase tracking-wider text-slate-400 hover:text-blue-500 transition-colors"
                >
                  {c.label}
                </button>
              )
          }
        </React.Fragment>
      ))}
    </nav>
  );
}
