import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContests } from '../../hooks/useContests';
import { useModules } from '../../hooks/useModules';
import { useQuestions } from '../../hooks/useQuestions';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Save,
  Send,
  Trophy,
  FileText
} from 'lucide-react';
import { Contest, Module, Question, Response } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

export function ContestParticipation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getContestById } = useContests();
  const { fetchModules } = useModules();
  const { fetchQuestions } = useQuestions();
  
  const [contest, setContest] = useState<Contest | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<any>(null);
  const [showNameInputModal, setShowNameInputModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    const initializeContest = async () => {
      if (!id) return;
      
      // Charger le concours
      const contestData = await getContestById(id);
      if (!contestData) {
        navigate('/');
        return;
      }
      
      if (contestData.type === 'public') {
        const candidateData = localStorage.getItem('currentCandidate');
        if (candidateData) {
          const storedCandidate = JSON.parse(candidateData);
          // Check if the stored candidate is for this contest and is not an old anonymous one
          if (storedCandidate.contest_id === id && !storedCandidate.id.startsWith('anonymous-')) {
            setCurrentCandidate(storedCandidate);
          } else {
            // If it's an old anonymous or for a different contest, prompt for name
            setShowNameInputModal(true);
          }
        } else {
          setShowNameInputModal(true);
        }
      } else {
        // Pour les concours privés, vérifier l'authentification
        const candidateData = localStorage.getItem('currentCandidate');
        if (candidateData) {
          setCurrentCandidate(JSON.parse(candidateData));
        } else {
          navigate(`/contest/${id}`);
          return;
        }
      }
      
      setContest(contestData);
      if (contestData.modules) {
        setModules(contestData.modules);
      }
      setLoading(false);
    };
    
    initializeContest();
  }, [id]);

  useEffect(() => {
    if (modules.length > 0 && currentModuleIndex < modules.length) {
      loadQuestions(modules[currentModuleIndex].id);
      if (currentCandidate && currentCandidate.id !== `anonymous-${Date.now()}`) {
        loadExistingResponses();
      }
    }
  }, [modules, currentModuleIndex, currentCandidate]);

  useEffect(() => {
    // Timer pour le module actuel
    if (modules[currentModuleIndex]?.time_limit_minutes && timeRemaining === null) {
      setTimeRemaining(modules[currentModuleIndex].time_limit_minutes * 60);
    }
  }, [currentModuleIndex, modules]);

  useEffect(() => {
    // Décompte du timer
    if (timeRemaining && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      // Temps écoulé, passer au module suivant ou terminer
      handleNextModule();
    }
  }, [timeRemaining]);

  const loadQuestions = async (moduleId: string) => {
    const { data, error } = await supabase
      .from('concour_questions')
      .select(`
        *,
        qcm_options:concour_qcm_options(*)
      `)
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });

    if (data && !error) {
      setQuestions(data);
      setCurrentQuestionIndex(0);
      // Reset timer pour le nouveau module
      if (modules[currentModuleIndex]?.time_limit_minutes) {
        setTimeRemaining(modules[currentModuleIndex].time_limit_minutes * 60);
      }
    }
  };

  const loadExistingResponses = async () => {
    if (!currentCandidate || !modules[currentModuleIndex]) return;

    try {
      const { data: existingResponses } = await supabase
        .from('concour_responses')
        .select('question_id, response_text, selected_option_id, qcm_options')
        .eq('candidate_id', currentCandidate.id);

      if (existingResponses) {
        const responseMap: Record<string, any> = {};
        existingResponses.forEach(response => {
          if (response.selected_option_id) {
            responseMap[response.question_id] = response.selected_option_id;
          } else {
            responseMap[response.question_id] = response.response_text || '';
          }
        });
        setResponses(responseMap);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réponses:', error);
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Sauvegarde automatique
    saveResponse(questionId, value);
  };

  const saveSingleResponseToDb = async (candidateId: string, questionId: string, value: any, moduleType: string | undefined) => {
    try {
      let responseData: any = {
        candidate_id: candidateId,
        question_id: questionId,
        submitted_at: new Date().toISOString()
      };

      if (moduleType === 'qcm') {
        responseData.selected_option_id = value;
        responseData.qcm_options = value;
      } else {
        responseData.response_text = value;
      }

      const { data: existingResponse } = await supabase
        .from('concour_responses')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('question_id', questionId)
        .single();

      if (existingResponse) {
        await supabase
          .from('concour_responses')
          .update(responseData)
          .eq('id', existingResponse.id);
      } else {
        await supabase
          .from('concour_responses')
          .insert(responseData);
      }
      console.log('Réponse sauvegardée:', { questionId, value });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const saveResponse = async (questionId: string, value: any) => {
    if (!currentCandidate || currentCandidate.id.startsWith('anonymous-')) {
      // Pour les candidats anonymes, sauvegarder seulement localement
      return;
    }
    await saveSingleResponseToDb(currentCandidate.id, questionId, value, currentModule?.module_type);
  };

  const saveAllResponses = async () => {
    if (!currentCandidate) return;

    for (const questionId in responses) {
      if (responses.hasOwnProperty(questionId)) {
        const value = responses[questionId];
        const question = questions.find(q => q.id === questionId);
        const module = modules.find(m => m.id === question?.module_id);
        await saveSingleResponseToDb(currentCandidate.id, questionId, value, module?.module_type);
      }
    }
  };

  const handleNameSubmit = async () => {
    if (!firstName || !lastName) return;

    setLoading(true);
    try {
      // Check if candidate already exists
      let { data: existingCandidate, error: fetchError } = await supabase
        .from('concour_candidates')
        .select('*')
        .eq('identifier', `${firstName.toLowerCase()}-${lastName.toLowerCase()}`)
        .single();

      let candidateToUse = existingCandidate;

      if (!existingCandidate) {
        // Create new candidate
        const { data: newCandidate, error: insertError } = await supabase
          .from('concour_candidates')
          .insert({
            name: `${firstName} ${lastName}`,
            identifier: `${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
            contest_id: id,
            status: 'started',
            password: 'public_contest_user' // A generic password for public users
          })
          .select()
          .single();

        if (insertError) throw insertError;
        candidateToUse = newCandidate;
      }

      setCurrentCandidate(candidateToUse);
      localStorage.setItem('currentCandidate', JSON.stringify(candidateToUse));
      setShowNameInputModal(false);
    } catch (error) {
      console.error('Error handling name submission:', error);
      // Handle error, maybe show a message to the user
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleNextModule();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextModule = () => {
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setTimeRemaining(null);
    } else {
      // Fin du concours
      setShowConfirmSubmit(true);
    }
  };

  const handleSubmitContest = async () => {
    if (!currentCandidate) return;

    try {
      // Save all responses before marking contest as completed
      await saveAllResponses();

      // Calculer le score total (pour les QCM automatiquement)
      let totalScore = 0;
      
      // Mettre à jour le statut du candidat
      await supabase
        .from('concour_candidates')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_score: totalScore
        })
        .eq('id', currentCandidate.id);

      // Nettoyer le localStorage
      localStorage.removeItem('currentCandidate');
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }

    setIsSubmitted(true);
    setShowConfirmSubmit(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentModule = modules[currentModuleIndex];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = modules.length > 0 ? ((currentModuleIndex + (currentQuestionIndex + 1) / questions.length) / modules.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Concours introuvable
        </h2>
        <Button onClick={() => navigate('/')}>
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Concours terminé !
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Votre participation au concours "{contest.name}" a été enregistrée avec succès.
          Vous recevrez vos résultats une fois l'évaluation terminée.
        </p>
        <Button onClick={() => navigate('/')}>
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  if (!currentModule || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucune question disponible
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Ce concours ne contient pas encore de questions.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header avec progression */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {contest.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Module {currentModuleIndex + 1}/{modules.length}: {currentModule.title}
              </p>
            </div>
            {timeRemaining !== null && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono font-bold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
            <span>Question {currentQuestionIndex + 1}/{questions.length}</span>
            <span>{Math.round(progress)}% terminé</span>
          </div>
        </CardContent>
      </Card>

      {/* Question actuelle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Question {currentQuestionIndex + 1}
            </h2>
            <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded-full text-sm font-medium">
              {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Contenu de la question */}
          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: currentQuestion.content }}
          />

          {/* Média si présent */}
          {currentQuestion.media_url && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <img 
                src={currentQuestion.media_url} 
                alt="Média de la question"
                className="max-w-full h-auto rounded"
              />
            </div>
          )}

          {/* Interface de réponse selon le type */}
          <div className="space-y-4">
            {currentModule.module_type === 'qcm' && currentQuestion.qcm_options && (
              <div className="space-y-3">
                {currentQuestion.qcm_options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      responses[currentQuestion.id] === option.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option.id}
                      checked={responses[currentQuestion.id] === option.id}
                      onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      responses[currentQuestion.id] === option.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {responses[currentQuestion.id] === option.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-white">
                      {option.option_text}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {currentModule.module_type !== 'qcm' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Votre réponse
                </label>
                <textarea
                  value={responses[currentQuestion.id] || ''}
                  onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Saisissez votre réponse ici..."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0 && currentModuleIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Précédent
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => saveResponse(currentQuestion.id, responses[currentQuestion.id])}
          >
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
          
          {currentQuestionIndex === questions.length - 1 && currentModuleIndex === modules.length - 1 ? (
            <Button
              onClick={() => setShowConfirmSubmit(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Terminer le concours
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Modal de confirmation */}
      <Modal
        isOpen={showConfirmSubmit}
        onClose={() => setShowConfirmSubmit(false)}
        title="Confirmer la soumission"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Êtes-vous sûr de vouloir terminer et soumettre votre concours ? 
            Cette action est définitive et vous ne pourrez plus modifier vos réponses.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 dark:text-yellow-200 text-sm">
                Vérifiez bien toutes vos réponses avant de confirmer.
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmSubmit(false)}
            >
              Continuer à répondre
            </Button>
            <Button
              onClick={handleSubmitContest}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Confirmer la soumission
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal for Name Input */}
      <Modal
        isOpen={showNameInputModal}
        onClose={() => {}} // Prevent closing without name
        title="Veuillez entrer vos informations"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Pour participer à ce concours public, veuillez entrer votre prénom et votre nom.
          </p>
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prénom
            </label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Votre prénom"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom
            </label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Votre nom"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleNameSubmit} disabled={!firstName || !lastName}>
              Commencer le concours
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}