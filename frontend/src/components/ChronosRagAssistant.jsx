import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Bot, User, Terminal, Eye, CornerDownLeft, AlertCircle } from 'lucide-react';

export default function ChronosRagAssistant({ isOpen, onClose, activeViolations, onActivateCamera, isStreaming, onSetStreaming, setGreenCorridorActive }) {
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
    "Triple riding on Begum Amin Road",
    "Lookup vehicle plate KA-03-HA-8821",
    "Show safety hotspots",
    "Signal timing recommendation"
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

    const normQuery = query.toLowerCase();
    const isGreenCorridorQuery = normQuery.includes('green corridor') && (normQuery.includes('hospital') || normQuery.includes('emergency'));

    if (isGreenCorridorQuery && setGreenCorridorActive) {
      setGreenCorridorActive(true);
    }
    
    // Choose thinking steps based on query
    let steps = [
      'Scanning local chroma vectors...',
      'Retrieving violation records...',
      'Synthesizing contextual response...'
    ];
    
    if (isGreenCorridorQuery) {
      steps = [
        'Locating active transit paths to Apollo Hospital...',
        'Chronos is authenticating security override token...',
        'Broadcasting signal grid control override signals...'
      ];
    } else if (normQuery.includes('triple riding') && (normQuery.includes('begum amin') || normQuery.includes('begur amin') || normQuery.includes('amin road'))) {
      steps = [
        'Searching chroma vector index for "triple riding"...',
        'Filtering results on node "CAM-BEGUM-AMIN-ROAD"...',
        'Extracting target bounding box and license plate...'
      ];
    } else if (normQuery.includes('helmet') && normQuery.includes('stats')) {
      steps = [
        'Querying daily violation database for "No Helmet"...',
        'Calculating hourly frequency distribution...',
        'Aggregating spatial hotspots...'
      ];
    } else if (normQuery.includes('critical') || normQuery.includes('risk') || normQuery.includes('alert') || normQuery.includes('hotspot')) {
      steps = [
        'Retrieving active critical incidents list...',
        'Checking dispatcher connection status...',
        'Validating geolocation data...'
      ];
    } else if (normQuery.includes('lookup') || normQuery.includes('plate') || normQuery.includes('vahan')) {
      steps = [
        'Connecting to BTP Vahan Database API...',
        'Searching vehicle registration for plate index...',
        'Parsing owner credentials and active citations...'
      ];
    } else if (normQuery.includes('congestion') || normQuery.includes('signal') || normQuery.includes('timing')) {
      steps = [
        'Aggregating traffic congestion flow metrics...',
        'Calculating junction waiting time index...',
        'Drafting signal cycle optimization rules...'
      ];
    }

    let stepIdx = 0;
    setThinkingStep(steps[0]);

    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setThinkingStep(steps[stepIdx]);
      }
    }, 500);

    // Simulate RAG response with custom delay
    const delayTime = isGreenCorridorQuery ? 1200 : 1500;
    setTimeout(() => {
      clearInterval(stepInterval);
      setIsThinking(false);

      let reply = '';

      if (isGreenCorridorQuery) {
        if (setGreenCorridorActive) {
          setGreenCorridorActive(true);
        }
        reply = `⚠️ EMERGENCY PROTOCOL INITIATED. Encryption Token Validated. Signal grid overrides dispatched along the route to Apollo Hospital. Ground directives synchronized.`;
      } else if (normQuery.includes('triple riding') && (normQuery.includes('begum amin') || normQuery.includes('begur amin') || normQuery.includes('amin road') || normQuery.includes('begumamin') || normQuery.includes('beguramin'))) {
        reply = `Searching BTP RAG Vector Store... 1 Match Found. \nViolation: Triple Riding \nLocation: Begum Amin Road Cam \nPlate: KA-03-HA-8821 \nConfidence: 94%. \nWould you like me to draft an E-Challan for this incident?`;
      } else if (normQuery.includes('helmet') && normQuery.includes('stats')) {
        reply = `Analyzing daily logs... There have been 14 'No Helmet' violations flagged across all active nodes in the last 2 hours. Peak frequency occurred at Silk Board Junction.`;
      } else if (normQuery.includes('critical') || normQuery.includes('risk') || normQuery.includes('alert')) {
        reply = `Scanning active alerts... Detected 3 high-severity Wrong-Side Driving events on Begum Amin Road Cam in the last hour. All dispatch statuses are: ACTIVE - BTP Rapid Response Team en route.`;
      } else if (normQuery.includes('lookup') || normQuery.includes('plate') || normQuery.includes('vahan')) {
        reply = `Connecting to BTP Vahan Database Registry API...\n\nLicense Plate: KA-03-HA-8821\nVehicle Owner: Rajesh Kumar Gowda\nVehicle Class: Two-Wheeler (Honda Activa 6G)\nRegistration Date: 12-Oct-2022\nActive Challans Pending: 2 (Total Fine: ₹1,000)\n\nNote: License status is active. Owner details mapped to citation index.`;
      } else if (normQuery.includes('congestion') || normQuery.includes('signal') || normQuery.includes('timing')) {
        reply = `Retrieving historical traffic flow telemetry for CAM-BEGUM-AMIN-ROAD...\n\nCongestion Index: 7.2/10 (High)\nPeak congestion observed: 09:30 AM - 11:00 AM and 05:45 PM - 07:15 PM.\n\nRecommendation: Adjust signaling cycle on Begum Amin Intersection to +20 seconds green-time to clear inbound queues.`;
      } else if (normQuery.includes('hotspot') || normQuery.includes('safety')) {
        reply = `Generating spatial density map of safety violations (last 24 hours)...\n\nTop Hotspots:\n1. Begum Amin Road Cam (12 incidents of Wrong-Side Driving) - Risk Score: CRITICAL\n2. Silk Board Underpass (8 incidents of Lane Splitting) - Risk Score: HIGH\n3. Hebbal Outer Ramp (4 incidents of Speeding) - Risk Score: MEDIUM\n\nPlan: Suggesting BTP patrol placement at Begum Amin exit lane during shift change.`;
      } else if (normQuery.includes('dispatch') || normQuery.includes('auto-intercept')) {
        reply = `BTP Dispatch Automation System Status: ONLINE.\n\nRule Profile: Automatically dispatch intercept unit if:\n- Severity = CRITICAL\n- Confirmed Confidence > 92%\n\nTrigger Event: Wrong-Side Driving detected on CAM-BEGUM-AMIN-ROAD.\nStatus: Intercept Unit B-12 dispatched automatically (ETA: 4 minutes).`;
      } else if (normQuery.includes('system') || normQuery.includes('health') || normQuery.includes('gpu') || normQuery.includes('latency')) {
        reply = `OMNI-GAZE System Telemetry Diagnostics:\n- Active Camera Streams: 3/4\n- AI Edge Model Load: 74%\n- GPU Temperature: 68°C\n- Average Inference Latency: 38ms\n- Frame Processing Rate: 30 FPS\n- Network Upload Health: 99.9%`;
      } else if (normQuery.includes('camera') || normQuery.includes('cameras') || normQuery.includes('node') || normQuery.includes('nodes')) {
        reply = `BTP edge registry retrieved:\n- CAM-BEGUM-AMIN-ROAD (Active, 30 FPS, HD Stream)\n- CAM-SILK-BOARD (Active, 30 FPS, SD Stream)\n- CAM-HEBBAL-FLYOVER (Active, 30 FPS, SD Stream)\n- CAM-OUTER-RING-ROAD (Standby, node health 99.8%)`;
      } else if (normQuery.includes('accuracy') || normQuery.includes('performance') || normQuery.includes('metrics')) {
        reply = `Model Performance Metrics:\n- Average Inference Confidence: 92.5%\n- False Positive Rate: < 1.4%\n- Inference Node Latency: 42ms\n- Precision-Recall AUC: 0.965`;
      } else if (normQuery.includes('challan') || normQuery.includes('e-challan')) {
        reply = `E-Challan automation status: ACTIVE.\nIntegrated with BTP Vahan Database API.\nTo draft an E-Challan, select any log entry from the Real-Time Violation Feed on your dashboard and click [ Issue E-Challan ].`;
      } else if (normQuery.includes('weekly') || normQuery.includes('report') || normQuery.includes('summary')) {
        reply = `Generating Weekly Incident Report Summary...\n\n- Total Inferences Processed: 148,924\n- Confirmed Violations: 1,842\n- E-Challans Dispatched: 1,622\n- Collection Rate: 78.4%\n- Top violation type: No Helmet (54% of total).`;
      } else if (normQuery.includes('begum amin') || normQuery.includes('begur amin') || normQuery.includes('amin road') || normQuery.includes('begumamin') || normQuery.includes('beguramin')) {
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
      } else {
        reply = `Query received. Routing through the Semantic Search Pipeline... Please specify a camera node or violation type to narrow down the context.`;
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }]);
    }, delayTime);
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
