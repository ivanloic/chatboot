import { useEffect, useRef, useState } from "react";
import { Paperclip, Mic, Send, Pause, Play, Square, Trash2 } from "lucide-react";

export default function ChatInput({ onSend, onComingSoon }) {
  const [value, setValue] = useState("");
  const [recordingState, setRecordingState] = useState("idle"); // idle | recording | paused | ready
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Références pour l'analyseur audio
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);
  const dataArrayRef = useRef(null);

  // ---------- Utilitaires ----------
  function formatTime(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function clearVoiceTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopVoiceTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function resetVoiceDraft() {
    clearVoiceTimer();
    setRecordingTime(0);
    setVoiceDraft(null);
    setRecordingState("idle");
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    stopVoiceTracks();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsPlaying(false);
    // Arrêter l'animation de l'analyseur
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }

  // ---------- Visualisation audio ----------
  function drawVisualizer() {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = (width / dataArray.length) * 2.5;

    ctx.clearRect(0, 0, width, height);

    analyser.getByteTimeDomainData(dataArray); // ou getByteFrequencyData selon votre préférence

    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const value = dataArray[i] / 128.0; // 0..2, 1 = silence
      const percent = Math.abs(value - 1); // écart par rapport au silence
      const barHeight = percent * height * 0.8;

      // Dégradé de couleur selon l'intensité
      const hue = 30 + percent * 30; // entre orange et rouge
      ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }

    animationRef.current = requestAnimationFrame(drawVisualizer);
  }

  function setupAudioAnalyser(stream) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128; // nombre de barres (64)
    source.connect(analyser);
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    // Configurer le canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = canvas.parentElement.clientWidth - 8;
      canvas.height = 40;
    }

    drawVisualizer();
  }

  // ---------- Gestionnaires ----------
  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  function handleAttachmentPick(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name?.toLowerCase() || "";
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");

    if (isImage) {
      onSend({ type: "image", file, text: "" });
    } else if (isPdf) {
      onSend({ type: "pdf", file, text: "" });
    } else {
      onComingSoon("📎 Seules les images et les PDF sont supportés pour l'instant.");
    }

    event.target.value = "";
  }

  async function startVoiceRecording() {
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      onComingSoon("🎙️ Le micro n'est pas disponible sur ce navigateur");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      setRecordingState("recording");
      setRecordingTime(0);
      clearVoiceTimer();
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const audioUrl = URL.createObjectURL(blob);
          setVoiceDraft({ blob, audioUrl });
          setRecordingState("ready");
        } else {
          setRecordingState("idle");
        }
        clearVoiceTimer();
        stopVoiceTracks();
        mediaRecorderRef.current = null;
        // Arrêter l'analyseur
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        analyserRef.current = null;
      };

      recorder.start();

      // Démarrer l'analyseur après que le flux soit actif
      setupAudioAnalyser(stream);
    } catch (_) {
      onComingSoon("🎙️ Autorise le micro pour envoyer un message vocal");
    }
  }

  function stopVoiceRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      setRecordingState("idle");
    }
  }

  function togglePauseRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      setRecordingState("paused");
      // On peut aussi mettre l'animation en pause (en arrêtant de dessiner)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    } else if (recorder.state === "paused") {
      recorder.resume();
      setRecordingState("recording");
      drawVisualizer(); // redémarrer l'animation
    }
  }

  function cancelVoiceRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    resetVoiceDraft();
  }

  function sendVoiceDraft() {
    if (!voiceDraft?.audioUrl || !voiceDraft?.blob) return;
    onSend({ type: "voice", file: voiceDraft.blob, audioUrl: voiceDraft.audioUrl, text: "" });
    resetVoiceDraft();
  }

  function togglePlayDraft() {
    if (!audioRef.current || !voiceDraft) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  // ---------- Nettoyage ----------
  useEffect(() => {
    return () => {
      clearVoiceTimer();
      stopVoiceTracks();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // ---------- Rendu ----------
  const isRecording = recordingState === "recording" || recordingState === "paused";
  const isReady = recordingState === "ready";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t border-gray-200 bg-white px-3 py-2 sm:px-4"
    >
      {/* Ligne principale */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleAttachmentPick}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-full p-2 text-gray-500 transition hover:bg-orange-50 hover:text-amber-700"
          aria-label="Joindre un fichier"
        >
          <Paperclip size={18} />
        </button>

        <div className="flex flex-1 items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 transition focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isRecording ? "Enregistrement vocal en cours..." : "Écris ton message…"}
            disabled={isRecording}
            className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            if (isRecording) {
              stopVoiceRecording();
            } else if (isReady) {
              sendVoiceDraft();
            } else {
              startVoiceRecording();
            }
          }}
          className={`shrink-0 rounded-full p-2 transition ${
            isRecording
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : isReady
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "text-gray-500 hover:bg-orange-50 hover:text-amber-700"
          }`}
          aria-label={
            isRecording ? "Arrêter l'enregistrement" : isReady ? "Envoyer le vocal" : "Message vocal"
          }
        >
          <Mic size={18} />
        </button>

        <button
          type="submit"
          disabled={!value.trim()}
          className="flex shrink-0 items-center justify-center rounded-full bg-amber-600 p-2.5 text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Envoyer"
        >
          <Send size={17} />
        </button>
      </div>

      {/* Panneau d'enregistrement / vocal prêt */}
      {(isRecording || isReady) && (
        <div className="rounded-2xl border border-gray-200 bg-orange-50/60 p-3 shadow-sm transition-all">
          <div className="flex flex-col gap-2">
            {/* Ligne supérieure : statut + timer + boutons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Indicateur visuel (point) */}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      isRecording ? "bg-red-500 animate-pulse" : "bg-amber-600"
                    }`}
                  />
                  <span className="text-sm font-medium text-gray-800">
                    {isRecording
                      ? recordingState === "paused"
                        ? "En pause"
                        : "Enregistrement…"
                      : "Message vocal prêt"}
                  </span>
                </div>
                <span className="font-mono text-sm text-gray-600">{formatTime(recordingTime)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {isRecording && (
                  <>
                    <button
                      type="button"
                      onClick={togglePauseRecording}
                      className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-1">
                        {recordingState === "paused" ? (
                          <>
                            <Play size={13} /> Reprendre
                          </>
                        ) : (
                          <>
                            <Pause size={13} /> Pause
                          </>
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="rounded-full bg-gray-800 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-gray-900"
                    >
                      <span className="flex items-center gap-1">
                        <Square size={13} /> Arrêter
                      </span>
                    </button>
                  </>
                )}

                {isReady && (
                  <>
                    <button
                      type="button"
                      onClick={togglePlayDraft}
                      className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-1">
                        {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                        {isPlaying ? "Pause" : "Écouter"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={sendVoiceDraft}
                      className="rounded-full bg-amber-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-amber-700"
                    >
                      Envoyer
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={cancelVoiceRecording}
                  className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="flex items-center gap-1">
                    <Trash2 size={13} /> Annuler
                  </span>
                </button>
              </div>
            </div>

            {/* Visualisation des vibrations (barres) */}
            {isRecording && (
              <div className="relative w-full h-10 overflow-hidden rounded-lg bg-white/50">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                  style={{ display: "block" }}
                />
              </div>
            )}
          </div>

          {/* Élément audio caché pour l'écoute du brouillon */}
          {voiceDraft?.audioUrl && (
            <audio
              ref={audioRef}
              src={voiceDraft.audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
        </div>
      )}
    </form>
  );
}