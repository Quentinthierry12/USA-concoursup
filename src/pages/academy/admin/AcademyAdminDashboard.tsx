import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Link } from 'react-router-dom';

export function AcademyAdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Académie</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Académies</h2>
            <p className="text-sm text-gray-500 mb-4">Gérez les académies.</p>
            <Link to="/academy/admin/academies" className="text-blue-600 hover:underline">Ouvrir</Link>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Classes</h2>
            <p className="text-sm text-gray-500 mb-4">Gérez les classes et leurs membres.</p>
            <Link to="/academy/admin/classes" className="text-blue-600 hover:underline">Ouvrir</Link>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Élèves</h2>
            <p className="text-sm text-gray-500 mb-4">Créer des comptes et assigner aux classes.</p>
            <Link to="/academy/admin/students" className="text-blue-600 hover:underline">Ouvrir</Link>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Modules</h2>
            <p className="text-sm text-gray-500 mb-4">Gérez les modules et assignations.</p>
            <Link to="/academy/admin/modules" className="text-blue-600 hover:underline">Ouvrir</Link>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Ressources</h2>
            <p className="text-sm text-gray-500 mb-4">Ajoutez des ressources pour classes ou modules.</p>
            <Link to="/academy/admin/resources" className="text-blue-600 hover:underline">Ouvrir</Link>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Évaluations</h2>
            <p className="text-sm text-gray-500 mb-4">Créez des évaluations et saisissez des notes.</p>
            <Link to="/academy/admin/evaluations" className="text-blue-600 hover:underline">Ouvrir</Link>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Professeurs</h2>
            <p className="text-sm text-gray-500 mb-4">Créer des comptes professeurs.</p>
            <Link to="/academy/admin/teachers" className="text-blue-600 hover:underline">Ouvrir</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}


