import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Candidate, CreateCandidateData } from '../types';
import { generateIdentifier, generatePassword } from '../lib/utils';

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCandidates = async (contestId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concour_candidates')
        .select(`
          *,
          user:concour_users(*)
        `)
        .eq('contest_id', contestId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des candidats:', error);
        return;
      }

      setCandidates(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des candidats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCandidateById = async (id: string): Promise<Candidate | null> => {
    try {
      const { data, error } = await supabase
        .from('concour_candidates')
        .select(`
          *,
          user:concour_users(*),
          responses:concour_responses(
            *,
            question:concour_questions(*),
            selected_option:concour_qcm_options(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur lors du chargement du candidat:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors du chargement du candidat:', error);
      return null;
    }
  };

  const createCandidate = async (contestId: string, candidateData: CreateCandidateData): Promise<Candidate | null> => {
    try {
      const identifier = generateIdentifier();
      const password = generatePassword();

      const { data, error } = await supabase
        .from('concour_candidates')
        .insert({
          contest_id: contestId,
          name: candidateData.name,
          discord_username: candidateData.discord_username,
          email: candidateData.email,
          identifier,
          password,
          status: 'invited'
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création du candidat:', error);
        return null;
      }

      // Mettre à jour la liste locale
      setCandidates(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erreur lors de la création du candidat:', error);
      return null;
    }
  };

  const createMultipleCandidates = async (contestId: string, candidatesData: CreateCandidateData[]): Promise<Candidate[]> => {
    try {
      const candidatesToInsert = candidatesData.map(candidate => ({
        contest_id: contestId,
        name: candidate.name,
        discord_username: candidate.discord_username,
        email: candidate.email,
        identifier: generateIdentifier(),
        password: generatePassword(),
        status: 'invited' as const
      }));

      const { data, error } = await supabase
        .from('concour_candidates')
        .insert(candidatesToInsert)
        .select();

      if (error) {
        console.error('Erreur lors de la création des candidats:', error);
        return [];
      }

      // Mettre à jour la liste locale
      setCandidates(prev => [...(data || []), ...prev]);
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la création des candidats:', error);
      return [];
    }
  };

  const updateCandidate = async (id: string, updates: Partial<Candidate>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('concour_candidates')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour du candidat:', error);
        return false;
      }

      // Mettre à jour la liste locale
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === id 
            ? { ...candidate, ...updates }
            : candidate
        )
      );
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du candidat:', error);
      return false;
    }
  };

  const deleteCandidate = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('concour_candidates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du candidat:', error);
        return false;
      }

      // Mettre à jour la liste locale
      setCandidates(prev => prev.filter(candidate => candidate.id !== id));
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du candidat:', error);
      return false;
    }
  };

  const regenerateCredentials = async (id: string): Promise<{ identifier: string; password: string } | null> => {
    try {
      const newIdentifier = generateIdentifier();
      const newPassword = generatePassword();

      const { error } = await supabase
        .from('concour_candidates')
        .update({
          identifier: newIdentifier,
          password: newPassword
        })
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la régénération des identifiants:', error);
        return null;
      }

      // Mettre à jour la liste locale
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === id 
            ? { ...candidate, identifier: newIdentifier, password: newPassword }
            : candidate
        )
      );

      return { identifier: newIdentifier, password: newPassword };
    } catch (error) {
      console.error('Erreur lors de la régénération des identifiants:', error);
      return null;
    }
  };

  return {
    candidates,
    loading,
    fetchCandidates,
    getCandidateById,
    createCandidate,
    createMultipleCandidates,
    updateCandidate,
    deleteCandidate,
    regenerateCredentials
  };
}