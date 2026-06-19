import { Moon, Sun, GitFork, Building2 } from 'lucide-react';

interface FloatingControlsProps {
  nightMode: boolean;
  onToggleNight: () => void;
  showForks: boolean;
  onToggleForks: (v: boolean) => void;
  showSkyline: boolean;
  onToggleSkyline: () => void;
}

interface IconBtnProps {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
  night: boolean;
}

function IconBtn({ onClick, active, icon, label, activeColor, night }: IconBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 12,
        background: active ? activeColor : 'transparent',
        border: 'none', cursor: 'pointer', transition: 'all 0.18s ease',
        color: active ? '#ffffff' : (night ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.55)'),
        flexShrink: 0,
      }}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

function Divider({ night }: { night: boolean }) {
  return (
    <div style={{
      width: 1, height: 20, flexShrink: 0,
      background: night ? 'rgba(255,255,255,0.10)' : 'rgba(74,191,176,0.20)',
    }} />
  );
}

export default function FloatingControls({
  nightMode, onToggleNight,
  showForks, onToggleForks,
  showSkyline, onToggleSkyline,
}: FloatingControlsProps) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 12, zIndex: 40,
      display: 'flex', alignItems: 'center', gap: 2,
      background: nightMode ? 'rgba(15,3,21,0.88)' : 'rgba(28,14,6,0.84)',
      border: `1px solid ${nightMode ? 'rgba(255,255,255,0.10)' : 'rgba(74,191,176,0.22)'}`,
      borderRadius: 16,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '4px 6px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
    }}>
      <IconBtn
        active={nightMode}
        onClick={onToggleNight}
        night={nightMode}
        icon={nightMode ? <Moon size={16} /> : <Sun size={16} />}
        label={nightMode ? 'Switch to Day' : 'Switch to Night'}
        activeColor="#6d28d9"
      />
      <Divider night={nightMode} />
      <IconBtn
        active={showForks}
        onClick={() => onToggleForks(!showForks)}
        night={nightMode}
        icon={<GitFork size={15} />}
        label={showForks ? 'Hide Forks' : 'Show Forks'}
        activeColor="#2CA89A"
      />
      <Divider night={nightMode} />
      <IconBtn
        active={showSkyline}
        onClick={onToggleSkyline}
        night={nightMode}
        icon={<Building2 size={15} />}
        label={showSkyline ? 'Hide Skyline' : 'Show Skyline'}
        activeColor="#B84C1F"
      />
    </div>
  );
}
