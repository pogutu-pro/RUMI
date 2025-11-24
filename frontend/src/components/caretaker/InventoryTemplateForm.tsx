import React, { useState } from 'react';

interface InventoryItem {
  name: string;
  quantity: number;
  condition: 'good' | 'fair' | 'poor';
}

interface InventoryCategory {
  name: string;
  items: InventoryItem[];
}

interface InventoryTemplate {
  id?: string;
  name: string;
  categories: InventoryCategory[];
}

interface InventoryTemplateFormProps {
  initialData?: InventoryTemplate | null;
  onSubmit: (data: InventoryTemplate) => Promise<void>;
  onCancel: () => void;
}

const InventoryTemplateForm: React.FC<InventoryTemplateFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [templateName, setTemplateName] = useState(initialData?.name || '');
  const [categories, setCategories] = useState<InventoryCategory[]>(
    initialData?.categories || []
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addCategory = () => {
    setCategories([...categories, { name: '', items: [] }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategoryName = (index: number, name: string) => {
    const updatedCategories = [...categories];
    updatedCategories[index].name = name;
    setCategories(updatedCategories);
  };

  const addItemToCategory = (categoryIndex: number) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].items.push({
      name: '',
      quantity: 1,
      condition: 'good',
    });
    setCategories(updatedCategories);
  };

  const removeItemFromCategory = (categoryIndex: number, itemIndex: number) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].items = updatedCategories[categoryIndex].items.filter(
      (_, i) => i !== itemIndex
    );
    setCategories(updatedCategories);
  };

  const updateItem = (
    categoryIndex: number,
    itemIndex: number,
    field: keyof InventoryItem,
    value: string | number
  ) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].items[itemIndex] = {
      ...updatedCategories[categoryIndex].items[itemIndex],
      [field]: value,
    };
    setCategories(updatedCategories);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!templateName.trim()) {
      newErrors.templateName = 'Template name is required';
    }

    if (categories.length === 0) {
      newErrors.categories = 'At least one category is required';
    }

    categories.forEach((category, categoryIndex) => {
      if (!category.name.trim()) {
        newErrors[`category_${categoryIndex}`] = 'Category name is required';
      }

      if (category.items.length === 0) {
        newErrors[`category_${categoryIndex}_items`] = 'At least one item is required in this category';
      }

      category.items.forEach((item, itemIndex) => {
        if (!item.name.trim()) {
          newErrors[`item_${categoryIndex}_${itemIndex}`] = 'Item name is required';
        }
        if (item.quantity < 1) {
          newErrors[`quantity_${categoryIndex}_${itemIndex}`] = 'Quantity must be at least 1';
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const templateData: InventoryTemplate = {
        id: initialData?.id,
        name: templateName,
        categories: categories.filter(cat => cat.name.trim() && cat.items.length > 0),
      };

      await onSubmit(templateData);
    } catch (error) {
      console.error('Failed to submit template:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Name */}
      <div>
        <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-1">
          Template Name *
        </label>
        <input
          type="text"
          id="templateName"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.templateName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Standard Room Inventory"
        />
        {errors.templateName && (
          <p className="mt-1 text-sm text-red-600">{errors.templateName}</p>
        )}
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Categories</h3>
          <button
            type="button"
            onClick={addCategory}
            className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm"
          >
            Add Category
          </button>
        </div>

        {errors.categories && (
          <p className="mb-4 text-sm text-red-600">{errors.categories}</p>
        )}

        <div className="space-y-4">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => updateCategoryName(categoryIndex, e.target.value)}
                  placeholder="Category name (e.g., Furniture)"
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors[`category_${categoryIndex}`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    type="button"
                    onClick={() => addItemToCategory(categoryIndex)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add Item
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCategory(categoryIndex)}
                    className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {errors[`category_${categoryIndex}`] && (
                <p className="mb-2 text-sm text-red-600">{errors[`category_${categoryIndex}`]}</p>
              )}

              {errors[`category_${categoryIndex}_items`] && (
                <p className="mb-2 text-sm text-red-600">{errors[`category_${categoryIndex}_items`]}</p>
              )}

              {/* Items in Category */}
              <div className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(categoryIndex, itemIndex, 'name', e.target.value)}
                      placeholder="Item name"
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors[`item_${categoryIndex}_${itemIndex}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />

                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(categoryIndex, itemIndex, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      className={`w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors[`quantity_${categoryIndex}_${itemIndex}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />

                    <select
                      value={item.condition}
                      onChange={(e) => updateItem(categoryIndex, itemIndex, 'condition', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => removeItemFromCategory(categoryIndex, itemIndex)}
                      className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No categories added yet. Click "Add Category" to get started.
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : (initialData ? 'Update Template' : 'Create Template')}
        </button>
      </div>
    </form>
  );
};

export default InventoryTemplateForm;