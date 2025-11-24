import React, { useState, useEffect } from 'react';
import { hostelAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import InventoryTemplateForm from '../../components/caretaker/InventoryTemplateForm';

interface InventoryTemplate {
  id: string;
  hostel_id: string;
  name: string;
  categories: Array<{
    name: string;
    items: Array<{
      name: string;
      quantity: number;
      condition: 'good' | 'fair' | 'poor';
    }>;
  }>;
  created_at: string;
  updated_at: string;
}

interface Hostel {
  id: string;
  name: string;
  location: string;
}

interface TemplateFormData {
  name: string;
  categories: Array<{
    name: string;
    items: Array<{
      name: string;
      quantity: number;
      condition: 'good' | 'fair' | 'poor';
    }>;
  }>;
}

const InventoryManagement: React.FC = () => {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<string>('');
  const [templates, setTemplates] = useState<InventoryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InventoryTemplate | null>(null);

  useEffect(() => {
    fetchHostels();
  }, []);

  useEffect(() => {
    if (selectedHostel) {
      fetchTemplates(selectedHostel);
    }
  }, [selectedHostel]);

  const fetchHostels = async () => {
    try {
      // Mock data for assigned hostels - in real implementation, this would come from a caretaker-specific API
      const mockHostels: Hostel[] = [
        {
          id: '1',
          name: 'Sunset Hostel',
          location: 'Westlands, Nairobi',
        },
        {
          id: '2',
          name: 'Green Valley Hostel',
          location: 'Karen, Nairobi',
        },
      ];
      setHostels(mockHostels);
    } catch (error) {
      console.error('Failed to fetch hostels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async (hostelId: string) => {
    try {
      setLoading(true);
      // In real implementation, fetch templates for the selected hostel
      // const response = await hostelAPI.getInventoryTemplate(hostelId);
      // setTemplates([response.data]);

      // Mock data for now
      const mockTemplates: InventoryTemplate[] = [
        {
          id: '1',
          hostel_id: hostelId,
          name: 'Standard Room Inventory',
          categories: [
            {
              name: 'Furniture',
              items: [
                { name: 'Bed', quantity: 1, condition: 'good' },
                { name: 'Chair', quantity: 1, condition: 'good' },
                { name: 'Desk', quantity: 1, condition: 'fair' },
              ],
            },
            {
              name: 'Electronics',
              items: [
                { name: 'Lamp', quantity: 1, condition: 'good' },
                { name: 'Fan', quantity: 1, condition: 'good' },
              ],
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: TemplateFormData) => {
    try {
      await hostelAPI.createInventoryTemplate(selectedHostel, templateData);
      setShowForm(false);
      fetchTemplates(selectedHostel);
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  };

  const handleEditTemplate = (template: InventoryTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleUpdateTemplate = async (_templateData: TemplateFormData) => {
    try {
      // In real implementation, there would be an update API
      // await hostelAPI.updateInventoryTemplate(selectedHostel, editingTemplate!.id, _templateData);
      setShowForm(false);
      setEditingTemplate(null);
      fetchTemplates(selectedHostel);
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  };

  const handleDeleteTemplate = async (_templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      // In real implementation, there would be a delete API
      // await hostelAPI.deleteInventoryTemplate(selectedHostel, _templateId);
      fetchTemplates(selectedHostel);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  if (loading && !selectedHostel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Create and manage inventory templates for hostels</p>
        </div>
        {selectedHostel && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Template
          </button>
        )}
      </div>

      {/* Hostel Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Hostel</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hostels.map((hostel) => (
            <div
              key={hostel.id}
              onClick={() => setSelectedHostel(hostel.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedHostel === hostel.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-medium text-gray-900">{hostel.name}</h3>
              <p className="text-sm text-gray-600">{hostel.location}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Templates List */}
      {selectedHostel && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory Templates for {hostels.find(h => h.id === selectedHostel)?.name}
          </h2>

          {loading ? (
            <LoadingSpinner size="md" />
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No inventory templates found for this hostel.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Template
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {template.categories.map((category, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2">{category.name}</h4>
                        <ul className="space-y-1">
                          {category.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-sm text-gray-600 flex justify-between">
                              <span>{item.name} (x{item.quantity})</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.condition === 'good' ? 'bg-green-100 text-green-800' :
                                item.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.condition}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Last updated: {new Date(template.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create Inventory Template'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTemplate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <InventoryTemplateForm
              initialData={editingTemplate}
              onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
              onCancel={() => {
                setShowForm(false);
                setEditingTemplate(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;