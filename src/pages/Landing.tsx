import React, { useState, useEffect, useRef } from "react";
import tccLogo from "../assets/tcc-logo.png";
import api from "../services/api";
import { ORG_DATA, loadStoredOrgData, type OrgCategory } from "./Organization";
import { useNavigate } from "react-router-dom";
import { LandingChatbot } from "../components/landing/LandingChatbot";
import {
    Menu,
    X,
    ArrowRight,
    ArrowUpRight,
    MapPin,
    Clock,
    ShieldCheck,
    Award,
    CheckCircle2,
    Users,
    ClipboardList,
    Pill,
    BarChart3,
    Activity,
    Maximize2,
    ChevronDown,
    HeartPulse,
    Stethoscope,
    FileText,
} from "lucide-react";

/* ─── Smooth Scroll Helper ─────────────────────────────────────────────────── */
function scrollTo(href: string) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
}

/* ─── Animated Number Counter ──────────────────────────────────────────────── */
function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setStarted(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        let startTimestamp: number | null = null;
        const duration = 1400;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeOut * value));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                setCount(value);
            }
        };
        window.requestAnimationFrame(step);
    }, [started, value]);

    return (
        <span ref={ref}>
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    );
}

interface GalleryItem {
    id: string;
    title: string;
    subtitle: string;
    tag: string;
    src: string;
}

