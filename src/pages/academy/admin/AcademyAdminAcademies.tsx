import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Academy } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';

export function AcademyAdminAcademies() {
  const [items, setItems] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ id?: string; name: string; description?: string; logo_url?: string }>({ name: '' });

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('academy_academies').select('*').order('created_at', { ascending: false });
    if (!error) setItems(data as Academy[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => setForm({ name: '' });

  const submit = async () => {
    if (!form.name?.trim()) return;
    if (form.id) {
      const { error } = await supabase.from('academy_academies').update({ name: form.name, description: form.description, logo_url: form.logo_url, updated_at: new Date().toISOString() }).eq('id', form.id);
      if (!error) { await fetchItems(); resetForm(); }
    } else {
      const { error } = await supabase.from('academy_academies').insert({ name: form.name, description: form.description, logo_url: form.logo_url });
      if (!error) { await fetchItems(); resetForm(); }
    }
  };

  const editItem = (it: Academy) => setForm({ id: it.id, name: it.name, description: it.description, logo_url: it.logo_url });
  const delItem = async (id: string) => { const { error } = await supabase.from('academy_academies').delete().eq('id', id); if (!error) await fetchItems(); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Académies</h1>

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Logo URL" value={form.logo_url || ''} onChange={e => setForm({ ...form, logo_url: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button onClick={submit}>{form.id ? 'Mettre à jour' : 'Créer'}</Button>
            {form.id && <Button variant="secondary" onClick={resetForm}>Annuler</Button>}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          {loading ? (
            <div>Chargement...</div>
          ) : (
            <div className="space-y-2">
              {items.map(it => (
                <div key={it.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 py-2">
                  <div>
                    <div className="font-semibold">{it.name}</div>
                    {it.description && <div className="text-sm text-gray-500">{it.description}</div>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => editItem(it)}>Éditer</Button>
                    <Button variant="destructive" onClick={() => delItem(it.id)}>Supprimer</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}


