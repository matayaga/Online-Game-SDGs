
export enum GameState {
  INTRO = 'INTRO',
  LOBBY = 'LOBBY',
  FLIP_PHASE = 'FLIP_PHASE',
  DECISION_PHASE = 'DECISION_PHASE',
  BUST = 'BUST',
  DISCARD_SELECT = 'DISCARD_SELECT',
  GIFT_EXCHANGE = 'GIFT_EXCHANGE',
  GAME_OVER = 'GAME_OVER'
}

export interface CardType {
  id: string;
  goalId: number;
  isNew?: boolean;
}

export interface Player {
  id: string;
  name: string;
  collected: CardType[];
  finalScore: number;
  isAI: boolean;
  isHost?: boolean;
}

export interface SDGGoal {
  id: number;
  name: string;
  color: string;
  textColor: string;
  desc: string;
  longDesc: string;
}

export interface ScoreInfo {
  total: number;
  passed: boolean;
  reason: string;
}
