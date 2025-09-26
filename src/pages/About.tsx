import React from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Shield, Users, Award, Target } from 'lucide-react';

export function About() {
  const specialties = [
    'USSS - United States Secret Service',
    'CTU - Counter Terrorist Unit',
    'HRD - Human Resources Department',
    'NSA - National Security Agency'
  ];

  const team = [
    {
      name: 'Mike Beanning',
      role: 'Directeur',
      description: 'Expert en sécurité nationale avec 15 ans d\'expérience'
    },
    {
      name: 'Sarah Johnson',
      role: 'Directrice Adjointe',
      description: 'Spécialisée en ressources humaines et formation'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Qui sommes-nous ?
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Plateforme dédiée au recrutement et à l'évaluation des talents pour les agences gouvernementales d'élite.
        </p>
      </div>

      {/* Mission */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Target className="mr-3 h-6 w-6 text-blue-600" />
            Notre Mission
          </h2>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Nous facilitons le processus de recrutement des agences gouvernementales en proposant 
            une plateforme moderne et sécurisée pour l'évaluation des candidats. Notre système 
            permet une évaluation équitable et transparente des compétences requises pour intégrer 
            les unités d'élite.
          </p>
        </CardContent>
      </Card>

      {/* Team */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Users className="mr-3 h-6 w-6 text-blue-600" />
          Notre Équipe
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {team.map((member, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">
                    {member.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {member.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Specialties */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <Shield className="mr-3 h-6 w-6 text-blue-600" />
          Nos Spécialités
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialties.map((specialty, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-3">
                  <Award className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {specialty}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Values */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nos Valeurs
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Excellence</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Nous visons l'excellence dans chaque évaluation
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Équité</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Tous les candidats sont évalués selon les mêmes critères
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Précision</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Évaluation précise des compétences requises
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
