import React, { useCallback, useEffect, useRef, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip } from "recharts";
import {
  Brain,
  Mic,
  MicOff,
  X,
  CheckCircle,
  Send,
  Loader2,
  Sparkles,
  Volume2
} from "lucide-react";
import { staticDataService } from "../services/staticDataService";
import { resolveIcon } from "../utils/iconMap";
import { useAppSelector } from "../app/hooks";
import { apiConnector } from "../services/apiConnector";

// ─── Speech Recognition helper ───────────────────────────────────────────────
const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// ─── Voice Talk Modal ─────────────────────────────────────────────────────────
function TalkModal({ onClose, token, assistantContext, voicePrompts }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi! I'm your AI performance coach. Ask me anything about your scores, or pick a prompt below.",
      id: Date.now()
    }
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [poweredBy, setPoweredBy] = useState(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Start / stop mic ──────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      alert("Your browser does not support voice input. Please type your question.");
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // auto-send voice input
      setTimeout(() => sendMessage(transcript), 200);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []); // eslint-disable-line

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (overrideText) => {
      const text = (overrideText ?? input).trim();
      if (!text || loading) return;

      const userMsg = { role: "user", text, id: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const response = await apiConnector({
          method: "POST",
          url: "/api/v1/assistant/ask",
          token,
          body: {
            question: text,
            context: assistantContext || {}
          }
        });

        const data = response?.data || response;
        const aiMsg = {
          role: "ai",
          text: data.answer || "I couldn't generate a response. Please try again.",
          id: Date.now() + 1
        };
        setPoweredBy(data.poweredBy || null);
        setMessages((prev) => [...prev, aiMsg]);

        // Text-to-speech
        if ("speechSynthesis" in window && aiMsg.text) {
          const utterance = new SpeechSynthesisUtterance(aiMsg.text);
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: "Sorry, I couldn't connect to the coaching service. Please make sure the server is running.",
            id: Date.now() + 2
          }
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, token, assistantContext]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg flex flex-col rounded-[28px] bg-white shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">AI Performance Coach</p>
              <p className="text-teal-100 text-xs">
                {poweredBy === "gemini" ? (
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Powered by Gemini</span>
                ) : "Ask me anything about your scores"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {messages.map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-[#0F766E] text-white px-4 py-2.5 text-sm leading-relaxed">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center mt-0.5">
                  <Brain className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-slate-100 px-4 py-2.5 text-sm text-slate-700 leading-relaxed">
                  {msg.text}
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-[#0F766E] animate-spin" />
                <span className="text-sm text-slate-500">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        {voicePrompts?.length > 0 && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {voicePrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                  className="flex-shrink-0 rounded-full border border-[#0F766E]/30 bg-teal-50 px-3 py-1.5 text-xs text-[#0F766E] font-medium hover:bg-teal-100 transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input row */}
        <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {/* Mic button */}
            <button
              onClick={listening ? stopListening : startListening}
              disabled={loading}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                listening
                  ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200"
                  : "bg-[#0F766E] text-white hover:bg-[#0D6460]"
              } disabled:opacity-50`}
              title={listening ? "Stop listening" : "Start voice input"}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening ? "Listening…" : "Type or use the mic…"}
              disabled={loading || listening}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 transition-all disabled:opacity-60"
            />

            {/* Send button */}
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0F766E] text-white flex items-center justify-center hover:bg-[#0D6460] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          {listening && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Listening — speak your question now
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AiInsightsPage() {
  const { token } = useAppSelector((state) => state.auth);
  const [quickInsights, setQuickInsights] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [performanceSummary, setPerformanceSummary] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [trainingPlan, setTrainingPlan] = useState([]);
  const [voicePrompts, setVoicePrompts] = useState([]);
  const [assistantContext, setAssistantContext] = useState(null);
  const [showTalkModal, setShowTalkModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await staticDataService.getAiInsights(token);
        if (data.quickInsights) {
          setQuickInsights(
            data.quickInsights.map((item) => ({
              ...item,
              icon: resolveIcon(item.icon, Brain)
            }))
          );
        }
        if (data.trendData) setTrendData(data.trendData);
        if (data.recommendations) setRecommendations(data.recommendations);
        if (data.performanceSummary) setPerformanceSummary(data.performanceSummary);
        if (data.predictions) setPredictions(data.predictions);
        if (data.trainingPlan) setTrainingPlan(data.trainingPlan);
        if (data.voicePrompts) setVoicePrompts(data.voicePrompts);
        if (data.assistantContext) setAssistantContext(data.assistantContext);
      } catch (e) {
        console.warn("Failed to load AI insights static data:", e);
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] p-6 lg:ml-[280px]">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0F766E] to-[#14B8A6] rounded-[32px] p-8 text-white h-[320px] flex items-center justify-between">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold">AI Performance Coach</h1>
          <p className="mt-3 text-slate-100">
            Your personal golf &amp; impact assistant — voice-enabled coaching, predictions and tailored plans.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowTalkModal(true)}
              disabled={assistantContext?.canAskAssistant === false}
              title={assistantContext?.canAskAssistant === false ? "Log at least 3 scores to unlock" : "Start a voice session"}
              className="h-12 px-6 rounded-xl bg-white text-[#0F766E] font-semibold hover:bg-teal-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-4 h-4" /> Start Voice Session
            </button>
            <button
              onClick={() => document.getElementById("ai-insights-section")?.scrollIntoView({ behavior: "smooth" })}
              className="h-12 px-6 rounded-xl border border-white/30 bg-transparent text-white font-semibold hover:bg-white/10 transition-colors"
            >
              View Insights
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-white/30 to-transparent flex items-center justify-center shadow-[0_10px_40px_rgba(20,184,166,0.25)]">
            <button
              onClick={() => setShowTalkModal(true)}
              disabled={assistantContext?.canAskAssistant === false}
              title={assistantContext?.canAskAssistant === false ? "Log at least 3 scores to unlock" : "Talk to your AI coach"}
              className="w-28 h-28 rounded-full bg-white/10 flex flex-col items-center justify-center gap-1 hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Brain className="w-10 h-10 text-white" />
              <span className="text-white text-sm font-semibold">Talk</span>
            </button>
          </div>
        </div>
      </div>

      <div id="ai-insights-section" className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Quick Insight Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickInsights.map((q) => {
            const Icon = q.icon;
            return (
              <div key={q.label} className="rounded-[20px] bg-white p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500">{q.label}</div>
                    <div className="mt-2 text-2xl font-bold">{q.value}</div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
                    <Icon className="w-5 h-5 text-[#0F766E]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Voice Assistant Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[28px] p-6 border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">AI Voice Assistant</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Tap the button to start a voice coaching session.
                </p>
              </div>
              <Volume2 className="w-5 h-5 text-[#0F766E]" />
            </div>

            {/* Talk button */}
            <div className="mt-6 flex items-center justify-center">
              <button
                onClick={() => setShowTalkModal(true)}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex flex-col items-center justify-center text-white font-bold gap-2 shadow-[0_8px_30px_rgba(15,118,110,0.35)] hover:shadow-[0_12px_40px_rgba(15,118,110,0.5)] hover:scale-105 active:scale-95 transition-all"
              >
                <Mic className="w-8 h-8" />
                <span className="text-xl">Talk</span>
              </button>
            </div>

            {/* Voice prompt chips */}
            <div className="mt-6 grid gap-2">
              {voicePrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => setShowTalkModal(true)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 text-left hover:border-[#0F766E] hover:text-[#0F766E] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Performance Summary */}
          {performanceSummary ? (
            <div className="bg-white rounded-[28px] p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold">Performance Summary</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div>
                  Current Average:{" "}
                  <strong className="text-[#0F766E]">{performanceSummary.currentAverage}</strong>
                </div>
                <div>
                  Best Score: <strong>{performanceSummary.bestScore}</strong>
                </div>
                <div>
                  Worst Score: <strong>{performanceSummary.worstScore}</strong>
                </div>
                <div>
                  Most Improved Month: <strong>{performanceSummary.mostImprovedMonth}</strong>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-6">
          <div className="bg-[#F0FDFA] rounded-[28px] p-6 border border-[#99F6E4]">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0F766E]" /> AI Recommendations
            </h3>
            <div className="mt-4 space-y-3">
              {recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm">
                  <CheckCircle className="w-5 h-5 mt-0.5 text-[#22C55E] flex-shrink-0" />
                  <div className="text-sm font-medium">{r}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Predictions */}
        {predictions ? (
          <div className="lg:col-span-6">
            <div className="bg-white rounded-[28px] p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold">Future Predictions</h3>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <div className="text-xs text-slate-500 mb-1">Predicted Score</div>
                  <strong className="text-2xl text-[#0F766E]">{predictions.predictedScore}</strong>
                </div>
                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <div className="text-xs text-slate-500 mb-1">Chance Top 5</div>
                  <strong className="text-2xl text-[#F59E0B]">{predictions.chanceTop5}</strong>
                </div>
                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <div className="text-xs text-slate-500 mb-1">Expected Wins</div>
                  <strong className="text-2xl">{predictions.expectedWins}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Trend Chart */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[28px] p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold">Performance Trends</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="predFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#E6F6F3" />
                  <Tooltip />
                  <Area dataKey="actual" name="Actual" stroke="#0F766E" fill="url(#actualFill)" />
                  <Area dataKey="predicted" name="Predicted" stroke="#F59E0B" fill="url(#predFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Training Plan */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[28px] p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold">AI Training Plan</h3>
            <div className="mt-4 space-y-3 text-sm">
              {trainingPlan.map((line, index) => (
                <div key={line} className={index === 0 ? "font-semibold text-[#0F766E]" : "text-slate-600"}>
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* CTA to open assistant */}
          <button
            onClick={() => setShowTalkModal(true)}
            className="w-full rounded-[20px] bg-gradient-to-r from-[#0F766E] to-[#14B8A6] p-5 text-white flex items-center gap-4 hover:shadow-lg hover:shadow-teal-200 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold">Ask your AI Coach</p>
              <p className="text-sm text-teal-100 mt-0.5">Voice or text — get instant coaching</p>
            </div>
          </button>
        </div>
      </div>

      {/* Talk Modal */}
      {showTalkModal && (
        <TalkModal
          onClose={() => setShowTalkModal(false)}
          token={token}
          assistantContext={assistantContext}
          voicePrompts={voicePrompts}
        />
      )}
    </div>
  );
}
