import React, { useState } from 'react';
import { useLms } from '../context/LmsContext';
import { Layers, BookOpen, Calculator, FlaskConical, Languages, Sparkles } from 'lucide-react';

export const SubjectsView: React.FC = () => {
  const { subjects } = useLms();

  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator':
        return Calculator;
      case 'FlaskConical':
        return FlaskConical;
      case 'Languages':
        return Languages;
      case 'Sparkles':
        return Sparkles;
      case 'BookOpen':
        return BookOpen;
      default:
        return Layers;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#eef5f1] text-[#3d6053] rounded-lg">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">Daftar Mata Pelajaran</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kurikulum Nasional dan Muatan Lokal PJJ yang terintegrasi di Mr. DIVA Smart School.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub) => {
          const Icon = getSubjectIcon(sub.iconName);
          return (
            <div
              key={sub.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#3d6053]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: sub.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {sub.code}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-800 mb-1">{sub.name}</h3>
                <p className="text-xs text-slate-500 mb-3">Jenjang: {sub.gradeLevel}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Pengampu:</span>
                <span className="font-semibold text-slate-700">{sub.teacherName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
