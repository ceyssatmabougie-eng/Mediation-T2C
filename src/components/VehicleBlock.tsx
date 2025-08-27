import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Bus, MapPin, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User, LineType } from '../types';
import { LINE_COLORS, STOPS_LINE_A } from '../utils/constants';

interface VehicleBlockProps {
  user: User;
  onInterventionAdded?: () => void;
}

export const VehicleBlock: React.FC<VehicleBlockProps> = ({ user, onInterventionAdded }) => {
  const [selectedLine, setSelectedLine] = useState<LineType | null>(null);
  const [customLine, setCustomLine] = useState('');
  const [time, setTime] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [stop, setStop] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFields, setShowFields] = useState(true);

  useEffect(() => {
    // Set current time on component mount
    const now = new Date();
    setTime(now.toTimeString().slice(0, 5));
  }, []);

  const handleLineSelection = (line: LineType) => {
    setSelectedLine(line);
    // Afficher automatiquement les champs si ils sont masqués
    if (!showFields) {
      setShowFields(true);
    }
    // Set current time automatically when line is selected
    const now = new Date();
    setTime(now.toTimeString().slice(0, 5));
    setStop(''); // Reset stop when changing line
  };

  const resetForm = () => {
    setTime(new Date().toTimeString().slice(0, 5));
    setVehicleNumber('');
    setStop('');
  };

  const submitVehicle = async () => {
    if (!selectedLine || !vehicleNumber) {
      alert('Veuillez sélectionner une ligne et saisir un numéro de véhicule');
      return;
    }

    setLoading(true);
    try {
      const interventionData = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        time,
        line: selectedLine,
        custom_line: selectedLine === 'Autres' ? customLine : null,
        vehicle_number: vehicleNumber,
        stop: stop || '',
        regulation: 0,
        incivility: 0,
        help: 0,
        information: 0,
        link: 0,
        bike_scooter: 0,
        stroller: 0,
        physical_aggression: 0,
        verbal_aggression: 0,
        other: 0
      };

      const { error } = await supabase
        .from('interventions')
        .insert([interventionData]);

      if (error) throw error;

      resetForm();
      onInterventionAdded?.();
      alert('Véhicule enregistré avec succès');

    } catch (error) {
      console.error('Error submitting intervention:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-black p-4 sm:p-6 mb-4 sm:mb-6 mx-1 sm:mx-0"
    >
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Enregistrer un véhicule</h2>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFields(!showFields)}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              showFields 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            {showFields ? 'Masquer' : 'Afficher'}
          </motion.button>
        </div>
      </div>

      {/* Line Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Sélectionner la ligne
        </label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {(Object.keys(LINE_COLORS) as LineType[]).map((line) => (
            <motion.button
              key={line}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleLineSelection(line)}
              className={`p-2 sm:p-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                selectedLine === line 
                  ? `${LINE_COLORS[line]} shadow-lg` 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Ligne {line}
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {selectedLine === 'Autres' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <input
                type="text"
                placeholder="Préciser la ligne"
                value={customLine}
                onChange={(e) => setCustomLine(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Vehicle Fields - Collapsible */}
      <AnimatePresence>
        {showFields && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Time and Vehicle */}
            <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Heure
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Bus className="w-4 h-4 inline mr-1" />
                  Numéro de véhicule
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Ex: 1234"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  required
                />
              </div>
            </div>

            {/* Stop */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Arrêt (optionnel)
              </label>
              {selectedLine === 'A' ? (
                <select
                  value={stop}
                  onChange={(e) => setStop(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"
                >
                  <option value="">Sélectionner un arrêt</option>
                  {STOPS_LINE_A.map((stopName) => (
                    <option key={stopName} value={stopName}>
                      {stopName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={stop}
                  onChange={(e) => setStop(e.target.value)}
                  placeholder="Nom de l'arrêt"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              )}
            </div>

            {/* Validation Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={submitVehicle}
                disabled={loading || !selectedLine || !vehicleNumber}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-sm sm:text-base touch-manipulation"
              >
                <Check className="w-4 h-4" />
                <span>Valider le véhicule</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};