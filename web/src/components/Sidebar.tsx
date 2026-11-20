import type { FC } from 'react';
import { LayoutDashboard, Package, Link2, CalendarCheck2, Settings } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'bienes', label: 'Bienes y Catálogo', icon: Package },
    { id: 'kits', label: 'Vinculación de Kits', icon: Link2 },
    { id: 'campanas', label: 'Campañas de Inventario', icon: CalendarCheck2 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 shadow-xl">
      <div className="space-y-6">
        <div className="px-3 py-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Menú Institucional
          </span>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-red-700 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800 px-3 flex items-center gap-2 text-xs text-slate-500">
        <Settings size={14} />
        <span>Versión 1.0.0 (API v1)</span>
      </div>
    </aside>
  );
};
