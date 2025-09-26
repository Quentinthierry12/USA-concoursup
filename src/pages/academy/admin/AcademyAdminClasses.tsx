import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { AcademyClass, AcademyClassMember, User, Academy } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';

export function AcademyAdminClasses() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string | ''>('');
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [members, setMembers] = useState<AcademyClassMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<{ id?: string; name: string; description?: string }>({ name: '' });
  const [selectedClassId, setSelectedClassId] = useState<string | ''>('');

  const fetchAcademies = async () => {
    const { data } = await supabase.from('academy_academies').select('*').order('created_at', { ascending: false });
    setAcademies((data || []) as Academy[]);
  };

  const fetchClasses = async () => {
    if (!selectedAcademyId) { setClasses([]); return; }
    const { data } = await supabase.from('academy_classes').select('*').eq('academy_id', selectedAcademyId).order('created_at', { ascending: false });
    setClasses((data || []) as AcademyClass[]);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('concour_users').select('*').in('academy_role', ['prof','etudiant','staff']);
    setUsers((data || []) as User[]);
  };

  const fetchMembers = async () => {
    if (!selectedClassId) { setMembers([]); return; }
    const { data } = await supabase.from('academy_class_members').select('*').eq('class_id', selectedClassId).order('created_at', { ascending: true });
    setMembers((data || []) as AcademyClassMember[]);
  };

  useEffect(() => { fetchAcademies(); fetchUsers(); }, []);
  useEffect(() => { fetchClasses(); setSelectedClassId(''); setMembers([]); }, [selectedAcademyId]);
  useEffect(() => { fetchMembers(); }, [selectedClassId]);

  const submitClass = async () => {
    if (!selectedAcademyId || !form.name?.trim()) return;
    if (form.id) {
      await supabase.from('academy_classes').update({ name: form.name, description: form.description, updated_at: new Date().toISOString() }).eq('id', form.id);
    } else {
      await supabase.from('academy_classes').insert({ academy_id: selectedAcademyId, name: form.name, description: form.description });
    }
    setForm({ name: '' });
    await fetchClasses();
  };

  const deleteClass = async (id: string) => { await supabase.from('academy_classes').delete().eq('id', id); await fetchClasses(); };

  const addMember = async (userId: string, roleInClass: 'prof' | 'etudiant') => {
    if (!selectedClassId) return;
    await supabase.from('academy_class_members').insert({ class_id: selectedClassId, user_id: userId, role_in_class: roleInClass });
    await fetchMembers();
  };

  const removeMember = async (memberId: string) => { await supabase.from('academy_class_members').delete().eq('id', memberId); await fetchMembers(); };

  const availableProfs = useMemo(() => users.filter(u => u.academy_role === 'prof'), [users]);
  const availableStudents = useMemo(() => users.filter(u => u.academy_role === 'etudiant'), [users]);

  // Création rapide d'un élève (compte + ajout à la classe)
  const [quickUsername, setQuickUsername] = useState('');
  const [quickPassword, setQuickPassword] = useState('');
  const quickCreateStudent = async () => {
    if (!selectedClassId || !quickUsername.trim() || !quickPassword.trim()) return;
    const { data: dup } = await supabase.from('concour_users').select('id').eq('username', quickUsername).maybeSingle();
    if (!dup) {
      const emailValue = `${quickUsername}@academy.local`;
      const { data: created } = await supabase.from('concour_users').insert({ username: quickUsername, email: emailValue, password: quickPassword, role: 'candidat', is_active: true, academy_role: 'etudiant' }).select('*').single();
      if (created) {
        await supabase.from('academy_class_members').insert({ class_id: selectedClassId, user_id: created.id, role_in_class: 'etudiant' });
      }
    }
    setQuickUsername(''); setQuickPassword('');
    await fetchUsers();
    await fetchMembers();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classes & Membres</h1>

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={selectedAcademyId} onChange={e => setSelectedAcademyId(e.target.value)}>
              <option value="">Sélectionner une académie</option>
              {academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <Input placeholder="Nom de la classe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button onClick={submitClass}>{form.id ? 'Mettre à jour' : 'Créer la classe'}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-semibold mb-2">Classes</h2>
            <div className="space-y-2">
              {classes.map(c => (
                <div key={c.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 py-2">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    {c.description && <div className="text-sm text-gray-500">{c.description}</div>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => { setForm({ id: c.id, name: c.name, description: c.description }); }}>Éditer</Button>
                    <Button variant="secondary" onClick={() => setSelectedClassId(c.id)}>Membres</Button>
                    <Button variant="destructive" onClick={() => deleteClass(c.id)}>Supprimer</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Membres de la classe</h2>
            {!selectedClassId ? (
              <div className="text-sm text-gray-500">Sélectionnez une classe.</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input placeholder="Création rapide: username" value={quickUsername} onChange={e => setQuickUsername(e.target.value)} />
                  <Input placeholder="password" type="password" value={quickPassword} onChange={e => setQuickPassword(e.target.value)} />
                  <Button onClick={quickCreateStudent}>Créer élève + ajouter</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2 font-medium">Ajouter un professeur</div>
                    <div className="space-y-1">
                      {availableProfs.map(u => (
                        <div key={u.id} className="flex items-center justify-between">
                          <span>{u.username}</span>
                          <Button size="sm" onClick={() => addMember(u.id, 'prof')}>Ajouter</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 font-medium">Ajouter un élève</div>
                    <div className="space-y-1">
                      {availableStudents.map(u => (
                        <div key={u.id} className="flex items-center justify-between">
                          <span>{u.username}</span>
                          <Button size="sm" onClick={() => addMember(u.id, 'etudiant')}>Ajouter</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 font-medium">Membres actuels</div>
                  <div className="space-y-1">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 py-1">
                        <span>{m.user_id} — {m.role_in_class}</span>
                        <Button size="sm" variant="destructive" onClick={() => removeMember(m.id)}>Retirer</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}