export default function Landing(): React.JSX.Element {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [orgCategory, setOrgCategory] = useState<OrgCategory>("clinic");
    const [orgData, setOrgData] = useState(() => loadStoredOrgData());
    const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const faqs = [
        {
            question: "Who is eligible for free health services at the TCC Clinic?",
            answer:
                "All currently enrolled Tagoloan Community College students, faculty members, and administrative staff across all academic departments can access free care by simply presenting their school ID.",
        },
        {
            question: "Are medical consultations and primary medicines completely free?",
            answer:
                "Yes. Walk-in consultations, vital signs triage, first-aid care, and primary dispensary medicines (such as pain relievers, fever medicines, antacids, and oral rehydration) are provided at zero cost.",
        },
        {
            question: "How do I request an official Medical Certificate for class excuse or OJT?",
            answer:
                "Visit the Baluarte Campus Clinic in person. Our registered duty health officer assesses your condition, records your clinical visit in the portal, and issues an officially signed Medical Certificate.",
        },
        {
            question: "Where is the clinic located on campus and what are the operating hours?",
            answer:
                "The clinic is on the Ground Floor, beside the UniFAST Building at Baluarte Campus, Tagoloan. Operating hours are Monday through Friday, 8:00 AM to 5:00 PM.",
        },
        {
            question: "What emergency protocols are followed for urgent cases?",
            answer:
                "For urgent medical needs requiring hospital care, our clinical staff provides immediate stabilization and coordinates rapid ambulance transport with the Tagoloan Municipal Health Office and emergency rescue units.",
        },
    ];

    /* Synchronize in real-time from MySQL Database and local storage */
    useEffect(() => {
        let isMounted = true;
        const fetchDbOrg = async () => {
            try {
                const res = await api.get("/organization");
                if (res.data?.clinic && res.data?.admin && isMounted) {
                    setOrgData(res.data);
                    try {
                        localStorage.setItem("tcc_organization_data_v1", JSON.stringify(res.data));
                    } catch {}
                }
            } catch (err) {
                // Silently fallback to cached organization data
            }
        };

        fetchDbOrg();

        const handleOrgSync = () => {
            setOrgData(loadStoredOrgData());
        };
        window.addEventListener("storage", handleOrgSync);
        window.addEventListener("tcc-org-updated", handleOrgSync);
        return () => {
            isMounted = false;
            window.removeEventListener("storage", handleOrgSync);
            window.removeEventListener("tcc-org-updated", handleOrgSync);
        };
    }, []);

    /* Navbar background adjustment on scroll */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const goToLogin = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            navigate("/login");
        }, 450);
    };

    /* Safe Initials Helper */
    const getInitials = (name: string) => {
        const parts = (name || "")
            .split(" ")
            .filter((w) => !["Dr.", "Prof.", "MD", "RN", "MAN", "RM", "RPh", "EdD", "PhD"].includes(w))
            .slice(0, 2)
            .map((w) => w[0])
            .join("");
        return (parts || (name || "").slice(0, 2)).toUpperCase() || "TC";
    };

    const currentMembers = (orgData[orgCategory] || ORG_DATA[orgCategory])?.members || [];
    const leadMember = currentMembers.find((m) => m.level === 1) || currentMembers[0];
    const staffMembers = currentMembers.filter((m) => m.id !== leadMember?.id);

    /* Gallery Items Data */
    const galleryItems: GalleryItem[] = [
        {
            id: "team",
            title: "Healthcare Team",
            subtitle: "Registered clinical staff ensuring campus health security.",
            tag: "Baluarte Campus",
            src: "/tcc-clinic-team.jpg",
        },
        {
            id: "care",
            title: "Primary Patient Care",
            subtitle: "Routine vital checkups and general consultations.",
            tag: "Clinical Care",
            src: "/tcc-clinic-care.jpg",
        },
        {
            id: "maternal",
            title: "Maternal & Child Health",
            subtitle: "Health counseling, education, and wellness guidance.",
            tag: "Specialized Services",
            src: "/tcc-clinic-checkup.jpg",
        },
        {
            id: "consult",
            title: "Health Consultations",
            subtitle: "Confidential walk-in consultations and medicine dispensary.",
            tag: "Consultation",
            src: "/tcc-clinic-consult.jpg",
        },
    ];

    return (
        <div className="min-h-screen bg-[#140206] font-[system-ui,_-apple-system,_sans-serif] text-white selection:bg-[#e5a93b] selection:text-[#1c080e]">
            {/* ── HEADER / FLOATING PILL NAVBAR ─────────────────────────── */}
            <header className="fixed top-3 sm:top-5 inset-x-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none">
                <div
                    className={[
                        "pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full px-5 py-2.5 transition-all duration-300",
                        scrolled
                            ? "bg-[#180307]/95 border border-[#70091f]/70 shadow-2xl shadow-black/60 backdrop-blur-md text-white"
                            : "bg-[#1d0309]/85 border border-[#70091f]/50 shadow-xl shadow-black/40 backdrop-blur-md text-white",
                    ].join(" ")}
                >
                    {/* Brand */}
                    <div
                        onClick={() => scrollTo("#hero")}
                        className="flex items-center gap-3 cursor-pointer select-none text-left group"
                    >
                        <div className="relative">
                            <img
                                src={tccLogo}
                                alt="TCC Logo"
                                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover ring-2 ring-[#e5a93b]/50 shadow-xs shrink-0 transition-transform duration-300 group-hover:scale-105"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#1d0309]" />
                        </div>
                        <div className="leading-tight">
                            <p className="text-xs sm:text-sm font-bold tracking-tight text-white group-hover:text-[#e5a93b] transition-colors">
                                Tagoloan Community College
                            </p>
                            <p className="text-[10px] sm:text-[11px] font-medium text-[#e5a93b]">
                                Health Services Clinic
                            </p>
                        </div>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                        <button
                            type="button"
                            onClick={() => scrollTo("#about")}
                            className="text-xs font-semibold text-[#fcebe7]/80 hover:text-[#e5a93b] transition duration-200 cursor-pointer"
                        >
                            About
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollTo("#services")}
                            className="text-xs font-semibold text-[#fcebe7]/80 hover:text-[#e5a93b] transition duration-200 cursor-pointer"
                        >
                            Services
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollTo("#features")}
                            className="text-xs font-semibold text-[#fcebe7]/80 hover:text-[#e5a93b] transition duration-200 cursor-pointer"
                        >
                            Features
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollTo("#team")}
                            className="text-xs font-semibold text-[#fcebe7]/80 hover:text-[#e5a93b] transition duration-200 cursor-pointer"
                        >
                            Team
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollTo("#faq")}
                            className="text-xs font-semibold text-[#fcebe7]/80 hover:text-[#e5a93b] transition duration-200 cursor-pointer"
                        >
                            FAQ
                        </button>

                        {/* Sign In Button */}
                        <button
                            type="button"
                            onClick={goToLogin}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#e5a93b] px-5 py-2 text-xs font-bold text-[#1c080e] shadow-md shadow-amber-950/40 hover:bg-[#f0b445] hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                            <span>Sign In</span>
                            <ArrowRight size={13} />
                        </button>
                    </nav>

                    {/* Mobile Hamburger Button */}
                    <button
                        type="button"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        onClick={() => setMenuOpen((v) => !v)}
                        className="rounded-full p-2 text-white hover:bg-white/10 md:hidden"
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Drawer */}
                {menuOpen && (
                    <div className="pointer-events-auto absolute top-16 inset-x-4 max-w-md mx-auto rounded-3xl border border-[#70091f]/60 bg-[#1d0309]/98 p-5 shadow-2xl md:hidden backdrop-blur-xl animate-fadeIn text-left text-white">
                        <div className="flex flex-col space-y-3">
                            <button
                                type="button"
                                onClick={() => {
                                    scrollTo("#about");
                                    setMenuOpen(false);
                                }}
                                className="text-sm font-semibold text-[#fcebe7] hover:text-[#e5a93b] py-1 text-left"
                            >
                                About
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    scrollTo("#services");
                                    setMenuOpen(false);
                                }}
                                className="text-sm font-semibold text-[#fcebe7] hover:text-[#e5a93b] py-1 text-left"
                            >
                                Services &amp; Care
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    scrollTo("#features");
                                    setMenuOpen(false);
                                }}
                                className="text-sm font-semibold text-[#fcebe7] hover:text-[#e5a93b] py-1 text-left"
                            >
                                System Features
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    scrollTo("#team");
                                    setMenuOpen(false);
                                }}
                                className="text-sm font-semibold text-[#fcebe7] hover:text-[#e5a93b] py-1 text-left"
                            >
                                Clinic Team
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    scrollTo("#faq");
                                    setMenuOpen(false);
                                }}
                                className="text-sm font-semibold text-[#fcebe7] hover:text-[#e5a93b] py-1 text-left"
                            >
                                FAQ
                            </button>
                            <button
                                type="button"
                                onClick={goToLogin}
                                className="mt-2 w-full rounded-full bg-[#e5a93b] py-2.5 text-xs font-bold text-[#1c080e] shadow-md hover:bg-[#d89c2f]"
                            >
                                Sign In to Portal
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* ── HERO SECTION ─────────────────────────────────────────────── */}
            <section
                id="hero"
                className="relative overflow-hidden bg-gradient-to-b from-[#25040d] via-[#1c0309] to-[#140206] pt-32 sm:pt-40 pb-20 text-center text-white"
            >
                {/* Subtle Ambient Glow */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-[380px] w-[620px] rounded-full bg-[#70091f]/30 blur-[130px]"
                />

                <div className="relative z-10 mx-auto w-full max-w-5xl px-6 sm:px-8">
                    {/* Top Accreditation Pill */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e5a93b]/40 bg-[#e5a93b]/10 px-4 py-1.5 text-xs font-semibold text-[#f5c358] backdrop-blur-md">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span>Tagoloan Community College · Baluarte Campus Clinic</span>
                    </div>

                    {/* Central Headline */}
                    <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                        Accessible campus healthcare
                        <br />
                        <span className="bg-gradient-to-r from-[#e5a93b] via-[#f7b944] to-[#f49342] bg-clip-text text-transparent">
                            for every student &amp; staff.
                        </span>
                    </h1>

                    {/* Concise Subtitle */}
                    <p className="mt-5 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-[#fcebe7]/85 font-normal">
                        Confidential medical consultations, vital signs triage, and free medicine dispensary dedicated to campus health security.
                    </p>

                    {/* Action buttons */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                        <button
                            type="button"
                            onClick={goToLogin}
                            className="inline-flex items-center gap-2 rounded-full bg-[#e5a93b] px-7 py-3 text-xs sm:text-sm font-bold text-[#1c080e] shadow-lg shadow-amber-950/50 hover:bg-[#f0b445] hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                            <span>Access Clinic Portal</span>
                            <ArrowRight size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollTo("#services")}
                            className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-white/10 active:scale-95 transition cursor-pointer"
                        >
                            Explore Services
                        </button>
                    </div>

                    {/* Clean Hero Visual Showcase (3-Pillar Clean Overview) */}
                    <div className="mt-14 mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xs">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#70091f] text-[#e5a93b] mb-3">
                                <Stethoscope size={18} />
                            </div>
                            <h3 className="text-sm font-bold text-white">Free Walk-In Care</h3>
                            <p className="mt-1 text-xs text-[#fcebe7]/70 leading-relaxed">
                                Immediate consultation and vital signs assessment for all enrolled students.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xs">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5a93b] text-[#1c080e] mb-3">
                                <Pill size={18} />
                            </div>
                            <h3 className="text-sm font-bold text-white">Medicine Dispensary</h3>
                            <p className="mt-1 text-xs text-[#fcebe7]/70 leading-relaxed">
                                100% subsidized essential medicines and immediate first-aid supplies.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xs">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#70091f] text-[#e5a93b] mb-3">
                                <FileText size={18} />
                            </div>
                            <h3 className="text-sm font-bold text-white">Medical Clearances</h3>
                            <p className="mt-1 text-xs text-[#fcebe7]/70 leading-relaxed">
                                Officially signed medical certificates for class excuse and OJT compliance.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── KEY CAMPUS HEALTH METRICS ─────────────────────────────────── */}
            <section id="stats" className="mx-auto w-full max-w-5xl px-6 sm:px-8 py-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-[#70091f]/50 bg-[#1d0309] p-5 text-center">
                        <p className="text-2xl sm:text-3xl font-black text-white">
                            <AnimatedCounter value={10000} suffix="+" />
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#e5a93b]">Campus Members</p>
                        <p className="text-[11px] text-[#fcebe7]/60">Full health coverage</p>
                    </div>

                    <div className="rounded-2xl border border-[#70091f]/50 bg-[#1d0309] p-5 text-center">
                        <p className="text-2xl sm:text-3xl font-black text-white">
                            <AnimatedCounter value={100} suffix="%" /> Free
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#e5a93b]">Care &amp; Medicine</p>
                        <p className="text-[11px] text-[#fcebe7]/60">Zero patient fees</p>
                    </div>

                    <div className="rounded-2xl border border-[#70091f]/50 bg-[#1d0309] p-5 text-center">
                        <p className="text-2xl sm:text-3xl font-black text-white">&lt; 5 mins</p>
                        <p className="mt-1 text-xs font-semibold text-[#e5a93b]">Average Triage</p>
                        <p className="text-[11px] text-[#fcebe7]/60">Rapid walk-in intake</p>
                    </div>

                    <div className="rounded-2xl border border-[#70091f]/50 bg-[#1d0309] p-5 text-center">
                        <p className="text-2xl sm:text-3xl font-black text-white">ALCUCOA</p>
                        <p className="mt-1 text-xs font-semibold text-[#e5a93b]">Accredited</p>
                        <p className="text-[11px] text-[#fcebe7]/60">Institutional standard</p>
                    </div>
                </div>
            </section>

            {/* ── ABOUT TCC CLINIC ─────────────────────────────────────────── */}
            <section id="about" className="mx-auto w-full max-w-5xl px-6 sm:px-8 py-16 text-left">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#e5a93b]">About TCC Clinic</p>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                        Health care built for campus life
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-[#fcebe7]/80 leading-relaxed">
                        The TCC Clinic provides primary care, medical assessments, and preventive guidance for every student, teacher, and employee at Tagoloan Community College.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="rounded-2xl border border-[#70091f]/60 bg-[#1e0309] p-6 flex flex-col justify-between">
                        <div>
                            <span className="inline-block rounded-lg bg-[#70091f] px-2.5 py-1 text-[11px] font-bold text-[#e5a93b] mb-3">
                                Our Mission
                            </span>
                            <h3 className="text-base font-bold text-white">Accessible Care</h3>
                            <p className="mt-2 text-xs text-[#fcebe7]/75 leading-relaxed">
                                Deliver quality, accessible, and compassionate health services to empower student wellness across all academic programs.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#70091f]/60 bg-[#1e0309] p-6 flex flex-col justify-between">
                        <div>
                            <span className="inline-block rounded-lg bg-[#e5a93b] px-2.5 py-1 text-[11px] font-bold text-[#1c080e] mb-3">
                                Our Vision
                            </span>
                            <h3 className="text-base font-bold text-white">Healthy Campus</h3>
                            <p className="mt-2 text-xs text-[#fcebe7]/75 leading-relaxed">
                                Foster a supportive, healthy learning environment where immediate medical guidance and preventive health are always within reach.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#70091f]/60 bg-[#1e0309] p-6 flex flex-col justify-between">
                        <div>
                            <span className="inline-block rounded-lg bg-[#70091f] px-2.5 py-1 text-[11px] font-bold text-[#e5a93b] mb-3">
                                Core Values
                            </span>
                            <h3 className="text-base font-bold text-white">Integrity &amp; Compassion</h3>
                            <p className="mt-2 text-xs text-[#fcebe7]/75 leading-relaxed">
                                Dedicated to patient confidentiality, professional nursing ethics, rapid response, and community responsibility.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PATIENT CARE JOURNEY / SERVICES ─────────────────────────── */}
            <section id="services" className="mx-auto w-full max-w-5xl px-6 sm:px-8 py-16 text-left border-t border-[#70091f]/30">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#e5a93b]">How It Works</p>
                        <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                            Patient Care Journey
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-[#fcebe7]/80">
                            Three quick steps from walk-in to treatment at Baluarte Campus.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={goToLogin}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e5a93b] hover:underline cursor-pointer"
                    >
                        <span>Open Clinic Portal</span>
                        <ArrowRight size={13} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="rounded-2xl border border-[#70091f]/50 bg-[#1a0207] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#70091f] text-xs font-black text-[#e5a93b]">
                                01
                            </span>
                            <span className="text-[11px] text-[#fcebe7]/60">Ground Floor</span>
                        </div>
                        <h3 className="text-base font-bold text-white">Walk-In &amp; Check-In</h3>
                        <p className="mt-2 text-xs text-[#fcebe7]/75 leading-relaxed">
                            Present your Student ID or Faculty/Staff ID at the clinic desk beside the UniFAST Building for digital triage.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[#e5a93b]/50 bg-[#250309] p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5a93b] text-xs font-black text-[#1c080e]">
                                02
                            </span>
                            <span className="text-[11px] text-[#e5a93b]">Assessment</span>
                        </div>
                        <h3 className="text-base font-bold text-white">Triage &amp; Consultation</h3>
                        <p className="mt-2 text-xs text-[#fcebe7]/75 leading-relaxed">
                            The registered duty nurse evaluates blood pressure, temperature, symptoms, and vital signs in privacy.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[#70091f]/50 bg-[#1a0207] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#70091f] text-xs font-black text-[#e5a93b]">
                                03
                            </span>
                            <span className="text-[11px] text-emerald-400">Complete</span>
                        </div>
                        <h3 className="text-base font-bold text-white">Meds &amp; Documentation</h3>
                        <p className="mt-2 text-xs text-[#fcebe7]/75 leading-relaxed">
                            Receive prescribed medicines, health instructions, and verified Medical Certificates for academic excuse.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── SYSTEM FEATURES & CAPABILITIES ──────────────────────────── */}
            <section id="features" className="mx-auto w-full max-w-5xl px-6 sm:px-8 py-16 text-left border-t border-[#70091f]/30">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#e5a93b]">System Capabilities</p>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                        Modern Clinic Management
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-[#fcebe7]/80">
                        Designed for streamlined patient workflows, stock control, and institutional reporting.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-[#70091f]/50 bg-[#1e0309] p-6 hover:border-[#e5a93b]/50 transition">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#70091f] text-[#e5a93b]">
                                <ClipboardList size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Digital Health Records</h3>
                                <p className="text-[11px] text-[#e5a93b]">Students &amp; Personnel</p>
                            </div>
                        </div>
                        <p className="text-xs text-[#fcebe7]/75 leading-relaxed">
                            Instant access to student medical profiles, clinical history, known allergies, vital records, and emergency contacts.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[#70091f]/50 bg-[#1e0309] p-6 hover:border-[#e5a93b]/50 transition">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#70091f] text-[#e5a93b]">
                                <Activity size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Clinic Visit Logging</h3>
                                <p className="text-[11px] text-[#e5a93b]">Walk-In &amp; Triage</p>
                            </div>
                        </div>
                        <p className="text-xs text-[#fcebe7]/75 leading-relaxed">
                            Fast consultation recording with symptoms, diagnoses, vital measurements, attending staff, and printable clearances.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[#70091f]/50 bg-[#1e0309] p-6 hover:border-[#e5a93b]/50 transition">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5a93b] text-[#1c080e]">
                                <Pill size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Medicine Inventory</h3>
                                <p className="text-[11px] text-[#e5a93b]">Real-Time Dispensary</p>
                            </div>
                        </div>
                        <p className="text-xs text-[#fcebe7]/75 leading-relaxed">
                            Accurate dispensary monitoring with automated low-stock alerts, expiration tracking, and dosage unit administration.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[#70091f]/50 bg-[#1e0309] p-6 hover:border-[#e5a93b]/50 transition">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#70091f] text-[#e5a93b]">
                                <BarChart3 size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Reports &amp; Analytics</h3>
                                <p className="text-[11px] text-[#e5a93b]">Monthly Summaries</p>
                            </div>
                        </div>
                        <p className="text-xs text-[#fcebe7]/75 leading-relaxed">
                            Automated visit trend charts, common illness breakdowns, medicine utilization reports, and official signed PDF exports.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── MEET THE CLINIC TEAM ─────────────────────────────────────── */}
            <section id="team" className="mx-auto w-full max-w-5xl px-6 sm:px-8 py-16 text-left border-t border-[#70091f]/30">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#e5a93b]">Healthcare Staff</p>
                        <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                            Meet the Clinic Team
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-[#fcebe7]/80">
                            Dedicated personnel caring for the Tagoloan Community College community.
                        </p>
                    </div>

                    {/* Toggle between Clinic and Admin */}
                    <div className="inline-flex rounded-full border border-[#70091f]/60 bg-[#1e0309] p-1 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setOrgCategory("clinic")}
                            className={[
                                "rounded-full px-4 py-1.5 text-xs font-bold transition duration-200 cursor-pointer",
                                orgCategory === "clinic"
                                    ? "bg-[#e5a93b] text-[#1c080e]"
                                    : "text-[#fcebe7]/75 hover:text-white",
                            ].join(" ")}
                        >
                            Clinic Team
                        </button>
                        <button
                            type="button"
                            onClick={() => setOrgCategory("admin")}
                            className={[
                                "rounded-full px-4 py-1.5 text-xs font-bold transition duration-200 cursor-pointer",
                                orgCategory === "admin"
                                    ? "bg-[#e5a93b] text-[#1c080e]"
                                    : "text-[#fcebe7]/75 hover:text-white",
                            ].join(" ")}
                        >
                            Administration
                        </button>
                    </div>
                </div>

                {/* Lead Banner */}
                {leadMember && (
                    <div className="rounded-2xl bg-gradient-to-r from-[#440511] via-[#36040d] to-[#250309] p-5 sm:p-6 border border-[#70091f]/60 mb-6 flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fcd34d] to-[#b45309] text-xl font-black text-[#1c080e] shadow-md ring-2 ring-[#e5a93b]/40">
                            <span>{getInitials(leadMember.name)}</span>
                        </div>
                        <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#e5a93b]">
                                Head Physician / Director
                            </span>
                            <h3 className="text-lg font-bold text-white mt-0.5">{leadMember.name}</h3>
                            <p className="text-xs text-[#fcebe7]/80">{leadMember.role} · {leadMember.credentials}</p>
                            <p className="text-xs text-[#fcebe7]/60 mt-1 flex items-center gap-2">
                                <span>{leadMember.location}</span>
                                <span>·</span>
                                <span>{leadMember.dutyHours}</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Staff Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {staffMembers.map((member) => (
                        <div
                            key={member.id}
                            className="rounded-2xl border border-[#70091f]/50 bg-[#1e0309] p-4 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#70091f] text-sm font-bold text-white">
                                        <span>{getInitials(member.name)}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-bold text-white truncate">{member.name}</h4>
                                        <p className="text-xs font-semibold text-[#e5a93b] truncate">{member.role}</p>
                                    </div>
                                </div>
                                <p className="text-[11px] text-[#fcebe7]/65">{member.credentials}</p>
                                <p className="text-[11px] text-[#fcebe7]/60 mt-1 flex items-center gap-1">
                                    <MapPin size={11} className="text-[#e5a93b] shrink-0" />
                                    <span className="truncate">{member.location}</span>
                                </p>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-[#70091f]/30 flex items-center justify-between text-[11px]">
                                <span className="text-[#fcebe7]/50">{member.dutyHours}</span>
                                <span className="text-emerald-400 font-semibold">{member.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PHOTO GALLERY ─────────────────────────────────────────────── */}
            <section id="gallery" className="mx-auto w-full max-w-5xl px-6 sm:px-8 py-16 text-left border-t border-[#70091f]/30">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#e5a93b]">Campus Life</p>
                        <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">Clinic in Action</h2>
                    </div>
                    <span className="text-xs text-[#e5a93b]/70 hidden sm:inline">Click photo to enlarge</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {galleryItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedPhoto(item)}
                            className="group relative h-48 sm:h-56 rounded-2xl overflow-hidden border border-[#70091f]/50 hover:border-[#e5a93b]/70 cursor-pointer transition shadow-md"
                        >
                            <img
                                src={item.src}
                                alt={item.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                            <div className="absolute bottom-3 inset-x-3 text-left">
                                <p className="text-xs font-bold text-white drop-shadow-xs truncate">{item.title}</p>
                                <p className="text-[10px] text-stone-300 drop-shadow-xs truncate">{item.tag}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PHOTO LIGHTBOX ───────────────────────────────────────────── */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div
                        className="relative max-w-3xl w-full rounded-2xl overflow-hidden bg-stone-900 text-white shadow-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedPhoto(null)}
                            aria-label="Close"
                            className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition"
                        >
                            <X size={16} />
                        </button>
                        <div className="max-h-[65vh] overflow-hidden bg-black flex items-center justify-center">
                            <img
                                src={selectedPhoto.src}
                                alt={selectedPhoto.title}
                                className="w-full h-full object-contain max-h-[65vh]"
                            />
                        </div>
                        <div className="p-4 bg-stone-950 text-left">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#e5a93b]">
                                {selectedPhoto.tag}
                            </span>
                            <h3 className="text-base font-bold text-white mt-0.5">{selectedPhoto.title}</h3>
                            <p className="mt-1 text-xs text-stone-300">{selectedPhoto.subtitle}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── FREQUENTLY ASKED QUESTIONS ────────────────────────────────── */}
            <section id="faq" className="mx-auto w-full max-w-4xl px-6 sm:px-8 py-16 text-left border-t border-[#70091f]/30">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#e5a93b]">Frequently Asked Questions</p>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                        Common Questions
                    </h2>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, index) => {
                        const isOpen = openFaq === index;
                        return (
                            <div
                                key={index}
                                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                                    isOpen
                                        ? "border-[#e5a93b]/60 bg-[#1e0309]"
                                        : "border-[#70091f]/40 bg-[#180207] hover:border-[#e5a93b]/30"
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenFaq(isOpen ? null : index)}
                                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer"
                                    aria-expanded={isOpen}
                                >
                                    <span className="text-sm font-bold text-white pr-4">
                                        {faq.question}
                                    </span>
                                    <ChevronDown
                                        size={16}
                                        className={`shrink-0 transition-transform duration-200 ${
                                            isOpen ? "rotate-180 text-[#e5a93b]" : "text-white/60"
                                        }`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-4 sm:px-5 pb-5 pt-0 text-xs sm:text-sm text-[#fcebe7]/80 leading-relaxed border-t border-white/5 mt-1">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── UNIFIED CALL TO ACTION BANNER ────────────────────────────── */}
            <section className="mx-auto w-full max-w-5xl px-6 sm:px-8 py-12">
                <div className="rounded-3xl border border-[#e5a93b]/40 bg-gradient-to-r from-[#32060f] via-[#24040c] to-[#1a0308] p-8 sm:p-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-2xl">
                    <div className="max-w-xl">
                        <h2 className="text-2xl sm:text-3xl font-black text-white">
                            Ready to access the clinic portal?
                        </h2>
                        <p className="mt-2 text-xs sm:text-sm text-[#fcebe7]/80 leading-relaxed">
                            Sign in to review health profiles, record patient consultations, manage medicine stocks, and export reports.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={goToLogin}
                            className="inline-flex items-center gap-2 rounded-full bg-[#e5a93b] px-6 py-3 text-xs sm:text-sm font-bold text-[#1c080e] shadow-md hover:bg-[#f0b445] transition cursor-pointer"
                        >
                            <span>Access Portal</span>
                            <ArrowRight size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollTo("#hero")}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-3 text-xs font-semibold text-white hover:bg-white/10 transition cursor-pointer"
                        >
                            <span>Top</span>
                            <ArrowUpRight size={14} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────────── */}
            <footer className="bg-[#100104] text-white/70 py-12 px-6 sm:px-8 border-t border-[#70091f]/40 text-left">
                <div className="mx-auto w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-5">
                        <div className="flex items-center gap-3">
                            <img
                                src={tccLogo}
                                alt="TCC Logo"
                                className="h-9 w-9 rounded-full object-cover ring-2 ring-[#e5a93b]/70 shrink-0"
                            />
                            <div>
                                <p className="text-sm font-bold text-white">Tagoloan Community College</p>
                                <p className="text-xs text-[#e5a93b] font-medium">Health Services Clinic</p>
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-white/60 leading-relaxed">
                            Committed to campus wellness, accessible healthcare, and academic excellence. Baluarte, Tagoloan, Misamis Oriental.
                        </p>
                    </div>

                    {/* Hours */}
                    <div className="md:col-span-4 text-xs space-y-1.5">
                        <p className="text-xs font-bold text-[#e5a93b] uppercase tracking-wider">Clinic Hours &amp; Location</p>
                        <p className="text-white/80 font-medium">Ground Floor, Beside UniFAST Building</p>
                        <p className="text-white/60">Baluarte Campus, Tagoloan, Misamis Oriental</p>
                        <p className="text-white/60">Monday – Friday · 8:00 AM – 5:00 PM</p>
                    </div>

                    {/* Quick Links */}
                    <div className="md:col-span-3 text-xs space-y-1.5">
                        <p className="text-xs font-bold text-[#e5a93b] uppercase tracking-wider">Quick Links</p>
                        <ul className="space-y-1 text-white/60">
                            <li>
                                <button type="button" onClick={goToLogin} className="hover:text-[#e5a93b] transition cursor-pointer">
                                    Sign In to Portal
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => scrollTo("#about")} className="hover:text-[#e5a93b] transition cursor-pointer">
                                    About Clinic
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => scrollTo("#services")} className="hover:text-[#e5a93b] transition cursor-pointer">
                                    Patient Care Journey
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => scrollTo("#features")} className="hover:text-[#e5a93b] transition cursor-pointer">
                                    System Features
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => scrollTo("#faq")} className="hover:text-[#e5a93b] transition cursor-pointer">
                                    FAQ
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-5xl mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/40">
                    © 2026 Tagoloan Community College. Health Services Clinic Management System. All rights reserved.
                </div>
            </footer>

            {/* ── PORTAL TRANSITION OVERLAY ────────────────────────────── */}
            {isTransitioning && (
                <div
                    aria-live="polite"
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#190308]/95 backdrop-blur-xl tcc-portal-overlay"
                >
                    <div className="relative flex flex-col items-center text-center">
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#70091f] shadow-2xl ring-4 ring-[#e5a93b]/90">
                            <img
                                src={tccLogo}
                                alt="TCC Logo"
                                className="h-16 w-16 rounded-full object-cover"
                            />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-white">
                            Entering Clinic Portal
                        </h3>
                        <p className="mt-1 text-xs text-[#fcebe7]/75">
                            Tagoloan Community College · Health Services
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#e5a93b] animate-bounce" />
                            <span className="h-2 w-2 rounded-full bg-[#e5a93b] animate-bounce [animation-delay:0.15s]" />
                            <span className="h-2 w-2 rounded-full bg-[#e5a93b] animate-bounce [animation-delay:0.3s]" />
                        </div>
                    </div>
                </div>
            )}

            {/* ── AI CHATBOT VIRTUAL ASSISTANT ────────────────────────────── */}
            <LandingChatbot />
        </div>
    );
}
