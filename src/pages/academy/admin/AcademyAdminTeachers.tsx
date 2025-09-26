import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { User } from '../../../types';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export function AcademyAdminTeachers() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [form, setForm] = useState<{ username: string; password: string; email?: string; full_name?: string }>({ username: '', password: '' });

  const fetchTeachers = async () => {
    const { data } = await supabase.from('concour_users').select('*').eq('academy_role', 'prof');
    setTeachers((data || []) as User[]);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const createTeacher = async () => {
    if (!form.username.trim() || !form.password.trim()) return;
    const { data: existing } = await supabase.from('concour_users').select('id').eq('username', form.username).maybeSingle();
    if (existing) return;
    const emailValue = (form.email && form.email.trim()) ? form.email.trim() : `${form.username}@academy.local`;
    await supabase.from('concour_users').insert({ username: form.username, email: emailValue, password: form.password, role: 'responsable', full_name: form.full_name || null, is_active: true, academy_role: 'prof' });
    setForm({ username: '', password: '' });
    await fetchTeachers();
  };

  const deactivate = async (id: string) => { await supabase.from('concour_users').update({ is_active: false }).eq('id', id); await fetchTeachers(); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Professeurs</h1>

      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Nom d'utilisateur" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          <Input placeholder="Mot de passe" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <Input placeholder="Email (optionnel)" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Nom complet (optionnel)" value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          <div>
            <Button onClick={createTeacher}>Créer compte prof</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map(t => (
            <div key={t.id} className="border rounded p-3">
              <div className="font-semibold">{t.username}</div>
              <div className="text-sm text-gray-500">{t.email}</div>
              <div className="mt-2">
                <span className={`px-2 py-0.5 rounded text-xs ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{t.is_active ? 'Actif' : 'Inactif'}</span>
              </div>
              {t.is_active && (
                <div className="mt-3">
                  <Button variant="secondary" onClick={() => deactivate(t.id)}>Désactiver</Button>
                </div>
              )}
            </div>
          ))}
          {!teachers.length && <div className="text-sm text-gray-500">Aucun professeur.</div>}
        </div>
      </Card>
    </div>
  );
}


