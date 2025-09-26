import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { AcademyClass, AcademyModule, AcademyResource } from '../../../types';
import { Card } from '../../../components/ui/Card';

export function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [resources, setResources] = useState<AcademyResource[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: classMembers } = await supabase.from('academy_class_members').select('*').eq('user_id', user.id).eq('role_in_class', 'etudiant');
      const classIds = (classMembers || []).map((m: any) => m.class_id);
      if (!classIds.length) { setClasses([]); setModules([]); setResources([]); return; }

      const { data: classesData } = await supabase.from('academy_classes').select('*').in('id', classIds);
      setClasses((classesData || []) as AcademyClass[]);

      const { data: assignments } = await supabase.from('academy_module_assignments').select('*').in('class_id', classIds);
      const moduleIds = Array.from(new Set((assignments || []).map((a: any) => a.module_id)));
      if (moduleIds.length) {
        const { data: modulesData } = await supabase.from('academy_modules').select('*').in('id', moduleIds);
        setModules((modulesData || []) as AcademyModule[]);
      }

      const { data: resourcesData } = await supabase.from('academy_resources').select('*').or(`visibility.eq.academy,visibility.eq.class,visibility.eq.module`).in('class_id', classIds);
      setResources((resourcesData || []) as AcademyResource[]);

      const { data: evals } = await supabase.from('academy_evaluations').select('*').in('class_id', classIds).order('created_at', { ascending: false });
      setEvaluations(evals || []);

      const { data: myGrades } = await supabase.from('academy_grades').select('*').in('evaluation_id', (evals || []).map((e: any) => e.id)).eq('student_id', user.id);
      setGrades(myGrades || []);
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Académie</h1>

      <Card>
        <div className="p-4">
          <h2 className="font-semibold mb-2">Mes classes</h2>
          <ul className="list-disc ml-6">
            {classes.map(c => <li key={c.id}>{c.name}</li>)}
            {!classes.length && <li>Aucune classe</li>}
          </ul>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h2 className="font-semibold mb-2">Modules assignés</h2>
          <ul className="list-disc ml-6">
            {modules.map(m => <li key={m.id}>{m.title}</li>)}
            {!modules.length && <li>Aucun module</li>}
          </ul>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h2 className="font-semibold mb-2">Ressources</h2>
          <ul className="list-disc ml-6">
            {resources.map(r => <li key={r.id}><a className="text-blue-600" href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>)}
            {!resources.length && <li>Aucune ressource</li>}
          </ul>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h2 className="font-semibold mb-2">Évaluations & Notes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="py-1 pr-4">Titre</th>
                  <th className="py-1 pr-4">Module</th>
                  <th className="py-1">Note</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map(ev => {
                  const g = grades.find(x => x.evaluation_id === ev.id);
                  const moduleName = modules.find(m => m.id === ev.module_id)?.title || ev.module_id;
                  return (
                    <tr key={ev.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-1 pr-4">{ev.title}</td>
                      <td className="py-1 pr-4">{moduleName}</td>
                      <td className="py-1">{g ? `${g.score}/${ev.total_points}` : '—'}</td>
                    </tr>
                  );
                })}
                {!evaluations.length && (
                  <tr><td className="py-2 text-sm text-gray-500" colSpan={3}>Aucune évaluation.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}


