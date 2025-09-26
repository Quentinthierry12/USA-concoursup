import React, { useState } from 'react';
import { useAgencies } from '../../hooks/useAgencies';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Building, Plus, Edit, Trash2, Users } from 'lucide-react';
import { Agency } from '../../types';

export function AgencyManagement() {
  const { agencies, loading, createAgency, updateAgency, deleteAgency } = useAgencies();
  const [showModal, setShowModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    director_name: '',
    deputy_director_name: '',
    specialties: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const agencyData = {
      ...formData,
      specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean)
    };

    if (editingAgency) {
      const success = await updateAgency(editingAgency.id, agencyData);
      if (success) {
        handleCloseModal();
      }
    } else {
      const result = await createAgency(agencyData);
      if (result) {
        handleCloseModal();
      }
    }
  };

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setFormData({
      name: agency.name,
      description: agency.description || '',
      logo_url: agency.logo_url || '',
      director_name: agency.director_name || '',
      deputy_director_name: agency.deputy_director_name || '',
      specialties: agency.specialties.join(', ')
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette agence ?')) {
      await deleteAgency(id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAgency(null);
    setFormData({
      name: '',
      description: '',
      logo_url: '',
      director_name: '',
      deputy_director_name: '',
      specialties: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des Agences
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Gérez les agences gouvernementales
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Agence
        </Button>
      </div>

      {/* Agencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agencies.map((agency) => (
          <Card key={agency.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {agency.logo_url ? (
                    <img 
                      src={agency.logo_url} 
                      alt={agency.name}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {agency.name}
                  </h3>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(agency)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(agency.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {agency.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                  {agency.description}
                </p>
              )}
              
              <div className="space-y-2">
                {agency.director_name && (
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Directeur: {agency.director_name}
                    </span>
                  </div>
                )}
                
                {agency.deputy_director_name && (
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Directeur adjoint: {agency.deputy_director_name}
                    </span>
                  </div>
                )}
                
                {agency.specialties.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {agency.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {agencies.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune agence créée
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Commencez par créer votre première agence
            </p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer une agence
            </Button>
          </div>
        )}
      </div>

      {/* Agency Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingAgency ? 'Modifier l\'agence' : 'Créer une nouvelle agence'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom de l'agence"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ex: USSS - United States Secret Service"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Description de l'agence..."
            />
          </div>

          <Input
            label="URL du logo (optionnel)"
            name="logo_url"
            type="url"
            value={formData.logo_url}
            onChange={handleChange}
            placeholder="https://example.com/logo.png"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom du directeur"
              name="director_name"
              value={formData.director_name}
              onChange={handleChange}
              placeholder="John Smith"
            />
            <Input
              label="Nom du directeur adjoint"
              name="deputy_director_name"
              value={formData.deputy_director_name}
              onChange={handleChange}
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Spécialités (séparées par des virgules)
            </label>
            <textarea
              name="specialties"
              value={formData.specialties}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Sécurité nationale, Protection VIP, Enquêtes financières"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
            >
              Annuler
            </Button>
            <Button type="submit">
              {editingAgency ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}