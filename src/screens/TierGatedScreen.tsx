// src/screens/TierGatedScreen.tsx
import TierGate            from '../TierGate';
import type { LearningModule } from '../types';
import { useTiers } from '../useTiers';

interface TierGatedScreenProps {
  activeModule: LearningModule;
  moduleIndex:  number;
  tierData:     ReturnType<typeof useTiers>;
  backToHome:   () => void;
  startModule:  (mod: LearningModule, index: number) => void;
}

export default function TierGatedScreen({
  activeModule, moduleIndex, tierData, backToHome, startModule,
}: TierGatedScreenProps) {
  return (
    <div style={{ paddingTop: '8px' }} className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <button className="btn-ghost" onClick={backToHome}>← Modules</button>
      </div>
      <TierGate
        tierData={tierData}
        moduleIndex={moduleIndex}
        moduleTitle={activeModule.title}
        moduleIcon={activeModule.icon}
        moduleColor={activeModule.color}
        onUnlockSuccess={() => startModule(activeModule, moduleIndex)}
      />
    </div>
  );
}