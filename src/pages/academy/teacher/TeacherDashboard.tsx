import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { AcademyClass, AcademyEvaluation, AcademyModule } from '../../../types';
import { Card } from '../../../components/ui/Card';
import { Link } from 'react-router-dom';

export function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [evaluations, setEvaluations] = useState<AcademyEvaluation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      // classes où l'utilisateur est prof
      const { data: classMembers } = await supabase.from('academy_class_members').select('*').eq('user_id', user.id).eq('role_in_class', 'prof');
      const classIds = (classMembers || []).map((m: any) => m.class_id);
      if (!classIds.length) { setClasses([]); setModules([]); setEvaluations([]); return; }

      const { data: classesData } = await supabase.from('academy_classes').select('*').in('id', classIds);
      setClasses((classesData || []) as AcademyClass[]);

      const { data: assignments } = await supabase.from('academy_module_assignments').select('*').in('class_id', classIds);
      const moduleIds = Array.from(new Set((assignments || []).map((a: any) => a.module_id)));
      if (moduleIds.length) {
        const { data: modulesData } = await supabase.from('academy_modules').select('*').in('id', moduleIds);
        setModules((modulesData || []) as AcademyModule[]);
      }

      const { data: evals } = await supabase.from('academy_evaluations').select('*').in('class_id', classIds).eq('evaluator_id', user.id).order('created_at', { ascending: false });
      setEvaluations((evals || []) as AcademyEvaluation[]);
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Espace Prof</h1>

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
          <h2 className="font-semibold mb-2">Modules</h2>
          <ul className="list-disc ml-6">
            {modules.map(m => <li key={m.id}>{m.title}</li>)}
            {!modules.length && <li>Aucun module</li>}
          </ul>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h2 className="font-semibold mb-2">Mes évaluations</h2>
          <ul className="list-disc ml-6">
            {evaluations.map(e => (
              <li key={e.id}>
                <Link className="text-blue-600" to="/academy/admin/evaluations">{e.title}</Link>
              </li>
            ))}
            {!evaluations.length && <li>Aucune évaluation</li>}
          </ul>
        </div>
      </Card>
    </div>
  );
}


