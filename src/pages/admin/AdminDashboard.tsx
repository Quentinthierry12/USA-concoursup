import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContests } from '../../hooks/useContests';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { CreateContestForm } from '../../components/admin/CreateContestForm';
import { 
  Plus, 
  Trophy, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings,
  Eye,
  Edit,
  Archive,
  Building
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function AdminDashboard() {
  const { contests, loading } = useContests();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const stats = {
    totalContests: contests.length,
    activeContests: contests.filter(c => c.status === 'active').length,
    totalCandidates: 0, // À implémenter
    completedContests: contests.filter(c => c.status === 'closed').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Administration
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Gérez vos concours et évaluez les candidats
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/agencies')}
          >
            <Building className="mr-2 h-4 w-4" />
            Gérer les agences
          </Button>
          {(user && (user.role === 'admin' || user.role === 'responsable') && user.academy_role === 'staff') && (
            <Button
              variant="outline"
              onClick={() => navigate('/academy/admin')}
            >
              Admin Académie
            </Button>
          )}
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Concours
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Trophy className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Concours
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalContests}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Concours Actifs
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeContests}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Candidats
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
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Terminés
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completedContests}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contests List */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Mes Concours
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contests.map((contest) => (
              <div
                key={contest.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {contest.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      contest.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : contest.status === 'draft'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {contest.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      contest.type === 'public'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}>
                      {contest.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Créé le {format(new Date(contest.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/admin/contest/${contest.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/admin/contest/${contest.id}/correction`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/admin/contest/${contest.id}`)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {contests.length === 0 && (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Aucun concours créé
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Commencez par créer votre premier concours
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un concours
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Contest Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouveau concours"
        size="lg"
      >
        <CreateContestForm onClose={() => setShowCreateModal(false)} />
      </Modal>
    </div>
  );
}