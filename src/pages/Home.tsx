import React from 'react';
import { Link } from 'react-router-dom';
import { useContests } from '../hooks/useContests';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Calendar, Users, Trophy, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Home() {
  const { getPublicContests, loading } = useContests();
  const publicContests = getPublicContests();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            Plateforme de Concours RP
          </h1>
          <p className="text-xl opacity-90 mb-6">
            Participez aux concours de recrutement des agences gouvernementales. 
            Testez vos compétences et rejoignez les équipes d'élite.
          </p>
          <div className="flex items-center space-x-6 text-sm opacity-80">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Concours certifiés</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Évaluation professionnelle</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Sessions régulières</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Contests */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Concours Disponibles
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {publicContests.length} concours actifs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicContests.map((contest) => (
            <Card key={contest.id} className="hover:shadow-2xl transition-shadow duration-300">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {contest.name}
                </h3>
              </CardHeader>
              
              <CardContent>
                <div 
                  className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: contest.description }}
                />
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      Jusqu'au {format(new Date(contest.end_date), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                {contest.type === 'public' ? (
                  <Link to={`/contest/${contest.id}/participate`} className="w-full">
                    <Button className="w-full group">
                      Participer
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Link to={`/contest/${contest.id}`} className="w-full">
                    <Button className="w-full group">
                      Accéder
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {publicContests.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun concours disponible
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Revenez bientôt pour de nouveaux concours !
            </p>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Vous êtes responsable d'agence ?
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Créez et gérez vos propres concours de recrutement avec notre plateforme complète.
          Interface intuitive, correction automatisée et génération de rapports.
        </p>
        <Link to="/login">
          <Button size="lg">
            Accès Direction
          </Button>
        </Link>
      </div>
    </div>
  );
}