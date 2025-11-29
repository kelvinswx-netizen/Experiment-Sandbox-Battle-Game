import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { BattleScene } from './components/BattleScene';
import { UI } from './components/UI';
import { GamePhase, Team, TerrainType, UnitInstance } from './types';
import { INITIAL_BUDGET } from './constants';

const App: React.FC = () => {
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
  const [units, setUnits] = useState<UnitInstance[]>([]);
  const [winner, setWinner] = useState<Team | null>(null);

  const handleStartBattle = () => {
    // Check if both teams have units
    const hasRed = units.some(u => u.team === Team.RED);
    const hasBlue = units.some(u => u.team === Team.BLUE);

    if (!hasRed || !hasBlue) {
      alert("Both teams must have at least one unit to start!");
      return;
    }

    setSelectedTemplateId(null);
    setPhase(GamePhase.BATTLE);
  };

  const handleReset = () => {
    setPhase(GamePhase.SETUP);
    setUnits([]);
    setBudgets({
      [Team.RED]: INITIAL_BUDGET,
      [Team.BLUE]: INITIAL_BUDGET
    });
    setWinner(null);
  };

  const decreaseBudget = (amount: number) => {
    setBudgets(prev => ({
      ...prev,
      [selectedTeam]: prev[selectedTeam] - amount
    }));
  };

  return (
    <div className="w-full h-screen relative bg-slate-900 overflow-hidden">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 20, 30], fov: 50 }}>
          <BattleScene
            units={units}
            setUnits={setUnits}
            phase={phase}
            setPhase={setPhase}
            terrain={terrain}
            selectedTemplateId={selectedTemplateId}
            selectedTeam={selectedTeam}
            budgets={budgets}
            decreaseBudget={decreaseBudget}
            setWinner={setWinner}
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