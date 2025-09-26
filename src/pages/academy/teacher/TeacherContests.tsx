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
  class_name: string;
  candidates_count: number;
  completed_count: number;
}

export function TeacherContests() {
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherContests();
  }, []);

  const fetchTeacherContests = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Récupérer les classes où l'utilisateur est professeur
      const { data: memberData } = await supabase
        .from('academy_class_members')
        .select('class_id')
        .eq('user_id', user.id)
        .eq('role_in_class', 'prof');
      
      if (!memberData || memberData.length === 0) {
        setLoading(false);
        return;
      }
      
      const classIds = memberData.map(m => m.class_id);
      
      // Récupérer les informations des classes
      const { data: classData } = await supabase
        .from('academy_classes')
        .select('id, name')
        .in('id', classIds);
      
      if (!classData || classData.length === 0) {
        setLoading(false);
        return;
      }
      
      const classMap = new Map(classData.map(c => [c.id, c.name]));
      
      // Récupérer les modules assignés à ces classes
      const { data: assignmentData } = await supabase
        .from('academy_module_assignments')
        .select('module_id, class_id')
        .in('class_id', classIds);
      
      if (!assignmentData || assignmentData.length === 0) {
        setLoading(false);
        return;
      }
      
      // Récupérer les concours créés à partir de ces modules
      const moduleIds = [...new Set(assignmentData.map(a => a.module_id))];
      
      const { data: contestData } = await supabase
        .from('concour_contests')
        .select('*, concour_candidates(id, status)')
        .in('academy_module_id', moduleIds)
        .order('start_date', { ascending: false });
      
      if (!contestData) {
        setLoading(false);
        return;
      }
      
      // Associer chaque concours à sa classe
      const contestsWithClassInfo = contestData.map(contest => {
        // Trouver l'assignment qui correspond au module du concours
        const assignment = assignmentData.find(a => a.module_id === contest.academy_module_id);
        const className = assignment ? classMap.get(assignment.class_id) || 'Classe inconnue' : 'Classe inconnue';
        
        // Compter les candidats et ceux qui ont terminé
        const candidates = contest.concour_candidates || [];
        const completedCount = candidates.filter(c => c.status === 'completed').length;
        
        return {
          id: contest.id,
          name: contest.name,
          description: contest.description,
          start_date: contest.start_date,
          end_date: contest.end_date,
          class_name: className,
          candidates_count: candidates.length,
          completed_count: completedCount
        };
      });
      
      setContests(contestsWithClassInfo);
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

  const getStatusColor = (completed: number, total: number) => {
    if (total === 0) return 'bg-gray-100 text-gray-800';
    const ratio = completed / total;
    if (ratio === 1) return 'bg-green-100 text-green-800';
    if (ratio >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Concours des Classes</h1>
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : contests.length === 0 ? (
        <Card>
          <div className="p-6 text-center">
            <p className="text-gray-500">Aucun concours disponible pour vos classes.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contests.map(contest => (
            <Card key={contest.id}>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold">{contest.name}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contest.completed_count, contest.candidates_count)}`}>
                    {contest.completed_count}/{contest.candidates_count} terminés
                  </span>
                </div>
                <div className="text-sm text-gray-700 font-medium">Classe: {contest.class_name}</div>
                <p className="text-sm text-gray-500">{contest.description}</p>
                <div className="text-xs text-gray-500">
                  <div>Début: {formatDate(contest.start_date)}</div>
                  <div>Fin: {formatDate(contest.end_date)}</div>
                </div>
                <div className="pt-2">
                  <Link to={`/admin/contest/${contest.id}/correction`}>
                    <Button>
                      Voir les résultats
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}