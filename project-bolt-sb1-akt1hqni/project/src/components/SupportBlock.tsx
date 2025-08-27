import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Clock, ExternalLink, Plus, Edit2, Trash2, ArrowLeft, Phone, Globe, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User, UsefulLink } from '../types';

interface SupportBlockProps {
  user: User;
  adminMode?: boolean;
}

// Configuration des lignes avec leurs couleurs officielles
const TRANSPORT_LINES = [
  { code: 'A', color: 'bg-red-500 hover:bg-red-600', textColor: 'text-white' },
  { code: 'B', color: 'bg-sky-400 hover:bg-sky-500', textColor: 'text-white' },
  { code: 'C', color: 'bg-pink-300 hover:bg-pink-400', textColor: 'text-white' },
  { code: '3', color: 'bg-orange-500 hover:bg-orange-600', textColor: 'text-white' },
  { code: '4', color: 'bg-purple-500 hover:bg-purple-600', textColor: 'text-white' },
  { code: '5', color: 'bg-green-500 hover:bg-green-600', textColor: 'text-white' },
  { code: '7', color: 'bg-blue-600 hover:bg-blue-700', textColor: 'text-white' },
  { code: '8', color: 'bg-yellow-500 hover:bg-yellow-600', textColor: 'text-black' },
  { code: '9', color: 'bg-indigo-500 hover:bg-indigo-600', textColor: 'text-white' },
  { code: '10', color: 'bg-teal-500 hover:bg-teal-600', textColor: 'text-white' },
  { code: '13', color: 'bg-rose-500 hover:bg-rose-600', textColor: 'text-white' },
  { code: '20', color: 'bg-cyan-500 hover:bg-cyan-600', textColor: 'text-white' },
  { code: '21', color: 'bg-lime-500 hover:bg-lime-600', textColor: 'text-black' },
  { code: '22', color: 'bg-amber-500 hover:bg-amber-600', textColor: 'text-black' },
  { code: '23', color: 'bg-emerald-500 hover:bg-emerald-600', textColor: 'text-white' },
  { code: '24', color: 'bg-violet-500 hover:bg-violet-600', textColor: 'text-white' },
  { code: '27', color: 'bg-fuchsia-500 hover:bg-fuchsia-600', textColor: 'text-white' },
  { code: '28', color: 'bg-slate-500 hover:bg-slate-600', textColor: 'text-white' },
  { code: '31', color: 'bg-red-600 hover:bg-red-700', textColor: 'text-white' },
  { code: '32', color: 'bg-blue-500 hover:bg-blue-600', textColor: 'text-white' },
  { code: '34', color: 'bg-green-600 hover:bg-green-700', textColor: 'text-white' },
  { code: '36', color: 'bg-purple-600 hover:bg-purple-700', textColor: 'text-white' },
  { code: 'PDD', color: 'bg-gray-700 hover:bg-gray-800', textColor: 'text-white' },
];

