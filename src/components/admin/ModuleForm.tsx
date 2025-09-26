import React, { useState, useEffect } from 'react';
import { useModules } from '../../hooks/useModules';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Module, CreateModuleData } from '../../types';
import { Clock, CheckCircle, FileText, Edit, Image, Video } from 'lucide-react';

interface ModuleFormProps {
  contestId: string;
  module?: Module | null;
  onClose: () => void;
}

export function ModuleForm({ contestId, module, onClose }: ModuleFormProps) {
  const { createModule, updateModule } = useModules();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateModuleData>({
    title: '',
    module_type: 'qcm',
    description: '',
    max_score: 100,
    time_limit_minutes: undefined,
    is_required: true
  });

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title,
        module_type: module.module_type,
        description: module.description || '',
        max_score: module.max_score,
        time_limit_minutes: module.time_limit_minutes || undefined,
        is_required: module.is_required
      });
    }
  }, [module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (module) {
        const success = await updateModule(module.id, formData);
        if (success) {
          onClose();
        }
      } else {
        const result = await createModule(contestId, formData);
        if (result) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du module:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              e.target.type === 'number' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const moduleTypes = [
    {
      value: 'qcm',
      label: 'QCM',
      description: 'Questions à choix multiples avec correction automatique',
      icon: CheckCircle
    },
    {
      value: 'open_question',
      label: 'Question ouverte',
      description: 'Questions nécessitant une correction manuelle',
      icon: FileText
    },
    {
      value: 'rp_scenario',
      label: 'Scénario RP',
      description: 'Mise en situation roleplay avec réponse libre',
      icon: Edit
    },
    {
      value: 'image_analysis',
      label: 'Analyse d\'image',
      description: 'Analyse de documents, plans ou photos',
      icon: Image
    },
    {
      value: 'audio_video',
      label: 'Audio/Vidéo',
      description: 'Analyse de contenu audio ou vidéo',
      icon: Video
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Titre du module"
        name="title"
        value={formData.title}
        onChange={handleChange}
        required
        placeholder="Ex: Connaissances générales"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Type de module
        </label>
        <div className="grid grid-cols-1 gap-3">
          {moduleTypes.map((type) => {
            const Icon = type.icon;
            return (
              <label
                key={type.value}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.module_type === type.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="module_type"
                  value={type.value}
                  checked={formData.module_type === type.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <Icon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {type.description}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description (optionnelle)
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="Description du module et consignes pour les candidats..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Score maximum"
          name="max_score"
          type="number"
          value={formData.max_score.toString()}
          onChange={handleChange}
          required
          min="1"
          placeholder="100"
        />
        
        <div>
          <Input
            label="Temps limite (minutes)"
            name="time_limit_minutes"
            type="number"
            value={formData.time_limit_minutes?.toString() || ''}
            onChange={handleChange}
            min="1"
            placeholder="Optionnel"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Laissez vide pour un temps illimité
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_required"
          name="is_required"
          checked={formData.is_required}
          onChange={handleChange}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is_required" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Module obligatoire
        </label>
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
          {loading ? 'Sauvegarde...' : module ? 'Modifier' : 'Créer le module'}
        </Button>
      </div>
    </form>
  );
}