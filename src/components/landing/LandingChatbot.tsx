import { useState, useRef, useEffect } from "react";
import {
    Bot,
    X,
    Send,
    RotateCcw,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Clock,
    Pill,
    FileText,
} from "lucide-react";
import api from "../../services/api";

interface ChatMessage {
    id: string;
    role: "assistant" | "user";
    text: string;
    time: string;
}

const INITIAL_GREETING: ChatMessage = {
    id: "welcome-msg",
    role: "assistant",
    text: "Hello! 👋 Welcome to the **Tagoloan Community College (TCC) Clinic** AI Assistant.\n\nI can answer questions regarding our clinic location, operating hours, free medicines, medical clearance for class excuses or OJT, and emergency protocols.\n\nHow can I help you today?",
    time: "Just now",
};

const SUGGESTED_QUESTIONS = [
    { label: "📍 Clinic Location", query: "Where is the clinic located on campus?" },
    { label: "🕒 Operating Hours", query: "What are the clinic operating hours?" },
    { label: "💊 Free Medicines", query: "Are medicines and consultations free?" },
    { label: "📋 Medical Certificate", query: "How do I request an official Medical Certificate?" },
    { label: "🚨 Emergency Protocols", query: "What emergency protocols do you follow?" },
    { label: "🩺 Vital Signs Triage", query: "What vital signs and checkups are available?" },
    { label: "👥 Who Can Visit?", query: "Who is eligible to visit the TCC clinic?" },
    { label: "🔐 Portal Access", query: "How do clinic staff log in to the portal?" },
];

