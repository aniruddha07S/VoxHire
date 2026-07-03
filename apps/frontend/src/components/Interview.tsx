import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Bot, Loader2, PhoneOff, User, Clock, Mic } from "lucide-react";
import { Button } from "./ui/button";
import { VoiceOrb } from "./VoiceOrb";

type Status = "connecting" | "live" | "ending";

/** Attaches an analyser to a stream and returns a getter for its current 0..1 volume level. */
function createLevelMeter(ctx: AudioContext, stream: MediaStream) {
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    return () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            const v = (data[i]! - 128) / 128;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        // Boost and clamp so normal speech fills most of the range.
        return Math.min(1, rms * 3.2);
    };
}

/** Format seconds into mm:ss */
function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function Interview() {
    const { interviewId } = useParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState<Status>("connecting");
    const [aiLevel, setAiLevel] = useState(0);
    const [userLevel, setUserLevel] = useState(0);
    const [elapsed, setElapsed] = useState(0);

    // Resources we need to tear down on exit.
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const userStreamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const rafRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const pc = new RTCPeerConnection();
            pcRef.current = pc;

            const audioCtx = new AudioContext();
            audioCtxRef.current = audioCtx;
            let aiMeter: (() => number) | null = null;
            let userMeter: (() => number) | null = null;

            // Play + meter the AI's audio.
            const audioEl = document.createElement("audio");
            audioEl.autoplay = true;
            pc.ontrack = (e) => {
                const stream = e.streams[0]!;
                audioEl.srcObject = stream;
                aiMeter = createLevelMeter(audioCtx, stream);
            };

            // Capture the user's microphone.
            const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (cancelled) {
                ms.getTracks().forEach((t) => t.stop());
                return;
            }
            userStreamRef.current = ms;
            userMeter = createLevelMeter(audioCtx, ms);

            // Stream the mic to Deepgram for live transcription.
            const socket = new WebSocket(`wss://api.deepgram.com/v1/listen?access_token=b30bc926b2a36c4082cc77b8385faa461b0a1a6d`)
                
                //TODO: Lets create ephemereal api keys for the user and not put the prod key on the frontend


            socketRef.current = socket;

            socket.onopen = () => {
                const mediaRecorder = new MediaRecorder(ms, { mimeType: "audio/webm" });
                recorderRef.current = mediaRecorder;
                mediaRecorder.start(250);
                mediaRecorder.addEventListener("dataavailable", (event) => {
                    if (socket.readyState === WebSocket.OPEN) socket.send(event.data);
                });
            };

            socket.onmessage = (message) => {
                const received = JSON.parse(message.data);
                const transcript = received.channel?.alternatives[0]?.transcript;
                if (transcript) {
                    axios.post(`${BACKEND_URL}/api/v1/session/user/response/${interviewId}`, {
                        message: transcript,
                    });
                }
            };

            pc.addTrack(ms.getTracks()[0]!);

            // SDP handshake with the backend.
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const sdpResponse = await fetch(`${BACKEND_URL}/api/v1/session/${interviewId}`, {
                method: "POST",
                body: offer.sdp,
                headers: { "Content-Type": "application/sdp" },
            });
            const answer = { type: "answer" as const, sdp: await sdpResponse.text() };
            await pc.setRemoteDescription(answer);

            if (cancelled) return;
            setStatus("live");

            // Start elapsed timer
            timerRef.current = setInterval(() => {
                setElapsed((prev) => prev + 1);
            }, 1000);

            // Single animation loop drives both volume meters.
            const tick = () => {
                if (aiMeter) setAiLevel(aiMeter());
                if (userMeter) setUserLevel(userMeter());
                rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
        })();

        return () => {
            cancelled = true;
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interviewId]);

    function cleanup() {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
        socketRef.current?.close();
        userStreamRef.current?.getTracks().forEach((t) => t.stop());
        pcRef.current?.getSenders().forEach((s) => s.track?.stop());
        pcRef.current?.close();
        audioCtxRef.current?.close().catch(() => {});
    }

    function endInterview() {
        setStatus("ending");
        cleanup();
        navigate(`/result/${interviewId}`);
    }

    const aiSpeaking = aiLevel > 0.06 && aiLevel >= userLevel;
    const userSpeaking = userLevel > 0.06 && userLevel > aiLevel;

    return (
        <main className="flex h-screen w-screen flex-col overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
                <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <div className={`
                        flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium
                        border backdrop-blur-sm transition-all duration-500
                        ${status === "live"
                            ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300"
                            : "border-amber-500/20 bg-amber-500/[0.06] text-amber-300"
                        }
                    `}>
                        <span className="relative flex size-2">
                            <span
                                className={
                                    status === "live"
                                        ? "absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
                                        : "hidden"
                                }
                            />
                            <span
                                className={
                                    "relative inline-flex size-2 rounded-full " +
                                    (status === "live" ? "bg-emerald-400" : "bg-amber-400")
                                }
                            />
                        </span>
                        {status === "connecting" ? "Connecting…" : status === "ending" ? "Wrapping up…" : "Interview Live"}
                    </div>

                    {/* Timer */}
                    {status === "live" && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground/60 animate-fade-in">
                            <Clock className="size-3.5" />
                            <span className="font-mono tabular-nums">{formatTime(elapsed)}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1.5 backdrop-blur-sm">
                        <Mic className="size-3" />
                        AI Interview
                    </div>
                </div>
            </header>

            {/* Stage */}
            <div className="flex flex-1 items-center justify-center px-6">
                {status === "connecting" ? (
                    <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
                        {/* Animated loading orb */}
                        <div className="relative">
                            <div className="size-20 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/10 grid place-items-center">
                                <Loader2 className="size-8 animate-spin text-teal-400" />
                            </div>
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: "radial-gradient(circle, rgba(45, 212, 191, 0.1), transparent 70%)",
                                    animation: "pulse-glow 2s ease-in-out infinite",
                                }}
                            />
                        </div>
                        <div>
                            <p className="text-base font-medium text-foreground/80">Setting up your interview</p>
                            <p className="text-sm text-muted-foreground/50 mt-1">
                                Preparing microphone & AI interviewer…
                            </p>
                        </div>
                        {/* Connection steps */}
                        <div className="flex flex-col gap-2 mt-2">
                            {["Initializing audio", "Connecting to AI", "Starting session"].map((step, i) => (
                                <div
                                    key={step}
                                    className="flex items-center gap-2 text-xs text-muted-foreground/40 animate-fade-in-up"
                                    style={{ animationDelay: `${i * 300 + 300}ms` }}
                                >
                                    <div className="size-1 rounded-full bg-teal-400/40" />
                                    {step}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex w-full max-w-3xl items-center justify-center gap-16 sm:gap-28 animate-scale-in">
                        <VoiceOrb
                            level={aiLevel}
                            speaking={aiSpeaking}
                            label="Interviewer"
                            sublabel="Listening"
                            icon={Bot}
                            accent="cyan"
                        />
                        <VoiceOrb
                            level={userLevel}
                            speaking={userSpeaking}
                            label="You"
                            sublabel="Mic on"
                            icon={User}
                            accent="emerald"
                        />
                    </div>
                )}
            </div>

            {/* Controls */}
            <footer className="flex justify-center px-6 py-8 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <Button
                    id="end-interview-btn"
                    variant="destructive"
                    size="lg"
                    onClick={endInterview}
                    disabled={status === "ending"}
                    className="gap-2 rounded-full px-8 py-5 text-sm font-semibold bg-gradient-to-r from-red-500/80 to-rose-500/80 hover:from-red-500 hover:to-rose-500 border border-red-500/20 shadow-[0_4px_20px_rgba(239,68,68,0.2)] hover:shadow-[0_8px_30px_rgba(239,68,68,0.3)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                >
                    {status === "ending" ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <PhoneOff className="size-4" />
                    )}
                    End interview
                </Button>
            </footer>
        </main>
    );
}
