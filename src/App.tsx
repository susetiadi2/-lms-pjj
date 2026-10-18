import React from 'react';
import { LmsProvider, useLms } from './context/LmsContext';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TasksView } from './components/TasksView';
import { MaterialsView } from './components/MaterialsView';
import { ExamsView } from './components/ExamsView';
import { QuestionBankView } from './components/QuestionBankView';
import { ClassesView } from './components/ClassesView';
import { UsersView } from './components/UsersView';
import { SubjectsView } from './components/SubjectsView';
import { GradesAchievementsView } from './components/GradesAchievementsView';
import { ProfileView } from './components/ProfileView';
import { SecurityAuditModal } from './components/SecurityAuditModal';

const MainAppContent: React.FC = () => {
  const { currentUser, activeTab, isSecurityModalOpen, setIsSecurityModalOpen } = useLms();

  if (!currentUser) {
    return <AuthScreen />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'ringkasan':
        return <DashboardView />;
      case 'tugas':
        return <TasksView />;
      case 'materi':
        return <MaterialsView />;
      case 'ujian':
        return <ExamsView />;
      case 'bank_soal':
        return <QuestionBankView />;
      case 'kelas':
        return <ClassesView />;
      case 'akun':
        return <UsersView />;
      case 'mapel':
        return <SubjectsView />;
      case 'nilai':
        return <GradesAchievementsView />;
      case 'profil':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f6] text-slate-800 flex font-sans">
      {/* Sidebar (Desktop and Mobile Drawer) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {renderActiveView()}
        </main>
      </div>

      {/* Enterprise Security & Live Penetration Test Modal */}
      <SecurityAuditModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <LmsProvider>
      <MainAppContent />
    </LmsProvider>
  );
}
