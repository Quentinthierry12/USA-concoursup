import React, { useState } from 'react';
import { useContests } from '../../hooks/useContests';
import { useAgencies } from '../../hooks/useAgencies';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Contest } from '../../types';
import { Save, Globe, Lock } from 'lucide-react';

interface ContestSettingsProps {
  contest: Contest;
  onUpdate: (contest: Contest) => void;
}

export function ContestSettings({ contest, onUpdate }: ContestSettingsProps) {
  const { updateContest } = useContests();
  const { agencies } = useAgencies();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: contest.name,
    description: contest.description || '',
    start_date: contest.start_date ? new Date(contest.start_date).toISOString().slice(0, 16) : '',
    end_date: contest.end_date ? new Date(contest.end_date).toISOString().slice(0, 16) : '',
    type: contest.type,
    max_participants: contest.max_participants?.toString() || '',
    is_recurring: contest.is_recurring,
    agency_id: contest.agency_id || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates = {
        ...formData,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        agency_id: formData.agency_id || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };
      
      const success = await updateContest(contest.id, updates);
      if (success) {
        onUpdate({ ...contest, ...updates });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du concours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Paramètres du concours
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informations générales
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nom du concours"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Description détaillée du concours..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Planification
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date de début"
                name="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={handleChange}
              />
              <Input
                label="Date de fin"
                name="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Agence
              </label>
              <select
                name="agency_id"
                value={formData.agency_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Aucune agence</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Nombre maximum de participants"
              name="max_participants"
              type="number"
              value={formData.max_participants}
              onChange={handleChange}
              placeholder="Laissez vide pour illimité"
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_recurring"
                name="is_recurring"
                checked={formData.is_recurring}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Concours récurrent
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Visibilité
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.type === 'public' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="public"
                  checked={formData.type === 'public'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <Globe className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Public</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Visible sur la page d'accueil
                  </div>
                </div>
              </label>

              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.type === 'private' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="private"
                  checked={formData.type === 'private'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <Lock className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Privé</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Accessible par lien unique
                  </div>
                </div>
              </label>
            </div>

            {formData.type === 'private' && contest.access_link && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lien d'accès
                </label>
                <code className="text-sm text-gray-900 dark:text-white">
                  {window.location.origin}/contest/{contest.access_link}
                </code>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}