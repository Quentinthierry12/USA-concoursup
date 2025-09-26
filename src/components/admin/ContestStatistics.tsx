import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { BarChart3, TrendingUp, Users, Award } from 'lucide-react';

interface ContestStatisticsProps {
  contestId: string;
}

export function ContestStatistics({ contestId }: ContestStatisticsProps) {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    completedCandidates: 0,
    averageScore: 0,
    passRate: 0,
    completionRate: 0
  });

  // TODO: Implémenter le chargement des statistiques depuis la base de données
  useEffect(() => {
    // Simuler le chargement des statistiques
    setStats({
      totalCandidates: 25,
      completedCandidates: 18,
      averageScore: 14.2,
      passRate: 72,
      completionRate: 72
    });
  }, [contestId]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Statistiques du concours
      </h2>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Candidats
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalCandidates}
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
                  Terminés
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completedCandidates}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Score Moyen
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageScore}/20
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Taux de Réussite
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.passRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Progression des candidats
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Taux de completion</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.completionRate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Distribution des scores
            </h3>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Graphique à implémenter
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance by Module */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance par module
          </h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Statistiques détaillées à implémenter
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}