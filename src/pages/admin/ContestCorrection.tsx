import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContests } from '../../hooks/useContests';
import { useCandidates } from '../../hooks/useCandidates';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { 
  ArrowLeft, 
  User, 
  CheckCircle, 
  XCircle, 
  Edit,
  Save,
  Eye,
  FileText,
  Award,
  Clock
} from 'lucide-react';
import { Contest, Candidate, Response } from '../../types';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ContestCorrection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getContestById } = useContests();
  const { candidates, fetchCandidates } = useCandidates();
  
  const [contest, setContest] = useState<Contest | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateResponses, setCandidateResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadContest();
      fetchCandidates(id);
    }
  }, [id]);

  const loadContest = async () => {
    if (!id) return;
    
    setLoading(true);
    const contestData = await getContestById(id);
    setContest(contestData);
    setLoading(false);
  };

  const loadCandidateResponses = async (candidateId: string) => {
    try {
      const { data, error } = await supabase
        .from('concour_responses')
        .select(`
          *,
          question:concour_questions(*),
          selected_option:concour_qcm_options(*),
          evaluations:concour_evaluations(*)
        `)
        .eq('candidate_id', candidateId)
        .order('submitted_at', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des réponses:', error);
        return;
      }

      setCandidateResponses(data || []);
      
      // Initialiser les scores et feedback
      const initialScores: Record<string, number> = {};
      const initialFeedback: Record<string, string> = {};
      
      data?.forEach(response => {
        initialScores[response.id] = response.score || 0;
        initialFeedback[response.id] = response.evaluations?.[0]?.feedback || '';
      });
      
      setScores(initialScores);
      setFeedback(initialFeedback);
    } catch (error) {
      console.error('Erreur lors du chargement des réponses:', error);
    }
  };

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    loadCandidateResponses(candidate.id);
  };

  const handleScoreChange = (responseId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [responseId]: score
    }));
  };

  const handleFeedbackChange = (responseId: string, feedbackText: string) => {
    setFeedback(prev => ({
      ...prev,
      [responseId]: feedbackText
    }));
  };

  const saveEvaluation = async (responseId: string) => {
    if (!selectedCandidate) return;

    try {
      const score = scores[responseId] || 0;
      const feedbackText = feedback[responseId] || '';

      // Vérifier si une évaluation existe déjà
      const { data: existingEvaluation } = await supabase
        .from('concour_evaluations')
        .select('id')
        .eq('response_id', responseId)
        .single();

      const evaluationData = {
        response_id: responseId,
        evaluator_id: 'current-user-id', // À remplacer par l'ID de l'utilisateur connecté
        score,
        feedback: feedbackText,
        is_final: true
      };

      if (existingEvaluation) {
        await supabase
          .from('concour_evaluations')
          .update(evaluationData)
          .eq('id', existingEvaluation.id);
      } else {
        await supabase
          .from('concour_evaluations')
          .insert(evaluationData);
      }

      // Mettre à jour le score de la réponse
      await supabase
        .from('concour_responses')
        .update({ score })
        .eq('id', responseId);

      // Recalculer le score total du candidat
      await updateCandidateScore(selectedCandidate.id);
      
      console.log('Évaluation sauvegardée');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'évaluation:', error);
    }
  };

  const updateCandidateScore = async (candidateId: string) => {
    try {
      const { data: responses } = await supabase
        .from('concour_responses')
        .select('score')
        .eq('candidate_id', candidateId);

      const totalScore = responses?.reduce((sum, response) => sum + (response.score || 0), 0) || 0;

      await supabase
        .from('concour_candidates')
        .update({ 
          total_score: totalScore,
          status: 'evaluated'
        })
        .eq('id', candidateId);

      // Mettre à jour la liste locale
      fetchCandidates(id!);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du score:', error);
    }
  };

  const getStatusColor = (status: Candidate['status']) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'evaluated': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Concours introuvable
        </h2>
        <Button onClick={() => navigate('/admin')}>
          Retour à l'administration
        </Button>
      </div>
    );
  }

  const completedCandidates = candidates.filter(c => c.status === 'completed' || c.status === 'evaluated');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Correction - {contest.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {completedCandidates.length} candidat{completedCandidates.length > 1 ? 's' : ''} à corriger
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des candidats */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Candidats terminés
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              {completedCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => handleCandidateSelect(candidate)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedCandidate?.id === candidate.id
                      ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {candidate.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Terminé le {candidate.completed_at && format(new Date(candidate.completed_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(candidate.status)}`}>
                        {candidate.status === 'evaluated' ? 'Corrigé' : 'À corriger'}
                      </span>
                      {candidate.total_score > 0 && (
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                          {candidate.total_score} pts
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {completedCandidates.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Aucun candidat n'a encore terminé le concours
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Réponses du candidat sélectionné */}
        <div className="lg:col-span-2">
          {selectedCandidate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Réponses de {selectedCandidate.name}
                  </h2>
                  <Button
                    onClick={() => setCorrectionMode(!correctionMode)}
                    variant={correctionMode ? "secondary" : "outline"}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {correctionMode ? 'Mode lecture' : 'Mode correction'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {candidateResponses.map((response, index) => (
                  <div key={response.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Question {index + 1}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {response.question?.points} point{(response.question?.points || 0) > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Question */}
                    <div 
                      className="text-gray-700 dark:text-gray-300 mb-4 prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: response.question?.content || '' }}
                    />

                    {/* Réponse du candidat */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Réponse du candidat :
                      </h4>
                      {response.selected_option ? (
                        <div className="flex items-center space-x-2">
                          {response.selected_option.is_correct ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm ${
                            response.selected_option.is_correct 
                              ? 'text-green-700 dark:text-green-300' 
                              : 'text-red-700 dark:text-red-300'
                          }`}>
                            {response.selected_option.option_text}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {response.response_text || 'Aucune réponse'}
                        </p>
                      )}
                    </div>

                    {/* Interface de correction */}
                    {correctionMode && (
                      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Score"
                            type="number"
                            min="0"
                            max={response.question?.points || 10}
                            value={scores[response.id] || 0}
                            onChange={(e) => handleScoreChange(response.id, parseInt(e.target.value) || 0)}
                          />
                          <div className="flex items-end">
                            <Button
                              onClick={() => saveEvaluation(response.id)}
                              size="sm"
                              className="w-full"
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Sauvegarder
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Commentaire (optionnel)
                          </label>
                          <textarea
                            value={feedback[response.id] || ''}
                            onChange={(e) => handleFeedbackChange(response.id, e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="Commentaire sur la réponse..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Score actuel */}
                    {!correctionMode && response.score !== undefined && (
                      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Score attribué :</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {response.score}/{response.question?.points || 10}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {candidateResponses.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucune réponse trouvée pour ce candidat
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Sélectionnez un candidat
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choisissez un candidat dans la liste pour voir ses réponses
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}