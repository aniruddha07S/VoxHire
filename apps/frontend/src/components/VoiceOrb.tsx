import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface VoiceOrbProps {
    /** Normalized volume level, 0..1 */
    level: number;
    /** Whether this participant is the active/loud speaker right now */
    speaking: boolean;
    label: string;
    sublabel: string;
    icon: LucideIcon;
    /** tailwind color family used for the accent */
    accent: "cyan" | "emerald";
}

const ACCENTS = {
    cyan: {
        core: "from-teal-400 via-cyan-400 to-sky-500",
        glow: "45, 212, 191",
        ring: "border-teal-400/30",
        text: "text-teal-300",
        bars: "bg-teal-400",
        shadow: "rgba(45, 212, 191, 0.15)",
        pulseColor: "rgba(45, 212, 191, 0.2)",
    },
    emerald: {
        core: "from-emerald-300 via-green-400 to-teal-500",
        glow: "16, 185, 129",
        ring: "border-emerald-400/30",
        text: "text-emerald-300",
        bars: "bg-emerald-400",
        shadow: "rgba(16, 185, 129, 0.15)",
        pulseColor: "rgba(16, 185, 129, 0.2)",
    },
} as const;

export function VoiceOrb({ level, speaking, label, sublabel, icon: Icon, accent }: VoiceOrbProps) {
    const a = ACCENTS[accent];
    const clamped = Math.min(1, Math.max(0, level));
    const scale = 1 + clamped * 0.35;
    const glowSize = 20 + clamped * 80;
    const Icon_ = Icon;

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="relative grid h-56 w-56 place-items-center">
                {/* Outer ripple rings on speaking */}
                {speaking && (
                    <>
                        <div
                            className={cn("absolute inset-0 rounded-full border", a.ring)}
                            style={{
                                animation: "ripple 2s ease-out infinite",
                                opacity: 0.3,
                            }}
                        />
                        <div
                            className={cn("absolute inset-0 rounded-full border", a.ring)}
                            style={{
                                animation: "ripple 2s ease-out 0.5s infinite",
                                opacity: 0.2,
                            }}
                        />
                        <div
                            className={cn("absolute inset-0 rounded-full border", a.ring)}
                            style={{
                                animation: "ripple 2s ease-out 1s infinite",
                                opacity: 0.1,
                            }}
                        />
                    </>
                )}

                {/* Outer reactive ring */}
                <div
                    className={cn(
                        "absolute inset-2 rounded-full border transition-all duration-200",
                        a.ring,
                    )}
                    style={{
                        transform: `scale(${1 + clamped * 0.2})`,
                        opacity: 0.25 + clamped * 0.5,
                    }}
                />

                {/* Secondary ring */}
                <div
                    className={cn("absolute h-44 w-44 rounded-full border transition-all duration-200", a.ring)}
                    style={{
                        transform: `scale(${1 + clamped * 0.12})`,
                        opacity: 0.3 + clamped * 0.4,
                    }}
                />

                {/* Glow blob behind the orb */}
                <div
                    className="absolute inset-0 rounded-full transition-all duration-300"
                    style={{
                        background: `radial-gradient(circle at 50% 50%, ${a.pulseColor}, transparent 70%)`,
                        transform: `scale(${1.2 + clamped * 0.3})`,
                        opacity: speaking ? 0.8 : 0.3,
                        filter: "blur(20px)",
                    }}
                />

                {/* Core orb with morph animation */}
                <div
                    className={cn(
                        "relative grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br text-white transition-transform duration-150",
                        a.core,
                    )}
                    style={{
                        transform: `scale(${scale})`,
                        boxShadow: `
                            0 0 ${glowSize}px rgba(${a.glow}, ${0.3 + clamped * 0.5}),
                            inset 0 -4px 12px rgba(0, 0, 0, 0.15),
                            inset 0 2px 8px rgba(255, 255, 255, 0.15)
                        `,
                        animation: speaking ? "blob-morph 4s ease-in-out infinite" : "floaty 6s ease-in-out infinite",
                        borderRadius: speaking ? undefined : "50%",
                    }}
                >
                    {/* Shine overlay */}
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
                            borderRadius: "inherit",
                        }}
                    />
                    <Icon_ className="size-10 relative z-10 drop-shadow-lg" strokeWidth={1.75} />
                </div>
            </div>

            {/* Equalizer bars driven by the volume level */}
            <div className="flex h-8 items-end gap-[3px]">
                {[0.5, 0.7, 0.9, 1, 0.85, 0.65, 0.4].map((weight, i) => (
                    <span
                        key={i}
                        className={cn(
                            "w-[3px] rounded-full transition-all duration-100",
                            speaking ? a.bars : "bg-white/10",
                        )}
                        style={{
                            height: `${Math.max(4, clamped * weight * 28)}px`,
                            opacity: speaking ? 0.7 + clamped * 0.3 : 0.2,
                            boxShadow: speaking ? `0 0 6px rgba(${a.glow}, 0.3)` : "none",
                        }}
                    />
                ))}
            </div>

            <div className="text-center">
                <p className={cn("text-sm font-semibold tracking-wide", speaking ? a.text : "text-foreground")}>
                    {label}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {speaking ? (
                        <span className="flex items-center justify-center gap-1">
                            <span className="relative flex size-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                                <span className="relative inline-flex size-1.5 rounded-full bg-current" />
                            </span>
                            Speaking…
                        </span>
                    ) : (
                        sublabel
                    )}
                </p>
            </div>
        </div>
    );
}
