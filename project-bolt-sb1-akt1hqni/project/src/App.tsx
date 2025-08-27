import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from './types';
import { MediationBlock } from './components/MediationBlock';
import { VehicleBlock } from './components/VehicleBlock';
import { HistoryBlock } from './components/HistoryBlock';
import { RouteSheetBlock } from './components/RouteSheetBlock';
import { SupportBlock } from './components/SupportBlock';
import { FooterBlock } from './components/FooterBlock';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [adminMode, setAdminMode] = useState(true);

  const handleInterventionAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 pb-safe">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/c-logo--t2c.svg" 
              alt="Logo T2C" 
              className="h-16 sm:h-20 w-auto"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Médiation T2C
          </h1>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            Système d'enregistrement des interventions
          </p>
        </motion.div>

        {/* Authentication Block */}
        <MediationBlock 
          user={user} 
          onUserChange={setUser}
          adminMode={adminMode}
          onAdminModeChange={setAdminMode}
        />

        {/* Main Content - Only show when authenticated */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Vehicle Registration Block */}
            <VehicleBlock 
              user={user} 
              onInterventionAdded={handleInterventionAdded}
            />

            {/* History Block */}
            <HistoryBlock 
              user={user} 
              refreshTrigger={refreshTrigger}
            />

            {/* Route Sheets Block */}
            <RouteSheetBlock user={user} adminMode={adminMode} />

            {/* Support Block */}
            <SupportBlock user={user} adminMode={adminMode} />
          </motion.div>
        )}

        {/* Footer */}
        <FooterBlock />
      </div>
    </div>
  );
}

export default App;