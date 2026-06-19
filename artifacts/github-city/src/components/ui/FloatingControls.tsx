import { Moon, Sun, GitFork, Building2 } from 'lucide-react';

interface FloatingControlsProps {
  nightMode: boolean;
  onToggleNight: () => void;
  showForks: boolean;
  onToggleForks: (v: boolean) => void;
  showSkyline: boolean;
  onToggleSkyline: () => void;
}

export default function FloatingControls({
  nightMode, onToggleNight,
  showForks, onToggleForks,
  showSkyline, onToggleSkyline,
}: FloatingControlsProps) {
  const panelBg = nightMode ? 'bg-[#0F0315]/85 border-white/10' : 'bg-[#1C0E06]/80 border-[#4ABFB0]/20';

  return (
    <div className="fixed bottom-6 right-3 z-40 flex flex-col gap-2">
      <ToggleBtn
        active={nightMode}
        onClick={onToggleNight}
        panelBg={panelBg}
        icon={nightMode
          ? <Moon size={18} className="text-purple-400" />
          : <Sun size={18} className="text-[#F0A882]" />
        }
        label={nightMode ? 'Day' : 'Night'}
        activeColor="bg-purple-700"
      />
      <ToggleBtn
        active={showForks}
        onClick={() => onToggleForks(!showForks)}
        panelBg={panelBg}
        icon={<GitFork size={16} className={showForks ? 'text-[#4ABFB0]' : 'text-white/40'} />}
        label="Forks"
        activeColor="bg-[#2CA89A]"
      />
      <ToggleBtn
        active={showSkyline}
        onClick={onToggleSkyline}
        panelBg={panelBg}
        icon={<Building2 size={16} className={showSkyline ? 'text-[#F0A882]' : 'text-white/40'} />}
        label="Skyline"
        activeColor="bg-[#B84C1F]"
      />
    </div>
  );
}

function ToggleBtn({
  active, onClick, panelBg, icon, label, activeColor,
}: {
  active: boolean; onClick: () => void;
  panelBg: string; icon: React.ReactNode;
  label: string; activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border min-h-[44px] text-xs font-medium transition-colors backdrop-blur-md shadow-lg ${
        active
          ? `${activeColor} text-white border-transparent`
          : `${panelBg} text-white/60`
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
