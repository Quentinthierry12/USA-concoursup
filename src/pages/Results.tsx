import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Trophy, Search, User, Calendar, Award, FileText, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CandidateResult {
  id: string;
  name: string;
  identifier: string;
  status: string;
  total_score: number;
  final_grade: number;
  started_at: string;
  completed_at: string;
  contest: {
    id: string;
    name: string;
    description: string;
    agency: {
      name: string;
      logo_url: string;
    };
  };
  responses: Array<{
    id: string;
    response_text: string;
    selected_option: {
      option_text: string;
      is_correct: boolean;
    };
    score: number;
    question: {
      content: string;
      points: number;
      explanation: string;
    };
    evaluations: Array<{
      feedback: string;
      score: number;
    }>;
  }>;
}

export function Results() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<CandidateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('concour_candidates')
        .select(`
          *,
          contest:concour_contests(
            *,
            agency:concour_agencies(*)
          ),
          responses:concour_responses(
            *,
            question:concour_questions(*),
            selected_option:concour_qcm_options(*),
            evaluations:concour_evaluations(*)
          )
        `)
        .eq('identifier', identifier)
        .eq('password', password)
        .single();

      if (error || !data) {
        setError('Identifiants incorrects ou résultats non disponibles');
        return;
      }

      if (data.status !== 'evaluated' && data.status !== 'completed') {
        setError('Vos résultats ne sont pas encore disponibles');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Erreur lors de la recherche des résultats');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'evaluated': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'evaluated': return 'Évalué';
      case 'completed': return 'En attente d\'évaluation';
      default: return status;
    }
  };

  const calculateGrade = (score: number, maxScore: number) => {
    return Math.round((score / maxScore) * 20 * 100) / 100;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Trophy className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Consulter mes résultats
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Saisissez vos identifiants pour consulter vos résultats de concours
        </p>
      </div>

      {/* Search Form */}
      {!result && (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Rechercher mes résultats
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Input
                label="Identifiant"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="Votre identifiant unique"
              />

              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Votre mot de passe"
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                <Search className="mr-2 h-4 w-4" />
                {loading ? 'Recherche...' : 'Consulter mes résultats'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Header with candidate info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {result.contest.agency?.logo_url && (
                    <img 
                      src={result.contest.agency.logo_url} 
                      alt={result.contest.agency.name}
                      className="w-16 h-16 object-contain"
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {result.contest.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {result.contest.agency?.name}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setResult(null)}
                >
                  Nouvelle recherche
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Candidate Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Candidat
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {result.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Score Total
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {result.total_score} points
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                    <Trophy className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Note /20
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {result.final_grade || calculateGrade(result.total_score, result.responses.reduce((sum, r) => sum + r.question.points, 0))}/20
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Statut
                    </p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(result.status)}`}>
                      {getStatusLabel(result.status)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chronologie
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.started_at && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Concours commencé
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(result.started_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
                {result.completed_at && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Concours terminé
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(result.completed_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          {result.status === 'evaluated' && result.responses && result.responses.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Détail des réponses
                </h3>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.responses.map((response, index) => (
                  <div key={response.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Question {index + 1}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {response.score}/{response.question.points} pts
                        </span>
                        {response.selected_option && (
                          response.selected_option.is_correct ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )
                        )}
                      </div>
                    </div>

                    <div 
                      className="text-gray-700 dark:text-gray-300 mb-3 prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: response.question.content }}
                    />

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Votre réponse :
                      </h5>
                      {response.selected_option ? (
                        <p className={`text-sm ${
                          response.selected_option.is_correct 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          {response.selected_option.option_text}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {response.response_text || 'Aucune réponse'}
                        </p>
                      )}
                    </div>

                    {response.question.explanation && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Explication :
                        </h5>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {response.question.explanation}
                        </p>
                      </div>
                    )}

                    {response.evaluations && response.evaluations.length > 0 && response.evaluations[0].feedback && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                          Commentaire du correcteur :
                        </h5>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          {response.evaluations[0].feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}