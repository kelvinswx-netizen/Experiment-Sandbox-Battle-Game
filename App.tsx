import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { BattleScene } from './components/BattleScene';
import { UI } from './components/UI';
import { GamePhase, Team, TerrainType } from './types';
import { INITIAL_BUDGET } from './constants';

const App: React.FC = () => {
  const [gameKey, setGameKey] = useState(0); // Used to force full reset of BattleScene
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SETUP);
  const [terrain, setTerrain] = useState<TerrainType>(TerrainType.GRASS);
  
  // Selection State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team>(Team.RED);
  
  // Game State
  const [budgets, setBudgets] = useState<Record<Team, number>>({
    [Team.RED]: INITIAL_BUDGET,
    [Team.BLUE]: INITIAL_BUDGET
  });
  const [winner, setWinner] = useState<Team | null>(null);

  // Status Check (Managed via callback from BattleScene)
  const [teamStatus, setTeamStatus] = useState({ red: false, blue: false });

  const handleStartBattle = () => {
    if (!teamStatus.red || !teamStatus.blue) {
      alert("Both teams must have at least one unit to start!");
      return;
    }
    setSelectedTemplateId(null);
    setPhase(GamePhase.BATTLE);
  };

  const handleReset = () => {
    // Incrementing key forces BattleScene to remount, clearing internal unit state
    setGameKey(k => k + 1); 
    setPhase(GamePhase.SETUP);
    setBudgets({
      [Team.RED]: INITIAL_BUDGET,
      [Team.BLUE]: INITIAL_BUDGET
    });
    setWinner(null);
    setTeamStatus({ red: false, blue: false });
  };

  const decreaseBudget = (amount: number) => {
    setBudgets(prev => ({
      ...prev,
      [selectedTeam]: prev[selectedTeam] - amount
    }));
  };

  // Callback to receive updates from BattleScene without constantly re-rendering App for positions
  const onTeamStatusChange = useCallback((hasRed: boolean, hasBlue: boolean) => {
    setTeamStatus({ red: hasRed, blue: hasBlue });
  }, []);

  return (
    <div className="w-full h-screen relative bg-slate-900 overflow-hidden">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 20, 30], fov: 50 }}>
          <BattleScene
            key={gameKey} // Force reset when gameKey changes
            phase={phase}
            setPhase={setPhase}
            terrain={terrain}
            selectedTemplateId={selectedTemplateId}
            selectedTeam={selectedTeam}
            budgets={budgets}
            decreaseBudget={decreaseBudget}
            setWinner={setWinner}
            onTeamStatusChange={onTeamStatusChange}
          />
        </Canvas>
      </div>

      {/* UI Layer */}
      <UI
        phase={phase}
        terrain={terrain}
        setTerrain={setTerrain}
        selectedTemplateId={selectedTemplateId}
        setSelectedTemplateId={setSelectedTemplateId}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        budgets={budgets}
        onStartBattle={handleStartBattle}
        onReset={handleReset}
        winner={winner}
      />
    </div>
  );
};

export default App;