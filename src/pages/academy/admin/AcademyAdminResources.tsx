import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Academy, AcademyClass, AcademyModule, AcademyResource } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';

export function AcademyAdminResources() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [resources, setResources] = useState<AcademyResource[]>([]);
  const [filterAcademyId, setFilterAcademyId] = useState<string | ''>('');
  const [form, setForm] = useState<{ id?: string; academy_id?: string; class_id?: string; module_id?: string; title: string; url: string; type: 'link' | 'file'; visibility: 'class' | 'module' | 'academy' }>({ title: '', url: '', type: 'link', visibility: 'academy' });

  const fetchAcademies = async () => { const { data } = await supabase.from('academy_academies').select('*'); setAcademies((data || []) as Academy[]); };
  const fetchClasses = async (academyId?: string) => { if (!academyId) { setClasses([]); return; } const { data } = await supabase.from('academy_classes').select('*').eq('academy_id', academyId); setClasses((data || []) as AcademyClass[]); };
  const fetchModules = async (academyId?: string) => { if (!academyId) { setModules([]); return; } const { data } = await supabase.from('academy_modules').select('*').eq('academy_id', academyId); setModules((data || []) as AcademyModule[]); };
  const fetchResources = async (academyId?: string) => { let query = supabase.from('academy_resources').select('*').order('created_at', { ascending: false }); if (academyId) query = query.eq('academy_id', academyId); const { data } = await query; setResources((data || []) as AcademyResource[]); };

  useEffect(() => { fetchAcademies(); }, []);
  useEffect(() => { fetchClasses(filterAcademyId || undefined); fetchModules(filterAcademyId || undefined); fetchResources(filterAcademyId || undefined); }, [filterAcademyId]);

  const submit = async () => {
    if (!form.title.trim() || !form.url.trim() || !form.academy_id) return;
    if (form.id) {
      await supabase.from('academy_resources').update({ academy_id: form.academy_id, class_id: form.class_id || null, module_id: form.module_id || null, title: form.title, url: form.url, type: form.type, visibility: form.visibility }).eq('id', form.id);
    } else {
      await supabase.from('academy_resources').insert({ academy_id: form.academy_id, class_id: form.class_id || null, module_id: form.module_id || null, title: form.title, url: form.url, type: form.type, visibility: form.visibility });
    }
    setForm({ title: '', url: '', type: 'link', visibility: 'academy' });
    await fetchResources(filterAcademyId || undefined);
  };

  const del = async (id: string) => { await supabase.from('academy_resources').delete().eq('id', id); await fetchResources(filterAcademyId || undefined); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ressources</h1>

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={filterAcademyId} onChange={e => setFilterAcademyId(e.target.value)}>
              <option value="">Filtrer par académie</option>
              {academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <Input placeholder="Titre" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={form.academy_id || ''} onChange={e => setForm({ ...form, academy_id: e.target.value })}>
              <option value="">Académie</option>
              {academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={form.class_id || ''} onChange={e => setForm({ ...form, class_id: e.target.value || undefined })}>
              <option value="">Classe (optionnel)</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={form.module_id || ''} onChange={e => setForm({ ...form, module_id: e.target.value || undefined })}>
              <option value="">Module (optionnel)</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value as any })}>
              <option value="academy">Académie</option>
              <option value="class">Classe</option>
              <option value="module">Module</option>
            </select>
          </div>
          <div className="flex gap-3 items-center">
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
              <option value="link">Lien</option>
              <option value="file">Fichier</option>
            </select>
            <Button onClick={submit}>{form.id ? 'Mettre à jour' : 'Ajouter ressource'}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 space-y-2">
          {resources.map(r => (
            <div key={r.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 py-2">
              <div>
                <div className="font-semibold">{r.title}</div>
                <div className="text-sm text-gray-500">{r.url} — {r.visibility}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setForm({ id: r.id, academy_id: r.academy_id, class_id: r.class_id, module_id: r.module_id, title: r.title, url: r.url, type: r.type, visibility: r.visibility })}>Éditer</Button>
                <Button variant="destructive" onClick={() => del(r.id)}>Supprimer</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


