import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User, RouteSheet } from '../types';

// Utility function to sanitize strings for Supabase Storage keys
const sanitizeForStorage = (str: string): string => {
  return str
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-') // Replace invalid characters with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

// Utility function to get display name from sanitized name
const getDisplayName = (sanitized: string): string => {
  const mapping: { [key: string]: string } = {
    'ete': 'Été',
    'semaine': 'Semaine',
    'vendredi': 'Vendredi',
    'samedi': 'Samedi',
    'dimanche': 'Dimanche',
    'vsd': 'VSD',
    'travaux': 'Travaux'
  };
  return mapping[sanitized] || sanitized;
};

interface RouteSheetBlockProps {
  user: User;
  adminMode?: boolean;
}

type MainCategory = 'Semaine' | 'VSD' | 'Été' | 'Travaux';
type SummerSubCategory = 'Semaine' | 'Vendredi' | 'Samedi' | 'Dimanche';

interface ExtendedRouteSheet extends RouteSheet {
  category: string;
  subcategory?: string;
}

export const RouteSheetBlock: React.FC<RouteSheetBlockProps> = ({ user, adminMode = true }) => {
  const [routeSheets, setRouteSheets] = useState<ExtendedRouteSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Category management
  const [activeCategory, setActiveCategory] = useState<MainCategory>('Semaine');
  const [activeSummerSubCategory, setActiveSummerSubCategory] = useState<SummerSubCategory>('Semaine');
  const [showFiles, setShowFiles] = useState(true);

  // Check if user is admin
  const isAdmin = user.email === 'gregory.lima@t2c.local' && adminMode;

  const mainCategories: MainCategory[] = ['Semaine', 'VSD', 'Été', 'Travaux'];
  const summerSubCategories: SummerSubCategory[] = ['Semaine', 'Vendredi', 'Samedi', 'Dimanche'];

  const getCurrentCategoryPath = () => {
    if (activeCategory === 'Été') {
      return `${sanitizeForStorage(activeCategory)}/${sanitizeForStorage(activeSummerSubCategory)}`;
    }
    return sanitizeForStorage(activeCategory);
  };

  const loadRouteSheets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('route_sheets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include category information
      const sheetsWithCategories: ExtendedRouteSheet[] = (data || []).map(sheet => {
        // Extract category from file_path (assuming format: category/subcategory/filename or category/filename)
        const pathParts = sheet.file_path.split('/');
        let category = pathParts.length > 1 ? pathParts[0] : 'semaine'; // default (sanitized)
        let subcategory = undefined;
        
        if (pathParts.length > 2) {
          subcategory = pathParts[1];
        }
        
        return {
          ...sheet,
          category,
          subcategory
        };
      });
      
      setRouteSheets(sheetsWithCategories);
    } catch (error) {
      console.error('Error loading route sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRouteSheets();
  }, []);

  const getFilteredSheets = () => {
    return routeSheets.filter(sheet => {
      const sanitizedActiveCategory = sanitizeForStorage(activeCategory);
      
      if (activeCategory === 'Été') {
        const sanitizedActiveSummerSubCategory = sanitizeForStorage(activeSummerSubCategory);
        return sheet.category === sanitizedActiveCategory && sheet.subcategory === sanitizedActiveSummerSubCategory;
      }
      return sheet.category === sanitizedActiveCategory;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Format de fichier non supporté. Utilisez JPG, PNG ou PDF.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Taille maximale: 5MB.');
      return;
    }

    setUploadLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const categoryPath = getCurrentCategoryPath();
      const fileName = `${categoryPath}/${user.id}_${Date.now()}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('route-sheets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('route_sheets')
        .insert([{
          name: file.name,
          file_path: fileName,
          file_type: file.type,
          uploaded_by: user.id
        }]);

      if (dbError) throw dbError;

      await loadRouteSheets();
      event.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erreur lors du téléchargement du fichier');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (sheet: ExtendedRouteSheet) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${sheet.name}" ?`)) return;

    try {
      // Delete from storage
      await supabase.storage
        .from('route-sheets')
        .remove([sheet.file_path]);

      // Delete from database
      const { error } = await supabase
        .from('route_sheets')
        .delete()
        .eq('id', sheet.id);

      if (error) throw error;
      await loadRouteSheets();
    } catch (error) {
      console.error('Error deleting route sheet:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleDownload = async (sheet: ExtendedRouteSheet) => {
    try {
      const { data, error } = await supabase.storage
        .from('route-sheets')
        .createSignedUrl(sheet.file_path, 3600); // 1 hour expiry
      
      if (error) throw error;
      
      if (data?.signedUrl) {
        // Open in new tab for download/view
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  const filteredSheets = getFilteredSheets();

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-black p-4 sm:p-6 mb-4 sm:mb-6 mx-1 sm:mx-0"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-full">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Feuilles de Route</h2>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFiles(!showFiles)}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              showFiles 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            {showFiles ? 'Masquer' : 'Afficher'}
          </motion.button>
        </div>

        {/* Main Category Tabs */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {mainCategories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveCategory(category);
                  if (category === 'Été') {
                    setActiveSummerSubCategory('Semaine');
                  }
                }}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  activeCategory === category
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Summer Sub-Category Tabs */}
        <AnimatePresence>
          {activeCategory === 'Été' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-indigo-200">
                {summerSubCategories.map((subCategory) => (
                  <motion.button
                    key={subCategory}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSummerSubCategory(subCategory)}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all text-xs sm:text-sm ${
                      activeSummerSubCategory === subCategory
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {subCategory}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Upload Section */}
        {isAdmin && (
          <div className="mb-6 p-3 sm:p-4 border-2 border-dashed border-indigo-300 rounded-lg hover:border-indigo-400 transition-colors bg-indigo-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-indigo-800">
                Catégorie active: {getCurrentCategoryPath()}
              </span>
            </div>
            <label className="cursor-pointer flex flex-col items-center space-y-2">
              <div className="bg-indigo-100 p-3 rounded-full">
                <Plus className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-indigo-700 text-center px-2">
                {uploadLoading ? 'Téléchargement...' : 'Ajouter un document'}
              </span>
              <span className="text-xs text-indigo-500">PDF, JPEG, PNG (max 5MB)</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploadLoading}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Route Sheets List */}
        <AnimatePresence>
          {showFiles && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : filteredSheets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune feuille de route disponible pour "{getCurrentCategoryPath()}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {filteredSheets.map((sheet) => (
                    <motion.div
                      key={sheet.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 flex-1">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {sheet.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {sheet.file_type.startsWith('image/') ? 'IMG' : 'PDF'}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-3">
                        {new Date(sheet.created_at).toLocaleDateString('fr-FR')}
                      </div>

                      <div className="flex space-x-1 sm:space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDownload(sheet)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center space-x-1 sm:space-x-2 touch-manipulation"
                        >
                          <Download className="w-4 h-4" />
                          <span>Ouvrir</span>
                        </motion.button>
                        
                        {isAdmin && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(sheet)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors touch-manipulation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </>
  );
};