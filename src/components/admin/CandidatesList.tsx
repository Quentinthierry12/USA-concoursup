import React, { useState, useEffect } from 'react';
import { useCandidates } from '../../hooks/useCandidates';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { 
  Plus, 
  Users, 
  Mail, 
  Key, 
  Download, 
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  FileText,
  FileDown
} from 'lucide-react';
import { Candidate, CreateCandidateData } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';

interface CandidatesListProps {
  contestId: string;
}

export function CandidatesList({ contestId }: CandidatesListProps) {
  const { 
    candidates, 
    loading, 
    fetchCandidates, 
    createCandidate, 
    createMultipleCandidates,
    deleteCandidate,
    regenerateCredentials
  } = useCandidates();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [singleCandidate, setSingleCandidate] = useState<CreateCandidateData>({
    name: '',
    discord_username: '',
    email: ''
  });
  const [bulkCandidates, setBulkCandidates] = useState('');

  useEffect(() => {
    fetchCandidates(contestId);
  }, [contestId]);

  const handleAddSingleCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createCandidate(contestId, singleCandidate);
    if (result) {
      setShowAddModal(false);
      setSingleCandidate({ name: '', discord_username: '', email: '' });
    }
  };

  const handleAddBulkCandidates = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkCandidates.trim().split('\n');
    const candidatesData: CreateCandidateData[] = [];

    for (const line of lines) {
      const parts = line.split(',').map(part => part.trim());
      if (parts.length >= 1 && parts[0]) {
        candidatesData.push({
          name: parts[0],
          discord_username: parts[1] || '',
          email: parts[2] || ''
        });
      }
    }

    if (candidatesData.length > 0) {
      const results = await createMultipleCandidates(contestId, candidatesData);
      if (results.length > 0) {
        setShowBulkModal(false);
        setBulkCandidates('');
      }
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce candidat ?')) {
      await deleteCandidate(candidateId);
    }
  };

  const handleRegenerateCredentials = async (candidateId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir régénérer les identifiants de ce candidat ?')) {
      await regenerateCredentials(candidateId);
    }
  };

  const generatePDF = (candidate: Candidate) => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.text('Identifiants de Concours', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Candidat: ${candidate.name}`, 20, 50);
    doc.text(`Concours: ${contestId}`, 20, 60);
    
    // Identifiants
    doc.setFontSize(14);
    doc.text('Vos identifiants:', 20, 80);
    doc.setFontSize(12);
    doc.text(`Identifiant: ${candidate.identifier}`, 20, 95);
    doc.text(`Mot de passe: ${candidate.password}`, 20, 105);
    
    // Lien
    doc.text('Lien du concours:', 20, 125);
    doc.text(`${window.location.origin}/contest/${contestId}`, 20, 135);
    
    // Instructions
    doc.text('Instructions:', 20, 155);
    doc.text('1. Rendez-vous sur le lien ci-dessus', 20, 165);
    doc.text('2. Saisissez vos identifiants', 20, 175);
    doc.text('3. Suivez les instructions du concours', 20, 185);
    
    doc.save(`identifiants-${candidate.name.replace(/\s+/g, '-')}.pdf`);
  };
  const getStatusColor = (status: Candidate['status']) => {
    switch (status) {
      case 'invited': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'started': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'evaluated': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: Candidate['status']) => {
    switch (status) {
      case 'invited': return 'Invité';
      case 'started': return 'En cours';
      case 'completed': return 'Terminé';
      case 'evaluated': return 'Évalué';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Candidats ({candidates.length})
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Import en lot
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un candidat
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Invités', count: candidates.filter(c => c.status === 'invited').length, color: 'blue' },
          { label: 'En cours', count: candidates.filter(c => c.status === 'started').length, color: 'yellow' },
          { label: 'Terminés', count: candidates.filter(c => c.status === 'completed').length, color: 'green' },
          { label: 'Évalués', count: candidates.filter(c => c.status === 'evaluated').length, color: 'purple' }
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className={`text-2xl font-bold text-${stat.color}-600`}>
                  {stat.count}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Candidates List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Candidat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Identifiants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {candidate.name}
                        </div>
                        {candidate.discord_username && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Discord: {candidate.discord_username}
                          </div>
                        )}
                        {candidate.email && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {candidate.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 dark:text-white">
                        ID: {candidate.identifier}
                      </div>
                      <div className="text-sm font-mono text-gray-500 dark:text-gray-400">
                        MDP: {candidate.password}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(candidate.status)}`}>
                        {getStatusLabel(candidate.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {candidate.total_score > 0 ? `${candidate.total_score} pts` : '-'}
                      </div>
                      {candidate.final_grade && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Note: {candidate.final_grade}/20
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRegenerateCredentials(candidate.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => generatePDF(candidate)}
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCandidate(candidate.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {candidates.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun candidat inscrit
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Commencez par ajouter des candidats à ce concours
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un candidat
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Single Candidate Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un candidat"
      >
        <form onSubmit={handleAddSingleCandidate} className="space-y-4">
          <Input
            label="Nom complet"
            value={singleCandidate.name}
            onChange={(e) => setSingleCandidate(prev => ({ ...prev, name: e.target.value }))}
            required
            placeholder="John Doe"
          />
          <Input
            label="Pseudo Discord (optionnel)"
            value={singleCandidate.discord_username}
            onChange={(e) => setSingleCandidate(prev => ({ ...prev, discord_username: e.target.value }))}
            placeholder="johndoe#1234"
          />
          <Input
            label="Email (optionnel)"
            type="email"
            value={singleCandidate.email}
            onChange={(e) => setSingleCandidate(prev => ({ ...prev, email: e.target.value }))}
            placeholder="john@example.com"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Add Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Import en lot"
        size="lg"
      >
        <form onSubmit={handleAddBulkCandidates} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Liste des candidats
            </label>
            <textarea
              value={bulkCandidates}
              onChange={(e) => setBulkCandidates(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
              placeholder="John Doe, johndoe#1234, john@example.com&#10;Jane Smith, janesmith#5678, jane@example.com&#10;Bob Wilson, bobwilson#9012"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Format: Nom complet, Discord (optionnel), Email (optionnel) - Un candidat par ligne
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              Importer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}