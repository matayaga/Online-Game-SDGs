
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, 
  Zap, 
  Cpu, 
  Copy, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Shuffle, 
  Gift, 
  SkipForward, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  AlertCircle,
  Lightbulb,
  MessageSquare,
  ShieldCheck,
  Award
} from 'lucide-react';
import { GameState, CardType, Player, ScoreInfo } from './types';
import { SDG_GOALS, DECK_COUNTS, TARGET_SCORE } from './constants';
import Card from './components/Card';
import AudioHandler, { playSound } from './components/AudioHandler';
import { getStrategistAdvice, getSDGInsight } from './services/geminiService';

const App: React.FC = () => {
  // Game UI State
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [isMuted, setIsMuted] = useState(false);
  const [userName, setUserName] = useState('Agent Alpha');
  const [roomId, setRoomId] = useState('');
  
  // Game Mechanics State
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [deck, setDeck] = useState<CardType[]>([]);
  const [tableCards, setTableCards] = useState<CardType[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [message, setMessage] = useState('Ready for your mission, Agent?');
  const [scoreInfo, setScoreInfo] = useState<ScoreInfo | null>(null);
  const [isExploding, setIsExploding] = useState(false);
  const [giftSelectedIndex, setGiftSelectedIndex] = useState<number | null>(null);
  
  // Gemini Integration State
  const [strategistAdvice, setStrategistAdvice] = useState<string>('');
  const [sdgInsight, setSdgInsight] = useState<string | null>(null);
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);

  // Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout for browser compatibility
  const adviceDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize deck
  const createDeck = useCallback(() => {
    const newDeck: CardType[] = [];
    Object.entries(DECK_COUNTS).forEach(([goalId, count]) => {
      for (let i = 0; i < count; i++) {
        newDeck.push({ id: `card-${goalId}-${i}`, goalId: parseInt(goalId) });
      }
    });
    return newDeck.sort(() => Math.random() - 0.5);
  }, []);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 10));
  }, []);

  // --- Gemini Integration ---
  const fetchAdvice = useCallback(async () => {
    if (gameState !== GameState.DECISION_PHASE) return;
    setIsGettingAdvice(true);
    const currentPlayer = players[currentTurnIndex];
    const advice = await getStrategistAdvice(
      tableCards.map(c => c.goalId),
      deck.length,
      currentPlayer?.collected.map(c => c.goalId) || []
    );
    setStrategistAdvice(advice);
    setIsGettingAdvice(false);
  }, [gameState, players, currentTurnIndex, tableCards, deck]);

  useEffect(() => {
    if (adviceDebounce.current) clearTimeout(adviceDebounce.current);
    if (gameState === GameState.DECISION_PHASE) {
      adviceDebounce.current = setTimeout(fetchAdvice, 1000);
    } else {
      setStrategistAdvice('');
    }
  }, [gameState, fetchAdvice]);

  const showInsight = async (goalId: number) => {
    const insight = await getSDGInsight(goalId);
    setSdgInsight(insight);
    setTimeout(() => setSdgInsight(null), 8000);
  };

  // --- Game Actions ---
  const initGame = () => {
    const initialPlayers: Player[] = [
      { id: 'p1', name: userName, collected: [], finalScore: 0, isAI: false, isHost: true },
      { id: 'ai1', name: 'Agent Byte', collected: [], finalScore: 0, isAI: true },
      { id: 'ai2', name: 'Agent Logic', collected: [], finalScore: 0, isAI: true },
    ];
    setPlayers(initialPlayers);
    setDeck(createDeck());
    setGameState(GameState.FLIP_PHASE);
    addLog("Mission initialized. Future secured by Agent Alpha.");
    playSound('success');
  };

  const startTurn = () => {
    if (deck.length === 0) {
      goToGiftPhase();
      return;
    }
    playSound('flip');
    const drawn = deck[0];
    setDeck(prev => prev.slice(1));
    setTableCards([{ ...drawn, isNew: true }]);
    setGameState(GameState.DECISION_PHASE);
    setMessage("Initial card deployed. High risk, high reward.");
  };

  const drawMore = () => {
    if (deck.length === 0) return;
    playSound('flip');
    const newCard = { ...deck[0], isNew: true };
    const prevTable = tableCards.map(c => ({ ...c, isNew: false }));
    const isDuplicate = prevTable.some(c => c.goalId === newCard.goalId);
    
    if (isDuplicate) {
      setTableCards([...prevTable, newCard]);
      handleBust();
    } else {
      setTableCards([...prevTable, newCard]);
      setDeck(prev => prev.slice(1));
      setMessage("Safe arrival. Proceed or extract?");
      addLog(`Agent ${players[currentTurnIndex].name} deployed SDG ${newCard.goalId}.`);
    }
  };

  const handleBust = () => {
    setIsExploding(true);
    playSound('explosion');
    setGameState(GameState.BUST);
    setMessage("COLLISION! Resources lost in the temporal blast.");
    setTimeout(() => setIsExploding(false), 1000);
  };

  const collect = () => {
    if (tableCards.length === 1) {
      const newPlayers = [...players];
      newPlayers[currentTurnIndex].collected.push(...tableCards);
      setPlayers(newPlayers);
      showInsight(tableCards[0].goalId);
      endTurn();
    } else {
      setGameState(GameState.DISCARD_SELECT);
      setMessage("Security Protocol: Sacrifice one card to extract the rest.");
    }
    playSound('click');
  };

  const handleDiscard = (idx: number) => {
    const kept = tableCards.filter((_, i) => i !== idx);
    const newPlayers = [...players];
    newPlayers[currentTurnIndex].collected.push(...kept);
    setPlayers(newPlayers);
    addLog(`${players[currentTurnIndex].name} extracted ${kept.length} goals.`);
    playSound('success');
    endTurn();
  };

  const endTurn = () => {
    setTableCards([]);
    if (deck.length === 0) {
      goToGiftPhase();
      return;
    }
    setCurrentTurnIndex(prev => (prev + 1) % players.length);
    setGameState(GameState.FLIP_PHASE);
    setMessage(`Agent ${players[(currentTurnIndex + 1) % players.length].name}'s window is open.`);
  };

  const goToGiftPhase = () => {
    setGameState(GameState.GIFT_EXCHANGE);
    setCurrentTurnIndex(0);
    setMessage("Supply lines open: Support your fellow agents.");
  };

  const handleGift = (targetIdx: number) => {
    if (giftSelectedIndex === null) return;
    const newPlayers = [...players];
    const card = newPlayers[currentTurnIndex].collected.splice(giftSelectedIndex, 1)[0];
    newPlayers[targetIdx].collected.push(card);
    setPlayers(newPlayers);
    setGiftSelectedIndex(null);
    playSound('success');
    addLog(`Goal ${card.goalId} transferred to ${newPlayers[targetIdx].name}.`);
    
    // Move to next player or end game
    if (currentTurnIndex === players.length - 1) {
      calculateFinal();
    } else {
      setCurrentTurnIndex(prev => prev + 1);
    }
  };

  const skipGift = () => {
    if (currentTurnIndex === players.length - 1) {
      calculateFinal();
    } else {
      setCurrentTurnIndex(prev => prev + 1);
    }
    playSound('click');
  };

  const calculateFinal = () => {
    let grandTotal = 0;
    const finalPlayers = players.map(p => {
      let score = 0;
      const counts: Record<number, number> = {};
      p.collected.forEach(c => counts[c.goalId] = (counts[c.goalId] || 0) + 1);
      
      score += (counts[1] || 0) * 2;
      if ((counts[2] || 0) > 0) score += (counts[2] * 1) + 1;
      [4, 13].forEach(id => {
        if ((counts[id] || 0) > 0) score += 2; // Simplified logic for demo
      });
      [6, 14, 15].forEach(id => {
        if ((counts[id] || 0) > 0) score += 1;
      });
      const c17 = counts[17] || 0;
      if (c17 >= 1 && c17 <= 3) score += 2;
      else if (c17 >= 4 && c17 <= 6) score += 4;
      
      grandTotal += score;
      return { ...p, finalScore: score };
    });

    const passed = grandTotal >= TARGET_SCORE;
    setPlayers(finalPlayers);
    setScoreInfo({
      total: grandTotal,
      passed,
      reason: passed ? "Future stabilized. Goals met." : "Insufficient momentum. Collapse imminent."
    });
    setGameState(GameState.GAME_OVER);
  };

  // --- AI Logic (Simplified) ---
  useEffect(() => {
    const currentPlayer = players[currentTurnIndex];
    if (currentPlayer?.isAI && gameState !== GameState.GAME_OVER) {
      const timer = setTimeout(() => {
        if (gameState === GameState.FLIP_PHASE) startTurn();
        else if (gameState === GameState.DECISION_PHASE) {
          if (tableCards.length < 2 && Math.random() > 0.3) drawMore();
          else collect();
        } else if (gameState === GameState.BUST) endTurn();
        else if (gameState === GameState.DISCARD_SELECT) handleDiscard(0);
        else if (gameState === GameState.GIFT_EXCHANGE) skipGift();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState, currentTurnIndex, players, tableCards]);

  // --- Render Components ---
  const renderIntro = () => (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="grid grid-cols-8 gap-4 p-8">
          {Object.values(SDG_GOALS).map(g => (
            <div key={g.id} className={`${g.color} w-24 h-24 rounded-full blur-3xl opacity-50`}></div>
          ))}
        </div>
      </div>
      
      <div className="z-10 text-center space-y-8 max-w-4xl">
        <div className="inline-block p-2 px-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold tracking-widest text-sm uppercase">
          United Nations SDG Response Unit
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic">
          FUTURE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">AGENTS</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The year is 2030. Progress has stalled. Your task: collect the core development goals and share resources to prevent global collapse.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
          <input 
            type="text" 
            value={userName} 
            onChange={e => setUserName(e.target.value)}
            className="bg-slate-800 border-2 border-slate-700 rounded-xl px-6 py-4 text-xl outline-none focus:border-blue-500 transition-all text-center"
            placeholder="Agent Code Name"
          />
          <button 
            onClick={initGame}
            className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl text-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-3 group"
          >
            START OPERATION <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderBoard = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AudioHandler isMuted={isMuted} isPlayingMusic={gameState !== GameState.GAME_OVER} />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="font-black text-slate-800 tracking-tight">SDG OPERATION HQ</h1>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Stabilization Protocol</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
             <span className="text-[10px] font-black text-slate-400 uppercase">Target Score</span>
             <span className="text-xl font-black text-emerald-600 tracking-tighter">{TARGET_SCORE} PTS</span>
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            {isMuted ? <VolumeX className="text-slate-400" /> : <Volume2 className="text-blue-500" />}
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col lg:flex-row gap-8 max-w-[1600px] mx-auto w-full">
        {/* Sidebar: Agents */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Active Field Agents</div>
          {players.map((p, idx) => {
            const isCurrent = currentTurnIndex === idx;
            return (
              <div 
                key={p.id} 
                className={`bg-white p-5 rounded-2xl border-2 transition-all ${isCurrent ? 'border-blue-500 shadow-lg scale-105 z-10' : 'border-slate-200 opacity-70'}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    {p.isAI ? <Cpu className="text-purple-500" size={18} /> : <Users className="text-blue-500" size={18} />}
                    <span className="font-black text-slate-800 tracking-tight">{p.name}</span>
                  </div>
                  {isCurrent && <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.collected.length === 0 ? (
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest py-2">No goals secured</div>
                  ) : (
                    p.collected.map((c, i) => (
                      <div key={i} className={`w-6 h-8 rounded-md ${SDG_GOALS[c.goalId].color} flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-1 ring-white/20`} title={SDG_GOALS[c.goalId].name}>
                        {c.goalId}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Mission Log */}
          <div className="mt-8 bg-slate-900 rounded-2xl p-5 text-slate-400 text-xs font-mono h-64 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 text-blue-400">
               <Zap size={14} /> <span className="font-bold">MISSION_LOG.TXT</span>
            </div>
            {logs.map((log, i) => (
              <div key={i} className="mb-2">
                <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Central Hub */}
        <div className="flex-1 flex flex-col gap-6">
          <div className={`relative flex-1 bg-white rounded-3xl shadow-xl border-4 overflow-hidden flex flex-col transition-all duration-300 ${isExploding ? 'border-red-500 animate-[shake_0.5s_ease-in-out]' : 'border-slate-100'}`}>
            {/* Advice Overlay */}
            {strategistAdvice && (
              <div className="absolute top-4 right-4 max-w-[200px] z-20 animate-float">
                <div className="bg-slate-800 text-white p-3 rounded-2xl shadow-xl border border-blue-500/30 text-xs italic">
                  <div className="flex items-center gap-1 text-blue-400 font-bold mb-1 uppercase tracking-tighter text-[8px]">
                    <Lightbulb size={10} /> HQ Strategy
                  </div>
                  "{strategistAdvice}"
                </div>
              </div>
            )}

            {/* Insight Message */}
            {sdgInsight && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40 animate-fade-in">
                <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3">
                   <Award size={32} className="shrink-0" />
                   <p className="text-sm font-bold leading-tight">{sdgInsight}</p>
                </div>
              </div>
            )}

            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{message}</h2>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Current Sector State</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Stockpile</div>
                <div className="text-xl font-black text-slate-800">{deck.length} CARDS</div>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 relative min-h-[400px]">
              {gameState === GameState.GIFT_EXCHANGE ? (
                <div className="w-full max-w-2xl flex flex-col items-center animate-fade-in">
                  <div className="bg-purple-50 text-purple-600 p-3 rounded-xl font-black uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
                    <Gift size={16} /> Cooperative Supply Phase
                  </div>
                  
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3 p-6 bg-slate-50 rounded-3xl w-full border-2 border-dashed border-slate-200 min-h-[200px] mb-8">
                    {players[currentTurnIndex]?.collected.map((card, idx) => (
                      <Card 
                        key={idx} 
                        card={card} 
                        size="sm" 
                        isSelected={giftSelectedIndex === idx}
                        onClick={() => !players[currentTurnIndex].isAI && setGiftSelectedIndex(idx === giftSelectedIndex ? null : idx)}
                      />
                    ))}
                  </div>

                  {giftSelectedIndex !== null && (
                    <div className="flex flex-wrap justify-center gap-3">
                      {players.map((p, idx) => (
                        idx !== currentTurnIndex && (
                          <button 
                            key={idx}
                            onClick={() => handleGift(idx)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                          >
                            TRANSFER TO {p.name}
                          </button>
                        )
                      ))}
                    </div>
                  )}
                  
                  {!players[currentTurnIndex].isAI && giftSelectedIndex === null && (
                    <button onClick={skipGift} className="mt-4 text-slate-400 font-bold hover:text-slate-600 flex items-center gap-2 uppercase tracking-widest text-xs">
                      Skip Resource Transfer <SkipForward size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap justify-center items-center gap-6 mb-12">
                    {tableCards.length === 0 ? (
                      <div className="w-28 h-40 border-4 border-slate-100 border-dashed rounded-3xl flex items-center justify-center opacity-50">
                        <MessageSquare className="text-slate-200" size={32} />
                      </div>
                    ) : (
                      tableCards.map((card, idx) => (
                        <Card 
                          key={card.id} 
                          card={card} 
                          isNew={card.isNew} 
                          onClick={() => gameState === GameState.DISCARD_SELECT && handleDiscard(idx)}
                        />
                      ))
                    )}
                  </div>

                  {/* Actions Area */}
                  {!players[currentTurnIndex]?.isAI && (
                    <div className="flex flex-col md:flex-row gap-4 items-center animate-fade-in-up">
                      {gameState === GameState.FLIP_PHASE && (
                        <button onClick={startTurn} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-3xl text-xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                          DEPLOY CARD <Zap size={24} />
                        </button>
                      )}
                      
                      {gameState === GameState.DECISION_PHASE && (
                        <>
                          <button onClick={collect} className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-5 rounded-3xl text-xl font-black shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                            EXTRACT GOALS <Award size={24} />
                          </button>
                          <button onClick={drawMore} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-5 rounded-3xl text-xl font-black shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                            PUSH LUCK <AlertCircle size={24} />
                          </button>
                        </>
                      )}

                      {gameState === GameState.BUST && (
                        <button onClick={endTurn} className="bg-slate-800 hover:bg-slate-900 text-white px-12 py-5 rounded-3xl text-xl font-black shadow-xl">
                          CONFIRM LOSS
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-slate-900 p-6 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <Users className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase">Active Agent</div>
                    <div className="text-white font-bold tracking-tight">{players[currentTurnIndex]?.name}</div>
                  </div>
               </div>
               {isGettingAdvice && (
                 <div className="flex items-center gap-2 text-blue-400 text-xs font-bold italic animate-pulse">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                   CONSULTING HQ...
                 </div>
               )}
            </div>
          </div>

          {/* Quick Rules Footer */}
          <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 flex flex-wrap gap-8 items-center justify-center">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs font-black text-slate-800 tracking-tight">SDG 1: 2 PTS</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-black text-slate-800 tracking-tight">SDG 2: COUNT+1</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-900"></div>
                <span className="text-xs font-black text-slate-800 tracking-tight">SDG 17: CURVE SCORE</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-black text-slate-800 tracking-tight">TEAM GOAL: 63 PTS</span>
             </div>
          </div>
        </div>
      </main>

      {/* Game Over Modal */}
      {gameState === GameState.GAME_OVER && scoreInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-10 max-w-lg w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border-t-[12px] border-blue-600">
            {scoreInfo.passed ? (
              <CheckCircle size={80} className="text-emerald-500 mx-auto mb-6" />
            ) : (
              <XCircle size={80} className="text-red-500 mx-auto mb-6" />
            )}
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 italic">
              {scoreInfo.passed ? 'MISSION SUCCESS' : 'SYSTEM FAILURE'}
            </h2>
            <p className="text-xl text-slate-500 font-medium mb-8">
              Total Coalition Score: <span className="text-slate-900 font-black">{scoreInfo.total}</span>
            </p>
            <div className="bg-slate-50 rounded-3xl p-6 mb-8 text-left space-y-4">
              {players.map(p => (
                <div key={p.id} className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">{p.name}</span>
                  <span className="text-slate-900 font-black">{p.finalScore} PTS</span>
                </div>
              ))}
            </div>
            <p className="text-slate-400 italic mb-10 leading-relaxed">"{scoreInfo.reason}"</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl text-xl font-black hover:bg-slate-800 transition-all shadow-xl"
            >
              RESTART OPERATION
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return gameState === GameState.INTRO ? renderIntro() : renderBoard();
};

export default App;
