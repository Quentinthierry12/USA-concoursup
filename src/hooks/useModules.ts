import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Module, CreateModuleData } from '../types';

export function useModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchModules = async (contestId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concour_modules')
        .select('*')
        .eq('contest_id', contestId)
        .order('order_position', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des modules:', error);
        return;
      }

      setModules(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleById = async (id: string): Promise<Module | null> => {
    try {
      const { data, error } = await supabase
        .from('concour_modules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur lors du chargement du module:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors du chargement du module:', error);
      return null;
    }
  };

  const createModule = async (contestId: string, moduleData: CreateModuleData): Promise<Module | null> => {
    try {
      // Obtenir la prochaine position
      const { data: existingModules } = await supabase
        .from('concour_modules')
        .select('order_position')
        .eq('contest_id', contestId)
        .order('order_position', { ascending: false })
        .limit(1);

      const nextPosition = existingModules && existingModules.length > 0 
        ? existingModules[0].order_position + 1 
        : 1;

      const { data, error } = await supabase
        .from('concour_modules')
        .insert({
          contest_id: contestId,
          ...moduleData,
          order_position: nextPosition
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création du module:', error);
        return null;
      }

      // Mettre à jour la liste locale
      setModules(prev => [...prev, data].sort((a, b) => a.order_position - b.order_position));
      return data;
    } catch (error) {
      console.error('Erreur lors de la création du module:', error);
      return null;
    }
  };

  const updateModule = async (id: string, updates: Partial<Module>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('concour_modules')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour du module:', error);
        return false;
      }

      // Mettre à jour la liste locale
      setModules(prev => 
        prev.map(module => 
          module.id === id 
            ? { ...module, ...updates }
            : module
        )
      );
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du module:', error);
      return false;
    }
  };

  const deleteModule = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('concour_modules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du module:', error);
        return false;
      }

      // Mettre à jour la liste locale
      setModules(prev => prev.filter(module => module.id !== id));
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du module:', error);
      return false;
    }
  };

  const reorderModules = async (contestId: string, moduleIds: string[]): Promise<boolean> => {
    try {
      const updates = moduleIds.map((id, index) => ({
        id,
        order_position: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('concour_modules')
          .update({ order_position: update.order_position })
          .eq('id', update.id);
      }

      // Recharger les modules
      await fetchModules(contestId);
      return true;
    } catch (error) {
      console.error('Erreur lors de la réorganisation des modules:', error);
      return false;
    }
  };

  return {
    modules,
    loading,
    fetchModules,
    getModuleById,
    createModule,
    updateModule,
    deleteModule,
    reorderModules
  };
}