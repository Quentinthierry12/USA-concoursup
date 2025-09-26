// Types pour l'application de concours RP
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'responsable' | 'candidat';
  full_name?: string;
  discord_username?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Académie
  academy_role?: 'prof' | 'etudiant' | 'staff' | null;
  academy_id?: string | null;
}

export interface Agency {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  director_name?: string;
  deputy_director_name?: string;
  specialties: string[];
  created_at: string;
  updated_at: string;
}

export interface Contest {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  type: 'public' | 'private';
  status: 'draft' | 'active' | 'closed' | 'archived';
  logo_url?: string;
  access_link?: string;
  max_participants?: number;
  is_recurring: boolean;
  recurring_interval?: string;
  agency_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  agency?: Agency;
  creator?: User;
  modules?: Module[];
  candidates?: Candidate[];
  statistics?: ContestStatistics;
}

export interface Module {
  id: string;
  contest_id: string;
  title: string;
  module_type: 'qcm' | 'open_question' | 'rp_scenario' | 'image_analysis' | 'audio_video';
  description?: string;
  max_score: number;
  time_limit_minutes?: number;
  order_position: number;
  is_required: boolean;
  created_at: string;
  // Relations
  contest?: Contest;
  questions?: Question[];
}

export interface Question {
  id: string;
  module_id: string;
  content: string;
  question_type: string;
  points: number;
  order_index: number;
  media_url?: string;
  correct_answer?: string;
  explanation?: string;
  created_at: string;
  // Relations
  module?: Module;
  qcm_options?: QCMOption[];
  responses?: Response[];
}

export interface QCMOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  option_order: number;
  // Relations
  question?: Question;
}

export interface Candidate {
  id: string;
  contest_id: string;
  user_id?: string;
  name: string;
  discord_username?: string;
  email?: string;
  identifier: string;
  password: string;
  status: 'invited' | 'started' | 'completed' | 'evaluated';
  invitation_sent_at?: string;
  started_at?: string;
  completed_at?: string;
  total_score: number;
  final_grade?: number;
  created_at: string;
  // Relations
  contest?: Contest;
  user?: User;
  responses?: Response[];
  evaluations?: Evaluation[];
}

export interface Response {
  id: string;
  candidate_id: string;
  question_id: string;
  response_text?: string;
  selected_option_id?: string;
  file_attachments: FileAttachment[];
  score: number;
  is_correct?: boolean;
  submitted_at: string;
  // Relations
  candidate?: Candidate;
  question?: Question;
  selected_option?: QCMOption;
  evaluations?: Evaluation[];
}

export interface FileAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
}

export interface Evaluation {
  id: string;
  response_id: string;
  evaluator_id: string;
  score: number;
  feedback?: string;
  is_final: boolean;
  evaluated_at: string;
  // Relations
  response?: Response;
  evaluator?: User;
}

export interface Invitation {
  id: string;
  contest_id: string;
  candidate_name: string;
  candidate_email?: string;
  discord_username?: string;
  identifier: string;
  password: string;
  invitation_link?: string;
  expires_at?: string;
  used_at?: string;
  created_at: string;
  // Relations
  contest?: Contest;
}

export interface ContestStatistics {
  id: string;
  contest_id: string;
  total_candidates: number;
  completed_candidates: number;
  average_score: number;
  pass_rate: number;
  calculated_at: string;
  // Relations
  contest?: Contest;
}

// Types pour les formulaires
export interface CreateContestData {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  type: 'public' | 'private';
  logo_url?: string;
  max_participants?: number;
  is_recurring?: boolean;
  recurring_interval?: string;
  agency_id?: string;
}

export interface CreateModuleData {
  title: string;
  module_type: 'qcm' | 'open_question' | 'rp_scenario' | 'image_analysis' | 'audio_video';
  description?: string;
  max_score: number;
  time_limit_minutes?: number;
  is_required?: boolean;
}

export interface CreateQuestionData {
  content: string;
  question_type: string;
  points: number;
  media_url?: string;
  correct_answer?: string;
  explanation?: string;
  qcm_options?: Omit<QCMOption, 'id' | 'question_id'>[];
}

export interface CreateCandidateData {
  name: string;
  discord_username?: string;
  email?: string;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Types pour les filtres et recherche
export interface ContestFilters {
  type?: 'public' | 'private';
  status?: 'draft' | 'active' | 'closed' | 'archived';
  agency_id?: string;
  created_by?: string;
  search?: string;
}

export interface CandidateFilters {
  status?: 'invited' | 'started' | 'completed' | 'evaluated';
  contest_id?: string;
  search?: string;
}

// Types pour les statistiques
export interface DashboardStats {
  total_contests: number;
  active_contests: number;
  total_candidates: number;
  completed_evaluations: number;
  recent_contests: Contest[];
  recent_candidates: Candidate[];
}

export interface ContestDetailStats {
  total_candidates: number;
  completed_candidates: number;
  in_progress_candidates: number;
  average_score: number;
  pass_rate: number;
  completion_rate: number;
  score_distribution: { range: string; count: number }[];
  module_performance: { module_title: string; average_score: number }[];
}

// ========= Types Académie =========
export type AcademyRole = 'prof' | 'etudiant' | 'staff';

export interface Academy {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AcademyClass {
  id: string;
  academy_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AcademyClassMember {
  id: string;
  class_id: string;
  user_id: string;
  role_in_class: 'prof' | 'etudiant';
  created_at: string;
}

export interface AcademyModule {
  id: string;
  academy_id: string;
  title: string;
  module_type: 'qcm' | 'open_question' | 'rp_scenario' | 'image_analysis' | 'audio_video';
  description?: string;
  max_score: number;
  is_required: boolean;
  order_position: number;
  created_at: string;
}

export interface AcademySubmodule {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  max_score: number;
  order_position: number;
}

export interface AcademyModuleAssignment {
  id: string;
  module_id: string;
  class_id: string;
  start_at?: string;
  end_at?: string;
  is_mandatory: boolean;
}

export interface AcademyResource {
  id: string;
  academy_id: string;
  class_id?: string;
  module_id?: string;
  title: string;
  url: string;
  type: 'link' | 'file';
  visibility: 'class' | 'module' | 'academy';
  created_by: string;
  created_at: string;
}

export interface AcademyEvaluation {
  id: string;
  module_id: string;
  class_id: string;
  title: string;
  description?: string;
  total_points: number;
  evaluator_id: string;
  due_at?: string;
  created_at: string;
}

export interface AcademyGrade {
  id: string;
  evaluation_id: string;
  student_id: string;
  score: number;
  feedback?: string;
  graded_at: string;
  grader_id?: string;
}

export interface AcademyLevel {
  id: string;
  academy_id: string;
  name: string;
  min_points: number;
  order_index: number;
}

export interface AcademyStudentLevel {
  id: string;
  student_id: string;
  current_level_id: string;
  current_points: number;
  updated_at: string;
}