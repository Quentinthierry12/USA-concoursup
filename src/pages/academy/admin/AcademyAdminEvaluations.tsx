import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Academy, AcademyClass, AcademyEvaluation, AcademyModule, AcademyGrade, User } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../contexts/AuthContext';

export function AcademyAdminEvaluations() {
  const { user } = useAuth();
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string | ''>('');
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [evaluations, setEvaluations] = useState<AcademyEvaluation[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [grades, setGrades] = useState<AcademyGrade[]>([]);
  const [form, setForm] = useState<{ id?: string; class_id?: string; module_id?: string; title: string; description?: string; total_points: number; due_at?: string }>({ title: '', total_points: 100 });

  const fetchAcademies = async () => { const { data } = await supabase.from('academy_academies').select('*'); setAcademies((data || []) as Academy[]); };
  const fetchClasses = async () => {
    if (user?.academy_role === 'prof') {
      const { data: myClasses } = await supabase.from('academy_class_members').select('class_id').eq('user_id', user.id).eq('role_in_class', 'prof');
      const classIds = (myClasses || []).map((m: any) => m.class_id);
      if (!classIds.length) { setClasses([]); return; }
      const { data } = await supabase.from('academy_classes').select('*').in('id', classIds);
      setClasses((data || []) as AcademyClass[]);
      return;
    }
    if (!selectedAcademyId) { setClasses([]); return; }
    const { data } = await supabase.from('academy_classes').select('*').eq('academy_id', selectedAcademyId);
    setClasses((data || []) as AcademyClass[]);
  };
  const fetchModules = async () => {
    if (user?.academy_role === 'prof') {
      const { data: myClasses } = await supabase.from('academy_class_members').select('class_id').eq('user_id', user.id).eq('role_in_class', 'prof');
      const classIds = (myClasses || []).map((m: any) => m.class_id);
      if (!classIds.length) { setModules([]); return; }
      const { data: assigns } = await supabase.from('academy_module_assignments').select('module_id').in('class_id', classIds);
      const moduleIds = Array.from(new Set((assigns || []).map((a: any) => a.module_id)));
      if (!moduleIds.length) { setModules([]); return; }
      const { data } = await supabase.from('academy_modules').select('*').in('id', moduleIds);
      setModules((data || []) as AcademyModule[]);
      return;
    }
    if (!selectedAcademyId) { setModules([]); return; }
    const { data } = await supabase.from('academy_modules').select('*').eq('academy_id', selectedAcademyId);
    setModules((data || []) as AcademyModule[]);
  };
  const fetchEvaluations = async () => {
    // Si prof connecté, limiter aux évaluations qu'il a créées ou à ses classes
    if (user?.academy_role === 'prof') {
      const { data: myClasses } = await supabase.from('academy_class_members').select('class_id').eq('user_id', user.id).eq('role_in_class', 'prof');
      const classIds = (myClasses || []).map((m: any) => m.class_id);
      const { data } = await supabase.from('academy_evaluations').select('*').or(`evaluator_id.eq.${user.id}${classIds.length ? `,class_id.in.(${classIds.join(',')})` : ''}`).order('created_at', { ascending: false });
      setEvaluations((data || []) as AcademyEvaluation[]);
      return;
    }
    const { data } = await supabase.from('academy_evaluations').select('*').order('created_at', { ascending: false });
    setEvaluations((data || []) as AcademyEvaluation[]);
  };
  const fetchStudents = async (classId?: string) => { if (!classId) { setStudents([]); return; } const { data } = await supabase.from('academy_class_members').select('user_id, role_in_class').eq('class_id', classId).eq('role_in_class', 'etudiant'); const studentIds = (data || []).map((m: any) => m.user_id); if (!studentIds.length) { setStudents([]); return; } const { data: users } = await supabase.from('concour_users').select('*').in('id', studentIds); setStudents((users || []) as User[]); };
  const fetchGrades = async (evaluationId?: string) => { if (!evaluationId) { setGrades([]); return; } const { data } = await supabase.from('academy_grades').select('*').eq('evaluation_id', evaluationId); setGrades((data || []) as AcademyGrade[]); };

  useEffect(() => { fetchAcademies(); fetchEvaluations(); }, []);
  useEffect(() => { fetchClasses(); fetchModules(); }, [selectedAcademyId]);

  const submit = async () => {
    if (!form.title.trim() || !form.class_id || !form.module_id || !user) return;
    if (form.id) {
      await supabase.from('academy_evaluations').update({ class_id: form.class_id, module_id: form.module_id, title: form.title, description: form.description, total_points: form.total_points, due_at: form.due_at, evaluator_id: user.id }).eq('id', form.id);
    } else {
      await supabase.from('academy_evaluations').insert({ class_id: form.class_id, module_id: form.module_id, title: form.title, description: form.description, total_points: form.total_points, evaluator_id: user.id, due_at: form.due_at });
    }
    setForm({ title: '', total_points: 100 });
    await fetchEvaluations();
  };

  const del = async (id: string) => { await supabase.from('academy_evaluations').delete().eq('id', id); await fetchEvaluations(); };

  const openGrades = async (evaluation: AcademyEvaluation) => {
    await fetchStudents(evaluation.class_id);
    await fetchGrades(evaluation.id);
    setForm({ id: evaluation.id, class_id: evaluation.class_id, module_id: evaluation.module_id, title: evaluation.title, description: evaluation.description, total_points: evaluation.total_points });
  };

  const setGrade = async (evaluationId: string, studentId: string, score: number) => {
    const existing = grades.find(g => g.evaluation_id === evaluationId && g.student_id === studentId);
    if (existing) {
      await supabase.from('academy_grades').update({ score }).eq('id', existing.id);
    } else {
      await supabase.from('academy_grades').insert({ evaluation_id: evaluationId, student_id: studentId, score });
    }
    await fetchGrades(evaluationId);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Évaluations & Notes</h1>

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={selectedAcademyId} onChange={e => setSelectedAcademyId(e.target.value)}>
              <option value="">Académie</option>
              {academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={form.class_id || ''} onChange={e => setForm({ ...form, class_id: e.target.value })}>
              <option value="">Classe</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={form.module_id || ''} onChange={e => setForm({ ...form, module_id: e.target.value })}>
              <option value="">Module</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            <Input placeholder="Titre" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Points totaux" type="number" value={form.total_points} onChange={e => setForm({ ...form, total_points: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Échéance (ISO)" value={form.due_at || ''} onChange={e => setForm({ ...form, due_at: e.target.value })} />
            <Button onClick={submit}>{form.id ? 'Mettre à jour' : 'Créer évaluation'}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evaluations.map(ev => (
              <div key={ev.id} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{ev.title}</div>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">{ev.total_points} pts</span>
                </div>
                {ev.description && <div className="text-sm text-gray-500 mt-1">{ev.description}</div>}
                <div className="text-xs text-gray-500 mt-1">Module {ev.module_id} — Classe {ev.class_id}</div>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" onClick={() => openGrades(ev)}>Notes</Button>
                  <Button variant="danger" onClick={() => del(ev.id)}>Supprimer</Button>
                </div>
                {form.id === ev.id && (
                  <div className="mt-3">
                    {!students.length ? (
                      <div className="text-sm text-gray-500">Aucun étudiant dans la classe.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                              <th className="py-1 pr-4">Élève</th>
                              <th className="py-1">Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map(s => {
                              const g = grades.find(x => x.student_id === s.id && x.evaluation_id === ev.id);
                              return (
                                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800">
                                  <td className="py-1 pr-4">{s.username}</td>
                                  <td className="py-1">
                                    <Input type="number" value={g?.score ?? ''} onChange={e => setGrade(ev.id, s.id, Number(e.target.value || 0))} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {!evaluations.length && <div className="text-sm text-gray-500">Aucune évaluation.</div>}
          </div>
        </div>
      </Card>
    </div>
  );
}


