import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn, LogOut, User, AlertCircle, Shield, Eye, MoreVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User as UserType } from '../types';

interface MediationBlockProps {
  user: UserType | null;
  onUserChange: (user: UserType | null) => void;
  adminMode?: boolean;
  onAdminModeChange?: (mode: boolean) => void;
}

export const MediationBlock: React.FC<MediationBlockProps> = ({ 
  user, 
  onUserChange, 
  adminMode = true, 
  onAdminModeChange 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is admin
  const isAdmin = user?.email === 'gregory.lima@t2c.local';

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        onUserChange({
          id: session.user.id,
          email: session.user.email || ''
        });
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          onUserChange({
            id: session.user.id,
            email: session.user.email || ''
          });
        } else {
          onUserChange(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [onUserChange]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('Email ou mot de passe incorrect');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminMode = () => {
    const newMode = !adminMode;
    onAdminModeChange?.(newMode);
  };

  if (user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-black p-4 sm:p-6 mb-4 sm:mb-6 mx-1 sm:mx-0"
      >
        <div className="flex flex-col space-y-3">
          {/* User info and logout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-2 rounded-full">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Connecté en tant que</p>
                <p className="font-semibold text-gray-900 text-sm sm:text-base break-all">
                  {user.email.replace('@t2c.local', '')}
                </p>
              </div>
            </div>
            
            {isAdmin && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                ADMIN
              </span>
            )}
          </div>
          
          {/* Admin mode switch and logout */}
          <div className="flex items-center justify-between">
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleAdminMode}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${
                  adminMode 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {adminMode ? 'Mode Admin' : 'Mode Agent'}
                </span>
                <span className="sm:hidden">
                  {adminMode ? 'Admin' : 'Agent'}
                </span>
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{loading ? 'Déconnexion...' : 'Se déconnecter'}</span>
            </motion.button>
          </div>
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
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-red-100 p-2 rounded-full">
          <LogIn className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Authentification T2C</h2>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
            placeholder="votre.email@t2c.local"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 touch-manipulation"
        >
          <LogIn className="w-4 h-4" />
          <span>{loading ? 'Connexion...' : 'Se connecter'}</span>
        </motion.button>
      </form>
    </motion.div>
  );
};