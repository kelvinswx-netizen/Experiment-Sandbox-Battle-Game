import React from 'react';
import { UnitTemplate, Team, TerrainType, GamePhase, AttackType } from '../types';
import { UNIT_TEMPLATES, INITIAL_BUDGET } from '../constants';
import { Swords, Shield, Heart, Zap, RotateCcw, Play, Coins } from 'lucide-react';

interface UIProps {
  phase: GamePhase;
  terrain: TerrainType;
  setTerrain: (t: TerrainType) => void;
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  selectedTeam: Team;
  setSelectedTeam: (team: Team) => void;
  budgets: Record<Team, number>;
  onStartBattle: () => void;
  onReset: () => void;
  winner: Team | null;
}

export const UI: React.FC<UIProps> = ({
  phase,
  terrain,
  setTerrain,
  selectedTemplateId,
  setSelectedTemplateId,
  selectedTeam,
  setSelectedTeam,
  budgets,
  onStartBattle,
  onReset,
  winner
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
      {/* Top Bar: Game Stats & Controls */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 text-white border border-white/10 shadow-lg">
          <h1 className="text-xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">
            BattleSandbox 3D
          </h1>
          {phase === GamePhase.SETUP && (
            <div className="flex gap-2 mb-2">
              <span className="text-sm text-gray-400">Terrain:</span>
              <select 
                value={terrain}
                onChange={(e) => setTerrain(e.target.value as TerrainType)}
                className="bg-gray-800 border border-gray-600 rounded text-xs px-2 py-1 outline-none"
              >
                {Object.values(TerrainType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex gap-6 mt-3">
             <div className={`flex items-center gap-2 ${selectedTeam === Team.RED ? 'text-red-400 font-bold' : 'text-red-400/70'}`}>
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                Red Budget: ${budgets[Team.RED]}
             </div>
             <div className={`flex items-center gap-2 ${selectedTeam === Team.BLUE ? 'text-blue-400 font-bold' : 'text-blue-400/70'}`}>
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                Blue Budget: ${budgets[Team.BLUE]}
             </div>
          </div>
        </div>

        {/* Phase Control */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl p-2 border border-white/10 pointer-events-auto">
          {phase === GamePhase.SETUP ? (
            <button
              onClick={onStartBattle}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-900/50"
            >
              <Play size={18} /> START BATTLE
            </button>
          ) : (
            <button
              onClick={onReset}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
            >
              <RotateCcw size={18} /> RESET GAME
            </button>
          )}
        </div>
      </div>

      {/* Game Over Screen */}
      {phase === GamePhase.GAME_OVER && winner && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border-2 border-white/10 p-8 rounded-2xl shadow-2xl text-center max-w-md animate-bounce-in">
            <h2 className={`text-4xl font-black mb-4 ${winner === Team.RED ? 'text-red-500' : 'text-blue-500'}`}>
              {winner} TEAM WINS!
            </h2>
            <p className="text-gray-400 mb-6">The battle has ended. The {winner.toLowerCase()} army annihilated the opposition.</p>
            <button
              onClick={onReset}
              className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Bottom Bar: Unit Selection (Only visible in setup) */}
      {phase === GamePhase.SETUP && (
        <div className="w-full flex flex-col gap-4 pointer-events-auto">
          {/* Team Selector Toggle */}
          <div className="flex self-center bg-black/50 backdrop-blur rounded-full p-1 border border-white/10">
            <button
              onClick={() => setSelectedTeam(Team.RED)}
              className={`px-6 py-1.5 rounded-full text-sm font-bold transition-all ${
                selectedTeam === Team.RED ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              RED TEAM
            </button>
            <button
              onClick={() => setSelectedTeam(Team.BLUE)}
              className={`px-6 py-1.5 rounded-full text-sm font-bold transition-all ${
                selectedTeam === Team.BLUE ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              BLUE TEAM
            </button>
          </div>

          {/* Unit Cards */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
            {UNIT_TEMPLATES.map((unit) => {
              const isAffordable = budgets[selectedTeam] >= unit.cost;
              const isSelected = selectedTemplateId === unit.id;
              
              return (
                <button
                  key={unit.id}
                  onClick={() => setSelectedTemplateId(unit.id)}
                  disabled={!isAffordable}
                  className={`
                    relative group flex flex-col items-start min-w-[160px] p-3 rounded-xl border transition-all duration-200
                    ${isSelected ? 'bg-white/10 border-yellow-400 scale-105' : 'bg-black/60 border-white/5 hover:bg-white/5'}
                    ${!isAffordable ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex justify-between w-full mb-1">
                    <span className="font-bold text-white text-sm">{unit.name}</span>
                    <span className="text-xs font-mono text-yellow-400 flex items-center">
                       <Coins size={10} className="mr-1"/> {unit.cost}
                    </span>
                  </div>
                  
                  {/* Visual Indicator of Color */}
                  <div className="w-full h-1 rounded-full mb-2" style={{ backgroundColor: unit.color }}></div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full text-[10px] text-gray-300">
                    <div className="flex items-center gap-1"><Heart size={10} className="text-pink-500"/> {unit.stats.maxHp}</div>
                    <div className="flex items-center gap-1"><Swords size={10} className="text-orange-500"/> {unit.stats.atk}</div>
                    <div className="flex items-center gap-1"><Shield size={10} className="text-blue-500"/> {unit.stats.def}</div>
                    <div className="flex items-center gap-1">
                      <Zap size={10} className={unit.attackType === AttackType.PHYSICAL ? 'text-gray-400' : 'text-purple-400'}/> 
                      {unit.attackType === AttackType.PHYSICAL ? 'Phys' : 'Magic'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};