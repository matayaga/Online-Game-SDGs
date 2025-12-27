
import { SDGGoal } from './types';

export const SDG_GOALS: Record<number, SDGGoal> = {
  1: { 
    id: 1, 
    name: 'No Poverty', 
    color: 'bg-red-500', 
    textColor: 'text-white', 
    desc: '2 pts each',
    longDesc: 'End poverty in all its forms everywhere.'
  },
  2: { 
    id: 2, 
    name: 'Zero Hunger', 
    color: 'bg-yellow-500', 
    textColor: 'text-white', 
    desc: 'Count + 1 pt',
    longDesc: 'End hunger, achieve food security and improved nutrition and promote sustainable agriculture.'
  },
  4: { 
    id: 4, 
    name: 'Quality Education', 
    color: 'bg-red-700', 
    textColor: 'text-white', 
    desc: '2 pts (Max 5 pts)',
    longDesc: 'Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.'
  },
  6: { 
    id: 6, 
    name: 'Clean Water & Sanitation', 
    color: 'bg-cyan-500', 
    textColor: 'text-white', 
    desc: '1 pt (Max 4 pts)',
    longDesc: 'Ensure availability and sustainable management of water and sanitation for all.'
  },
  13: { 
    id: 13, 
    name: 'Climate Action', 
    color: 'bg-green-700', 
    textColor: 'text-white', 
    desc: '2 pts (Max 5 pts)',
    longDesc: 'Take urgent action to combat climate change and its impacts.'
  },
  14: { 
    id: 14, 
    name: 'Life Below Water', 
    color: 'bg-blue-500', 
    textColor: 'text-white', 
    desc: '1 pt (Max 4 pts)',
    longDesc: 'Conserve and sustainably use the oceans, seas and marine resources for sustainable development.'
  },
  15: { 
    id: 15, 
    name: 'Life on Land', 
    color: 'bg-green-500', 
    textColor: 'text-white', 
    desc: '1 pt (Max 4 pts)',
    longDesc: 'Protect, restore and promote sustainable use of terrestrial ecosystems.'
  },
  17: { 
    id: 17, 
    name: 'Partnerships for the Goals', 
    color: 'bg-blue-900', 
    textColor: 'text-white', 
    desc: 'Curve Scoring',
    longDesc: 'Strengthen the means of implementation and revitalize the Global Partnership for Sustainable Development.'
  },
};

export const DECK_COUNTS = { 1: 7, 2: 8, 4: 10, 6: 8, 13: 5, 14: 10, 15: 12, 17: 19 };

export const TARGET_SCORE = 63;
