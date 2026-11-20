import { useState } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { BienesPage } from './pages/BienesPage';
import { KitsPage } from './pages/KitsPage';

export function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'bienes' | 'kits' | 'campanas'>('dashboard');

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <HeaderBar userRole="ADMIN" userName="Admin Marcona" />

      <div className="flex flex-1">
        <Sidebar currentTab={currentTab} onTabChange={(tab) => setCurrentTab(tab as any)} />

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
          {currentTab === 'dashboard' && <DashboardPage />}
          {currentTab === 'bienes' && <BienesPage />}
          {currentTab === 'kits' && <KitsPage />}
          {currentTab === 'campanas' && <DashboardPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
