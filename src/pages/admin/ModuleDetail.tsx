import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useModules } from '../../hooks/useModules';
import { useQuestions } from '../../hooks/useQuestions';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { QuestionForm } from '../../components/admin/QuestionForm';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Image,
  Video,
  Mic
} from 'lucide-react';
import { Module, Question } from '../../types';

export function ModuleDetail() {
  const { contestId, moduleId } = useParams<{ contestId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { getModuleById } = useModules();
  const { questions, loading: questionsLoading, fetchQuestions, deleteQuestion } = useQuestions();
  
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (moduleId && contestId) {
      loadModule();
      fetchQuestions(moduleId);
    }
  }, [moduleId, contestId]);

  const loadModule = async () => {
    if (!moduleId) return;
    
    setLoading(true);
    const moduleData = await getModuleById(moduleId);
    setModule(moduleData);
    setLoading(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      const success = await deleteQuestion(questionId);
      if (success && moduleId) {
        fetchQuestions(moduleId);
      }
    }
  };

  const getModuleTypeIcon = (type: string) => {
    switch (type) {
      case 'qcm': return CheckCircle;
      case 'open_question': return FileText;
      case 'rp_scenario': return Edit;
      case 'image_analysis': return Image;
      case 'audio_video': return Video;
      default: return FileText;
    }
  };

  const getModuleTypeLabel = (type: string) => {
    switch (type) {
      case 'qcm': return 'QCM';
      case 'open_question': return 'Question ouverte';
      case 'rp_scenario': return 'Scénario RP';
      case 'image_analysis': return 'Analyse d\'image';
      case 'audio_video': return 'Audio/Vidéo';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Module introuvable
        </h2>
        <Button onClick={() => navigate(`/admin/contest/${contestId}`)}>
          Retour au concours
        </Button>
      </div>
    );
  }

  const ModuleIcon = getModuleTypeIcon(module.module_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/admin/contest/${contestId}`)}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ModuleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {module.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {getModuleTypeLabel(module.module_type)} • {module.max_score} points
                {module.time_limit_minutes && ` • ${module.time_limit_minutes} minutes`}
              </p>
            </div>
          </div>
        </div>

        <Button onClick={() => setShowQuestionModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une question
        </Button>
      </div>

      {/* Module Info */}
      {module.description && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Description du module
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              {module.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Questions ({questions.length})
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total: {questions.reduce((sum, q) => sum + q.points, 0)} points
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {question.points} point{question.points > 1 ? 's' : ''}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                          {question.question_type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-11">
                      <div 
                        className="text-gray-900 dark:text-white mb-2 prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: question.content }}
                      />
                      
                      {question.media_url && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Média: {question.media_url}
                          </span>
                        </div>
                      )}

                      {question.qcm_options && question.qcm_options.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {question.qcm_options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                              {option.is_correct ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-400" />
                              )}
                              <span className={`text-sm ${
                                option.is_correct 
                                  ? 'text-green-600 dark:text-green-400 font-medium' 
                                  : 'text-gray-600 dark:text-gray-300'
                              }`}>
                                {option.option_text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Explication:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingQuestion(question);
                        setShowQuestionModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune question créée
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Commencez par créer votre première question pour ce module
              </p>
              <Button onClick={() => setShowQuestionModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une question
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Question Modal */}
      <Modal
        isOpen={showQuestionModal}
        onClose={() => {
          setShowQuestionModal(false);
          setEditingQuestion(null);
        }}
        title={editingQuestion ? 'Modifier la question' : 'Créer une nouvelle question'}
        size="xl"
      >
        <QuestionForm
          moduleId={module.id}
          moduleType={module.module_type}
          question={editingQuestion}
          onClose={() => {
            setShowQuestionModal(false);
            setEditingQuestion(null);
            if (moduleId) fetchQuestions(moduleId);
          }}
        />
      </Modal>
    </div>
  );
}