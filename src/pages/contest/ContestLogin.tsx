import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Trophy, AlertCircle, Lock } from 'lucide-react';

export function ContestLogin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Vérifier les identifiants candidat
      const { data: candidate, error } = await supabase
        .from('concour_candidates')
        .select('*')
        .eq('contest_id', id)
        .eq('identifier', identifier)
        .eq('password', password)
        .single();

      if (error || !candidate) {
        setError('Identifiants incorrects');
        return;
      }

      // Stocker les informations du candidat dans le localStorage
      localStorage.setItem('currentCandidate', JSON.stringify(candidate));
      
      // Mettre à jour le statut si c'est la première connexion
      if (candidate.status === 'invited') {
        await supabase
          .from('concour_candidates')
          .update({ 
            status: 'started',
            started_at: new Date().toISOString()
          })
          .eq('id', candidate.id);
      }

      // Rediriger vers l'interface de passage du concours
      navigate(`/contest/${id}/participate`);
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Accès Candidat
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connectez-vous avec vos identifiants pour participer au concours
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
              </div>
            )}

            <Input
              label="Identifiant"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={loading}
              placeholder="Votre identifiant unique"
            />

            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Votre mot de passe"
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Accéder au concours'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Informations importantes :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Utilisez les identifiants fournis dans votre convocation</li>
                  <li>• Assurez-vous d'avoir une connexion internet stable</li>
                  <li>• Vos réponses sont sauvegardées automatiquement</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}