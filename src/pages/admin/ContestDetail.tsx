import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContests } from '../../hooks/useContests';
import { useModules } from '../../hooks/useModules';
import { useCandidates } from '../../hooks/useCandidates';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ModuleForm } from '../../components/admin/ModuleForm';
import { CandidatesList } from '../../components/admin/CandidatesList';
import { ContestSettings } from '../../components/admin/ContestSettings';
import { ContestStatistics } from '../../components/admin/ContestStatistics';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Settings, 
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Archive
} from 'lucide-react';
import { Contest, Module } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ContestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getContestById, updateContest } = useContests();
  const { modules, loading: modulesLoading, fetchModules, deleteModule } = useModules();
  const { candidates, fetchCandidates } = useCandidates();
  
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'modules' | 'candidates' | 'statistics' | 'settings'>('modules');
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  useEffect(() => {
    if (id) {
      loadContest();
      fetchModules(id);
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

  const handleStatusChange = async (newStatus: Contest['status']) => {
    if (!contest) return;
    
    const success = await updateContest(contest.id, { status: newStatus });
    if (success) {
      setContest({ ...contest, status: newStatus });
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) {
      const success = await deleteModule(moduleId);
      if (success && id) {
        fetchModules(id);
      }
    }
  };

  const getStatusColor = (status: Contest['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'closed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'archived': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
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
              {contest.name}
            </h1>
            <div className="flex items-center space-x-3 mt-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(contest.status)}`}>
                {contest.status}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                contest.type === 'public'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
              }`}>
                {contest.type}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {contest.status === 'draft' && (
            <Button
              onClick={() => handleStatusChange('active')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Activer
            </Button>
          )}
          {contest.status === 'active' && (
            <Button
              onClick={() => handleStatusChange('closed')}
              variant="outline"
            >
              <Pause className="mr-2 h-4 w-4" />
              Fermer
            </Button>
          )}
          {contest.status === 'closed' && (
            <Button
              onClick={() => handleStatusChange('archived')}
              variant="outline"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archiver
            </Button>
          )}
        </div>
      </div>

      {/* Contest Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Période</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {contest.start_date && format(new Date(contest.start_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                {' - '}
                {contest.end_date && format(new Date(contest.end_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Participants</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {contest.max_participants ? `Max ${contest.max_participants}` : 'Illimité'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Créé le</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {format(new Date(contest.created_at), 'dd/MM/yyyy', { locale: fr })}
              </p>
            </div>
          </div>
          {contest.description && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Description</h3>
              <div 
                className="text-sm text-gray-600 dark:text-gray-300 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: contest.description }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'modules', label: 'Modules & Questions', icon: Edit },
            { id: 'candidates', label: 'Candidats', icon: Users },
            { id: 'statistics', label: 'Statistiques', icon: BarChart3 },
            { id: 'settings', label: 'Paramètres', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Modules d'évaluation
              </h2>
              <Button onClick={() => setShowModuleModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un module
              </Button>
            </div>

            <div className="space-y-4">
              {modules.map((module, index) => (
                <Card key={module.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {module.title}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Type: {module.module_type}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Points: {module.max_score}
                              </span>
                              {module.time_limit_minutes && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Temps: {module.time_limit_minutes}min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {module.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 ml-11">
                            {module.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/contest/${contest.id}/module/${module.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingModule(module);
                            setShowModuleModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteModule(module.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {modules.length === 0 && (
                <div className="text-center py-12">
                  <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucun module créé
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Commencez par créer votre premier module d'évaluation
                  </p>
                  <Button onClick={() => setShowModuleModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un module
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <CandidatesList contestId={contest.id} />
        )}

        {activeTab === 'statistics' && (
          <ContestStatistics contestId={contest.id} />
        )}

        {activeTab === 'settings' && (
          <ContestSettings contest={contest} onUpdate={setContest} />
        )}
      </div>

      {/* Module Modal */}
      <Modal
        isOpen={showModuleModal}
        onClose={() => {
          setShowModuleModal(false);
          setEditingModule(null);
        }}
        title={editingModule ? 'Modifier le module' : 'Créer un nouveau module'}
        size="lg"
      >
        <ModuleForm
          contestId={contest.id}
          module={editingModule}
          onClose={() => {
            setShowModuleModal(false);
            setEditingModule(null);
            if (id) fetchModules(id);
          }}
        />
      </Modal>
    </div>
  );
}