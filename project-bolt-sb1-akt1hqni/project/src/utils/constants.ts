export const LINE_COLORS = {
  A: 'bg-red-500 hover:bg-red-600 text-white',
  B: 'bg-sky-400 hover:bg-sky-500 text-white',
  C: 'bg-pink-300 hover:bg-pink-400 text-white',
  Autres: 'bg-emerald-500 hover:bg-emerald-600 text-white'
} as const;

export const LINE_BORDER_COLORS = {
  A: 'border-red-500',
  B: 'border-sky-400',
  C: 'border-pink-300',
  Autres: 'border-emerald-500'
} as const;

export const STOPS_LINE_A = [
  'Les Vergnes',
  'Stade G. Montpied',
  'La Plaine',
  'Champratel',
  'Croix de Neyrat',
  'Hauts de Chanturgue',
  'Collège A. Camus',
  'Les Vignes',
  'Lycée A. Brugière',
  'Les Pistes',
  'Musée d\'Art Roger Quilliot',
  'Montferrand La Fontaine',
  'Gravière',
  'Stade M. Michelin',
  '1er Mai',
  'Les Carmes',
  'Delille Montlosier',
  'Hôtel de Ville',
  'Gaillard',
  'Jaude',
  'Lagarlaye',
  'Maison de la Culture',
  'UCA - Campus Centre',
  'St Jacques Dolet',
  'CHU G. Montpied',
  'St Jacques Loucheur',
  'Léon Blum',
  'La Chaux',
  'Cézeaux Pellez',
  'UCA - Campus Cézeaux',
  'Margeride',
  'Fontaine du Bac',
  'Lycée Lafayette',
  'La Pardieu Gare'
];

export const INTERVENTION_TYPES = [
  { key: 'regulation', label: 'Régulation', icon: '🚦' },
  { key: 'incivility', label: 'Incivilité', icon: '😤' },
  { key: 'help', label: 'Aide', icon: '🤝' },
  { key: 'information', label: 'Renseignement', icon: 'ℹ️' },
  { key: 'link', label: 'Lien', icon: '🔗' },
  { key: 'bike_scooter', label: 'Vélo / Trottinette', icon: '🚲' },
  { key: 'stroller', label: 'Poussettes', icon: '👶' },
  { key: 'physical_aggression', label: 'Agression physique', icon: '👊' },
  { key: 'verbal_aggression', label: 'Agression verbale', icon: '🗣️' },
  { key: 'other', label: 'Autre', icon: '📝' }
] as const;