import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Bot, Loader2, Sparkles, User, ArrowRight, BarChart3, MessageSquare, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ResultData {
    transcript: { type: "Assistant" | "User"; content: string; createdAt: string }[];
    score: number;
    feedback: string;
    status: "Done" | "InProgress" | "Pre";
}

/** Animated score ring */
function ScoreRing({ score }: { score: number }) {
    const percentage = (score / 10) * 100;
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getScoreColor = () => {
        if (score >= 8) return { stroke: "#10b981", glow: "rgba(16, 185, 129, 0.3)", text: "text-emerald-400", label: "Excellent" };
        if (score >= 6) return { stroke: "#2dd4bf", glow: "rgba(45, 212, 191, 0.3)", text: "text-teal-400", label: "Good" };
        if (score >= 4) return { stroke: "#06b6d4", glow: "rgba(6, 182, 212, 0.3)", text: "text-cyan-400", label: "Average" };
        return { stroke: "#f59e0b", glow: "rgba(245, 158, 11, 0.3)", text: "text-amber-400", label: "Needs work" };
    };

    const colors = getScoreColor();

    return (
        <div className="relative flex flex-col items-center animate-scale-in" style={{ animationDelay: "200ms" }}>
            {/* Glow behind the ring */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
                style={{
                    background: `radial-gradient(circle, ${colors.glow}, transparent 70%)`,
                    filter: "blur(20px)",
                }}
            />
            <svg className="size-36 -rotate-90 relative z-10" viewBox="0 0 120 120">
                {/* Background ring */}
                <circle
                    cx="60" cy="60" r="54"
                    fill="none"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="6"
                />
                {/* Score arc */}
                <circle
                    cx="60" cy="60" r="54"
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                    style={{
                        filter: `drop-shadow(0 0 8px ${colors.glow})`,
                    }}
                />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
                <span className={cn("text-4xl font-bold tracking-tight", colors.text)}>
                    {score}
                </span>
                <span className="text-sm text-muted-foreground/60">/10</span>
            </div>
            <span className={cn("text-xs font-medium mt-3", colors.text)}>{colors.label}</span>
        </div>
    );
}

/** Loading state with animated pulses */
function AnalyzingState() {
    return (
        <div className="flex flex-col items-center justify-center gap-8 py-24 text-center animate-fade-in">
            {/* Animated orb */}
            <div className="relative">
                <div className="size-24 rounded-full bg-gradient-to-br from-teal-500/10 to-cyan-500/5 grid place-items-center animate-pulse">
                    <Sparkles className="size-10 text-teal-400/60" />
                </div>
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: "radial-gradient(circle, rgba(45, 212, 191, 0.08), transparent 70%)",
                        animation: "pulse-glow 2s ease-in-out infinite",
                    }}
                />
                {/* Spinning ring */}
                <div
                    className="absolute -inset-4 rounded-full border border-teal-500/10"
                    style={{ animation: "spin-slow 8s linear infinite" }}
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-teal-400/60" />
                </div>
            </div>

            <div>
                <p className="text-lg font-semibold text-foreground/80">Analyzing your interview…</p>
                <p className="mt-2 text-sm text-muted-foreground/50 max-w-sm">
                    Our AI is reviewing your responses and generating personalized feedback. This usually takes a few seconds.
                </p>
            </div>

            {/* Shimmer bar */}
            <div className="w-48 h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-full shimmer rounded-full" />
            </div>
        </div>
    );
}

