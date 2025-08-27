import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Edit2, Trash2, Eye, Download, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User, Intervention } from '../types';
import { LINE_BORDER_COLORS, INTERVENTION_TYPES } from '../utils/constants';
import { exportDayToHTML } from '../utils/export';

interface HistoryBlockProps {
  user: User;
  refreshTrigger?: number;
}

export const HistoryBlock: React.FC<HistoryBlockProps> = ({ user, refreshTrigger }) => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIntervention, setExpandedIntervention] = useState<string | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [editingIntervention, setEditingIntervention] = useState<Intervention | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadInterventions = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('interventions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInterventions(data || []);
    } catch (error) {
      console.error('Error loading interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterventions();
  }, [user.id, refreshTrigger]);

  const handleResetHistory = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer TOUT l\'historique ?')) return;
    if (!confirm('Cette action est IRRÉVERSIBLE. Tous les enregistrements seront définitivement supprimés. Confirmer ?')) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('interventions')
        .delete()
        .eq('user_id', user.id)
        .eq('date', today);
        
      if (error) throw error;
      
      setInterventions([]);
      alert('Historique supprimé avec succès');
    } catch (error) {
      console.error('Error resetting history:', error);
      alert('Erreur lors de la suppression de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) return;
    if (!confirm('Cette action est irréversible. Confirmer la suppression ?')) return;
    
    try {
      const { error } = await supabase
        .from('interventions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      await loadInterventions();
    } catch (error) {
      console.error('Error deleting intervention:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleEdit = async (intervention: Intervention) => {
    if (!editingIntervention) return;
    
    try {
      const { error } = await supabase
        .from('interventions')
        .update({
          time: editingIntervention.time,
          vehicle_number: editingIntervention.vehicle_number,
          stop: editingIntervention.stop,
          regulation: editingIntervention.regulation,
          incivility: editingIntervention.incivility,
          help: editingIntervention.help,
          information: editingIntervention.information,
          link: editingIntervention.link,
          bike_scooter: editingIntervention.bike_scooter,
          stroller: editingIntervention.stroller,
          physical_aggression: editingIntervention.physical_aggression,
          verbal_aggression: editingIntervention.verbal_aggression,
          other: editingIntervention.other,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingIntervention.id);
        
      if (error) throw error;
      setShowEditModal(false);
      setEditingIntervention(null);
      await loadInterventions();
    } catch (error) {
      console.error('Error updating intervention:', error);
      alert('Erreur lors de la modification');
    }
  };

  const showDetails = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setShowDetailsModal(true);
  };

  const startEdit = (intervention: Intervention) => {
    setEditingIntervention({ ...intervention });
    setShowEditModal(true);
  };

  const handleExport = () => {
    if (interventions.length === 0) {
      alert('Aucune intervention à exporter');
      return;
    }
    exportDayToHTML(interventions, user.email);
  };

  // Filter active interventions (with at least one intervention > 0)
  const getActiveInterventions = (intervention: Intervention) => {
    return INTERVENTION_TYPES.some(({ key }) => 
      (intervention[key as keyof Intervention] as number) > 0
    );
  };

  // Get summary of active interventions only
  const getActiveInterventionsSummary = (intervention: Intervention) => {
    return INTERVENTION_TYPES
      .filter(({ key }) => (intervention[key as keyof Intervention] as number) > 0)
      .map(({ key, label, icon }) => ({ 
        key, 
        label, 
        icon, 
        count: intervention[key as keyof Intervention] as number 
      }));
  };

  const toggleInterventionExpansion = (interventionId: string) => {
    setExpandedIntervention(expandedIntervention === interventionId ? null : interventionId);
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg border border-black p-4 sm:p-6 mb-4 sm:mb-6 mx-1 sm:mx-0"
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Chargement...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-black p-4 sm:p-6 mb-4 sm:mb-6 mx-1 sm:mx-0"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <History className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Historique du jour</h2>
          </div>
          
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={interventions.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exporter</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetHistory}
              className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </motion.button>
          </div>
        </div>

        {interventions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune intervention enregistrée aujourd'hui</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              {interventions.length} intervention(s) enregistrée(s)
            </p>
            
            {interventions.map((intervention) => (
              <motion.div
                key={intervention.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`border-l-4 ${LINE_BORDER_COLORS[intervention.line]} bg-gray-50 p-3 sm:p-4 rounded-r-lg`}
              >
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleInterventionExpansion(intervention.id!)}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">
                        {intervention.time} - Ligne {intervention.line}
                        {intervention.custom_line && ` (${intervention.custom_line})`} - Véhicule {intervention.vehicle_number}
                      </span>
                      <motion.div
                        animate={{ rotate: expandedIntervention === intervention.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-auto"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 ml-2 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => showDetails(intervention)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors touch-manipulation flex items-center justify-center"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => startEdit(intervention)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors touch-manipulation flex items-center justify-center"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(intervention.id!)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors touch-manipulation flex items-center justify-center"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Interventions déployées */}
                <AnimatePresence>
                  {expandedIntervention === intervention.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 pt-3 border-t border-gray-200"
                    >
                      {getActiveInterventions(intervention) ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {getActiveInterventionsSummary(intervention).map(({ key, label, icon, count }) => (
                            <div key={key} className="bg-white p-2 rounded border text-center">
                              <div className="text-lg">{icon}</div>
                              <div className="text-xs text-gray-600">{label}</div>
                              <div className="font-bold text-blue-600">{count}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 italic py-2">
                          Aucune intervention enregistrée
                        </div>
                      )}
                      
                      {intervention.stop && (
                        <div className="mt-2 text-xs text-gray-600">
                          <strong>Arrêt:</strong> {intervention.stop}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedIntervention && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full mx-2"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base sm:text-lg font-bold mb-4">Détails de l'intervention</h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Heure:</span>
                    <p>{selectedIntervention.time}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Ligne:</span>
                    <p>{selectedIntervention.line}
                      {selectedIntervention.custom_line && ` (${selectedIntervention.custom_line})`}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Véhicule:</span>
                    <p>{selectedIntervention.vehicle_number}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Arrêt:</span>
                    <p>{selectedIntervention.stop}</p>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <span className="font-medium text-gray-700">Interventions:</span>
                  <div className="mt-2 space-y-1">
                    {INTERVENTION_TYPES
                      .filter(({ key }) => (selectedIntervention[key as keyof typeof selectedIntervention] as number) > 0)
                      .map(({ key, label, icon }) => (
                        <div key={key} className="flex justify-between">
                          <span>{icon} {label}:</span>
                          <span className="font-semibold">
                            {selectedIntervention[key as keyof typeof selectedIntervention] as number}
                          </span>
                        </div>
                      ))}
                    {!getActiveInterventions(selectedIntervention) && (
                      <div className="text-center text-gray-400 italic py-2">
                        Aucune intervention enregistrée
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors touch-manipulation"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingIntervention && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto mx-2"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base sm:text-lg font-bold mb-4">Modifier l'intervention</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                  <input
                    type="time"
                    value={editingIntervention.time}
                    onChange={(e) => setEditingIntervention(prev => 
                      prev ? { ...prev, time: e.target.value } : null
                    )}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule</label>
                  <input
                    type="text"
                    value={editingIntervention.vehicle_number}
                    onChange={(e) => setEditingIntervention(prev => 
                      prev ? { ...prev, vehicle_number: e.target.value } : null
                    )}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arrêt</label>
                  <input
                    type="text"
                    value={editingIntervention.stop}
                    onChange={(e) => setEditingIntervention(prev => 
                      prev ? { ...prev, stop: e.target.value } : null
                    )}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Interventions</label>
                  {INTERVENTION_TYPES.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm flex-1">{label}:</span>
                      <div className="flex items-center space-x-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingIntervention(prev => 
                            prev ? { ...prev, [key]: Math.max(0, (prev[key as keyof Intervention] as number) - 1) } : null
                          )}
                          className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg touch-manipulation"
                        >
                          -
                        </motion.button>
                        
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editingIntervention[key as keyof Intervention] as number}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Permettre la suppression complète pour saisie manuelle
                            if (value === '') {
                              setEditingIntervention(prev => 
                                prev ? { ...prev, [key]: 0 } : null
                              );
                            } else {
                              // Ne garder que les chiffres
                              const numericValue = value.replace(/[^0-9]/g, '');
                              const parsedValue = parseInt(numericValue) || 0;
                              setEditingIntervention(prev => 
                                prev ? { ...prev, [key]: Math.max(0, parsedValue) } : null
                              );
                            }
                          }}
                          onFocus={(e) => {
                            // Sélectionner tout le texte au focus pour faciliter la saisie
                            e.target.select();
                          }}
                          className="w-12 sm:w-16 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-base text-center"
                        />
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingIntervention(prev => 
                            prev ? { ...prev, [key]: (prev[key as keyof Intervention] as number) + 1 } : null
                          )}
                          className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg touch-manipulation"
                        >
                          +
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors touch-manipulation"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleEdit(editingIntervention)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors touch-manipulation"
                >
                  Sauvegarder
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};