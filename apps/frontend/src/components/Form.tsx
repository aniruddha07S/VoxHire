import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { BACKEND_URL } from "@/lib/config";
import { useNavigate } from "react-router";
import { ArrowRight, Github, Loader2, Mic, Sparkles, Zap, Shield, BarChart3 } from "lucide-react";

/** Animated waveform visualization */
function WaveformVisual() {
    const bars = 24;
    return (
        <div className="flex items-center justify-center gap-[3px] h-12 opacity-40">
            {Array.from({ length: bars }, (_, i) => {
                const height = Math.sin((i / bars) * Math.PI) * 28 + 4;
                return (
                    <div
                        key={i}
                        className="w-[2px] rounded-full bg-gradient-to-t from-teal-500 to-cyan-400"
                        style={{
                            height: `${height}px`,
                            animation: `wave 1.5s ease-in-out ${i * 0.06}s infinite`,
                            // @ts-ignore
                            "--wave-height": `${height}px`,
                        } as React.CSSProperties}
                    />
                );
            })}
        </div>
    );
}

/** Feature pill component */
function FeaturePill({ icon: Icon, text, delay }: { icon: React.ElementType; text: string; delay: string }) {
    return (
        <div
            className="animate-fade-in-up flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all duration-300 hover:border-teal-500/20 hover:bg-teal-500/[0.05] hover:text-teal-300"
            style={{ animationDelay: delay }}
        >
            <Icon className="size-3.5 text-teal-400" />
            {text}
        </div>
    );
}

/** Animated stat counter */
function StatCounter({ value, label, suffix, delay }: { value: string; label: string; suffix?: string; delay: string }) {
    return (
        <div
            className="animate-fade-in-up text-center"
            style={{ animationDelay: delay }}
        >
            <div className="text-2xl font-bold gradient-text">{value}{suffix}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
    );
}

export function Form() {
    const [github, setGithub] = useState("");
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    async function onSubmit() {
        if (!github.trim()) {
            toast("Please provide a valid GitHub URL");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${BACKEND_URL}/api/v1/pre-interview`, {
                github: github.trim(),
            });
            navigate(`/interview/${response.data.id}`);
        } catch (e) {
            toast("Something went wrong starting your interview. Please try again.");
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden px-6 py-12 relative">
            {/* Hero section */}
            <div className="flex w-full max-w-2xl flex-col items-center text-center relative z-10">

                {/* Badge */}
                <div
                    className="animate-fade-in-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-teal-500/15 bg-teal-500/[0.06] px-4 py-2 text-xs font-medium text-teal-300 backdrop-blur-sm"
                    style={{ animationDelay: "100ms" }}
                >
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-teal-400" />
                    </span>
                    AI-Powered Voice Interview Platform
                </div>

                {/* Main heading */}
                <h1
                    className="animate-fade-in-up text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
                    style={{ animationDelay: "200ms" }}
                >
                    <span className="gradient-text gradient-text-glow">VoxHire</span>
                </h1>

                {/* Waveform visual */}
                <div className="animate-fade-in my-6" style={{ animationDelay: "350ms" }}>
                    <WaveformVisual />
                </div>

                {/* Subtitle */}
                <p
                    className="animate-fade-in-up max-w-lg text-base sm:text-lg text-muted-foreground leading-relaxed"
                    style={{ animationDelay: "400ms" }}
                >
                    Drop your GitHub profile and start a live, voice-driven technical interview
                    tailored to your work. Get{" "}
                    <span className="text-teal-300 font-medium">instant AI feedback</span>{" "}
                    when you're done.
                </p>

                {/* Input area */}
                <div
                    className="animate-slide-up mt-10 w-full max-w-lg"
                    style={{ animationDelay: "500ms" }}
                >
                    <div
                        className={`
                            relative flex items-center gap-2 rounded-2xl p-2
                            border backdrop-blur-xl transition-all duration-500
                            ${focused
                                ? "border-teal-500/30 bg-white/[0.04] shadow-[0_0_40px_rgba(45,212,191,0.08),0_8px_32px_rgba(0,0,0,0.2)]"
                                : "border-white/[0.06] bg-white/[0.02] shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
                            }
                        `}
                    >
                        {/* Animated border glow on focus */}
                        {focused && (
                            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-teal-500/20 via-cyan-500/10 to-emerald-500/20 -z-10 blur-sm" />
                        )}

                        <div className={`flex items-center pl-3 transition-colors duration-300 ${focused ? "text-teal-400" : "text-muted-foreground"}`}>
                            <Github className="size-5" />
                        </div>
                        <Input
                            ref={inputRef}
                            id="github-url-input"
                            value={github}
                            placeholder="https://github.com/your-username"
                            onChange={(e) => setGithub(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !loading && onSubmit()}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            disabled={loading}
                            className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm sm:text-base placeholder:text-white/20"
                        />
                        <Button
                            id="start-interview-btn"
                            disabled={loading}
                            onClick={onSubmit}
                            size="lg"
                            className="shrink-0 gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-400 hover:to-cyan-400 border-0 shadow-[0_4px_20px_rgba(45,212,191,0.25)] hover:shadow-[0_8px_30px_rgba(45,212,191,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Starting…
                                </>
                            ) : (
                                <>
                                    Start interview
                                    <ArrowRight className="size-4" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Helper text */}
                    <p className="mt-3 text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
                        <Mic className="size-3" />
                        We'll ask for microphone access once your interview begins
                    </p>
                </div>

                {/* Feature pills */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                    <FeaturePill icon={Zap} text="Real-time AI voice" delay="600ms" />
                    <FeaturePill icon={Shield} text="GitHub-tailored questions" delay="700ms" />
                    <FeaturePill icon={BarChart3} text="Instant scoring" delay="800ms" />
                    <FeaturePill icon={Sparkles} text="Gemini feedback" delay="900ms" />
                </div>

                {/* Stats */}
                <div
                    className="mt-14 flex items-center gap-10 sm:gap-16"
                >
                    <StatCounter value="<2" suffix="min" label="Setup time" delay="800ms" />
                    <div className="h-8 w-px bg-white/5" />
                    <StatCounter value="AI" label="Interviewer" delay="900ms" />
                    <div className="h-8 w-px bg-white/5" />
                    <StatCounter value="10" suffix="pt" label="Score system" delay="1000ms" />
                </div>
            </div>

            {/* Bottom decorative gradient */}
            <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-0" />
        </main>
    );
}
