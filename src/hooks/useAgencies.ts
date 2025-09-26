import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Agency } from '../types';

export function useAgencies() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concour_agencies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des agences:', error);
        return;
      }

      setAgencies(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des agences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const createAgency = async (agencyData: Omit<Agency, 'id' | 'created_at' | 'updated_at'>): Promise<Agency | null> => {
    try {
      const { data, error } = await supabase
        .from('concour_agencies')
        .insert(agencyData)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de l\'agence:', error);
        return null;
      }

      setAgencies(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'agence:', error);
      return null;
    }
  };

  const updateAgency = async (id: string, updates: Partial<Agency>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('concour_agencies')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour de l\'agence:', error);
        return false;
      }

      setAgencies(prev => 
        prev.map(agency => 
          agency.id === id 
            ? { ...agency, ...updates }
            : agency
        )
      );
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'agence:', error);
      return false;
    }
  };

  const deleteAgency = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('concour_agencies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression de l\'agence:', error);
        return false;
      }

      setAgencies(prev => prev.filter(agency => agency.id !== id));
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'agence:', error);
      return false;
    }
  };

  return {
    agencies,
    loading,
    fetchAgencies,
    createAgency,
    updateAgency,
    deleteAgency
  };
}