import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Academy, AcademyClass, AcademyClassMember, User } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';

export function AcademyAdminStudents() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string | ''>('');
  const [selectedClassId, setSelectedClassId] = useState<string | ''>('');
  const [students, setStudents] = useState<User[]>([]);
  const [members, setMembers] = useState<AcademyClassMember[]>([]);

  const [createForm, setCreateForm] = useState<{ username: string; email?: string; full_name?: string; password: string }>(() => ({ username: '', password: '' }));

  const fetchAcademies = async () => { const { data } = await supabase.from('academy_academies').select('*'); setAcademies((data || []) as Academy[]); };
  const fetchClasses = async (academyId?: string) => { if (!academyId) { setClasses([]); return; } const { data } = await supabase.from('academy_classes').select('*').eq('academy_id', academyId); setClasses((data || []) as AcademyClass[]); };
  const fetchStudents = async () => { const { data } = await supabase.from('concour_users').select('*').eq('academy_role', 'etudiant'); setStudents((data || []) as User[]); };
  const fetchMembers = async (classId?: string) => { if (!classId) { setMembers([]); return; } const { data } = await supabase.from('academy_class_members').select('*').eq('class_id', classId).eq('role_in_class', 'etudiant'); setMembers((data || []) as AcademyClassMember[]); };

  useEffect(() => { fetchAcademies(); fetchStudents(); }, []);
  useEffect(() => { fetchClasses(selectedAcademyId || undefined); setSelectedClassId(''); setMembers([]); }, [selectedAcademyId]);
  useEffect(() => { fetchMembers(selectedClassId || undefined); }, [selectedClassId]);

  const createStudentAccount = async () => {
    if (!createForm.username.trim() || !createForm.password.trim()) return;
    const { data: existingByUsername } = await supabase.from('concour_users').select('id').eq('username', createForm.username).maybeSingle();
    if (existingByUsername) return;
    const emailValue = (createForm.email && createForm.email.trim()) ? createForm.email.trim() : `${createForm.username}@academy.local`;
    const { error } = await supabase.from('concour_users').insert({ username: createForm.username, email: emailValue, password: createForm.password, role: 'candidat', full_name: createForm.full_name || null, is_active: true, academy_role: 'etudiant' });
    if (!error) { setCreateForm({ username: '', password: '' }); await fetchStudents(); }
  };

  const addStudentToClass = async (userId: string) => {
    if (!selectedClassId) return;
    await supabase.from('academy_class_members').insert({ class_id: selectedClassId, user_id: userId, role_in_class: 'etudiant' });
    await fetchMembers(selectedClassId);
  };

  const removeStudentFromClass = async (memberId: string) => { await supabase.from('academy_class_members').delete().eq('id', memberId); await fetchMembers(selectedClassId || undefined); };

  const unassignedStudents = useMemo(() => {
    const memberIds = new Set(members.map(m => m.user_id));
    return students.filter(s => !memberIds.has(s.id));
  }, [students, members]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Élèves</h1>

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={selectedAcademyId} onChange={e => setSelectedAcademyId(e.target.value)}>
              <option value="">Académie</option>
              {academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select className="border rounded px-3 py-2 bg-white dark:bg-gray-800" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
              <option value="">Classe</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input placeholder="Nom d'utilisateur" value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value })} />
            <Input placeholder="Mot de passe" type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Email (optionnel)" value={createForm.email || ''} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
            <Input placeholder="Nom complet (optionnel)" value={createForm.full_name || ''} onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })} />
            <div className="flex gap-3">
              <Button onClick={createStudentAccount}>Créer compte élève</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-semibold mb-2">Élèves disponibles</h2>
            <div className="space-y-1">
              {unassignedStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 py-1">
                  <span>{s.username}</span>
                  <Button size="sm" onClick={() => addStudentToClass(s.id)} disabled={!selectedClassId}>Assigner</Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Élèves de la classe</h2>
            {!selectedClassId ? (
              <div className="text-sm text-gray-500">Sélectionnez une classe.</div>
            ) : (
              <div className="space-y-1">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 py-1">
                    <span>{m.user_id}</span>
                    <Button size="sm" variant="destructive" onClick={() => removeStudentFromClass(m.id)}>Retirer</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}


