import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Question, CreateQuestionData, QCMOption } from '../types';

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = async (moduleId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concour_questions')
        .select(`
          *,
          qcm_options:concour_qcm_options(*)
        `)
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des questions:', error);
        return;
      }

      setQuestions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionById = async (id: string): Promise<Question | null> => {
    try {
      const { data, error } = await supabase
        .from('concour_questions')
        .select(`
          *,
          qcm_options:concour_qcm_options(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur lors du chargement de la question:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors du chargement de la question:', error);
      return null;
    }
  };

  const createQuestion = async (moduleId: string, questionData: CreateQuestionData): Promise<Question | null> => {
    try {
      // Obtenir le prochain index
      const { data: existingQuestions } = await supabase
        .from('concour_questions')
        .select('order_index')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextIndex = existingQuestions && existingQuestions.length > 0 
        ? existingQuestions[0].order_index + 1 
        : 1;

      const { data: question, error: questionError } = await supabase
        .from('concour_questions')
        .insert({
          module_id: moduleId,
          ...questionData,
          order_index: nextIndex
        })
        .select()
        .single();

      if (questionError) {
        console.error('Erreur lors de la création de la question:', questionError);
        return null;
      }

      // Créer les options QCM si nécessaire
      if (questionData.qcm_options && questionData.qcm_options.length > 0) {
        const optionsToInsert = questionData.qcm_options.map(option => ({
          question_id: question.id,
          ...option
        }));

        const { error: optionsError } = await supabase
          .from('concour_qcm_options')
          .insert(optionsToInsert);

        if (optionsError) {
          console.error('Erreur lors de la création des options:', optionsError);
          // Supprimer la question créée en cas d'erreur
          await supabase.from('concour_questions').delete().eq('id', question.id);
          return null;
        }
      }

      // Recharger la question avec ses options
      const fullQuestion = await getQuestionById(question.id);
      if (fullQuestion) {
        setQuestions(prev => [...prev, fullQuestion].sort((a, b) => a.order_index - b.order_index));
      }
      
      return fullQuestion;
    } catch (error) {
      console.error('Erreur lors de la création de la question:', error);
      return null;
    }
  };

  const updateQuestion = async (id: string, updates: Partial<CreateQuestionData>): Promise<boolean> => {
    try {
      const { error: questionError } = await supabase
        .from('concour_questions')
        .update({
          content: updates.content,
          question_type: updates.question_type,
          points: updates.points,
          media_url: updates.media_url,
          correct_answer: updates.correct_answer,
          explanation: updates.explanation
        })
        .eq('id', id);

      if (questionError) {
        console.error('Erreur lors de la mise à jour de la question:', questionError);
        return false;
      }

      // Mettre à jour les options QCM si nécessaire
      if (updates.qcm_options) {
        // Supprimer les anciennes options
        await supabase
          .from('concour_qcm_options')
          .delete()
          .eq('question_id', id);

        // Créer les nouvelles options
        if (updates.qcm_options.length > 0) {
          const optionsToInsert = updates.qcm_options.map(option => ({
            question_id: id,
            ...option
          }));

          const { error: optionsError } = await supabase
            .from('concour_qcm_options')
            .insert(optionsToInsert);

          if (optionsError) {
            console.error('Erreur lors de la mise à jour des options:', optionsError);
            return false;
          }
        }
      }

      // Recharger la question mise à jour
      const updatedQuestion = await getQuestionById(id);
      if (updatedQuestion) {
        setQuestions(prev => 
          prev.map(question => 
            question.id === id ? updatedQuestion : question
          )
        );
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la question:', error);
      return false;
    }
  };

  const deleteQuestion = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('concour_questions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression de la question:', error);
        return false;
      }

      // Mettre à jour la liste locale
      setQuestions(prev => prev.filter(question => question.id !== id));
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la question:', error);
      return false;
    }
  };

  const reorderQuestions = async (moduleId: string, questionIds: string[]): Promise<boolean> => {
    try {
      const updates = questionIds.map((id, index) => ({
        id,
        order_index: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('concour_questions')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      // Recharger les questions
      await fetchQuestions(moduleId);
      return true;
    } catch (error) {
      console.error('Erreur lors de la réorganisation des questions:', error);
      return false;
    }
  };

  return {
    questions,
    loading,
    fetchQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions
  };
}