export function Result() {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState<ResultData>({
        score: 0,
        feedback: "",
        transcript: [],
        status: "Pre",
    });

    useEffect(() => {
        const fetchResult = () =>
            axios.get(`${BACKEND_URL}/api/v1/result/${interviewId}`).then((response) => {
                setResult(response.data);
                return response.data.status as ResultData["status"];
            });

        fetchResult();
        const intervalId = setInterval(async () => {
            const s = await fetchResult();
            if (s === "Done") clearInterval(intervalId);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [interviewId]);

    const ready = result.status === "Done";

    return (
        <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12 relative z-10">
            {/* Header */}
            <header className="mb-10 flex items-center justify-between animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        <span className="text-foreground">Interview </span>
                        <span className="gradient-text">Results</span>
                    </h1>
                    <p className="mt-1.5 text-sm text-muted-foreground/60">
                        Your feedback and full conversation transcript
                    </p>
                </div>
                <Button
                    id="new-interview-btn"
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="gap-2 rounded-xl border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-teal-500/20 transition-all duration-300"
                >
                    <RotateCcw className="size-3.5" />
                    New interview
                </Button>
            </header>

            {!ready ? (
                <AnalyzingState />
            ) : (
                <div className="flex flex-col gap-8">
                    {/* Score + feedback card */}
                    <section
                        className="animate-fade-in-up rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl interactive-card"
                        style={{ animationDelay: "200ms" }}
                    >
                        <div className="flex flex-col sm:flex-row items-center gap-8">
                            {/* Score ring */}
                            <ScoreRing score={result.score} />

                            {/* Feedback */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-sm font-medium text-teal-300 mb-4">
                                    <Sparkles className="size-4" />
                                    AI Feedback
                                </div>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/75">
                                    {result.feedback}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
                        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 flex items-center gap-3 interactive-card">
                            <div className="size-10 rounded-lg bg-teal-500/10 grid place-items-center">
                                <MessageSquare className="size-4.5 text-teal-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-foreground">{result.transcript.length}</p>
                                <p className="text-xs text-muted-foreground/50">Messages exchanged</p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 flex items-center gap-3 interactive-card">
                            <div className="size-10 rounded-lg bg-emerald-500/10 grid place-items-center">
                                <BarChart3 className="size-4.5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-foreground">{result.score}/10</p>
                                <p className="text-xs text-muted-foreground/50">Overall score</p>
                            </div>
                        </div>
                    </div>

                    {/* Transcript */}
                    <section className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
                        <h2 className="mb-5 text-sm font-medium text-muted-foreground/60 flex items-center gap-2">
                            <MessageSquare className="size-3.5" />
                            Conversation transcript
                        </h2>
                        <div className="flex flex-col gap-4">
                            {result.transcript.length === 0 && (
                                <p className="text-sm text-muted-foreground/40 text-center py-12">
                                    No messages were recorded for this interview.
                                </p>
                            )}
                            {result.transcript.map((m, i) => {
                                const isAi = m.type === "Assistant";
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex gap-3 animate-fade-in-up",
                                            isAi ? "justify-start" : "flex-row-reverse",
                                        )}
                                        style={{ animationDelay: `${600 + i * 60}ms` }}
                                    >
                                        <div
                                            className={cn(
                                                "grid size-8 shrink-0 place-items-center rounded-full text-white shadow-md",
                                                isAi
                                                    ? "bg-gradient-to-br from-teal-400 to-cyan-500"
                                                    : "bg-gradient-to-br from-emerald-300 to-green-500",
                                            )}
                                        >
                                            {isAi ? (
                                                <Bot className="size-4" />
                                            ) : (
                                                <User className="size-4" />
                                            )}
                                        </div>
                                        <div
                                            className={cn(
                                                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all duration-200",
                                                isAi
                                                    ? "rounded-tl-sm bg-white/[0.03] border border-white/[0.04] text-foreground/80"
                                                    : "rounded-tr-sm bg-gradient-to-r from-teal-500/15 to-cyan-500/10 border border-teal-500/10 text-foreground/85",
                                            )}
                                        >
                                            {m.content}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Try again CTA */}
                    <div className="flex justify-center pt-4 pb-8 animate-fade-in-up" style={{ animationDelay: "700ms" }}>
                        <Button
                            onClick={() => navigate("/")}
                            className="gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-400 hover:to-cyan-400 border-0 shadow-[0_4px_20px_rgba(45,212,191,0.2)] hover:shadow-[0_8px_30px_rgba(45,212,191,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] px-6 py-5"
                        >
                            Start another interview
                            <ArrowRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </main>
    );
}
