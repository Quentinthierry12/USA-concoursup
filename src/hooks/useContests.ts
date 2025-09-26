import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Contest, CreateContestData, ContestFilters } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchContests = async (filters?: ContestFilters) => {
    try {
      setLoading(true);
      let query = supabase
        .from('concour_contests')
        .select(`
          *,
          agency:concour_agencies(*),
          creator:concour_users!created_by(*)
        `);

      // Appliquer les filtres
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.agency_id) {
        query = query.eq('agency_id', filters.agency_id);
      }
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des concours:', error);
        return;
      }

      setContests(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des concours:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const getPublicContests = () => {
    return contests.filter(contest => contest.type === 'public' && contest.status === 'active');
  };

  const getContestById = async (id: string): Promise<Contest | null> => {
    try {
      const { data, error } = await supabase
        .from('concour_contests')
        .select(`
          *,
          agency:concour_agencies(*),
          creator:concour_users!created_by(*),
          modules:concour_modules(
            *,
            questions:concour_questions(
              *,
              qcm_options:concour_qcm_options(*)
            )
          ),
          candidates:concour_candidates(*),
          statistics:concour_statistics(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur lors du chargement du concours:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors du chargement du concours:', error);
      return null;
    }
  };

  const createContest = async (contestData: CreateContestData): Promise<Contest | null> => {
    if (!user) return null;

    try {
      // Générer un lien d'accès unique pour les concours privés
      const access_link = contestData.type === 'private' 
        ? `contest-${Math.random().toString(36).substr(2, 12)}`
        : null;

      const { data, error } = await supabase
        .from('concour_contests')
        .insert({
          ...contestData,
          access_link,
          created_by: user.id,
          status: 'draft'
        })
        .select(`
          *,
          agency:concour_agencies(*),
          creator:concour_users!created_by(*)
        `)
        .single();

      if (error) {
        console.error('Erreur lors de la création du concours:', error);
        return null;
      }

      // Mettre à jour la liste locale
      setContests(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erreur lors de la création du concours:', error);
      return null;
    }
  };

  const updateContest = async (id: string, updates: Partial<Contest>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('concour_contests')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour du concours:', error);
        return false;
      }

      // Mettre à jour la liste locale
      setContests(prev => 
        prev.map(contest => 
          contest.id === id 
            ? { ...contest, ...updates, updated_at: new Date().toISOString() }
            : contest
        )
      );
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du concours:', error);
      return false;
    }
  };

  const deleteContest = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('concour_contests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du concours:', error);
        return false;
      }

      // Mettre à jour la liste locale
      setContests(prev => prev.filter(contest => contest.id !== id));
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du concours:', error);
      return false;
    }
  };

  const duplicateContest = async (id: string): Promise<Contest | null> => {
    if (!user) return null;

    try {
      const originalContest = await getContestById(id);
      if (!originalContest) return null;

      // Créer une copie du concours
      const contestCopy: CreateContestData = {
        name: `${originalContest.name} (Copie)`,
        description: originalContest.description,
        type: originalContest.type,
        max_participants: originalContest.max_participants,
        is_recurring: originalContest.is_recurring,
        recurring_interval: originalContest.recurring_interval,
        agency_id: originalContest.agency_id
      };

      const newContest = await createContest(contestCopy);
      if (!newContest) return null;

      // Copier les modules et questions si ils existent
      if (originalContest.modules && originalContest.modules.length > 0) {
        for (const module of originalContest.modules) {
          const { data: newModule, error: moduleError } = await supabase
            .from('concour_modules')
            .insert({
              contest_id: newContest.id,
              title: module.title,
              module_type: module.module_type,
              description: module.description,
              max_score: module.max_score,
              time_limit_minutes: module.time_limit_minutes,
              order_position: module.order_position,
              is_required: module.is_required
            })
            .select()
            .single();

          if (moduleError || !newModule) continue;

          // Copier les questions du module
          if (module.questions && module.questions.length > 0) {
            for (const question of module.questions) {
              const { data: newQuestion, error: questionError } = await supabase
                .from('concour_questions')
                .insert({
                  module_id: newModule.id,
                  content: question.content,
                  question_type: question.question_type,
                  points: question.points,
                  order_index: question.order_index,
                  media_url: question.media_url,
                  correct_answer: question.correct_answer,
                  explanation: question.explanation
                })
                .select()
                .single();

              if (questionError || !newQuestion) continue;

              // Copier les options QCM si elles existent
              if (question.qcm_options && question.qcm_options.length > 0) {
                const optionsToInsert = question.qcm_options.map(option => ({
                  question_id: newQuestion.id,
                  option_text: option.option_text,
                  is_correct: option.is_correct,
                  option_order: option.option_order
                }));

                await supabase
                  .from('concour_qcm_options')
                  .insert(optionsToInsert);
              }
            }
          }
        }
      }

      return newContest;
    } catch (error) {
      console.error('Erreur lors de la duplication du concours:', error);
      return null;
    }
  };

  return {
    contests,
    loading,
    fetchContests,
    getPublicContests,
    getContestById,
    createContest,
    updateContest,
    deleteContest,
    duplicateContest
  };
}