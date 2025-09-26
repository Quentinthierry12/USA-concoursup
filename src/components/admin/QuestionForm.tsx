import React, { useState, useEffect } from 'react';
import { useQuestions } from '../../hooks/useQuestions';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Question, CreateQuestionData, QCMOption } from '../../types';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface QuestionFormProps {
  moduleId: string;
  moduleType: string;
  question?: Question | null;
  onClose: () => void;
}

export function QuestionForm({ moduleId, moduleType, question, onClose }: QuestionFormProps) {
  const { createQuestion, updateQuestion } = useQuestions();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateQuestionData>({
    content: '',
    question_type: 'text',
    points: 10,
    media_url: '',
    correct_answer: '',
    explanation: '',
    qcm_options: []
  });

  useEffect(() => {
    if (question) {
      setFormData({
        content: question.content,
        question_type: question.question_type,
        points: question.points,
        media_url: question.media_url || '',
        correct_answer: question.correct_answer || '',
        explanation: question.explanation || '',
        qcm_options: question.qcm_options?.map(option => ({
          option_text: option.option_text,
          is_correct: option.is_correct,
          option_order: option.option_order
        })) || []
      });
    } else if (moduleType === 'qcm') {
      // Initialiser avec 4 options par défaut pour les QCM
      setFormData(prev => ({
        ...prev,
        qcm_options: [
          { option_text: '', is_correct: false, option_order: 1 },
          { option_text: '', is_correct: false, option_order: 2 },
          { option_text: '', is_correct: false, option_order: 3 },
          { option_text: '', is_correct: false, option_order: 4 }
        ]
      }));
    }
  }, [question, moduleType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation pour les QCM
      if (moduleType === 'qcm' && formData.qcm_options) {
        const hasCorrectAnswer = formData.qcm_options.some(option => option.is_correct);
        if (!hasCorrectAnswer) {
          alert('Veuillez sélectionner au moins une réponse correcte pour le QCM.');
          setLoading(false);
          return;
        }
      }

      if (question) {
        const success = await updateQuestion(question.id, formData);
        if (success) {
          onClose();
        }
      } else {
        const result = await createQuestion(moduleId, formData);
        if (result) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? (value ? parseInt(value) : 0) : value
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      qcm_options: [
        ...(prev.qcm_options || []),
        {
          option_text: '',
          is_correct: false,
          option_order: (prev.qcm_options?.length || 0) + 1
        }
      ]
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qcm_options: prev.qcm_options?.filter((_, i) => i !== index).map((option, i) => ({
        ...option,
        option_order: i + 1
      }))
    }));
  };

  const updateOption = (index: number, field: keyof QCMOption, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      qcm_options: prev.qcm_options?.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const toggleCorrectAnswer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qcm_options: prev.qcm_options?.map((option, i) => ({
        ...option,
        is_correct: i === index ? !option.is_correct : option.is_correct
      }))
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Question
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="Saisissez votre question..."
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type de question
          </label>
          <select
            name="question_type"
            value={formData.question_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="text">Texte</option>
            <option value="multiple_choice">Choix multiple</option>
            <option value="true_false">Vrai/Faux</option>
            <option value="short_answer">Réponse courte</option>
            <option value="essay">Dissertation</option>
          </select>
        </div>

        <Input
          label="Points"
          name="points"
          type="number"
          value={formData.points.toString()}
          onChange={handleChange}
          required
          min="1"
          placeholder="10"
        />
      </div>

      <Input
        label="URL du média (optionnel)"
        name="media_url"
        type="url"
        value={formData.media_url}
        onChange={handleChange}
        placeholder="https://example.com/image.jpg"
      />

      {/* Options QCM */}
      {moduleType === 'qcm' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Options de réponse
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
            >
              <Plus className="mr-1 h-4 w-4" />
              Ajouter
            </Button>
          </div>

          <div className="space-y-3">
            {formData.qcm_options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleCorrectAnswer(index)}
                  className={`flex-shrink-0 ${
                    option.is_correct 
                      ? 'text-green-600 hover:text-green-700' 
                      : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  {option.is_correct ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </button>
                
                <input
                  type="text"
                  value={option.option_text}
                  onChange={(e) => updateOption(index, 'option_text', e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                />
                
                {formData.qcm_options && formData.qcm_options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-700 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Cliquez sur l'icône pour marquer une option comme correcte
          </p>
        </div>
      )}

      {/* Réponse correcte pour les autres types */}
      {moduleType !== 'qcm' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Réponse correcte (optionnel)
          </label>
          <textarea
            name="correct_answer"
            value={formData.correct_answer}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Réponse attendue ou éléments de correction..."
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Explication (optionnelle)
        </label>
        <textarea
          name="explanation"
          value={formData.explanation}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="Explication de la réponse pour les candidats..."
        />
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
          {loading ? 'Sauvegarde...' : question ? 'Modifier' : 'Créer la question'}
        </Button>
      </div>
    </form>
  );
}