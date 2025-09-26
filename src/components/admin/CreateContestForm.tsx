import React, { useState } from 'react';
import { useContests } from '../../hooks/useContests';
import { useAgencies } from '../../hooks/useAgencies';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Calendar, Globe, Lock, Building } from 'lucide-react';

interface CreateContestFormProps {
  onClose: () => void;
}

export function CreateContestForm({ onClose }: CreateContestFormProps) {
  const { createContest } = useContests();
  const { agencies } = useAgencies();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    type: 'public' as 'public' | 'private',
    max_participants: '',
    is_recurring: false,
    agency_id: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const contestData = {
        ...formData,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
        agency_id: formData.agency_id || undefined
      };
      
      const result = await createContest(contestData);
      if (result) {
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la création du concours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Nom du concours"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        placeholder="Ex: Concours USSS - Agent Spécial"
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
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Date de début"
          name="start_date"
          type="datetime-local"
          value={formData.start_date}
          onChange={handleChange}
          required
        />
        <Input
          label="Date de fin"
          name="end_date"
          type="datetime-local"
          value={formData.end_date}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Agence (optionnel)
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre maximum de participants (optionnel)"
          name="max_participants"
          type="number"
          value={formData.max_participants}
          onChange={handleChange}
          placeholder="Illimité si vide"
        />
        <div className="flex items-center space-x-2 pt-6">
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Type de concours
        </label>
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
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Création...' : 'Créer le concours'}
        </Button>
      </div>
    </form>
  );
}