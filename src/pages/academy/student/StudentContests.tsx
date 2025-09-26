import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Link } from 'react-router-dom';

interface Contest {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  candidate_id?: string;
}

export function StudentContests() {
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentContests();
  }, [user]);

  const fetchStudentContests = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Récupérer les classes de l'étudiant
      const { data: memberData } = await supabase
        .from('academy_class_members')
        .select('class_id')
        .eq('user_id', user.id)
        .eq('role_in_class', 'etudiant');
      
      if (!memberData || memberData.length === 0) {
        setLoading(false);
        return;
      }
      
      const classIds = memberData.map(m => m.class_id);
      
      // Récupérer les modules assignés à ces classes
      const { data: assignmentData } = await supabase
        .from('academy_module_assignments')
        .select('module_id')
        .in('class_id', classIds);
      
      if (!assignmentData || assignmentData.length === 0) {
        setLoading(false);
        return;
      }
      
      const moduleIds = assignmentData.map(a => a.module_id);
      
      // Récupérer les concours créés à partir de ces modules
      const { data: contestData, error } = await supabase
        .from('concour_contests')
        .select('*')
        .in('academy_module_id', moduleIds)
        .order('start_date', { ascending: true });
      
      if (error) {
        console.error('Erreur lors de la récupération des concours:', error);
        setLoading(false);
        return;
      }
      
      if (!contestData || contestData.length === 0) {
        setLoading(false);
        return;
      }
      
      // Récupérer les candidats pour ces concours
      const { data: candidateData } = await supabase
        .from('concour_candidates')
        .select('id, contest_id, status')
        .eq('user_id', user.id)
        .in('contest_id', contestData.map(c => c.id));
      
      // Combiner les données
      const contestsWithStatus = contestData.map(contest => {
        const candidate = candidateData?.find(c => c.contest_id === contest.id);
        return {
          ...contest,
          candidate_id: candidate?.id,
          status: candidate?.status || 'not_started'
        };
      });
      
      setContests(contestsWithStatus);
    } catch (error) {
      console.error('Erreur lors de la récupération des concours:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'in_progress':
        return 'En cours';
      case 'invited':
        return 'À faire';
      case 'not_started':
        return 'À faire';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'invited':
      case 'not_started':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes Concours</h1>
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : contests.length === 0 ? (
        <Card>
          <div className="p-6 text-center">
            <p className="text-gray-500">Aucun concours disponible pour le moment.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map(contest => (
            <Card key={contest.id}>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold">{contest.name}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contest.status)}`}>
                    {getStatusLabel(contest.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{contest.description}</p>
                <div className="text-xs text-gray-500">
                  <div>Début: {formatDate(contest.start_date)}</div>
                  <div>Fin: {formatDate(contest.end_date)}</div>
                </div>
                <div className="pt-2">
                  {contest.status === 'completed' ? (
                    <Button disabled>Terminé</Button>
                  ) : (
                    <Link to={`/contest/${contest.id}`}>
                      <Button>
                        {contest.status === 'in_progress' ? 'Continuer' : 'Commencer'}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}