export function LandingChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const questionsRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isTyping, isOpen]);

    // Focus input when opening chat
    useEffect(() => {
        if (isOpen) {
            setHasUnread(false);
            setTimeout(() => inputRef.current?.focus(), 250);
        }
    }, [isOpen]);

    const formatCurrentTime = () => {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    // Scroll helper for quick questions container
    const scrollQuestions = (direction: "left" | "right") => {
        if (questionsRef.current) {
            const offset = direction === "left" ? -170 : 170;
            questionsRef.current.scrollBy({ left: offset, behavior: "smooth" });
        }
    };

    // Check if user query is related to TCC Clinic
    const isClinicQuery = (query: string): boolean => {
        const q = query.toLowerCase().trim();

        // Greetings and bot capabilities
        if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|sup|yo|welcome)\b/i.test(q) ||
            /(who\s*are\s*you|what\s*(can|do)\s*you\s*do|help|what\s*is\s*your\s*purpose)/i.test(q) ||
            /(thank\s*you|thanks|salamat|bye|goodbye)/i.test(q)) {
            return true;
        }

        const clinicKeywords = [
            "clinic", "tcc", "campus", "baluarte", "unifast", "tagoloan", "college", "school",
            "health", "medical", "medicine", "meds", "drug", "pill", "dispensary", "pharmacy",
            "vital", "vitals", "sign", "checkup", "check-up", "check up", "triage", "bp", "blood pressure",
            "temperature", "temp", "fever", "chills", "pulse", "heart rate", "oxygen", "spo2",
            "respiratory", "breathing", "height", "weight", "bmi", "physical", "assessment", "exam",
            "doctor", "nurse", "medic", "staff", "patient", "student", "faculty",
            "headache", "pain", "cough", "cold", "flu", "sore throat", "stomach", "dizzy", "nausea",
            "injury", "wound", "cut", "bleed", "burn", "first aid", "bandage", "allergy", "asthma",
            "certificate", "cert", "clearance", "excuse", "ojt", "sports clearance",
            "hour", "time", "open", "close", "schedule", "when", "where", "location", "building", "floor",
            "free", "cost", "fee", "pay", "eligible", "id", "emergency", "ambulance", "hospital",
            "portal", "login", "sign in", "account", "bed", "rest", "observation", "consult"
        ];

        return clinicKeywords.some((kw) => q.includes(kw));
    };

    // Client-side knowledge base fallback if API is unreachable
    const getClientKnowledgeReply = (query: string): string => {
        const q = query.toLowerCase().trim();

        // 1. Strict Scope Check: Reject non-clinic questions
        if (!isClinicQuery(q)) {
            return "I apologize, but I am specifically designed to assist with **Tagoloan Community College (TCC) Clinic** inquiries only.\n\nI can only answer questions related to:\n• **Clinic Operating Hours & Baluarte Campus Location**\n• **Free Dispensary Medicines & Medical Consultations**\n• **Vital Signs Triage & Checkups (BP, Temperature, Pulse, SpO2, BMI)**\n• **Official Medical Certificates & OJT Clearance**\n• **Emergency Protocols & Ambulance Transfer**\n• **Staff Clinic Management Portal Access**\n\nPlease feel free to ask any clinic or campus health question!";
        }

        // 2. Vital Signs & Checkups
        if (
            q.includes("vital") ||
            q.includes("checkup") ||
            q.includes("check-up") ||
            q.includes("check up") ||
            q.includes("triage") ||
            q.includes("blood pressure") ||
            q.includes("bp") ||
            q.includes("pulse") ||
            q.includes("heart rate") ||
            q.includes("temperature") ||
            q.includes("temp") ||
            q.includes("spo2") ||
            q.includes("oxygen") ||
            q.includes("respiratory") ||
            q.includes("bmi") ||
            q.includes("height") ||
            q.includes("weight")
        ) {
            return "🩺 **Vital Signs & Checkups Available at TCC Clinic:**\n\nThe TCC Baluarte Campus Clinic provides comprehensive vital signs assessment and routine primary checkups **100% free of charge** for all students, faculty, and administrative staff:\n\n1. **Blood Pressure (BP) Monitoring:** Routine hypertension screening, hypotension checks, and monitoring for dizziness.\n2. **Body Temperature:** Digital thermometer screening for fevers, chills, and viral infections.\n3. **Heart Rate / Pulse Rate & Rhythm:** Radial pulse count and pulse oximeter evaluation.\n4. **Oxygen Saturation (SpO2):** Rapid fingertip pulse oximetry for respiratory wellness.\n5. **Respiratory Rate:** Breaths-per-minute monitoring for asthma or breathing difficulties.\n6. **Height, Weight & BMI Measurement:** Physical wellness and nutritional status baseline.\n7. **Basic Physical Assessment & Triage:** Evaluation of minor injuries, ear-nose-throat discomfort, abdominal pain triage, and bed-rest observation bay admission.\n\n📍 **Where to Avail:** Ground Floor, Beside UniFAST Building, Baluarte Campus\n🕒 **Clinic Hours:** Monday to Friday, 8:00 AM – 5:00 PM (Walk-ins welcome, just present your TCC ID)";
        }

        // 3. Location
        if (q.includes("where") || q.includes("location") || q.includes("building") || q.includes("locate") || q.includes("find") || q.includes("floor") || q.includes("unifast") || q.includes("address")) {
            return "📍 **Clinic Location:**\nThe TCC Clinic is located on the **Ground Floor, Beside the UniFAST Building** at Baluarte Campus, Tagoloan, Misamis Oriental.\n\nWalk-ins are welcomed during our regular operating hours!";
        }

        // 4. Operating Hours
        if (q.includes("hour") || q.includes("time") || q.includes("open") || q.includes("schedule") || q.includes("when") || q.includes("close")) {
            return "🕒 **Operating Hours:**\nThe TCC Baluarte Campus Clinic is open **Monday through Friday, from 8:00 AM to 5:00 PM**, with active duty registered nurses on site throughout the day.";
        }

        // 5. Cost & Free Services
        if (q.includes("cost") || q.includes("fee") || q.includes("pay") || q.includes("free") || q.includes("price") || q.includes("charge")) {
            return "💊 **Free Health Services:**\nYes! All medical consultations, vital sign checkups, emergency first-aid treatments, and basic dispensary medicines are **100% free of charge** for all TCC students, faculty, and administrative staff.";
        }

        // 6. Medical Certificate & Clearance
        if (q.includes("med cert") || q.includes("certificate") || q.includes("clearance") || q.includes("excuse") || q.includes("ojt") || q.includes("practicum")) {
            return "📋 **Medical Certificate & Health Clearance:**\nTo request an official Medical Certificate for class excuse, sports participation, or OJT clearance:\n1. Visit the clinic in person (Ground Floor, Beside UniFAST Building).\n2. Present your Student ID.\n3. Complete an in-person health assessment with our duty nurse.\n4. An officially signed Medical Certificate will be issued upon clearance.";
        }

        // 7. Emergency Protocols
        if (q.includes("emergency") || q.includes("urgent") || q.includes("ambulance") || q.includes("hospital") || q.includes("severe") || q.includes("accident") || q.includes("rescue")) {
            return "🚨 **Emergency Protocols:**\nIn case of critical emergencies:\n1. The campus clinic team stabilizes the patient immediately.\n2. We coordinate rapid emergency transport with the **Tagoloan Municipal Health Office** and municipal rescue units.\n3. The patient's emergency contact or parents are notified immediately.";
        }

        // 8. Eligibility & Who can visit
        if (q.includes("who") || q.includes("eligible") || q.includes("visitor") || q.includes("student") || q.includes("faculty") || q.includes("requirements")) {
            return "👥 **Eligibility:**\nAll actively enrolled Tagoloan Community College students, faculty members, administrative staff, and official campus visitors are welcome and covered at zero cost. Just bring your TCC ID card!";
        }

        // 9. Symptoms / Sickness
        if (q.includes("fever") || q.includes("headache") || q.includes("pain") || q.includes("cough") || q.includes("sick") || q.includes("cold") || q.includes("dizzy") || q.includes("vomit") || q.includes("stomach") || q.includes("wound")) {
            return "🏥 **Medical Advice & Consultation:**\nFor symptoms like fever, headache, body pain, wounds, or illness, please visit the **TCC Baluarte Campus Clinic** in person (Ground Floor, Beside UniFAST Building). Our registered duty healthcare professionals will assess you and provide free first-aid care and dispensary medicines.\n\n*Clinic Hours: Monday – Friday, 8:00 AM – 5:00 PM.*";
        }

        // 10. Medicines & Dispensary
        if (q.includes("medicine") || q.includes("drug") || q.includes("pill") || q.includes("dispensary") || q.includes("stock") || q.includes("paracetamol")) {
            return "💊 **Available Medications:**\nThe clinic maintains an active stock of essential over-the-counter medicines including analgesics/pain relievers, fever medications (paracetamol), antacids, oral rehydration salts, antihistamines, and antiseptic wound care supplies — all dispensed free of charge upon clinical evaluation.";
        }

        // 11. Portal Login & Access
        if (q.includes("login") || q.includes("sign in") || q.includes("portal") || q.includes("account") || q.includes("access")) {
            return "🔐 **Clinic Management Portal:**\nAuthorized clinic staff, nurses, and administrators can access the system by clicking **'Sign In'** at the top right of this page or visiting [/login](/login).";
        }

        // 12. Greetings
        if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("good morning") || q.includes("good afternoon")) {
            return "Hello! 👋 Welcome to the **Tagoloan Community College (TCC) Clinic** virtual assistant. How can I help you today? You can ask about our campus clinic location, operating hours, free medications, vital signs & checkups, medical certificate procedures, or emergency protocols!";
        }

        return "Thank you for reaching out to the **TCC Clinic Assistant**! 🏥\n\n- **Location:** Ground Floor, Beside UniFAST Building, Baluarte Campus, Tagoloan\n- **Hours:** Monday to Friday, 8:00 AM – 5:00 PM\n- **Services:** Free consultations, vital sign triage, free medicines, and official Medical Certificates.\n\nFor in-person assistance, feel free to walk into the clinic or consult with our on-duty campus nurse!";
    };

    const handleSendMessage = async (textToSend?: string) => {
        const text = (textToSend || input).trim();
        if (!text || isTyping) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            text,
            time: formatCurrentTime(),
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setIsTyping(true);

        try {
            // Build message payload for API
            const apiPayload = updatedMessages
                .filter((m) => m.role === "user" || m.role === "assistant")
                .slice(-10)
                .map((m) => ({
                    role: m.role === "assistant" ? "model" : "user",
                    content: m.text,
                }));

            const response = await api.post("/public-ai-chat", {
                messages: apiPayload,
            });

            const replyText =
                response.data?.message ||
                response.data?.reply ||
                getClientKnowledgeReply(text);

            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-${Date.now()}`,
                    role: "assistant",
                    text: replyText,
                    time: formatCurrentTime(),
                },
            ]);
        } catch (error) {
            console.warn("Public AI Chatbot network notice; using instant smart knowledge fallback:", error);
            const fallbackReply = getClientKnowledgeReply(text);
            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-${Date.now()}`,
                    role: "assistant",
                    text: fallbackReply,
                    time: formatCurrentTime(),
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleResetChat = () => {
        setMessages([INITIAL_GREETING]);
        setInput("");
    };

    // Simple markdown renderer for bolding, bullet points, and links
    const renderFormattedText = (raw: string) => {
        const lines = raw.split("\n");
        return lines.map((line, lIdx) => {
            // Check for bullet list item
            const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
            const cleanLine = isBullet ? line.trim().substring(2) : line;

            // Parse bold (**text**)
            const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
            const renderedLine = parts.map((part, pIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                        <strong key={pIdx} className="font-bold text-[#e5a93b]">
                            {part.slice(2, -2)}
                        </strong>
                    );
                }
                return part;
            });

            if (isBullet) {
                return (
                    <li key={lIdx} className="ml-3.5 list-disc leading-relaxed text-xs sm:text-[13px]">
                        {renderedLine}
                    </li>
                );
            }

            if (!line.trim()) {
                return <div key={lIdx} className="h-1.5" />;
            }

            return (
                <p key={lIdx} className="leading-relaxed text-xs sm:text-[13px]">
                    {renderedLine}
                </p>
            );
        });
    };

    return (
        <aside aria-label="TCC Clinic Virtual Assistant" className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {/* ── EXPANDED CHAT WINDOW ──────────────────────────────────────── */}
            {isOpen && (
                <div className="mb-4 w-[92vw] sm:w-[410px] h-[560px] max-h-[85vh] rounded-3xl border border-[#e5a93b]/40 bg-[#160207] shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#2c040e] via-[#200309] to-[#160207] border-b border-[#70091f]/50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#70091f] to-[#450512] border border-[#e5a93b]/40 shadow-md">
                                <Bot size={20} className="text-[#e5a93b]" />
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#160207]" />
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-1.5">
                                    <h2 className="text-sm font-bold text-white tracking-tight">
                                        TCC Clinic Assistant
                                    </h2>
                                    <span className="rounded-full bg-[#e5a93b]/20 px-2 py-0.5 text-[9px] font-black uppercase text-[#e5a93b] tracking-wider border border-[#e5a93b]/30">
                                        AI
                                    </span>
                                </div>
                                <p className="text-[11px] text-[#fcebe7]/70 flex items-center gap-1">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Active Duty · Baluarte Campus
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleResetChat}
                                title="Reset Conversation"
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <RotateCcw size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                title="Close Assistant"
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X size={17} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-left text-white tcc-scrollbar">
                        {messages.map((msg) => {
                            const isUser = msg.role === "user";
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-[13px] leading-relaxed shadow-md ${
                                            isUser
                                                ? "bg-gradient-to-br from-[#800b24] to-[#60081a] text-white rounded-br-none border border-[#e5a93b]/30"
                                                : "bg-[#22040c] text-[#fcebe7] rounded-bl-none border border-[#70091f]/70"
                                        }`}
                                    >
                                        {isUser ? msg.text : renderFormattedText(msg.text)}
                                    </div>
                                    <span className="mt-1 px-1 text-[10px] text-white/40">
                                        {msg.time}
                                    </span>
                                </div>
                            );
                        })}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div className="flex items-center gap-2 text-left">
                                <div className="rounded-2xl bg-[#22040c] px-4 py-3 rounded-bl-none border border-[#70091f]/70 shadow-md">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-[#e5a93b] animate-bounce [animation-delay:-0.3s]" />
                                        <span className="h-2 w-2 rounded-full bg-[#e5a93b] animate-bounce [animation-delay:-0.15s]" />
                                        <span className="h-2 w-2 rounded-full bg-[#e5a93b] animate-bounce" />
                                    </div>
                                </div>
                                <span className="text-[10px] text-[#e5a93b]/70 font-semibold animate-pulse">
                                    TCC Clinic AI thinking...
                                </span>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* ── SCROLLABLE QUICK QUESTIONS BAR ────────────────────────── */}
                    <div className="border-t border-white/10 bg-[#120105] px-2.5 pt-2 pb-2.5 shrink-0">
                        <div className="flex items-center justify-between px-1 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#e5a93b] flex items-center gap-1">
                                <Sparkles size={11} className="text-[#e5a93b]" />
                                Ask a Question (Scroll to view):
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => scrollQuestions("left")}
                                    title="Scroll left"
                                    className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10 hover:bg-[#e5a93b] hover:text-[#160207] text-[#fcebe7] transition-colors cursor-pointer"
                                >
                                    <ChevronLeft size={12} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollQuestions("right")}
                                    title="Scroll right"
                                    className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10 hover:bg-[#e5a93b] hover:text-[#160207] text-[#fcebe7] transition-colors cursor-pointer"
                                >
                                    <ChevronRight size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Container with Gold Scrollbar and Mouse Wheel Support */}
                        <div
                            ref={questionsRef}
                            onWheel={(e) => {
                                if (e.deltaY !== 0) {
                                    e.currentTarget.scrollLeft += e.deltaY;
                                }
                            }}
                            className="overflow-x-auto tcc-scrollbar-x flex items-center gap-1.5 pb-1.5 pt-0.5 scroll-smooth"
                        >
                            {SUGGESTED_QUESTIONS.map((s, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={isTyping}
                                    onClick={() => handleSendMessage(s.query)}
                                    className="whitespace-nowrap rounded-full bg-white/5 hover:bg-[#70091f] border border-white/15 hover:border-[#e5a93b]/70 px-3 py-1.5 text-[11px] font-medium text-[#fcebe7] hover:text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-sm"
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-gradient-to-t from-[#0e0104] to-[#160207] border-t border-[#70091f]/50 shrink-0">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isTyping}
                                placeholder="Ask about clinic hours, location, meds..."
                                className="flex-1 rounded-2xl bg-white/10 border border-white/10 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#e5a93b]/80 focus:bg-white/15 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#e5a93b] to-[#d69527] text-[#1a080d] font-bold shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                                title="Send message"
                            >
                                <Send size={15} />
                            </button>
                        </form>
                        <p className="mt-1.5 text-center text-[10px] text-white/40">
                            Tagoloan Community College · Baluarte Campus Clinic
                        </p>
                    </div>
                </div>
            )}

            {/* ── FLOATING LAUNCHER BUTTON ──────────────────────────────────── */}
            <div className="flex items-center gap-3">
                {/* Floating pill badge when closed */}
                {!isOpen && hasUnread && (
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="hidden sm:flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2c040e] to-[#1c0309] border border-[#e5a93b]/50 px-4 py-2 shadow-2xl text-left cursor-pointer hover:border-[#e5a93b] hover:scale-105 transition-all duration-300"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-[#e5a93b] animate-ping" />
                        <span className="text-xs font-bold text-white">Ask Clinic AI</span>
                        <span className="text-[10px] font-semibold text-[#e5a93b]">· Online</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    title={isOpen ? "Close AI Assistant" : "Open TCC Clinic AI Chatbot"}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#70091f] via-[#500615] to-[#30030c] border border-[#e5a93b]/60 text-white shadow-2xl shadow-black/80 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
                >
                    {/* Pulsing glow ring */}
                    <span className="absolute -inset-1 rounded-2xl bg-[#e5a93b]/20 blur-sm group-hover:bg-[#e5a93b]/40 transition-all pointer-events-none" />

                    {isOpen ? (
                        <X size={24} className="relative z-10 text-white transition-transform group-hover:rotate-90 duration-300" />
                    ) : (
                        <div className="relative z-10 flex items-center justify-center">
                            <Bot size={26} className="text-[#e5a93b] transition-transform group-hover:scale-110 duration-200" />
                            <Sparkles size={11} className="absolute -top-1.5 -right-1.5 text-yellow-300 animate-pulse" />
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
}
