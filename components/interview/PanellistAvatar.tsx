import type { PanellistPersona } from "@/types";

const PANELLIST_CONFIG = {
  hiring_manager: {
    label: "Hiring Manager",
    abbrev: "HM",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    desc: "Evaluating impact & fit",
  },
  senior_engineer: {
    label: "Senior Engineer",
    abbrev: "SE",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    desc: "Probing technical depth",
  },
  peer_engineer: {
    label: "Peer Engineer",
    abbrev: "PE",
    color: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    desc: "Exploring collaboration",
  },
};

interface PanellistAvatarProps {
  persona: PanellistPersona;
  speaking?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PanellistAvatar({ persona, speaking = false, size = "md" }: PanellistAvatarProps) {
  const config = PANELLIST_CONFIG[persona];
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`
        ${sizeClasses[size]} rounded-full border-2 flex items-center justify-center font-bold flex-shrink-0
        ${config.color}
        ${speaking ? "ring-2 ring-offset-1 ring-offset-[#0f1117] ring-green-400" : ""}
      `}>
        {config.abbrev}
      </div>
      {size !== "sm" && (
        <div>
          <p className="text-foreground text-sm font-medium leading-tight">{config.label}</p>
          {speaking && <p className="text-green-400 text-xs">Speaking...</p>}
          {!speaking && <p className="text-slate-500 text-xs">{config.desc}</p>}
        </div>
      )}
    </div>
  );
}
