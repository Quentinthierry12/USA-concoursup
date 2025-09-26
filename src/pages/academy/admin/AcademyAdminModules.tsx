import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Academy, AcademyClass, AcademyModule, AcademyModuleAssignment } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';

export function AcademyAdminModules() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string | ''>('');
  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [assignments, setAssignments] = useState<AcademyModuleAssignment[]>([]);
  const [form, setForm] = useState<{ id?: string; title: string; module_type: AcademyModule['module_type']; description?: string; max_score: number; is_required: boolean; order_position: number }>({ title: '', module_type: 'qcm', max_score: 100, is_required: true, order_position: 0 });

  const fetchAcademies = async () => {
    const { data } = await supabase.from('academy_academies').select('*');
    setAcademies((data || []) as Academy[]);
  };

  const fetchModules = async () => {
    if (!selectedAcademyId) { setModules([]); return; }
    const { data } = await supabase.from('academy_modules').select('*').eq('academy_id', selectedAcademyId).order('order_position', { ascending: true });
    setModules((data || []) as AcademyModule[]);
  };

  const fetchClasses = async () => {
    if (!selectedAcademyId) { setClasses([]); return; }
    const { data } = await supabase.from('academy_classes').select('*').eq('academy_id', selectedAcademyId).order('created_at', { ascending: false });
    setClasses((data || []) as AcademyClass[]);
  };

  const fetchAssignments = async () => {
    const { data } = await supabase.from('academy_module_assignments').select('*');
    setAssignments((data || []) as AcademyModuleAssignment[]);
  };

  useEffect(() => { fetchAcademies(); }, []);
  useEffect(() => { fetchModules(); fetchClasses(); }, [selectedAcademyId]);
  useEffect(() => { fetchAssignments(); }, [modules]);

  const submitModule = async () => {
    if (!selectedAcademyId || !form.title.trim()) return;
    if (form.id) {
      await supabase.from('academy_modules').update({ title: form.title, module_type: form.module_type, description: form.description, max_score: form.max_score, is_required: form.is_required, order_position: form.order_position }).eq('id', form.id);
    } else {
      await supabase.from('academy_modules').insert({ academy_id: selectedAcademyId, title: form.title, module_type: form.module_type, description: form.description, max_score: form.max_score, is_required: form.is_required, order_position: form.order_position });
    }
    setForm({ title: '', module_type: 'qcm', max_score: 100, is_required: true, order_position: 0 });
    await fetchModules();
  };

  const deleteModule = async (id: string) => { await supabase.from('academy_modules').delete().eq('id', id); await fetchModules(); };

  const toggleAssignment = async (moduleId: string, classId: string) => {
    const exists = assignments.find(a => a.module_id === moduleId && a.class_id === classId);
    if (exists) {
      await supabase.from('academy_module_assignments').delete().eq('id', exists.id);
    } else {
      await supabase.from('academy_module_assignments').insert({ module_id: moduleId, class_id: classId });
    }
    await fetchAssignments();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modules & Assignations</h1>

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={selectedAcademyId} onChange={e => setSelectedAcademyId(e.target.value)}>
              <option value="">Sélectionner une académie</option>
              {academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <Input placeholder="Titre" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={form.module_type} onChange={e => setForm({ ...form, module_type: e.target.value as any })}>
              <option value="qcm">QCM</option>
              <option value="open_question">Question Ouverte</option>
              <option value="rp_scenario">Scénario RP</option>
              <option value="image_analysis">Analyse Image</option>
              <option value="audio_video">Audio/Video</option>
            </select>
            <Input placeholder="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Points max" type="number" value={form.max_score} onChange={e => setForm({ ...form, max_score: Number(e.target.value) })} />
          </div>
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_required} onChange={e => setForm({ ...form, is_required: e.target.checked })} /> Obligatoire</label>
            <Input placeholder="Ordre" type="number" value={form.order_position} onChange={e => setForm({ ...form, order_position: Number(e.target.value) })} />
            <Button onClick={submitModule}>{form.id ? 'Mettre à jour' : 'Créer le module'}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h2 className="font-semibold mb-4">Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map(m => (
              <div key={m.id} className="border rounded p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{m.title}</div>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">{m.module_type}</span>
                  </div>
                  {m.description && <div className="text-sm text-gray-500 mt-1">{m.description}</div>}
                  <div className="text-sm text-gray-500 mt-2">{m.max_score} pts • {m.is_required ? 'Obligatoire' : 'Optionnel'}</div>
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-1">Assigné à:</div>
                    <div className="flex flex-wrap gap-2">
                      {classes.map(c => {
                        const active = assignments.some(a => a.module_id === m.id && a.class_id === c.id);
                        return (
                          <button key={c.id} onClick={() => toggleAssignment(m.id, c.id)} className={`text-xs px-2 py-1 rounded border ${active ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-transparent border-gray-300 text-gray-600'}`}>
                            {active ? '✔' : '+'} {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="secondary" onClick={() => setForm({ id: m.id, title: m.title, module_type: m.module_type, description: m.description, max_score: m.max_score, is_required: m.is_required, order_position: m.order_position })}>Éditer</Button>
                  <Button variant="destructive" onClick={() => deleteModule(m.id)}>Supprimer</Button>
                </div>
              </div>
            ))}
            {!modules.length && <div className="text-sm text-gray-500">Aucun module.</div>}
          </div>
        </div>
      </Card>
    </div>
  );
}


