import type { FC } from 'react';
import { User } from 'lucide-react';

interface HeaderBarProps {
  userRole?: string;
  userName?: string;
}

export const HeaderBar: FC<HeaderBarProps> = ({ userRole = 'ADMIN', userName = 'Administrador General' }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-1 shadow-sm">
          <img src="/escudo-marcona.png" alt="Escudo Marcona" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-800 leading-tight">
            Patrimonio Marcona
          </h1>
          <p className="text-xs text-slate-400">
            Municipalidad Distrital de Marcona • Control Patrimonial
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
          {userRole}
        </span>
        <div className="flex items-center gap-2 text-slate-700">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-300">
            <User size={16} className="text-slate-600" />
          </div>
          <span className="text-sm font-semibold">{userName}</span>
        </div>
      </div>
    </header>
  );
};
