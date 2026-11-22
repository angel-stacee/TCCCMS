import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import {
    ArrowLeft,
    Bot,
    Clock,
    History,
    MessageSquare,
    Plus,
    RotateCcw,
    Send,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import api from "../../services/api";
import { addClinicNotification } from "../../services/notifications";

const AI_QUICK_REPLIES = [
    "Add a new patient",
    "How many clinic visits were recorded this month?",
    "How many medicines are low or out of stock?",
    "How do I record a clinic visit?",
    "What can you help me with?",
];

const AI_GREETING =
    "Hello! I can help with clinic workflows and aggregate dashboard counts, plus general health education. I can't view individual patient records or provide a diagnosis. What would you like help with?";

export type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    text: string;
    timestamp?: number;
    error?: boolean;
};

export type ChatSession = {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
};

const STORAGE_KEY = "tcc-ai-chat-sessions-v1";
const ACTIVE_SESSION_KEY = "tcc-ai-active-session-id-v1";

function createNewSession(): ChatSession {
    const now = Date.now();
    return {
        id: `session-${now}-${Math.random().toString(36).slice(2, 7)}`,
        title: "New Conversation",
        createdAt: now,
        updatedAt: now,
        messages: [
            {
                id: `ai-greeting-${now}`,
                role: "assistant",
                text: AI_GREETING,
                timestamp: now,
            },
        ],
    };
}

function loadSavedSessions(): ChatSession[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch {
        // ignore parse error
    }
    return [createNewSession()];
}

function loadInitialActiveSessionId(currentSessions: ChatSession[]): string {
    try {
        const savedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (savedActiveId && currentSessions.some((s) => s.id === savedActiveId)) {
            return savedActiveId;
        }
    } catch {
        // ignore storage error
    }

    // Pick the most recent session with user interaction
    const sessionWithMessages = currentSessions.find((s) =>
        s.messages.some((m) => m.role === "user")
    );
    if (sessionWithMessages) {
        return sessionWithMessages.id;
    }

    return currentSessions[0]?.id || "";
}

function formatSessionTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(timestamp?: number): string {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function DashboardAssistant() {
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"chat" | "history">("chat");
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    const [sessions, setSessions] = useState<ChatSession[]>(() => loadSavedSessions());
    const [activeSessionId, setActiveSessionId] = useState<string>(() => {
        const initial = loadSavedSessions();
        return loadInitialActiveSessionId(initial);
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{
        type: "active" | "single" | "all";
        sessionId?: string;
        title?: string;
    } | null>(null);

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Save sessions to localStorage whenever modified
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        } catch {
            // ignore storage quota error
        }
    }, [sessions]);

    // Save activeSessionId to localStorage whenever modified
    useEffect(() => {
        if (activeSessionId) {
            try {
                localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
            } catch {
                // ignore storage quota error
            }
        }
    }, [activeSessionId]);

    // Handle Escape key to dismiss delete confirmation dialog
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && deleteConfirm) {
                setDeleteConfirm(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [deleteConfirm]);

    // Active session and its messages
    const activeSession =
        sessions.find((s) => s.id === activeSessionId) || sessions[0] || createNewSession();
    const messages = activeSession.messages;

    useEffect(() => {
        if (scrollRef.current && viewMode === "chat") {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, sending, open, viewMode]);

    useEffect(() => {
        if (open && viewMode === "chat") {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [open, viewMode]);

    const updateActiveMessages = (
        updater: (previousMessages: ChatMessage[]) => ChatMessage[],
        suggestedTitle?: string
    ) => {
        setSessions((previousSessions) =>
            previousSessions.map((session) => {
                if (session.id !== activeSession.id) return session;

                const newMessages = updater(session.messages);
                let newTitle = session.title;

                if (suggestedTitle && (session.title === "New Conversation" || !session.title)) {
                    newTitle =
                        suggestedTitle.length > 32
                            ? `${suggestedTitle.slice(0, 32)}...`
                            : suggestedTitle;
                }

                return {
                    ...session,
                    title: newTitle,
                    updatedAt: Date.now(),
                    messages: newMessages,
                };
            })
        );
    };

    const sendMessage = async (text = input, retrying = false) => {
        const value = (text ?? input).trim();

        if (!value || sending) {
            return;
        }

        const now = Date.now();
        const conversation = messages.filter((message) => !message.error);
        const updatedMessages: ChatMessage[] = retrying
            ? conversation
            : [
                  ...conversation,
                  {
                      id: `${now}-user`,
                      role: "user" as const,
                      text: value,
                      timestamp: now,
                  },
              ];

        updateActiveMessages(() => updatedMessages, value);
        setInput("");
        setSending(true);

        try {
            const apiMessages = updatedMessages
                .filter(
                    (message) =>
                        message.role === "user" || message.role === "assistant"
                )
                .slice(-30)
                .map((message) => ({
                    role:
                        message.role === "assistant"
                            ? "model"
                            : "user",
                    content: message.text,
                }));

            const response = await api.post("/ai-chat", {
                messages: apiMessages,
            });

            const reply =
                response.data?.message ||
                response.data?.reply ||
                "I couldn't generate a response right now.";

            updateActiveMessages((previous) => [
                ...previous,
                {
                    id: `${Date.now()}-assistant`,
                    role: "assistant",
                    text: reply,
                    timestamp: Date.now(),
                },
            ]);

            if (response.data?.patient_created) {
                const pc = response.data.patient_created;
                const catLabel =
                    pc.type === "faculty"
                        ? "Faculty"
                        : pc.type === "staff"
                        ? "Staff"
                        : "Student";

                addClinicNotification({
                    type: "add",
                    title: `${catLabel} Registered via Chatbot`,
                    description: `${pc.name || "Patient"} (${pc.id || "ID"}) recorded`,
                    category: "patient",
                });

                window.dispatchEvent(
                    new CustomEvent("clinic-patient-updated", {
                        detail: pc,
                    })
                );
            }
        } catch (error) {
            console.error("AI chatbot error:", error);

            let errorMessage = "Sorry, I couldn't connect to the AI service right now.";

            if (isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            updateActiveMessages((previous) => [
                ...previous,
                {
                    id: `${Date.now()}-error`,
                    role: "assistant",
                    text: errorMessage,
                    timestamp: Date.now(),
                    error: true,
                },
            ]);
        } finally {
            setSending(false);
        }
    };

    const retryLastMessage = () => {
        const lastUserMessage = [...messages]
            .reverse()
            .find((message) => message.role === "user");

        if (lastUserMessage) {
            void sendMessage(lastUserMessage.text, true);
        }
    };

    const startNewChat = () => {
        const hasUserMessage = activeSession.messages.some((m) => m.role === "user");
        if (!hasUserMessage) {
            setViewMode("chat");
            setInput("");
            return;
        }

        const fresh = createNewSession();
        setSessions((previous) => [fresh, ...previous]);
        setActiveSessionId(fresh.id);
        setViewMode("chat");
        setInput("");
    };

    const handleDeleteActive = () => {
        setSessions((previous) => {
            const filtered = previous.filter((s) => s.id !== activeSession.id);
            if (filtered.length === 0) {
                const fresh = createNewSession();
                setActiveSessionId(fresh.id);
                return [fresh];
            }
            setActiveSessionId(filtered[0].id);
            return filtered;
        });
        setDeleteConfirm(null);
    };

    const handleDeleteSingle = (sessionId: string) => {
        setSessions((previous) => {
            const filtered = previous.filter((s) => s.id !== sessionId);
            if (filtered.length === 0) {
                const fresh = createNewSession();
                setActiveSessionId(fresh.id);
                return [fresh];
            }

            if (activeSessionId === sessionId) {
                setActiveSessionId(filtered[0].id);
            }

            return filtered;
        });
        setDeleteConfirm(null);
    };

    const handleClearAllHistory = () => {
        const fresh = createNewSession();
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
        setViewMode("chat");
        setDeleteConfirm(null);
    };

    return (
        <aside aria-label="TCC Clinic AI Assistant" className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-auto">
            {/* ── EXPANDED CHAT WINDOW ──────────────────────────────────────── */}
            {open && (
                <div className="relative mb-4 flex h-[580px] max-h-[85vh] w-[92vw] sm:w-[410px] flex-col overflow-hidden rounded-3xl border border-[#e5a93b]/40 bg-[#160207] text-white shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    {/* Delete Confirmation Dialog */}
                    {deleteConfirm && (
                        <div
                            className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="confirm-delete-title"
                        >
                            <div className="w-full max-w-[320px] rounded-2xl border border-[#e5a93b]/30 bg-[#20040b] p-5 shadow-2xl">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-950/80 border border-red-500/40 text-red-400">
                                        <Trash2 size={16} />
                                    </div>
                                    <h3 id="confirm-delete-title" className="text-sm font-bold text-white">
                                        {deleteConfirm.type === "all"
                                            ? "Clear All History?"
                                            : "Delete Conversation?"}
                                    </h3>
                                </div>

                                <p className="mt-2.5 text-xs leading-relaxed text-[#fcebe7]/75">
                                    {deleteConfirm.type === "all"
                                        ? `Are you sure you want to delete all ${sessions.length} conversations? All chat history will be permanently erased.`
                                        : deleteConfirm.type === "single"
                                        ? `Are you sure you want to delete "${deleteConfirm.title || "this conversation"}"? This action cannot be undone.`
                                        : "Are you sure you want to delete this conversation? Your chat messages will be permanently removed."}
                                </p>

                                <div className="mt-5 flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setDeleteConfirm(null)}
                                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (deleteConfirm.type === "all") {
                                                handleClearAllHistory();
                                            } else if (deleteConfirm.type === "single" && deleteConfirm.sessionId) {
                                                handleDeleteSingle(deleteConfirm.sessionId);
                                            } else {
                                                handleDeleteActive();
                                            }
                                        }}
                                        className="rounded-xl bg-gradient-to-r from-red-700 to-red-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition hover:from-red-600 hover:to-red-700 cursor-pointer"
                                    >
                                        {deleteConfirm.type === "all" ? "Clear All" : "Delete"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#2c040e] via-[#200309] to-[#160207] border-b border-[#70091f]/50 shrink-0">
                        {viewMode === "history" ? (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("chat")}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
                                    aria-label="Back to chat"
                                    title="Back to chat"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div>
                                    <p className="text-sm font-bold text-white">Chat History</p>
                                    <p className="text-[11px] text-[#fcebe7]/60">
                                        {sessions.length} conversation{sessions.length === 1 ? "" : "s"}
                                    </p>
                                </div>
                            </div>
                        ) : (
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
                                        Active Duty · Clinic Intelligence
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-1">
                            {viewMode === "chat" ? (
                                <>
                                    {messages.some((m) => m.role === "user") && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDeleteConfirm({
                                                    type: "active",
                                                    title: activeSession.title || "Current Conversation",
                                                })
                                            }
                                            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-red-300 transition-colors cursor-pointer"
                                            aria-label="Delete current chat"
                                            title="Delete current chat"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={startNewChat}
                                        disabled={sending}
                                        className="flex h-8 w-8 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                                        aria-label="New chat"
                                        title="New chat"
                                    >
                                        <Plus size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("history")}
                                        className="flex h-8 w-8 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-[#e5a93b] transition-colors cursor-pointer"
                                        aria-label="View history"
                                        title="Chat history"
                                    >
                                        <History size={17} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={startNewChat}
                                    className="flex items-center gap-1.5 rounded-full bg-[#70091f] border border-[#e5a93b]/40 px-3 py-1 text-xs font-semibold text-white hover:bg-[#8b1505] transition-colors cursor-pointer"
                                    title="Start a new chat"
                                >
                                    <Plus size={14} /> New
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                                aria-label="Close AI chatbot"
                                title="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* View: History List */}
                    {viewMode === "history" ? (
                        <div className="flex flex-1 flex-col overflow-hidden bg-[#160207]">
                            <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
                                {sessions.map((session) => {
                                    const isCurrent = session.id === activeSession.id;
                                    const messageCount = session.messages.filter(
                                        (m) => m.role === "user"
                                    ).length;

                                    return (
                                        <div
                                            key={session.id}
                                            onClick={() => {
                                                setActiveSessionId(session.id);
                                                setViewMode("chat");
                                            }}
                                            className={`group flex cursor-pointer items-start justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                                                isCurrent
                                                    ? "border-[#e5a93b]/60 bg-[#25040e] shadow-md ring-1 ring-[#e5a93b]/30"
                                                    : "border-[#70091f]/40 bg-[#1c0309] hover:border-[#e5a93b]/40 hover:bg-[#25040e]"
                                            }`}
                                        >
                                            <div className="flex min-w-0 flex-1 items-start gap-2.5">
                                                <div
                                                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                                                        isCurrent
                                                            ? "bg-[#70091f] text-[#e5a93b]"
                                                            : "bg-white/5 text-[#fcebe7]/60"
                                                    }`}
                                                >
                                                    <MessageSquare size={14} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-white">
                                                        {session.title || "Conversation"}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-2 text-[10px] text-[#fcebe7]/50">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {formatSessionTime(session.updatedAt)}
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            {messageCount} question
                                                            {messageCount === 1 ? "" : "s"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirm({
                                                        type: "single",
                                                        sessionId: session.id,
                                                        title: session.title || "Conversation",
                                                    });
                                                }}
                                                className="shrink-0 p-1.5 text-[#fcebe7]/40 opacity-70 transition hover:text-red-400 group-hover:opacity-100 cursor-pointer"
                                                title="Delete chat"
                                                aria-label="Delete chat"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Clear All Footer */}
                            <div className="border-t border-[#70091f]/40 bg-[#120105] p-3">
                                <button
                                    type="button"
                                    onClick={() => setDeleteConfirm({ type: "all" })}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/40 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-900/60 cursor-pointer"
                                >
                                    <Trash2 size={13} /> Clear all history
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* View: Chat Messages */
                        <>
                            <div
                                ref={scrollRef}
                                role="log"
                                aria-live="polite"
                                className="flex-1 space-y-3.5 overflow-y-auto bg-[#160207] p-4 text-left"
                            >
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex flex-col ${
                                            message.role === "user" ? "items-end" : "items-start"
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[86%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                                message.role === "user"
                                                    ? "bg-gradient-to-br from-[#70091f] via-[#550718] to-[#3a0410] border border-[#e5a93b]/40 text-white shadow-md"
                                                    : message.error
                                                    ? "border border-red-500/50 bg-[#36050e] text-red-200"
                                                    : "border border-[#70091f]/60 bg-[#20040b] text-[#fcebe7] shadow-xs"
                                            }`}
                                        >
                                            {message.text}
                                            {message.error && (
                                                <button
                                                    type="button"
                                                    onClick={retryLastMessage}
                                                    disabled={sending}
                                                    className="mt-2.5 flex items-center gap-1 font-semibold text-red-300 underline underline-offset-2 hover:text-red-100 disabled:opacity-50 cursor-pointer"
                                                >
                                                    <RotateCcw size={13} /> Try again
                                                </button>
                                            )}
                                        </div>
                                        {message.timestamp && (
                                            <span className="mt-1 px-1.5 text-[9px] text-[#fcebe7]/50">
                                                {formatMessageTime(message.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                ))}

                                {sending && (
                                    <div className="flex justify-start">
                                        <div className="flex items-center gap-1.5 rounded-2xl border border-[#70091f]/50 bg-[#20040b] px-4 py-3">
                                            <span className="h-2 w-2 animate-bounce rounded-full bg-[#e5a93b]" />
                                            <span
                                                className="h-2 w-2 animate-bounce rounded-full bg-[#e5a93b]"
                                                style={{ animationDelay: "120ms" }}
                                            />
                                            <span
                                                className="h-2 w-2 animate-bounce rounded-full bg-[#e5a93b]"
                                                style={{ animationDelay: "240ms" }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quick Questions */}
                            <div className="border-t border-[#70091f]/40 bg-[#1c0309] px-3.5 py-2.5">
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#e5a93b]/80">
                                    Quick questions
                                </p>
                                <div className="flex gap-1.5 overflow-x-auto pb-1">
                                    {AI_QUICK_REPLIES.map((reply) => (
                                        <button
                                            key={reply}
                                            type="button"
                                            onClick={() => sendMessage(reply)}
                                            disabled={sending}
                                            className="shrink-0 rounded-full border border-[#70091f] bg-[#29050d] px-3 py-1.5 text-[11px] font-medium text-[#fcebe7]/85 transition hover:border-[#e5a93b] hover:text-[#e5a93b] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                        >
                                            {reply}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Input form */}
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    sendMessage();
                                }}
                                className="flex items-center gap-2 border-t border-[#70091f]/50 bg-[#160207] p-3"
                            >
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    placeholder="Ask TCC Clinic AI..."
                                    disabled={sending}
                                    className="min-w-0 flex-1 rounded-2xl border border-[#70091f]/70 bg-[#24040d] px-4 py-2.5 text-sm text-white placeholder-[#fcebe7]/40 outline-none transition focus:border-[#e5a93b] focus:ring-1 focus:ring-[#e5a93b]/40 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || sending}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#70091f] to-[#4d0615] border border-[#e5a93b]/50 text-[#e5a93b] transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-md"
                                    aria-label="Send message"
                                    title="Send"
                                >
                                    <Send size={16} />
                                </button>
                            </form>

                            {/* Disclaimer */}
                            <div className="border-t border-[#70091f]/40 bg-[#120105] px-3.5 py-2">
                                <p className="text-center text-[10px] leading-4 text-[#fcebe7]/50">
                                    TCC AI provides general information and system assistance. It does not replace a healthcare professional.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── FLOATING LAUNCHER BUTTON ──────────────────────────────────── */}
            <div className="flex items-center gap-3">
                {/* Floating pill badge when closed */}
                {!open && (
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="hidden sm:flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2c040e] to-[#1c0309] border border-[#e5a93b]/50 px-4 py-2 shadow-2xl text-left cursor-pointer hover:border-[#e5a93b] hover:scale-105 transition-all duration-300"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-[#e5a93b] animate-ping" />
                        <span className="text-xs font-bold text-white">Ask Clinic AI</span>
                        <span className="text-[10px] font-semibold text-[#e5a93b]">· Online</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => setOpen((previous) => !previous)}
                    aria-expanded={open}
                    title={open ? "Close AI Assistant" : "Open TCC Clinic AI Chatbot"}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#70091f] via-[#500615] to-[#30030c] border border-[#e5a93b]/60 text-white shadow-2xl shadow-black/80 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
                >
                    {/* Pulsing glow ring */}
                    <span className="absolute -inset-1 rounded-2xl bg-[#e5a93b]/20 blur-sm group-hover:bg-[#e5a93b]/40 transition-all pointer-events-none" />

                    {open ? (
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

export default DashboardAssistant;
