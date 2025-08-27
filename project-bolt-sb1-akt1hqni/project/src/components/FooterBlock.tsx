import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Shield } from 'lucide-react';

export const FooterBlock: React.FC = () => {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="bg-gray-800 text-white py-6 sm:py-8 px-4 sm:px-6 rounded-t-xl mt-6 sm:mt-8 mx-1 sm:mx-0"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-full">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-base sm:text-lg">Application de Médiation</h3>
              <p className="text-gray-300 text-xs sm:text-sm">Transport en commun</p>
            </div>
          </div>
          
          <div className="text-center sm:text-right">
            <p className="text-xs sm:text-sm text-gray-300 mb-1">
              © 2025 Application de Médiation
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-4 text-center">
          <p className="text-xs text-gray-400">
            Développé par Grégory Lima • Version 1.0
          </p>
        </div>
      </div>
    </motion.footer>
  );
};