export const SupportBlock: React.FC<SupportBlockProps> = ({ user, adminMode = true }) => {
  const [showSupport, setShowSupport] = useState(false);
  const [activeSection, setActiveSection] = useState<'guide' | 'links'>('guide');
  const [expandedLink, setExpandedLink] = useState<string | null>(null);
  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Admin states
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showEditLinkModal, setShowEditLinkModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedLineForUpload, setSelectedLineForUpload] = useState<string>('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [editingLink, setEditingLink] = useState<UsefulLink | null>(null);
  const [newLink, setNewLink] = useState({ label: '', url: '', information: '' });
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);
  const isAdmin = user.email === 'gregory.lima@t2c.local' && adminMode;

  useEffect(() => {
    loadUsefulLinks();
    checkBucketExists();
  }, []);

  const checkBucketExists = async () => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        console.log('Cannot check buckets:', error.message);
        setBucketExists(false);
        return;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'guide-horaire');
      if (bucketExists) {
        setBucketExists(true);
      } else {
        setBucketExists(false);
      }
    } catch (error) {
      console.log('Error checking bucket:', error);
      setBucketExists(false);
    }
  };


  const loadUsefulLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('useful_links')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setUsefulLinks(data || []);
    } catch (error) {
      console.error('Error loading useful links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLineClick = async (lineCode: string) => {
    if (isAdmin && (event as any)?.ctrlKey) {
      // Ctrl+clic pour admin : ouvrir modal d'upload
      setSelectedLineForUpload(lineCode);
      setShowUploadModal(true);
      return;
    }

    try {
      // Essayer d'abord avec .pdf, puis .jpg si échec
      const extensions = ['pdf', 'jpg'];
      let fileFound = false;

      for (const ext of extensions) {
        try {
          const fileName = `${lineCode}.${ext}`;
          
          console.log('Tentative d\'ouverture:', fileName);
          
          // Essayer de créer l'URL signée directement
          const { data, error } = await supabase.storage
            .from('guide-horaire')
            .createSignedUrl(fileName, 3600);

          if (error) {
            console.log('Erreur pour', fileName, ':', error.message);
            // Si erreur contient "not found", essayer l'extension suivante
            if (error.message.includes('not found') || error.message.includes('Object not found')) {
              continue;
            }
            // Si erreur de bucket, arrêter complètement
            if (error.message.includes('Bucket not found')) {
              console.log('Bucket guide-horaire non trouvé');
              return;
            }
            continue;
          }

          if (data?.signedUrl) {
            console.log('Ouverture réussie:', fileName);
            window.open(data.signedUrl, '_blank');
            fileFound = true;
            break;
          }
        } catch (err) {
          console.log('Exception pour', lineCode, ext, ':', err);
          continue;
        }
      }

      if (!fileFound) {
        // Message plus discret, pas d'alerte
        console.log(`Guide horaire non disponible pour la ligne ${lineCode}`);
      }
    } catch (error) {
      console.error('Error opening schedule:', error);
      // Pas d'alerte pour éviter de spammer l'utilisateur
      console.log('Erreur lors de l\'ouverture du guide horaire');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedLineForUpload) return;

    // Valider le type de fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Format de fichier non supporté. Utilisez JPG, PNG ou PDF.');
      return;
    }

    // Valider la taille (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Taille maximale: 10MB.');
      return;
    }

    setUploadLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedLineForUpload}.${fileExt}`;
      
      console.log('Tentative d\'upload:', fileName, 'Taille:', file.size, 'Type:', file.type);
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('guide-horaire')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Erreur upload:', uploadError);
        throw uploadError;
      }

      console.log('Upload réussi pour:', fileName);
      alert(`Guide horaire pour la ligne ${selectedLineForUpload} ajouté avec succès`);
      setBucketExists(true); // Marquer le bucket comme existant après un upload réussi
      setShowUploadModal(false);
      setSelectedLineForUpload('');
      event.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Erreur lors du téléchargement du fichier: ${error.message || error}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLinkClick = (link: UsefulLink) => {
    // Toggle l'expansion du lien
    if (expandedLink === link.id) {
      setExpandedLink(null);
    } else {
      setExpandedLink(link.id);
    }
  };

  const handleLinkAction = (link: UsefulLink) => {
    window.open(link.url, '_blank');
  };

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'https': return <Globe className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  const detectLinkType = (url: string): UsefulLink['type'] => {
    if (url.endsWith('.pdf')) return 'pdf';
    if (url.startsWith('https://') || url.startsWith('http://')) return 'https';
    return 'other';
  };

  const handleAddLink = () => {
    if (!newLink.label || !newLink.url) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    addLinkToDatabase();
  };

  const addLinkToDatabase = async () => {
    try {
      const { error } = await supabase
        .from('useful_links')
        .insert([{
          label: newLink.label,
          url: newLink.url,
          type: detectLinkType(newLink.url),
          information: newLink.information || null,
          order_index: usefulLinks.length + 1,
          created_by: user.id
        }]);

      if (error) throw error;

      setNewLink({ label: '', url: '', information: '' });
      setShowAddLinkModal(false);
      await loadUsefulLinks();
    } catch (error) {
      console.error('Error adding link:', error);
      alert('Erreur lors de l\'ajout du lien');
    }
  };

  const handleEditLink = () => {
    if (!editingLink) return;

    updateLinkInDatabase();
  };

  const updateLinkInDatabase = async () => {
    if (!editingLink) return;

    try {
      const { error } = await supabase
        .from('useful_links')
        .update({
          label: editingLink.label,
          url: editingLink.url,
          type: detectLinkType(editingLink.url),
          information: editingLink.information || null
        })
        .eq('id', editingLink.id);

      if (error) throw error;

      setEditingLink(null);
      setShowEditLinkModal(false);
      await loadUsefulLinks();
    } catch (error) {
      console.error('Error updating link:', error);
      alert('Erreur lors de la modification du lien');
    }
  };

  const handleDeleteLink = (linkId: string) => {
    const link = usefulLinks.find(l => l.id === linkId);
    if (!link) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${link.label}" ?`)) return;
    if (!confirm('Cette action est irréversible. Confirmer la suppression ?')) return;

    deleteLinkFromDatabase(linkId);
  };

  const deleteLinkFromDatabase = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('useful_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      await loadUsefulLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Erreur lors de la suppression du lien');
    }
  };

  const moveLink = (linkId: string, direction: 'up' | 'down') => {
    const currentIndex = usefulLinks.findIndex(l => l.id === linkId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= usefulLinks.length) return;
    
    updateLinkOrder(linkId, direction);
  };

  const updateLinkOrder = async (linkId: string, direction: 'up' | 'down') => {
    try {
      const currentIndex = usefulLinks.findIndex(l => l.id === linkId);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= usefulLinks.length) return;
      
      const currentLink = usefulLinks[currentIndex];
      const swapLink = usefulLinks[newIndex];
      
      // Échanger les order_index
      const { error: error1 } = await supabase
        .from('useful_links')
        .update({ order_index: swapLink.order_index })
        .eq('id', currentLink.id);
        
      const { error: error2 } = await supabase
        .from('useful_links')
        .update({ order_index: currentLink.order_index })
        .eq('id', swapLink.id);
      
      if (error1 || error2) throw error1 || error2;
      
      await loadUsefulLinks();
    } catch (error) {
      console.error('Error updating link order:', error);
      alert('Erreur lors du changement d\'ordre');
    }
  };
  if (!showSupport) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-black p-4 sm:p-6 mb-4 sm:mb-6 mx-1 sm:mx-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-full">
              <HelpCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Support</h2>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSupport(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            Ouvrir
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-black p-4 sm:p-6 mb-4 sm:mb-6 mx-1 sm:mx-0"
    >
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSupport(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="bg-orange-100 p-2 rounded-full">
            <HelpCircle className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Support</h2>
        </div>
      </div>

      {/* Navigation des sections */}
      <div className="flex space-x-2 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveSection('guide')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
            activeSection === 'guide'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Guide horaire
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveSection('links')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
            activeSection === 'links'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <ExternalLink className="w-4 h-4 inline mr-2" />
          Liens utiles
        </motion.button>
      </div>

      {/* Section Guide horaire */}
      <AnimatePresence mode="wait">
        {activeSection === 'guide' && (
          <motion.div
            key="guide"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Sélectionnez une ligne pour consulter les horaires
            </h3>
            
            {isAdmin && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Mode Admin:</strong> Ctrl+clic sur une pastille pour ajouter/modifier le guide horaire
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
              {TRANSPORT_LINES.map((line) => (
                <motion.button
                  key={line.code}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleLineClick(line.code, e)}
                  className={`${line.color} ${line.textColor} w-12 h-12 sm:w-14 sm:h-14 rounded-full font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl touch-manipulation flex items-center justify-center`}
                >
                  {line.code}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Section Liens utiles */}
        {activeSection === 'links' && (
          <motion.div
            key="links"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Liens utiles
              </h3>
              
              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddLinkModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </motion.button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {usefulLinks.map((link) => (
                  <div
                    key={link.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleLinkClick(link)}
                        className="flex items-center space-x-3 flex-1 text-left touch-manipulation"
                      >
                        <div className="text-orange-600">
                          {getLinkIcon(link.type)}
                        </div>
                        <span className="text-sm sm:text-base text-gray-900 font-medium">
                          {link.label}
                        </span>
                        <motion.div
                          animate={{ rotate: expandedLink === link.id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-auto"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </motion.button>
                      
                      {isAdmin && (
                        <div className="flex space-x-1 ml-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => moveLink(link.id, 'up')}
                            disabled={usefulLinks.findIndex(l => l.id === link.id) === 0}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Monter"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => moveLink(link.id, 'down')}
                            disabled={usefulLinks.findIndex(l => l.id === link.id) === usefulLinks.length - 1}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Descendre"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setEditingLink(link);
                              setShowEditLinkModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      )}
                    </div>

                    {/* Contenu déployé */}
                    <AnimatePresence>
                      {expandedLink === link.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-200 bg-gray-50"
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span className="font-medium">Type:</span>
                              <span className="capitalize">
                                {link.type === 'pdf' ? 'Document PDF' :
                                 link.type === 'https' ? 'Site Web' : 'Autre'}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span className="font-medium">URL:</span>
                              <span className="font-mono text-xs bg-white px-2 py-1 rounded border break-all">
                                {link.url}
                              </span>
                            </div>
                            
                            {link.information && (
                              <div className="flex items-start space-x-2 text-sm text-gray-600">
                                <span className="font-medium">Info:</span>
                                <span className="flex-1">{link.information}</span>
                              </div>
                            )}

                            <div className="pt-2">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleLinkAction(link)}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>
                                  {link.type === 'pdf' ? 'Ouvrir le document' : 
                                   'Ouvrir le lien'}
                                </span>
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Ajouter lien */}
      <AnimatePresence>
        {showAddLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddLinkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Ajouter un lien</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Libellé
                  </label>
                  <input
                    type="text"
                    value={newLink.label}
                    onChange={(e) => setNewLink(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-base"
                    placeholder="Ex: Service Client"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="text"
                    value={newLink.url}
                    onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-base"
                    placeholder="Ex: tel:+33123456789 ou https://example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Information (optionnel)
                  </label>
                  <textarea
                    value={newLink.information}
                    onChange={(e) => setNewLink(prev => ({ ...prev, information: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-base"
                    placeholder="Description du lien"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddLinkModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddLink}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Modifier lien */}
      <AnimatePresence>
        {showEditLinkModal && editingLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditLinkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Modifier le lien</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Libellé
                  </label>
                  <input
                    type="text"
                    value={editingLink.label}
                    onChange={(e) => setEditingLink(prev => 
                      prev ? { ...prev, label: e.target.value } : null
                    )}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="text"
                    value={editingLink.url}
                    onChange={(e) => setEditingLink(prev => 
                      prev ? { ...prev, url: e.target.value } : null
                    )}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Information (optionnel)
                  </label>
                  <textarea
                    value={editingLink.information || ''}
                    onChange={(e) => setEditingLink(prev => 
                      prev ? { ...prev, information: e.target.value } : null
                    )}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-base"
                    placeholder="Description du lien"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditLinkModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleEditLink}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors"
                >
                  Sauvegarder
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Upload Guide Horaire */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">
                Ajouter guide horaire - Ligne {selectedLineForUpload}
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 transition-colors bg-orange-50">
                  <label className="cursor-pointer flex flex-col items-center space-y-2">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-orange-700 text-center">
                      {uploadLoading ? 'Téléchargement...' : 'Sélectionner un fichier'}
                    </span>
                    <span className="text-xs text-orange-500">PDF, JPEG, PNG (max 10MB)</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      disabled={uploadLoading}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <p className="text-sm text-gray-600">
                  Le fichier sera nommé automatiquement "{selectedLineForUpload}.pdf" ou "{selectedLineForUpload}.jpg" selon le type.
                </p>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploadLoading}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};