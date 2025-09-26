import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Academy, AcademyClass, AcademyModule, AcademyModuleAssignment, User } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../contexts/AuthContext';
import { useContests } from '../../../hooks/useContests';
import { Plus, ArrowRight, Edit, Trash, FileText } from 'react-feather';
import { Calendar, CheckCircle, XCircle, X } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';

export function AcademyAdminModules() {
  const { user } = useAuth();
  const { createContest } = useContests();
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string | ''>('');
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [assignments, setAssignments] = useState<AcademyModuleAssignment[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [form, setForm] = useState<{ id?: string; academy_id?: string; title: string; module_type: 'qcm' | 'open_question' | 'rp_scenario' | 'image_analysis' | 'audio_video'; description?: string; max_score: number; is_required: boolean; order_position: number }>({ 
    title: '', 
    module_type: 'qcm', 
    max_score: 100, 
    is_required: true, 
    order_position: 0 
  });
  const [assignForm, setAssignForm] = useState<{ module_id?: string; class_id?: string; start_at?: string; end_at?: string; is_mandatory: boolean }>({ is_mandatory: true });
  const [showCreateContestModal, setShowCreateContestModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<{
    id?: string;
    content: string;
    question_type: 'qcm' | 'open_question' | 'rp_scenario' | 'image_analysis' | 'audio_video';
    points: number;
    order_index: number;
    media_url?: string;
    correct_answer?: string;
    explanation?: string;
    qcm_options?: {option_text: string; is_correct: boolean; option_order: number}[];
  }>({
    content: '',
    question_type: 'qcm',
    points: 10,
    order_index: 0,
    qcm_options: [
      {option_text: '', is_correct: false, option_order: 0},
      {option_text: '', is_correct: false, option_order: 1},
      {option_text: '', is_correct: false, option_order: 2},
      {option_text: '', is_correct: false, option_order: 3}
    ]
  });
  const [contestForm, setContestForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    type: 'private' as 'public' | 'private',
    is_recurring: false
  });

  const fetchAcademies = async () => { 
    const { data } = await supabase.from('academy_academies').select('*'); 
    setAcademies((data || []) as Academy[]); 
  };

  const fetchClasses = async () => {
    if (user?.academy_role === 'prof') {
      const { data: myClasses } = await supabase.from('academy_class_members').select('class_id').eq('user_id', user.id).eq('role_in_class', 'prof');
      const classIds = (myClasses || []).map((m: any) => m.class_id);
      if (!classIds.length) { setClasses([]); return; }
      const { data } = await supabase.from('academy_classes').select('*').in('id', classIds);
      setClasses((data || []) as AcademyClass[]);
      return;
    }
    if (!selectedAcademyId) { setClasses([]); return; }
    const { data } = await supabase.from('academy_classes').select('*').eq('academy_id', selectedAcademyId);
    setClasses((data || []) as AcademyClass[]);
  };

  const fetchModules = async () => {
    if (user?.academy_role === 'prof') {
      const { data: myClasses } = await supabase.from('academy_class_members').select('class_id').eq('user_id', user.id).eq('role_in_class', 'prof');
      const classIds = (myClasses || []).map((m: any) => m.class_id);
      if (!classIds.length) { setModules([]); return; }
      const { data: assigns } = await supabase.from('academy_module_assignments').select('module_id').in('class_id', classIds);
      const moduleIds = Array.from(new Set((assigns || []).map((a: any) => a.module_id)));
      if (!moduleIds.length) { setModules([]); return; }
      const { data } = await supabase.from('academy_modules').select('*').in('id', moduleIds);
      setModules((data || []) as AcademyModule[]);
      return;
    }
    if (!selectedAcademyId) { setModules([]); return; }
    const { data } = await supabase.from('academy_modules').select('*').eq('academy_id', selectedAcademyId).order('order_position', { ascending: true });
    setModules((data || []) as AcademyModule[]);
  };

  const fetchAssignments = async () => {
    if (!selectedAcademyId) { setAssignments([]); return; }
    const { data } = await supabase.from('academy_module_assignments').select('*');
    setAssignments((data || []) as AcademyModuleAssignment[]);
  };
  
  const fetchQuestions = async (moduleId: string) => {
    if (!moduleId) return;
    
    const { data } = await supabase
      .from('academy_questions')
      .select(`
        *,
        qcm_options:academy_qcm_options(*)
      `)
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });
      
    setQuestions(data || []);
    setSelectedModuleId(moduleId);
    setShowQuestionsModal(true);
  };
  
  const submitQuestion = async () => {
    if (!selectedModuleId || !questionForm.content.trim()) return;
    
    try {
      if (questionForm.id) {
        // Mise à jour d'une question existante
        await supabase
          .from('academy_questions')
          .update({
            content: questionForm.content,
            question_type: questionForm.question_type,
            points: questionForm.points,
            media_url: questionForm.media_url,
            correct_answer: questionForm.correct_answer,
            explanation: questionForm.explanation
          })
          .eq('id', questionForm.id);
          
        // Supprimer les anciennes options QCM
        if (questionForm.question_type === 'qcm') {
          await supabase
            .from('academy_qcm_options')
            .delete()
            .eq('question_id', questionForm.id);
            
          // Ajouter les nouvelles options QCM
          if (questionForm.qcm_options && questionForm.qcm_options.length > 0) {
            const optionsToInsert = questionForm.qcm_options
              .filter(opt => opt.option_text.trim() !== '')
              .map(option => ({
                question_id: questionForm.id,
                option_text: option.option_text,
                is_correct: option.is_correct,
                option_order: option.option_order
              }));
              
            if (optionsToInsert.length > 0) {
              await supabase
                .from('academy_qcm_options')
                .insert(optionsToInsert);
            }
          }
        }
      } else {
        // Création d'une nouvelle question
        const { data: newQuestion } = await supabase
          .from('academy_questions')
          .insert({
            module_id: selectedModuleId,
            content: questionForm.content,
            question_type: questionForm.question_type,
            points: questionForm.points,
            order_index: questionForm.order_index,
            media_url: questionForm.media_url,
            correct_answer: questionForm.correct_answer,
            explanation: questionForm.explanation
          })
          .select()
          .single();
          
        // Ajouter les options QCM si nécessaire
        if (questionForm.question_type === 'qcm' && newQuestion) {
          const optionsToInsert = questionForm.qcm_options
            ?.filter(opt => opt.option_text.trim() !== '')
            .map(option => ({
              question_id: newQuestion.id,
              option_text: option.option_text,
              is_correct: option.is_correct,
              option_order: option.option_order
            }));
            
          if (optionsToInsert && optionsToInsert.length > 0) {
            await supabase
              .from('academy_qcm_options')
              .insert(optionsToInsert);
          }
        }
      }
      
      // Réinitialiser le formulaire et rafraîchir les questions
      resetQuestionForm();
      await fetchQuestions(selectedModuleId);
    } catch (error) {
      console.error('Erreur lors de la soumission de la question:', error);
    }
  };
  
  const deleteQuestion = async (questionId: string) => {
    if (!questionId) return;
    
    try {
      await supabase
        .from('academy_questions')
        .delete()
        .eq('id', questionId);
        
      await fetchQuestions(selectedModuleId!);
    } catch (error) {
      console.error('Erreur lors de la suppression de la question:', error);
    }
  };
  
  const editQuestion = (question: any) => {
    setQuestionForm({
      id: question.id,
      content: question.content,
      question_type: question.question_type,
      points: question.points,
      order_index: question.order_index,
      media_url: question.media_url,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      qcm_options: question.qcm_options && question.qcm_options.length > 0 
        ? question.qcm_options.map((opt: any) => ({
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            option_order: opt.option_order
          }))
        : [
            {option_text: '', is_correct: false, option_order: 0},
            {option_text: '', is_correct: false, option_order: 1},
            {option_text: '', is_correct: false, option_order: 2},
            {option_text: '', is_correct: false, option_order: 3}
          ]
    });
  };
  
  const resetQuestionForm = () => {
    setQuestionForm({
      content: '',
      question_type: 'qcm',
      points: 10,
      order_index: questions.length,
      qcm_options: [
        {option_text: '', is_correct: false, option_order: 0},
        {option_text: '', is_correct: false, option_order: 1},
        {option_text: '', is_correct: false, option_order: 2},
        {option_text: '', is_correct: false, option_order: 3}
      ]
    });
  };
  
  const updateQcmOption = (index: number, field: 'option_text' | 'is_correct', value: string | boolean) => {
    if (!questionForm.qcm_options) return;
    
    const updatedOptions = [...questionForm.qcm_options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    
    setQuestionForm({
      ...questionForm,
      qcm_options: updatedOptions
    });
  };
  
  const addQcmOption = () => {
    if (!questionForm.qcm_options) return;
    
    setQuestionForm({
      ...questionForm,
      qcm_options: [
        ...questionForm.qcm_options,
        {
          option_text: '',
          is_correct: false,
          option_order: questionForm.qcm_options.length
        }
      ]
    });
  };
  
  const removeQcmOption = (index: number) => {
    if (!questionForm.qcm_options || questionForm.qcm_options.length <= 2) return;
    
    const updatedOptions = questionForm.qcm_options.filter((_, i) => i !== index);
    
    setQuestionForm({
      ...questionForm,
      qcm_options: updatedOptions.map((opt, i) => ({
        ...opt,
        option_order: i
      }))
    });
  };

  useEffect(() => { 
    fetchAcademies(); 
  }, []);
  
  useEffect(() => { 
    fetchClasses(); 
    fetchModules(); 
    fetchAssignments(); 
  }, [selectedAcademyId]);

  const submit = async () => {
    if (!form.title.trim() || !selectedAcademyId) return;
    
    if (form.id) {
      await supabase.from('academy_modules').update({ 
        title: form.title, 
        module_type: form.module_type, 
        description: form.description, 
        max_score: form.max_score, 
        is_required: form.is_required, 
        order_position: form.order_position 
      }).eq('id', form.id);
    } else {
      await supabase.from('academy_modules').insert({ 
        academy_id: selectedAcademyId, 
        title: form.title, 
        module_type: form.module_type, 
        description: form.description, 
        max_score: form.max_score, 
        is_required: form.is_required, 
        order_position: modules.length 
      });
    }
    
    setForm({ 
      title: '', 
      module_type: 'qcm', 
      max_score: 100, 
      is_required: true, 
      order_position: 0 
    });
    
    await fetchModules();
  };

  const deleteModule = async (id: string) => { 
    await supabase.from('academy_modules').delete().eq('id', id); 
    await fetchModules(); 
  };

  const assignModule = async () => {
    if (!assignForm.module_id || !assignForm.class_id) return;
    
    await supabase.from('academy_module_assignments').insert({ 
      module_id: assignForm.module_id, 
      class_id: assignForm.class_id, 
      start_at: assignForm.start_at, 
      end_at: assignForm.end_at, 
      is_mandatory: assignForm.is_mandatory 
    });
    
    setAssignForm({ is_mandatory: true });
    await fetchAssignments();
  };

  const openCreateContestModal = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      setSelectedModuleId(moduleId);
      setContestForm({
        name: `Concours - ${module.title}`,
        description: module.description || '',
        start_date: '',
        end_date: '',
        type: 'private',
        is_recurring: false
      });
      setShowCreateContestModal(true);
    }
  };

  const createContestFromModule = async () => {
    if (!selectedModuleId || !contestForm.name.trim()) return;
    
    const selectedModule = modules.find(m => m.id === selectedModuleId);
    if (!selectedModule) return;

    // Créer le concours
    const newContest = await createContest({
      name: contestForm.name,
      description: contestForm.description,
      start_date: contestForm.start_date || undefined,
      end_date: contestForm.end_date || undefined,
      type: contestForm.type,
      is_recurring: contestForm.is_recurring
    });

    if (newContest) {
      // Lier le concours au module académique pour lister dans "Mes Concours"
      try {
        await supabase
          .from('concour_contests')
          .update({ academy_module_id: selectedModuleId })
          .eq('id', newContest.id);
      } catch (e) {
        console.error('Impossible de lier academy_module_id au concours', e);
      }

      // Créer un module de concours basé sur le module académique
      const { data: newModule } = await supabase
        .from('concour_modules')
        .insert({
          contest_id: newContest.id,
          title: selectedModule.title,
          module_type: selectedModule.module_type,
          description: selectedModule.description,
          max_score: selectedModule.max_score,
          is_required: selectedModule.is_required,
          order_position: 0
        })
        .select()
        .single();

      // Récupérer les questions du module académique
      const { data: academyQuestions } = await supabase
        .from('academy_questions')
        .select('*')
        .eq('module_id', selectedModuleId);

      // Copier les questions vers le module de concours
      if (academyQuestions && academyQuestions.length > 0) {
        for (const question of academyQuestions) {
          const { data: newQuestion } = await supabase
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

          // Copier les options QCM si elles existent
          if (question.qcm_options && question.qcm_options.length > 0) {
            const optionsToInsert = question.qcm_options.map((option: any) => ({
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

      // Récupérer les membres des classes assignées à ce module
      const { data: moduleAssignments } = await supabase
        .from('academy_module_assignments')
        .select('class_id')
        .eq('module_id', selectedModuleId);

      if (moduleAssignments && moduleAssignments.length > 0) {
        const classIds = moduleAssignments.map(a => a.class_id);
        
        // Récupérer les étudiants de ces classes
        const { data: classMembers } = await supabase
          .from('academy_class_members')
          .select('user_id')
          .in('class_id', classIds)
          .eq('role_in_class', 'etudiant');

        if (classMembers && classMembers.length > 0) {
          const studentIds = classMembers.map(m => m.user_id);
          
          // Récupérer les informations des étudiants
          const { data: students } = await supabase
            .from('concour_users')
            .select('*')
            .in('id', studentIds);

          // Créer des candidats pour le concours
          if (students && students.length > 0) {
            for (const student of students) {
              await supabase
                .from('concour_candidates')
                .insert({
                  contest_id: newContest.id,
                  user_id: student.id,
                  name: student.full_name || student.username,
                  email: student.email,
                  identifier: student.username,
                  password: student.username, // Utiliser le nom d'utilisateur comme mot de passe par défaut
                  status: 'invited',
                  total_score: 0
                });
            }
          }
        }
      }

      setShowCreateContestModal(false);
      setSelectedModuleId(null);
      setContestForm({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        type: 'private',
        is_recurring: false
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modules Académiques</h1>

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              className="border rounded px-3 py-2 bg-white dark:bg-gray-800" 
              value={selectedAcademyId} 
              onChange={e => setSelectedAcademyId(e.target.value)}
            >
              <option value="">Sélectionner une académie</option>
              {academies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {selectedAcademyId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                placeholder="Titre du module" 
                value={form.title} 
                onChange={e => setForm({ ...form, title: e.target.value })} 
              />
              <select 
                className="border rounded px-3 py-2 bg-white dark:bg-gray-800" 
                value={form.module_type} 
                onChange={e => setForm({ ...form, module_type: e.target.value as any })}
              >
                <option value="qcm">QCM</option>
                <option value="open_question">Question ouverte</option>
                <option value="rp_scenario">Scénario RP</option>
                <option value="image_analysis">Analyse d'image</option>
                <option value="audio_video">Audio/Vidéo</option>
              </select>
              <Input 
                placeholder="Score maximum" 
                type="number" 
                value={form.max_score} 
                onChange={e => setForm({ ...form, max_score: parseInt(e.target.value) })} 
              />
              <Input 
                placeholder="Description" 
                value={form.description || ''} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
              />
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="is_required" 
                  checked={form.is_required} 
                  onChange={e => setForm({ ...form, is_required: e.target.checked })} 
                />
                <label htmlFor="is_required">Obligatoire</label>
              </div>
              <Button onClick={submit}>
                {form.id ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {modules.map(module => (
          <Card key={module.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{module.title}</h3>
                  <p className="text-sm text-gray-500">{module.description}</p>
                  <div className="flex space-x-4 mt-2">
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {module.module_type}
                    </span>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      {module.max_score} points
                    </span>
                    {module.is_required && (
                      <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                        Obligatoire
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => openCreateContestModal(module.id)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un concours
                  </Button>
                  <Button 
                    onClick={() => fetchQuestions(module.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Questions
                  </Button>
                  <Button 
                    onClick={() => setForm({ 
                      id: module.id, 
                      title: module.title, 
                      module_type: module.module_type, 
                      description: module.description, 
                      max_score: module.max_score, 
                      is_required: module.is_required, 
                      order_position: module.order_position 
                    })}
                    variant="outline"
                  >
                    Modifier
                  </Button>
                  <Button 
                    onClick={() => deleteModule(module.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Assigner à une classe</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <select 
                    className="border rounded px-3 py-2 bg-white dark:bg-gray-800" 
                    value={assignForm.class_id || ''} 
                    onChange={e => setAssignForm({ ...assignForm, module_id: module.id, class_id: e.target.value })}
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <Input 
                    type="datetime-local" 
                    placeholder="Date de début" 
                    value={assignForm.start_at || ''} 
                    onChange={e => setAssignForm({ ...assignForm, start_at: e.target.value })} 
                  />
                  <Input 
                    type="datetime-local" 
                    placeholder="Date de fin" 
                    value={assignForm.end_at || ''} 
                    onChange={e => setAssignForm({ ...assignForm, end_at: e.target.value })} 
                  />
                  <Button onClick={assignModule}>Assigner</Button>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Classes assignées</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {assignments
                    .filter(a => a.module_id === module.id)
                    .map(assignment => {
                      const assignedClass = classes.find(c => c.id === assignment.class_id);
                      return (
                        <div key={assignment.id} className="border p-2 rounded">
                          <p className="font-medium">{assignedClass?.name || 'Classe inconnue'}</p>
                          {assignment.start_at && (
                            <p className="text-sm">Début: {new Date(assignment.start_at).toLocaleString()}</p>
                          )}
                          {assignment.end_at && (
                            <p className="text-sm">Fin: {new Date(assignment.end_at).toLocaleString()}</p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de création de concours */}
      {showCreateContestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Créer un concours à partir du module</h2>
            
            <div className="space-y-4">
              <Input 
                label="Nom du concours"
                placeholder="Nom du concours" 
                value={contestForm.name} 
                onChange={e => setContestForm({ ...contestForm, name: e.target.value })} 
              />
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800" 
                  rows={3}
                  value={contestForm.description} 
                  onChange={e => setContestForm({ ...contestForm, description: e.target.value })}
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date de début</label>
                  <Input 
                    type="datetime-local" 
                    value={contestForm.start_date} 
                    onChange={e => setContestForm({ ...contestForm, start_date: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date de fin</label>
                  <Input 
                    type="datetime-local" 
                    value={contestForm.end_date} 
                    onChange={e => setContestForm({ ...contestForm, end_date: e.target.value })} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Type de concours</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-3 border rounded cursor-pointer">
                    <input 
                      type="radio" 
                      name="contest_type" 
                      value="public" 
                      checked={contestForm.type === 'public'} 
                      onChange={() => setContestForm({ ...contestForm, type: 'public' })} 
                      className="mr-2"
                    />
                    Public (visible sur la page d'accueil)
                  </label>
                  
                  <label className="flex items-center p-3 border rounded cursor-pointer">
                    <input 
                      type="radio" 
                      name="contest_type" 
                      value="private" 
                      checked={contestForm.type === 'private'} 
                      onChange={() => setContestForm({ ...contestForm, type: 'private' })} 
                      className="mr-2"
                    />
                    Privé (accessible par lien unique)
                  </label>
                </div>
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="is_recurring" 
                  checked={contestForm.is_recurring} 
                  onChange={e => setContestForm({ ...contestForm, is_recurring: e.target.checked })} 
                  className="mr-2"
                />
                <label htmlFor="is_recurring">Concours récurrent</label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateContestModal(false)}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={createContestFromModule}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Créer le concours
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des questions */}
      {showQuestionsModal && (
        <Modal
          isOpen={showQuestionsModal}
          onClose={() => setShowQuestionsModal(false)}
          title={`Questions du module ${modules.find(m => m.id === selectedModuleId)?.title || ''}`}
          size="xl"
        >
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Ajouter/Modifier une question</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contenu de la question</label>
                  <Input
                    value={questionForm.content}
                    onChange={(e) => setQuestionForm({...questionForm, content: e.target.value})}
                    placeholder="Saisissez votre question ici"
                    className="w-full"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type de question</label>
                    <select
                      value={questionForm.question_type}
                      onChange={(e) => setQuestionForm({...questionForm, question_type: e.target.value as any})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="qcm">QCM</option>
                      <option value="open_question">Question ouverte</option>
                      <option value="rp_scenario">Scénario RP</option>
                      <option value="image_analysis">Analyse d'image</option>
                      <option value="audio_video">Audio/Vidéo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Points</label>
                    <Input
                      type="number"
                      value={questionForm.points}
                      onChange={(e) => setQuestionForm({...questionForm, points: parseInt(e.target.value) || 0})}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">URL du média (optionnel)</label>
                  <Input
                    value={questionForm.media_url || ''}
                    onChange={(e) => setQuestionForm({...questionForm, media_url: e.target.value})}
                    placeholder="https://..."
                    className="w-full"
                  />
                </div>
                
                {questionForm.question_type === 'qcm' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">Options QCM</label>
                      <Button 
                        size="sm" 
                        onClick={addQcmOption}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Ajouter une option
                      </Button>
                    </div>
                    
                    {questionForm.qcm_options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={option.is_correct}
                          onChange={(e) => updateQcmOption(index, 'is_correct', e.target.checked)}
                          className="mr-2"
                        />
                        <Input
                          value={option.option_text}
                          onChange={(e) => updateQcmOption(index, 'option_text', e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-grow"
                        />
                        {questionForm.qcm_options!.length > 2 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => removeQcmOption(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {questionForm.question_type !== 'qcm' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Réponse correcte (pour correction automatique)</label>
                    <Input
                      value={questionForm.correct_answer || ''}
                      onChange={(e) => setQuestionForm({...questionForm, correct_answer: e.target.value})}
                      placeholder="Réponse attendue"
                      className="w-full"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Explication (visible après réponse)</label>
                  <textarea
                    value={questionForm.explanation || ''}
                    onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                    placeholder="Explication de la réponse correcte"
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={resetQuestionForm}
                  >
                    Réinitialiser
                  </Button>
                  <Button 
                    onClick={submitQuestion}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {questionForm.id ? 'Mettre à jour' : 'Ajouter'} la question
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Liste des questions</h3>
              {questions.length === 0 ? (
                <p className="text-gray-500 italic">Aucune question pour ce module. Ajoutez-en une ci-dessus.</p>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <Card key={question.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="font-medium mr-2">Question {index + 1}</span>
                              <span className="text-sm bg-gray-100 px-2 py-1 rounded">{question.points} pts</span>
                              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                                {question.question_type === 'qcm' ? 'QCM' : 
                                 question.question_type === 'open_question' ? 'Question ouverte' :
                                 question.question_type === 'rp_scenario' ? 'Scénario RP' :
                                 question.question_type === 'image_analysis' ? 'Analyse d\'image' : 'Audio/Vidéo'}
                              </span>
                            </div>
                            <p className="mb-2">{question.content}</p>
                            
                            {question.question_type === 'qcm' && question.qcm_options && (
                              <div className="ml-4 mt-2">
                                {question.qcm_options.map((option: any) => (
                                  <div key={option.id} className="flex items-center mb-1">
                                    {option.is_correct ? (
                                      <CheckCircle size={16} className="text-green-500 mr-2" />
                                    ) : (
                                      <XCircle size={16} className="text-red-500 mr-2" />
                                    )}
                                    <span>{option.option_text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.media_url && (
                              <div className="mt-2">
                                <span className="text-sm text-blue-600">Média: {question.media_url}</span>
                              </div>
                            )}
                            
                            {question.explanation && (
                              <div className="mt-2 text-sm text-gray-600">
                                <strong>Explication:</strong> {question.explanation}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => editQuestion(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => deleteQuestion(question.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


