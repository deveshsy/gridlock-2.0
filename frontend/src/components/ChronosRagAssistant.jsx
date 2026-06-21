import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Bot, User, Terminal, Eye, CornerDownLeft, AlertCircle } from 'lucide-react';

export default function ChronosRagAssistant({ isOpen, onClose, activeViolations, onActivateCamera, isStreaming, onSetStreaming }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'SYSTEM ONLINE. I am Chronos, your RAG Traffic Intelligence Copilot. Ask me questions about camera feeds, incident tracking, or violation analytics. Try asking: "Open Begum Amin Road Cam".',
      timestamp: new Date(Date.now() - 600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 2,
      sender: 'user',
      text: 'Are there any critical safety issues on the highway right now?',
      timestamp: new Date(Date.now() - 400000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 3,
      sender: 'bot',
      text: 'RAG database retrieves 2 "Wrong-Side Driving" violations on Begum Amin Road Cam within the last hour. All are flagged as critical risk. I suggest checking the dashboard live feed for active alerts.',
      timestamp: new Date(Date.now() - 390000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Suggested Prompts
  const suggestedPrompts = [
    "Open Begum Amin Road Cam",
    "Report for Wrong-Side Driving",
    "Identify peak violation types",
    "Explain average accuracy score"
  ];

  const handleSendMessage = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // AI Thinking state simulation with RAG retrieval sub-steps
    const steps = [
      'Scanning local chroma vectors...',
      'Retrieving violation records...',
      'Synthesizing contextual response...'
    ];

    let stepIdx = 0;
    setThinkingStep(steps[0]);

    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setThinkingStep(steps[stepIdx]);
      }
    }, 500);

    // Simulate RAG response after 1.5 seconds
    setTimeout(() => {
      clearInterval(stepInterval);
      setIsThinking(false);

      let reply = '';
      const normQuery = query.toLowerCase();

      if (normQuery.includes('begum amin') || normQuery.includes('begur amin') || normQuery.includes('amin road') || normQuery.includes('begumamin') || normQuery.includes('beguramin')) {
        if (onActivateCamera) {
          onActivateCamera('CAM-BEGUM-AMIN-ROAD');
        }
        if (onSetStreaming) {
          onSetStreaming(true);
        }
        reply = `[SYSTEM COMMAND INITIATED] Connecting live feed for Begum Amin Road Camera node. Channel initialized successfully on port 8001. Live stream is now active on your dashboard.`;
      } else if (normQuery.includes('stop') || normQuery.includes('pause') || normQuery.includes('halt') || normQuery.includes('shutdown')) {
        if (onSetStreaming) {
          onSetStreaming(false);
        }
        reply = `[SYSTEM COMMAND INITIATED] Stopping live video feed. Telemetry analysis paused. Node is standby.`;
      } else if (normQuery.includes('start') || normQuery.includes('restart') || normQuery.includes('resume') || normQuery.includes('play')) {
        if (onSetStreaming) {
          onSetStreaming(true);
        }
        reply = `[SYSTEM COMMAND INITIATED] Restarting live video feed. Active telemetry analysis resumed at 30 FPS.`;
      } else if (normQuery.includes('wrong-side') || normQuery.includes('wrong side')) {
        const wrongSideCount = activeViolations.filter(v => v.type === 'Wrong-Side Driving').length;
        reply = `Found ${wrongSideCount} active "Wrong-Side Driving" violations in the current loop. The latest involved a White Sedan (Suzuki Dzire) or Black Scooter on CAM-BEGUM-AMIN-ROAD with a confidence score of 92%. Recommendation: Dispatch intercept unit to Begum Amin Road.`;
      } else if (normQuery.includes('report') || normQuery.includes('viol-')) {
        const latest = activeViolations.find(v => v.id.startsWith('VIOL-CSB')) || { id: 'VIOL-2026-X', type: 'Unspecified', plate: 'N/A', vehicle: 'Unknown', speed: 0, confidence: 0.90 };
        reply = `[INCIDENT REPORT GENERATED]
ID: ${latest.id}
Type: ${latest.type}
Target Plate: ${latest.plate}
Model: ${latest.vehicle}
Speed Recorded: ${latest.speed} km/h
Neural Confidence: ${(latest.confidence * 100).toFixed(0)}%
Status: Logged to BTP database.`;
      } else if (normQuery.includes('confidence') || normQuery.includes('accuracy')) {
        reply = `The edge neural array is reporting an Average Inference Accuracy of 92.5% across active cameras. Edge node is running healthy at 99.8%.`;
      } else if (normQuery.includes('type') || normQuery.includes('peak') || normQuery.includes('violation')) {
        reply = `Peak violation types detected in this session are "Wrong-Side Driving" (critical risk) and "No Helmet" (medium risk) on CAM-BEGUM-AMIN-ROAD.`;
      } else {
        reply = `Retrieving database: I found ${activeViolations.length} records matching current session indicators. Active camera channel: CAM-BEGUM-AMIN-ROAD. How else can I assist with surveillance telemetry?`;
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }]);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950 z-40 lg:hidden"
          />

          {/* Chat Slide-out Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white border-l border-slate-200 z-50 flex flex-col shadow-lg"
          >
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-4 animate-pulse">
                <div className="relative flex-shrink-0 h-14 w-14 rounded-full overflow-hidden border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)] bg-slate-900">
                  <img
                    src="/chronos-avatar.png"
                    alt="Chronos AI"
                    className="object-cover h-full w-full"
                  />
                </div>
                <div className="text-left">
                  <h2 className="text-xs font-bold font-sans text-slate-800 tracking-wider uppercase">Chronos RAG Co-Pilot</h2>
                  <p className="text-[9px] text-[#2874f0] font-sans flex items-center gap-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    KNOWLEDGE BASE: ACTIVE
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-left font-sans text-xs border ${
                      msg.sender === 'user'
                        ? 'bg-blue-50 border-blue-200 text-slate-850'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[9px] text-slate-450 font-semibold uppercase">
                      {msg.sender === 'user' ? (
                        <>
                          <User className="h-3 w-3 text-[#2874f0]" />
                          <span>OPERATOR</span>
                        </>
                      ) : (
                        <>
                          <Bot className="h-3 w-3 text-slate-550" />
                          <span>CHRONOS AI</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="font-mono text-[8px]">{msg.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}

              {/* Animated AI Thinking State */}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-slate-50 border border-slate-200 font-sans text-xs text-slate-650">
                    <div className="flex items-center gap-1.5 mb-1.5 text-[9px] text-slate-550 font-semibold uppercase">
                      <Bot className="h-3 w-3 text-slate-400" />
                      <span>RAG AGENT QUERYING</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[#2874f0] text-[10px] font-mono">
                        &gt; {thinkingStep}
                      </p>
                      <div className="flex gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-[#2874f0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-[#2874f0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-[#2874f0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Panel */}
            <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50">
              <p className="text-[9px] text-slate-500 font-sans mb-1.5 uppercase font-bold tracking-wider">Suggested Queries</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[9px] px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-600 hover:text-[#2874f0] transition-all font-sans font-semibold text-left cursor-pointer shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Ask Chronos about camera logs..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2874f0]/50 focus:ring-1 focus:ring-[#2874f0]/20 font-sans shadow-sm"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="absolute right-1.5 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-md transition-all cursor-pointer shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 flex justify-between items-center text-[9px] font-sans text-slate-450 font-medium">
                <span className="flex items-center gap-1">
                  <Terminal className="h-3 w-3 text-slate-400" />
                  Press Enter to submit query
                </span>
                <span>Chronos Copilot v2.4</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
