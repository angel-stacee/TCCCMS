import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, BookOpen, Briefcase, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Download, Eye, FileBadge, FileText, GraduationCap, MapPin, Pencil, RotateCcw, Search, ShieldCheck, Stethoscope, Trash2, User, X } from "lucide-react";
import api from "../services/api";
import { getCachedRecord, invalidateRecordCache } from "../services/recordCache";
import { ConfirmationModal, InfoItem, Modal, RecordSection } from "../components/student-management/FieldsAndModals";
import { RestorePatientsModal } from "../components/student-management/RestorePatientsModal";
import { StudentForms, validateContactNumber, type StudentFormValues, type StaffFormValues, type FacultyFormValues } from "../components/student-management/StudentForms";
import FloatingToast from "../components/common/FloatingToast";
import { addClinicNotification } from "../services/notifications";
import { exportMedicalCertificatePDF, exportPatientMedicalReportPDF } from "../utils/pdfExport";
import { formatNA, formatTemperature, formatDate, mapCourseToDepartment } from "../utils/formatters";
import { ReasonBadge } from "../utils/reasonColors";







const EMPTY_STUDENT_FORM = {
    student_id: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    course: "",
    year_level: "",
    section: "",
    sex: "",
    birth_date: "",
    contact_number: "",
    address: "",
};

const EMPTY_STAFF_FORM = {
    staff_id: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    position: "",
    department: "",
    sex: "",
    birth_date: "",
    contact_number: "",
    address: "",
};

const EMPTY_FACULTY_FORM = {
    employee_id: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    position: "",
    department: "",
    sex: "",
    birth_date: "",
    contact_number: "",
    address: "",
};







const COURSES = [
    "BSIT",
    "BSBA",
    "MidWifery",
    "BSHM",
    "BLIS",
    "BSED",
    "BSCRIM",
];

const YEAR_LEVELS = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
];

const SEX_OPTIONS = [
    "Male",
    "Female",
];







function StudentManagement() {

    const [searchParams, setSearchParams] = useSearchParams();






    const [students, setStudents] = useState([]);
    const [studentPagination, setStudentPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 25,
    });
    const [staff, setStaff] = useState([]);
    const [staffPagination, setStaffPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 25 });
    const [faculties, setFaculties] = useState([]);
    const [facultyPagination, setFacultyPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 25 });







    const [search, setSearch] = useState(
        () => searchParams.get("search") || ""
    );
    const [activeTab, setActiveTab] = useState<"students" | "staff" | "faculty">(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam === "staff" || tabParam === "faculty") {
            return tabParam;
        }
        const profileType = searchParams.get("profile_type");
        if (profileType === "staff" || profileType === "faculty") {
            return profileType;
        }
        return "students";
    });

    const handleTabChange = (tab: "students" | "staff" | "faculty") => {
        setActiveTab(tab);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (tab === "students") {
                next.delete("tab");
            } else {
                next.set("tab", tab);
            }
            return next;
        }, { replace: true });
    };

    const renderPagination = (
        current_page: number,
        last_page: number,
        total: number,
        onPageChange: (page: number) => void
    ) => {
        const maxPages = last_page || 1;

        return (
            <div className="flex flex-col gap-3 border-t border-[#e8dfd4] bg-white px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#4e4234] dark:bg-[#211c17]">
                <span className="text-center sm:text-left text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300">
                    Page <span className="font-bold text-[#70091f] dark:text-[#f8a598]">{current_page}</span> of <span className="font-bold">{maxPages}</span> ({total} records)
                </span>
                <div className="flex items-center justify-center gap-2 sm:justify-end">
                    <button
                        type="button"
                        disabled={current_page <= 1}
                        onClick={() => onPageChange(current_page - 1)}
                        className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-bold text-black shadow-xs transition hover:bg-stone-50 hover:border-stone-400 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-black disabled:shadow-none dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:hover:bg-stone-700 dark:disabled:border-stone-800 dark:disabled:bg-stone-900/60 dark:disabled:text-white cursor-pointer"
                    >
                        <ChevronLeft size={14} strokeWidth={2.5} />
                        <span>Previous</span>
                    </button>

                    <button
                        type="button"
                        disabled={current_page >= maxPages}
                        onClick={() => onPageChange(current_page + 1)}
                        className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-bold text-black shadow-xs transition hover:bg-stone-50 hover:border-stone-400 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-black disabled:shadow-none dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:hover:bg-stone-700 dark:disabled:border-stone-800 dark:disabled:bg-stone-900/60 dark:disabled:text-white cursor-pointer"
                    >
                        <span>Next</span>
                        <ChevronRight size={14} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        );
    };

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [formError, setFormError] = useState("");
    const [successToast, setSuccessToast] = useState("");
    const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | undefined>(undefined);
    const [inlineNotification, setInlineNotification] = useState<{
        type: "add" | "edit" | "delete" | "restore" | "error";
        title: string;
        message: string;
        action?: { label: string; onClick: () => void };
    } | null>(null);
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    const [sexFilter, setSexFilter] = useState("all");
    const [courseFilter, setCourseFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name_asc");

    const hasActiveFilters = Boolean(
        search.trim() ||
        sexFilter !== "all" ||
        (activeTab === "students" && courseFilter !== "all") ||
        sortBy !== "name_asc"
    );

    const resetAllFilters = () => {
        setSearch("");
        setSexFilter("all");
        setCourseFilter("all");
        setSortBy("name_asc");
    };







    const [showStudentForm, setShowStudentForm] = useState(false);
    const [showStaffForm, setShowStaffForm] = useState(false);
    const [showFacultyForm, setShowFacultyForm] = useState(false);







    const [editingStudent, setEditingStudent] = useState(null);
    const [editingStaff, setEditingStaff] = useState(null);
    const [editingFaculty, setEditingFaculty] = useState(null);







    const [viewingStudent, setViewingStudent] = useState(null);
    const [viewingStaff, setViewingStaff] = useState(null);
    const [viewingFaculty, setViewingFaculty] = useState(null);

    const [medicalReportStudent, setMedicalReportStudent] = useState<any | null>(null);
    const [medicalReportData, setMedicalReportData] = useState<any | null>(null);
    const [loadingMedicalReport, setLoadingMedicalReport] = useState(false);
    const [medicalReportType, setMedicalReportType] = useState<"student" | "faculty" | "staff">("student");







    const [confirmation, setConfirmation] = useState(null);







    const [studentForm, setStudentForm] = useState<StudentFormValues>({
        ...EMPTY_STUDENT_FORM,
    });

    const [staffForm, setStaffForm] = useState<StaffFormValues>({
        ...EMPTY_STAFF_FORM,
    });

    const [facultyForm, setFacultyForm] = useState<FacultyFormValues>({
        ...EMPTY_FACULTY_FORM,
    });







    useEffect(() => {
        const timeout = setTimeout(() => fetchData(), 0);

        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (!successToast) return;
        const timeout = setTimeout(() => setSuccessToast(""), 4500);
        return () => clearTimeout(timeout);
    }, [successToast]);

    useEffect(() => {
        if (!inlineNotification) return;
        const timer = setTimeout(() => setInlineNotification(null), 6000);
        return () => clearTimeout(timer);
    }, [inlineNotification]);

    const initialStudentSearch = useRef(true);







    const getFullName = (person) => {
        if (!person) {
            return "";
        }

        return [
            person.first_name,
            person.middle_name,
            person.last_name,
        ]
            .filter(Boolean)
            .join(" ");
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return String(date);
        }

        return parsedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatDateInput = (date) => {
        if (!date) {
            return "";
        }

        return String(date).slice(0, 10);
    };

    const getErrorMessage = (err, fallback) => {
        const validationErrors =
            err.response?.data?.errors;

        if (validationErrors) {
            const firstError = Object.values(
                validationErrors
            )
                .flat()
                .find(Boolean);

            if (firstError) {
                return firstError;
            }
        }

        return (
            err.response?.data?.message ||
            fallback
        );
    };

    const loadStudentPage = useCallback(async (page, searchTerm = "") => {
        try {
            const normalizedSearch = searchTerm.trim();
            const response = await getCachedRecord(
                `students:list:${page}:${normalizedSearch}`,
                () => api.get("/students", {
                    params: {
                        page,
                        per_page: 25,
                        search: normalizedSearch || undefined,
                    },
                })
            );

            setStudents(response.data?.data || []);
            setStudentPagination({
                current_page: response.data?.current_page || 1,
                last_page: response.data?.last_page || 1,
                total: response.data?.total || 0,
                per_page: response.data?.per_page || 25,
            });
        } catch (err) {
            console.error("Student loading error:", err);
            setError(
                err.response?.data?.message ||
                    "Unable to load student records."
            );
        }
    }, []);

    const loadStaffPage = useCallback(async (page, searchTerm = "") => {
        try {
            const normalizedSearch = searchTerm.trim();
            const response = await getCachedRecord(
                `staff:list:${page}:${normalizedSearch}`,
                () => api.get("/staff", {
                    params: { page, per_page: 25, search: normalizedSearch || undefined },
                })
            );
            setStaff(response.data?.data || []);
            setStaffPagination({
                current_page: response.data?.current_page || 1,
                last_page: response.data?.last_page || 1,
                total: response.data?.total || 0,
                per_page: response.data?.per_page || 25,
            });
        } catch (err) {
            console.error("Staff loading error:", err);
            setError(err.response?.data?.message || "Unable to load staff records.");
        }
    }, []);

    const loadFacultyPage = useCallback(async (page, searchTerm = "") => {
        try {
            const normalizedSearch = searchTerm.trim();
            const response = await getCachedRecord(
                `faculties:list:${page}:${normalizedSearch}`,
                () => api.get("/faculties", {
                    params: { page, per_page: 25, search: normalizedSearch || undefined },
                })
            );
            setFaculties(response.data?.data || []);
            setFacultyPagination({
                current_page: response.data?.current_page || 1,
                last_page: response.data?.last_page || 1,
                total: response.data?.total || 0,
                per_page: response.data?.per_page || 25,
            });
        } catch (err) {
            console.error("Faculty loading error:", err);
            setError(err.response?.data?.message || "Unable to load faculty records.");
        }
    }, []);

    useEffect(() => {
        if (initialStudentSearch.current) {
            initialStudentSearch.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            loadStudentPage(1, search);
            loadStaffPage(1, search);
            loadFacultyPage(1, search);
        }, 250);

        return () => clearTimeout(timeout);
    }, [search, loadStudentPage, loadStaffPage, loadFacultyPage]);

    async function fetchData() {
        setLoading(true);
        setError("");

        try {
            await Promise.all([
                loadStudentPage(1, search),
                loadStaffPage(1, search),
                loadFacultyPage(1, search),
            ]);
        } catch (err) {
            console.error(err);

            setError(
                getErrorMessage(
                    err,
                    "Unable to load student, staff, and faculty records."
                )
            );
        } finally {
            setLoading(false);
        }
    }







    const filteredStudents = useMemo(() => {
        return (students || [])
            .filter((s) => {
                if (sexFilter !== "all" && (s.sex || "").toLowerCase() !== sexFilter.toLowerCase()) {
                    return false;
                }
                if (courseFilter !== "all" && s.course !== courseFilter) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => {
                const nameA = `${a.last_name || ""} ${a.first_name || ""}`.toLowerCase();
                const nameB = `${b.last_name || ""} ${b.first_name || ""}`.toLowerCase();
                if (sortBy === "name_asc") return nameA.localeCompare(nameB);
                if (sortBy === "name_desc") return nameB.localeCompare(nameA);
                if (sortBy === "id_asc") return (a.student_id || "").localeCompare(b.student_id || "");
                return 0;
            });
    }, [students, sexFilter, courseFilter, sortBy]);

    const filteredStaff = useMemo(() => {
        return (staff || [])
            .filter((s) => {
                if (sexFilter !== "all" && (s.sex || "").toLowerCase() !== sexFilter.toLowerCase()) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => {
                const nameA = `${a.last_name || ""} ${a.first_name || ""}`.toLowerCase();
                const nameB = `${b.last_name || ""} ${b.first_name || ""}`.toLowerCase();
                if (sortBy === "name_asc") return nameA.localeCompare(nameB);
                if (sortBy === "name_desc") return nameB.localeCompare(nameA);
                if (sortBy === "id_asc") return (a.staff_id || "").localeCompare(b.staff_id || "");
                return 0;
            });
    }, [staff, sexFilter, sortBy]);

    const filteredFaculties = useMemo(() => {
        return (faculties || [])
            .filter((f) => {
                if (sexFilter !== "all" && (f.sex || "").toLowerCase() !== sexFilter.toLowerCase()) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => {
                const nameA = `${a.last_name || ""} ${a.first_name || ""}`.toLowerCase();
                const nameB = `${b.last_name || ""} ${b.first_name || ""}`.toLowerCase();
                if (sortBy === "name_asc") return nameA.localeCompare(nameB);
                if (sortBy === "name_desc") return nameB.localeCompare(nameA);
                if (sortBy === "id_asc") return (a.employee_id || "").localeCompare(b.employee_id || "");
                return 0;
            });
    }, [faculties, sexFilter, sortBy]);







    const resetAllPatientForms = () => {
        setStudentForm({ ...EMPTY_STUDENT_FORM });
        setStaffForm({ ...EMPTY_STAFF_FORM });
        setFacultyForm({ ...EMPTY_FACULTY_FORM });
        setError("");
    };

    const openStudentForm = (student = null) => {
        setError("");
        setFormError("");
        setEditingStudent(student);

        if (student) {
            setStudentForm({
                student_id: student.student_id || "",
                first_name: student.first_name || "",
                middle_name: student.middle_name || "",
                last_name: student.last_name || "",
                course: student.course || "",
                year_level: student.year_level || "",
                section: student.section || "",
                sex: student.sex || "",
                birth_date: formatDateInput(
                    student.birth_date
                ),
                contact_number:
                    student.contact_number || "",
                address: student.address || "",
            });
        } else {
            resetAllPatientForms();
        }

        setShowStudentForm(true);
    };

    const closeStudentForm = (force = false) => {
        if (saving && !force) {
            return;
        }

        setShowStudentForm(false);
        setEditingStudent(null);
        setFormError("");
        resetAllPatientForms();
    };

    const openStaffForm = (person = null) => {
        setError("");
        setFormError("");
        setEditingStaff(person);

        if (person) {
            setStaffForm({
                staff_id: person.staff_id || "",
                first_name: person.first_name || "",
                middle_name: person.middle_name || "",
                last_name: person.last_name || "",
                position: person.position || "",
                department: person.department || "",
                sex: person.sex || "",
                birth_date: formatDateInput(
                    person.birth_date
                ),
                contact_number:
                    person.contact_number || "",
                address: person.address || "",
            });
        } else {
            resetAllPatientForms();
        }

        setShowStaffForm(true);
    };

    const closeStaffForm = (force = false) => {
        if (saving && !force) {
            return;
        }

        setShowStaffForm(false);
        setEditingStaff(null);
        setFormError("");
        resetAllPatientForms();
    };

    const openFacultyForm = (faculty = null) => {
        setError("");
        setFormError("");
        setEditingFaculty(faculty);

        if (faculty) {
            setFacultyForm({
                employee_id:
                    faculty.employee_id || "",
                first_name:
                    faculty.first_name || "",
                middle_name:
                    faculty.middle_name || "",
                last_name:
                    faculty.last_name || "",
                position:
                    faculty.position || "",
                department:
                    faculty.department || "",
                sex:
                    faculty.sex || "",
                birth_date:
                    formatDateInput(
                        faculty.birth_date
                    ),
                contact_number:
                    faculty.contact_number || "",
                address:
                    faculty.address || "",
            });
        } else {
            resetAllPatientForms();
        }

        setShowFacultyForm(true);
    };

    const closeFacultyForm = (force = false) => {
        if (saving && !force) {
            return;
        }

        setShowFacultyForm(false);
        setEditingFaculty(null);
        setFormError("");
        resetAllPatientForms();
    };

    const handleSwitchCategory = (category: "student" | "faculty" | "staff") => {
        if (category === "student") {
            const currentSource = showFacultyForm ? facultyForm : staffForm;
            setStudentForm((prev) => ({
                ...prev,
                student_id: prev.student_id && prev.student_id.startsWith("20") ? prev.student_id : "",
                first_name: currentSource.first_name || prev.first_name,
                middle_name: currentSource.middle_name || prev.middle_name,
                last_name: currentSource.last_name || prev.last_name,
                sex: currentSource.sex || prev.sex,
                birth_date: currentSource.birth_date || prev.birth_date,
                contact_number: currentSource.contact_number || prev.contact_number,
                address: currentSource.address || prev.address,
            }));
            setShowFacultyForm(false);
            setShowStaffForm(false);
            setShowStudentForm(true);
            setActiveTab("students");
        } else if (category === "faculty") {
            const currentSource = showStudentForm ? studentForm : staffForm;
            setFacultyForm((prev) => ({
                ...prev,
                first_name: currentSource.first_name || prev.first_name,
                middle_name: currentSource.middle_name || prev.middle_name,
                last_name: currentSource.last_name || prev.last_name,
                sex: currentSource.sex || prev.sex,
                birth_date: currentSource.birth_date || prev.birth_date,
                contact_number: currentSource.contact_number || prev.contact_number,
                address: currentSource.address || prev.address,
                department: (showStaffForm ? staffForm.department : prev.department) || "",
                position: (showStaffForm ? staffForm.position : prev.position) || "",
            }));
            setShowStudentForm(false);
            setShowStaffForm(false);
            setShowFacultyForm(true);
            setActiveTab("faculty");
        } else if (category === "staff") {
            const currentSource = showStudentForm ? studentForm : facultyForm;
            setStaffForm((prev) => ({
                ...prev,
                first_name: currentSource.first_name || prev.first_name,
                middle_name: currentSource.middle_name || prev.middle_name,
                last_name: currentSource.last_name || prev.last_name,
                sex: currentSource.sex || prev.sex,
                birth_date: currentSource.birth_date || prev.birth_date,
                contact_number: currentSource.contact_number || prev.contact_number,
                address: currentSource.address || prev.address,
                department: (showFacultyForm ? facultyForm.department : prev.department) || "",
                position: (showFacultyForm ? facultyForm.position : prev.position) || "",
            }));
            setShowStudentForm(false);
            setShowFacultyForm(false);
            setShowStaffForm(true);
            setActiveTab("staff");
        }
    };

    const handleClearServerError = useCallback(() => {
        setFormError("");
    }, []);

    const viewStudentRecord = async (student) => {
        setError("");

        try {
            const response = await api.get(`/students/${student.id}`);

            setViewingStudent(response.data);
        } catch (err) {
            console.error(err);

            setViewingStudent(student);

            setError(
                getErrorMessage(
                    err,
                    "Unable to load student record."
                )
            );
        }
    };

    const closeStudentProfile = () => {
        setViewingStudent(null);
        setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams);
            nextParams.delete("profile_type");
            nextParams.delete("profile_code");
            return nextParams;
        }, { replace: true });
    };

    const openMedicalReport = async (item: any, type: "student" | "faculty" | "staff" = "student") => {
        setMedicalReportStudent(item);
        setMedicalReportType(type);
        setLoadingMedicalReport(true);
        try {
            let endpoint = `/students/${item.id}/medical-history`;
            if (type === "faculty") endpoint = `/faculties/${item.id}/medical-history`;
            else if (type === "staff") endpoint = `/staff/${item.id}/medical-history`;

            const res = await api.get(endpoint);
            setMedicalReportData(res.data);
            if (res.data?.patient) {
                setMedicalReportStudent((prev: any) => ({ ...prev, ...res.data.patient }));
            }
        } catch (err) {
            console.error("Failed to load medical history:", err);
            const fullName = getFullName(item);
            const dept = type === "student" ? (item.department || mapCourseToDepartment(item.course)) : (item.department || "N/A");
            const fallbackPatient = {
                ...item,
                full_name: fullName,
                department: dept,
            };
            setMedicalReportData({
                patient_type: type,
                patient: fallbackPatient,
                student: fallbackPatient,
                faculty: fallbackPatient,
                staff: fallbackPatient,
                total_visits: item.clinic_visits?.length || 0,
                visits: item.clinic_visits || [],
            });
        } finally {
            setLoadingMedicalReport(false);
        }
    };

    const closeMedicalReport = () => {
        setMedicalReportStudent(null);
        setMedicalReportData(null);
        setMedicalReportType("student");
    };

    const handleDownloadCertificate = (specificVisit?: any) => {
        if (!medicalReportStudent) return;
        const patientInfo = medicalReportData?.patient || medicalReportData?.student || medicalReportData?.faculty || medicalReportData?.staff || {
            ...medicalReportStudent,
            full_name: getFullName(medicalReportStudent),
            department: medicalReportStudent.department || mapCourseToDepartment(medicalReportStudent.course),
        };
        const visits = medicalReportData?.visits || medicalReportStudent.clinic_visits || [];
        const visit = specificVisit || visits[0] || {};

        const roleLabel = medicalReportType === "faculty"
            ? `Faculty (${patientInfo.position || "Instructor"} - ${patientInfo.department || "Faculty"})`
            : medicalReportType === "staff"
            ? `Staff (${patientInfo.position || "Staff"} - ${patientInfo.department || "Office"})`
            : `Student (${patientInfo.course || ""})`;

        exportMedicalCertificatePDF({
            patient_name: patientInfo.full_name || getFullName(patientInfo),
            student_id: patientInfo.student_id || patientInfo.employee_id || patientInfo.staff_id,
            role_label: roleLabel,
            address: patientInfo.address,
            visit_date: visit.visit_date || new Date().toISOString(),
            diagnosis: visit.assessment || visit.symptoms || visit.reason || "Clinical Consultation & Treatment",
            reason: visit.reason,
            symptoms: visit.symptoms,
            temperature: visit.temperature,
            blood_pressure: visit.blood_pressure,
            treatment: visit.treatment,
            remarks: visit.remarks,
            attending_nurse: visit.nurse?.name || visit.nurse_name || (typeof visit.nurse === "string" ? visit.nurse : "Angel Stacee Sabandal"),
        });
    };

    const handleDownloadMedicalReport = () => {
        if (!medicalReportStudent) return;
        const patientInfo = medicalReportData?.patient || medicalReportData?.student || medicalReportData?.faculty || medicalReportData?.staff || {
            ...medicalReportStudent,
            full_name: getFullName(medicalReportStudent),
            department: medicalReportStudent.department || mapCourseToDepartment(medicalReportStudent.course),
        };
        const visits = (medicalReportData?.visits || medicalReportStudent.clinic_visits || []).map((v: any) => ({
            id: v.id,
            visit_date: v.visit_date,
            reason: v.reason,
            symptoms: v.symptoms,
            temperature: v.temperature,
            blood_pressure: v.blood_pressure,
            assessment: v.assessment,
            treatment: v.treatment,
            medicine_name: v.medicine?.name || v.medicine_name,
            medicine_quantity: v.quantity || v.medicine_quantity,
            nurse_name: v.nurse?.name || (typeof v.nurse === "string" ? v.nurse : v.nurse_name),
            remarks: v.remarks,
            department: v.department || patientInfo.department,
        }));
        const totalCount = medicalReportData?.total_visits ?? visits.length;

        exportPatientMedicalReportPDF(patientInfo, visits, totalCount, medicalReportType);
    };

    useEffect(() => {
        const profileType = searchParams.get("profile_type");
        if (profileType === "student") setActiveTab("students");
        else if (profileType === "staff") setActiveTab("staff");
        else if (profileType === "faculty") setActiveTab("faculty");

        const profileCode = searchParams.get("profile_code");

        const profileConfig = {
            student: {
                collection: "students",
                identifier: "student_id",
                setProfile: setViewingStudent,
            },
            staff: {
                collection: "staff",
                identifier: "staff_id",
                setProfile: setViewingStaff,
            },
            faculty: {
                collection: "faculties",
                identifier: "employee_id",
                setProfile: setViewingFaculty,
            },
        }[profileType];

        if (!profileCode || !profileConfig) {
            return undefined;
        }

        let cancelled = false;

        const loadAndOpenStudent = async () => {
            try {
                const normalizedProfileCode = profileCode.trim().toLowerCase();
                const personResponse = await getCachedRecord(
                    `${profileConfig.collection}:profile:${normalizedProfileCode}`,
                    () => api.get(`/${profileConfig.collection}`, {
                        params: {
                            search: profileCode,
                            per_page: 100,
                        },
                    })
                );
                const person = personResponse.data?.data?.find(
                    (record) =>
                        String(record[profileConfig.identifier]).trim().toLowerCase() ===
                        profileCode.trim().toLowerCase()
                );

                if (!person) {
                    throw new Error(`${profileType} ID was not found.`);
                }

                const response = await getCachedRecord(
                    `${profileConfig.collection}:detail:${person.id}`,
                    () => api.get(`/${profileConfig.collection}/${encodeURIComponent(person.id)}`)
                );

                if (!cancelled) {
                    setViewingStudent(null);
                    setViewingStaff(null);
                    setViewingFaculty(null);
                    profileConfig.setProfile(response.data);
                }
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error("Student profile loading error:", err);
                setError(
                    getErrorMessage(
                        err,
                        "Unable to load student record."
                    )
                );
            }
        };

        void loadAndOpenStudent();

        return () => {
            cancelled = true;
        };
    }, [searchParams]);







    const viewStaffRecord = async (person) => {
        setError("");

        try {
            const response = await api.get(`/staff/${person.id}`);

            setViewingStaff(response.data);
        } catch (err) {
            console.error(err);

            setViewingStaff(person);

            setError(
                getErrorMessage(
                    err,
                    "Unable to load staff record."
                )
            );
        }
    };







    const viewFacultyRecord = async (faculty) => {
        setError("");

        try {
            const response = await api.get(`/faculties/${faculty.id}`);

            setViewingFaculty(response.data);
        } catch (err) {
            console.error(err);

            setViewingFaculty(faculty);

            setError(
                getErrorMessage(
                    err,
                    "Unable to load faculty record."
                )
            );
        }
    };







    const handleStudentSubmit = async (e: any) => {
        e.preventDefault();

        if (saving) {
            return;
        }

        setError("");

        if (!studentForm.student_id || !studentForm.student_id.trim()) {
            setError("Student ID is required.");
            return;
        }

        const sId = studentForm.student_id.trim();

        if (!/^\d+$/.test(sId)) {
            setError("Student ID must contain numbers only.");
            setFormError("Student ID must contain numbers only.");
            return;
        }

        if (!sId.startsWith("20")) {
            setError("Student ID must start with 20 (e.g. 20241041).");
            setFormError("Student ID must start with 20 (e.g. 20241041).");
            return;
        }

        if (sId.length > 8) {
            setError("Student ID must not exceed 8 numbers.");
            setFormError("Student ID must not exceed 8 numbers.");
            return;
        }
        const dupStudent = students.find(
            (s: any) => String(s.student_id).trim() === sId && (!editingStudent || s.id !== editingStudent.id)
        );
        if (dupStudent) {
            const name = `${dupStudent.first_name || ""} ${dupStudent.last_name || ""}`.trim();
            const msg = `Student ID "${sId}" is already in use by student ${name || "record"}. Please enter a different ID.`;
            setError(msg);
            setFormError(msg);
            return;
        }
        const dupStaff = staff.find((st: any) => String(st.staff_id).trim() === sId);
        if (dupStaff) {
            const name = `${dupStaff.first_name || ""} ${dupStaff.last_name || ""}`.trim();
            const msg = `The ID "${sId}" is already in use by staff member ${name || "record"}. Please enter a different ID.`;
            setError(msg);
            setFormError(msg);
            return;
        }
        const dupFaculty = faculties.find((f: any) => String(f.employee_id).trim() === sId);
        if (dupFaculty) {
            const name = `${dupFaculty.first_name || ""} ${dupFaculty.last_name || ""}`.trim();
            const msg = `The ID "${sId}" is already in use by faculty member ${name || "record"}. Please enter a different ID.`;
            setError(msg);
            setFormError(msg);
            return;
        }

        if (!studentForm.first_name || !studentForm.first_name.trim()) {
            setError("First name is required.");
            setFormError("First name is required.");
            return;
        }

        if (!studentForm.last_name || !studentForm.last_name.trim()) {
            setError("Last name is required.");
            setFormError("Last name is required.");
            return;
        }

        if (!studentForm.birth_date || !/^\d{4}-\d{2}-\d{2}$/.test(studentForm.birth_date)) {
            setError("Birth date is incomplete. Please enter a complete date (Month, Day, and Year).");
            setFormError("Birth date is incomplete. Please enter a complete date (Month, Day, and Year).");
            return;
        }

        const [bYear] = studentForm.birth_date.split("-").map(Number);
        const currYear = new Date().getFullYear();
        if (bYear < 1920 || bYear > currYear) {
            setError(`Birth year must be between 1920 and ${currYear}.`);
            setFormError(`Birth year must be between 1920 and ${currYear}.`);
            return;
        }

        const phoneErr = validateContactNumber(studentForm.contact_number, true);
        if (phoneErr) {
            setError(phoneErr);
            setFormError(phoneErr);
            return;
        }

        await saveStudent();
    };

    const saveStudent = async () => {
        setSaving(true);
        setError("");
        try {
            if (editingStudent) {
                const updatedStudentRes = await api.put(`/students/${editingStudent.id}`, studentForm);
                const updatedStudentData = updatedStudentRes.data || { ...editingStudent, ...studentForm };
                setStudents((prev) =>
                    prev.map((s: any) => (s.id === editingStudent.id ? { ...s, ...updatedStudentData } : s))
                );
                if (viewingStudent?.id === editingStudent.id) {
                    setViewingStudent(updatedStudentData);
                }
                if (medicalReportStudent?.id === editingStudent.id) {
                    setMedicalReportStudent((prev: any) => ({ ...prev, ...updatedStudentData }));
                }
                closeStudentForm(true);
                setSuccessToast("Student updated successfully.");
                setInlineNotification({
                    type: "edit",
                    title: "Student Updated Successfully",
                    message: `${getFullName(studentForm)} profile and information have been updated.`,
                });
                addClinicNotification({
                    type: "edit",
                    title: "Student Updated",
                    description: `${getFullName(studentForm)} profile updated`,
                    category: "patient",
                });
            } else {
                await api.post("/students", studentForm);
                closeStudentForm(true);
                setSuccessToast("Student added successfully.");
                setInlineNotification({
                    type: "add",
                    title: "Student Added Successfully",
                    message: `${getFullName(studentForm)} (${studentForm.student_id || "Student"}) has been registered.`,
                });
                addClinicNotification({
                    type: "add",
                    title: "Student Registered",
                    description: `${getFullName(studentForm)} (${studentForm.student_id || "Student"}) registered`,
                    category: "patient",
                });
            }
            invalidateRecordCache();
            await fetchData();
        } catch (err: any) {
            console.error("Save student error:", err);
            const validationMsg = getErrorMessage(err, "Failed to save student record.");
            setError(validationMsg);
            setFormError(validationMsg);
        } finally {
            setSaving(false);
        }
    };







    const handleStaffSubmit = async (e: any) => {
        e.preventDefault();

        if (saving) {
            return;
        }

        setError("");

        if (!staffForm.staff_id.trim()) {
            setError("Staff ID is required.");
            setFormError("Staff ID is required.");
            return;
        }

        if (!/^\d+$/.test(staffForm.staff_id.trim())) {
            setError("Staff ID must contain numbers only.");
            setFormError("Staff ID must contain numbers only.");
            return;
        }

        const stId = staffForm.staff_id.trim();
        const dupStaff = staff.find(
            (st: any) => String(st.staff_id).trim() === stId && (!editingStaff || st.id !== editingStaff.id)
        );
        if (dupStaff) {
            const name = `${dupStaff.first_name || ""} ${dupStaff.last_name || ""}`.trim();
            const msg = `Staff ID "${stId}" is already in use by staff member ${name || "record"}. Please enter a different ID.`;
            setError(msg);
            setFormError(msg);
            return;
        }
        const dupStudent = students.find((s: any) => String(s.student_id).trim() === stId);
        if (dupStudent) {
            const name = `${dupStudent.first_name || ""} ${dupStudent.last_name || ""}`.trim();
            const msg = `The ID "${stId}" is already in use by student ${name || "record"}. Please enter a different ID.`;
            setError(msg);
            setFormError(msg);
            return;
        }
        const dupFaculty = faculties.find((f: any) => String(f.employee_id).trim() === stId);
        if (dupFaculty) {
            const name = `${dupFaculty.first_name || ""} ${dupFaculty.last_name || ""}`.trim();
            const msg = `The ID "${stId}" is already in use by faculty member ${name || "record"}. Please enter a different ID.`;
            setError(msg);
            setFormError(msg);
            return;
        }

        if (!staffForm.first_name.trim()) {
            setError("First name is required.");
            setFormError("First name is required.");
            return;
        }

        if (!staffForm.last_name.trim()) {
            setError("Last name is required.");
            setFormError("Last name is required.");
            return;
        }

        if (!staffForm.position.trim()) {
            setError("Position is required.");
            setFormError("Position is required.");
            return;
        }

        if (staffForm.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(staffForm.birth_date)) {
            setError("Staff birth date is incomplete. Please enter the full Month, Day, and Year.");
            setFormError("Staff birth date is incomplete. Please enter the full Month, Day, and Year.");
            return;
        }

        const phoneErr = validateContactNumber(staffForm.contact_number, true);
        if (phoneErr) {
            setError(phoneErr);
            setFormError(phoneErr);
            return;
        }

        await saveStaff();
    };

    const saveStaff = async () => {
        setSaving(true);
        setError("");
        try {
            if (editingStaff) {
                const updatedStaffRes = await api.put(`/staff/${editingStaff.id}`, staffForm);
                const updatedStaffData = updatedStaffRes.data || { ...editingStaff, ...staffForm };
                setStaff((prev) =>
                    prev.map((st: any) => (st.id === editingStaff.id ? { ...st, ...updatedStaffData } : st))
                );
                if (viewingStaff?.id === editingStaff.id) {
                    setViewingStaff(updatedStaffData);
                }
                if (medicalReportStudent?.id === editingStaff.id) {
                    setMedicalReportStudent((prev: any) => ({ ...prev, ...updatedStaffData }));
                }
                closeStaffForm(true);
                setSuccessToast("Staff member updated successfully.");
                setInlineNotification({
                    type: "edit",
                    title: "Staff Updated Successfully",
                    message: `${getFullName(staffForm)} profile and information have been updated.`,
                });
                addClinicNotification({
                    type: "edit",
                    title: "Staff Updated",
                    description: `${getFullName(staffForm)} profile updated`,
                    category: "patient",
                });
            } else {
                await api.post("/staff", staffForm);
                closeStaffForm(true);
                setSuccessToast("Staff member added successfully.");
                setInlineNotification({
                    type: "add",
                    title: "Staff Added Successfully",
                    message: `${getFullName(staffForm)} has been registered.`,
                });
                addClinicNotification({
                    type: "add",
                    title: "Staff Registered",
                    description: `${getFullName(staffForm)} registered`,
                    category: "patient",
                });
            }
            invalidateRecordCache();
            await fetchData();
        } catch (err: any) {
            console.error("Save staff error:", err);
            const validationMsg = getErrorMessage(err, "Failed to save staff record.");
            setError(validationMsg);
            setFormError(validationMsg);
        } finally {
            setSaving(false);
        }
    };







    const handleFacultySubmit = async (e: any) => {
        e.preventDefault();

        if (saving) {
            return;
        }

        setError("");

        if (!facultyForm.employee_id.trim()) {
            setError("Faculty ID is required.");
            setFormError("Faculty ID is required.");
            return;
        }

        if (!/^\d+$/.test(facultyForm.employee_id.trim())) {
            setError("Faculty ID must contain numbers only.");
            setFormError("Faculty ID must contain numbers only.");
            return;
        }

        const fId = facultyForm.employee_id.trim();
        const dupFaculty = faculties.find(
            (f: any) => String(f.employee_id).trim() === fId && (!editingFaculty || f.id !== editingFaculty.id)
        );
        if (dupFaculty) {
            const name = `${dupFaculty.first_name || ""} ${dupFaculty.last_name || ""}`.trim();
            const msg = `Faculty ID "${fId}" is already in use by faculty member ${name || "record"}. Please enter a different ID.`;
            setError(msg);
            setFormError(msg);
            return;
        }
        const dupStudent = students.find((s: any) => String(s.student_id).trim() === fId);
        if (dupStudent) {
            const name = `${dupStudent.first_name || ""} ${dupStudent.last_name || ""}`.trim();
            const msg = `The ID "${fId}" is already in use by student ${name || "record"}. Please enter a different ID.`;
            setError(msg);
            setFormError(msg);
            return;
        }
        const dupStaff = staff.find((st: any) => String(st.staff_id).trim() === fId);
        if (dupStaff) {
            const name = `${dupStaff.first_name || ""} ${dupStaff.last_name || ""}`.trim();
            const msg = `The ID "${fId}" is already in use by staff member ${name || "record"}. Please enter a different ID.`;
            setError(msg);
            setFormError(msg);
            return;
        }

        if (!facultyForm.first_name.trim()) {
            setError("First name is required.");
            setFormError("First name is required.");
            return;
        }

        if (!facultyForm.last_name.trim()) {
            setError("Last name is required.");
            setFormError("Last name is required.");
            return;
        }

        if (!facultyForm.position.trim()) {
            setError("Position is required.");
            setFormError("Position is required.");
            return;
        }

        if (facultyForm.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(facultyForm.birth_date)) {
            setError("Faculty birth date is incomplete. Please enter the full Month, Day, and Year.");
            setFormError("Faculty birth date is incomplete. Please enter the full Month, Day, and Year.");
            return;
        }

        if (facultyForm.contact_number && facultyForm.contact_number.trim() !== "") {
            const phoneErr = validateContactNumber(facultyForm.contact_number, false);
            if (phoneErr) {
                setError(phoneErr);
                setFormError(phoneErr);
                return;
            }
        }

        await saveFaculty();
    };

    const saveFaculty = async () => {
        setSaving(true);
        setError("");
        try {
            if (editingFaculty) {
                const updatedFacultyRes = await api.put(`/faculties/${editingFaculty.id}`, facultyForm);
                const updatedFacultyData = updatedFacultyRes.data || { ...editingFaculty, ...facultyForm };
                setFaculties((prev) =>
                    prev.map((f: any) => (f.id === editingFaculty.id ? { ...f, ...updatedFacultyData } : f))
                );
                if (viewingFaculty?.id === editingFaculty.id) {
                    setViewingFaculty(updatedFacultyData);
                }
                if (medicalReportStudent?.id === editingFaculty.id) {
                    setMedicalReportStudent((prev: any) => ({ ...prev, ...updatedFacultyData }));
                }
                closeFacultyForm(true);
                setSuccessToast("Faculty member updated successfully.");
                setInlineNotification({
                    type: "edit",
                    title: "Faculty Updated Successfully",
                    message: `${getFullName(facultyForm)} profile and information have been updated.`,
                });
                addClinicNotification({
                    type: "edit",
                    title: "Faculty Updated",
                    description: `${getFullName(facultyForm)} profile updated`,
                    category: "patient",
                });
            } else {
                await api.post("/faculties", facultyForm);
                closeFacultyForm(true);
                setSuccessToast("Faculty member added successfully.");
                setInlineNotification({
                    type: "add",
                    title: "Faculty Added Successfully",
                    message: `${getFullName(facultyForm)} has been registered.`,
                });
                addClinicNotification({
                    type: "add",
                    title: "Faculty Registered",
                    description: `${getFullName(facultyForm)} registered`,
                    category: "patient",
                });
            }
            invalidateRecordCache();
            await fetchData();
        } catch (err: any) {
            console.error("Save faculty error:", err);
            const validationMsg = getErrorMessage(err, "Failed to save faculty record.");
            setError(validationMsg);
            setFormError(validationMsg);
        } finally {
            setSaving(false);
        }
    };







    const deleteStudent = (student) => {
        const name =
            getFullName(student) ||
            "this student";

        setConfirmation({
            type: "deleteStudent",
            person: student,

            title: "Delete Student",

            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,

            confirmText: "Delete Student",
            danger: true,
        });
    };







    const deleteStaff = (person) => {
        const name =
            getFullName(person) ||
            "this staff member";

        setConfirmation({
            type: "deleteStaff",
            person,

            title: "Delete Staff",

            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,

            confirmText: "Delete Staff",
            danger: true,
        });
    };







    const deleteFaculty = (faculty) => {
        const name =
            getFullName(faculty) ||
            "this faculty member";

        setConfirmation({
            type: "deleteFaculty",
            person: faculty,

            title: "Delete Faculty",

            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,

            confirmText: "Delete Faculty",
            danger: true,
        });
    };







    const handleRestoreQuick = async (id: number | string, type: "student" | "staff" | "faculty") => {
        try {
            const endpoint =
                type === "student"
                    ? `/students/${id}/restore`
                    : type === "staff"
                    ? `/staff/${id}/restore`
                    : `/faculties/${id}/restore`;

            await api.post(endpoint);
            setSuccessToast("Patient record restored successfully.");
            setInlineNotification({
                type: "restore",
                title: "Record Restored",
                message: "Patient record has been restored successfully.",
            });
            setToastAction(undefined);
            invalidateRecordCache();
            await fetchData();
        } catch (err: any) {
            console.error("Failed to restore record:", err);
            setError("Failed to restore record.");
            setInlineNotification({
                type: "error",
                title: "Restore Failed",
                message: "Failed to restore record. Please try again.",
            });
        }
    };

    const handleConfirmation = async () => {
        if (!confirmation || saving) {
            return;
        }

        setSaving(true);
        setError("");
        let completedMessage = "";

        try {
            switch (confirmation.type) {
                case "deleteStudent":
                    const deletedStudentId = confirmation.person.id;
                    await api.delete(
                        `/students/${deletedStudentId}`
                    );

                    if (
                        viewingStudent?.id ===
                        deletedStudentId
                    ) {
                        setViewingStudent(null);
                    }

                    completedMessage = "Student record moved to trash.";
                    setToastAction({
                        label: "Undo",
                        onClick: () => handleRestoreQuick(deletedStudentId, "student"),
                    });
                    setInlineNotification({
                        type: "delete",
                        title: "Student Record Deleted",
                        message: `${getFullName(confirmation.person)} was moved to trash.`,
                        action: {
                            label: "Undo",
                            onClick: () => handleRestoreQuick(deletedStudentId, "student"),
                        },
                    });
                    addClinicNotification({
                        type: "delete",
                        title: "Student Deleted",
                        description: `${getFullName(confirmation.person)} removed from student records`,
                        category: "patient",
                    });
                    break;

                case "deleteStaff":
                    const deletedStaffId = confirmation.person.id;
                    await api.delete(
                        `/staff/${deletedStaffId}`
                    );

                    if (
                        viewingStaff?.id ===
                        deletedStaffId
                    ) {
                        setViewingStaff(null);
                    }

                    completedMessage = "Staff record moved to trash.";
                    setToastAction({
                        label: "Undo",
                        onClick: () => handleRestoreQuick(deletedStaffId, "staff"),
                    });
                    setInlineNotification({
                        type: "delete",
                        title: "Staff Record Deleted",
                        message: `${getFullName(confirmation.person)} was moved to trash.`,
                        action: {
                            label: "Undo",
                            onClick: () => handleRestoreQuick(deletedStaffId, "staff"),
                        },
                    });
                    addClinicNotification({
                        type: "delete",
                        title: "Staff Deleted",
                        description: `${getFullName(confirmation.person)} removed from staff records`,
                        category: "patient",
                    });
                    break;

                case "deleteFaculty":
                    const deletedFacultyId = confirmation.person.id;
                    await api.delete(
                        `/faculties/${deletedFacultyId}`
                    );

                    if (
                        viewingFaculty?.id ===
                        deletedFacultyId
                    ) {
                        setViewingFaculty(null);
                    }

                    completedMessage = "Faculty record moved to trash.";
                    setToastAction({
                        label: "Undo",
                        onClick: () => handleRestoreQuick(deletedFacultyId, "faculty"),
                    });
                    setInlineNotification({
                        type: "delete",
                        title: "Faculty Record Deleted",
                        message: `${getFullName(confirmation.person)} was moved to trash.`,
                        action: {
                            label: "Undo",
                            onClick: () => handleRestoreQuick(deletedFacultyId, "faculty"),
                        },
                    });
                    addClinicNotification({
                        type: "delete",
                        title: "Faculty Deleted",
                        description: `${getFullName(confirmation.person)} removed from faculty records`,
                        category: "patient",
                    });
                    break;

                default:
                    break;
            }

            setConfirmation(null);

            invalidateRecordCache();
            await fetchData();
            if (completedMessage) setSuccessToast(completedMessage);
        } catch (err: any) {
            console.error(err);

            const validationMsg =
                err?.response?.data?.errors?.student_id?.[0] ||
                err?.response?.data?.errors?.staff_id?.[0] ||
                err?.response?.data?.errors?.employee_id?.[0] ||
                getErrorMessage(
                    err,
                    "Unable to complete the requested action."
                );

            setError(validationMsg);
            setFormError(validationMsg);
            setInlineNotification({
                type: "error",
                title: "Action Could Not Be Completed",
                message: validationMsg,
            });
            setConfirmation(null);
        } finally {
            setSaving(false);
        }
    };







    return (
        <div className="tcc-module-page relative min-h-screen overflow-hidden p-3.5 sm:p-5 lg:p-6">


            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#8f7154]/5 blur-3xl" />

                <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-[#8f7154]/5 blur-3xl" />

                <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl" />

                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#8f7154 1px, transparent 1px), linear-gradient(90deg, #8f7154 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />
            </div>

            <div className="tcc-module-content relative w-full">


                <div className="tcc-module-header mb-4 sm:mb-5 flex flex-col gap-3.5 sm:gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 shadow-sm">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#3d3329] dark:text-[#f8f3eb]">
                            PATIENT MANAGEMENT
                        </h1>

                        <p className="mt-1 text-xs sm:text-sm text-[#887d70] dark:text-[#a99d8f]">
                            Manage patient, staff, and faculty information.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setShowRestoreModal(true)}
                            className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-[#e8dfd4] bg-white px-4 py-3 text-sm font-semibold text-[#6d5942] shadow-xs transition hover:bg-[#fcfaf6] hover:text-[#3d3329] dark:border-[#4e4234] dark:bg-[#211c17] dark:text-[#e5dcd1] dark:hover:bg-[#2c231a] cursor-pointer"
                            title="Restore deleted patient records"
                        >
                            <RotateCcw size={15} className="text-[#8a6f50]" />
                            <span>Restore Deleted</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                if (activeTab === "staff") {
                                    openStaffForm();
                                } else if (activeTab === "faculty") {
                                    openFacultyForm();
                                } else {
                                    openStudentForm();
                                }
                            }}
                            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#70091f] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[#70091f]/20 transition hover:bg-[#8b1505] focus:outline-none focus:ring-2 focus:ring-[#70091f]/40 cursor-pointer"
                        >
                            <span>+ Add Patient</span>
                        </button>
                    </div>
                </div>

                {/* Inline Notification Banner under Header */}
                {inlineNotification && (
                    <div
                        role="status"
                        aria-live="polite"
                        className={`mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
                            inlineNotification.type === "delete"
                                ? "border-amber-200 bg-amber-50/95 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
                                : inlineNotification.type === "edit"
                                ? "border-blue-200 bg-blue-50/95 text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200"
                                : inlineNotification.type === "error"
                                ? "border-red-200 bg-red-50/95 text-red-950 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                                : "border-emerald-200 bg-emerald-50/95 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                                    inlineNotification.type === "delete"
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                                        : inlineNotification.type === "edit"
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                                        : inlineNotification.type === "error"
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                                }`}
                            >
                                {inlineNotification.type === "delete" ? (
                                    <Trash2 size={20} />
                                ) : inlineNotification.type === "edit" ? (
                                    <CheckCircle2 size={20} />
                                ) : inlineNotification.type === "error" ? (
                                    <AlertCircle size={20} />
                                ) : inlineNotification.type === "restore" ? (
                                    <RotateCcw size={20} />
                                ) : (
                                    <CheckCircle2 size={20} />
                                )}
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-bold tracking-tight">
                                    {inlineNotification.title}
                                </p>
                                <p className="text-xs opacity-90 leading-relaxed">
                                    {inlineNotification.message}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {inlineNotification.action && (
                                <button
                                    type="button"
                                    onClick={inlineNotification.action.onClick}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer"
                                >
                                    <RotateCcw size={13} />
                                    <span>{inlineNotification.action.label}</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setInlineNotification(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-black/5 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-stone-200 transition cursor-pointer"
                                aria-label="Dismiss notification"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Patient Category Tabs Navigation */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div
                        role="tablist"
                        aria-label="Patient categories"
                        className="inline-flex w-full sm:w-auto p-1.5 rounded-2xl bg-[#f5efe6] border border-[#e8dfd4] dark:bg-[#251f19] dark:border-[#3d3226]"
                    >
                        <button
                            type="button"
                            role="tab"
                            id="tab-students"
                            aria-selected={activeTab === "students"}
                            aria-controls="panel-students"
                            onClick={() => handleTabChange("students")}
                            className={`flex flex-1 sm:flex-initial items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                                activeTab === "students"
                                    ? "bg-[#70091f] text-white shadow-md shadow-[#70091f]/20 scale-[1.01]"
                                    : "text-[#766959] hover:text-[#3d3329] hover:bg-white/70 dark:text-[#a99d8f] dark:hover:text-[#f8f3eb] dark:hover:bg-[#1f1914]"
                            }`}
                        >
                            <GraduationCap size={17} className={activeTab === "students" ? "text-white" : "text-[#8a6f50] dark:text-[#c4b5a5]"} />
                            <span>Students</span>
                            <span
                                className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                    activeTab === "students"
                                        ? "bg-white/20 text-white"
                                        : "bg-[#e8dfd4] text-[#5c4e3f] dark:bg-[#382f25] dark:text-[#d3bca2]"
                                }`}
                            >
                                {studentPagination.total}
                            </span>
                        </button>

                        <button
                            type="button"
                            role="tab"
                            id="tab-staff"
                            aria-selected={activeTab === "staff"}
                            aria-controls="panel-staff"
                            onClick={() => handleTabChange("staff")}
                            className={`flex flex-1 sm:flex-initial items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                                activeTab === "staff"
                                    ? "bg-[#70091f] text-white shadow-md shadow-[#70091f]/20 scale-[1.01]"
                                    : "text-[#766959] hover:text-[#3d3329] hover:bg-white/70 dark:text-[#a99d8f] dark:hover:text-[#f8f3eb] dark:hover:bg-[#1f1914]"
                            }`}
                        >
                            <Briefcase size={17} className={activeTab === "staff" ? "text-white" : "text-[#8a6f50] dark:text-[#c4b5a5]"} />
                            <span>Staff</span>
                            <span
                                className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                    activeTab === "staff"
                                        ? "bg-white/20 text-white"
                                        : "bg-[#e8dfd4] text-[#5c4e3f] dark:bg-[#382f25] dark:text-[#d3bca2]"
                                }`}
                            >
                                {staffPagination.total}
                            </span>
                        </button>

                        <button
                            type="button"
                            role="tab"
                            id="tab-faculty"
                            aria-selected={activeTab === "faculty"}
                            aria-controls="panel-faculty"
                            onClick={() => handleTabChange("faculty")}
                            className={`flex flex-1 sm:flex-initial items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                                activeTab === "faculty"
                                    ? "bg-[#70091f] text-white shadow-md shadow-[#70091f]/20 scale-[1.01]"
                                    : "text-[#766959] hover:text-[#3d3329] hover:bg-white/70 dark:text-[#a99d8f] dark:hover:text-[#f8f3eb] dark:hover:bg-[#1f1914]"
                            }`}
                        >
                            <BookOpen size={17} className={activeTab === "faculty" ? "text-white" : "text-[#8a6f50] dark:text-[#c4b5a5]"} />
                            <span>Faculty</span>
                            <span
                                className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                    activeTab === "faculty"
                                        ? "bg-white/20 text-white"
                                        : "bg-[#e8dfd4] text-[#5c4e3f] dark:bg-[#382f25] dark:text-[#d3bca2]"
                                }`}
                            >
                                {facultyPagination.total}
                            </span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <span>{error}</span>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="font-bold"
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="mb-6 rounded-2xl border border-[#e8dfd4] bg-white p-4 shadow-sm sm:p-5 dark:border-[#4e4234] dark:bg-[#211c17]">
                    {/* Search and Filters Controls */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-12">
                        {/* Search Input */}
                        <div className={`relative sm:col-span-2 ${activeTab === "students" ? "md:col-span-5" : "md:col-span-7"}`}>
                            <label htmlFor="patient-search" className="sr-only">
                                Search patients by name, ID, course, or department
                            </label>
                            <Search
                                size={18}
                                aria-hidden="true"
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a99d8f] dark:text-[#887d70]"
                            />
                            <input
                                id="patient-search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={
                                    activeTab === "students"
                                        ? "Search students by name, ID, course..."
                                        : activeTab === "staff"
                                        ? "Search staff by name, ID, position, department..."
                                        : "Search faculty by name, ID, position, department..."
                                }
                                autoComplete="off"
                                className="w-full rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] py-2.5 pl-10 pr-10 text-sm text-[#3d3329] outline-none transition placeholder:text-[#a99d8f] focus:border-[#8a6f50] focus:bg-white focus:ring-4 focus:ring-[#8a6f50]/10 dark:border-[#4e4234] dark:bg-[#261f19] dark:text-[#f8f3eb] dark:placeholder:text-[#887d70] dark:focus:border-[#8a6f50] dark:focus:bg-[#211c17]"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                    className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[#a99d8f] hover:bg-[#f6f1e9] hover:text-[#3c332a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6f50] dark:text-[#887d70] dark:hover:bg-[#382f25] dark:hover:text-[#f8f3eb]"
                                >
                                    <X size={15} aria-hidden="true" />
                                </button>
                            )}
                        </div>

                        {/* Sex Filter */}
                        <div className="md:col-span-2">
                            <label htmlFor="sex-filter" className="sr-only">
                                Filter by Sex
                            </label>
                            <select
                                id="sex-filter"
                                value={sexFilter}
                                onChange={(e) => setSexFilter(e.target.value)}
                                aria-label="Filter by Sex"
                                className="w-full rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-3.5 py-2.5 text-sm font-medium text-[#3d3329] outline-none transition focus:border-[#8a6f50] focus:bg-white focus:ring-4 focus:ring-[#8a6f50]/10 dark:border-[#4e4234] dark:bg-[#261f19] dark:text-[#f8f3eb] dark:focus:border-[#8a6f50] dark:focus:bg-[#211c17]"
                            >
                                <option value="all">All Sex</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>

                        {/* Course Filter - only relevant for Students */}
                        {activeTab === "students" && (
                            <div className="md:col-span-3">
                                <label htmlFor="course-filter" className="sr-only">
                                    Filter by Course
                                </label>
                                <select
                                    id="course-filter"
                                    value={courseFilter}
                                    onChange={(e) => setCourseFilter(e.target.value)}
                                    aria-label="Filter by Course"
                                    className="w-full rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-3.5 py-2.5 text-sm font-medium text-[#3d3329] outline-none transition focus:border-[#8a6f50] focus:bg-white focus:ring-4 focus:ring-[#8a6f50]/10 dark:border-[#4e4234] dark:bg-[#261f19] dark:text-[#f8f3eb] dark:focus:border-[#8a6f50] dark:focus:bg-[#211c17]"
                                >
                                    <option value="all">All Courses</option>
                                    {COURSES.map((course) => (
                                        <option key={course} value={course}>
                                            {course}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Sort Filter */}
                        <div className={activeTab === "students" ? "md:col-span-2" : "md:col-span-3"}>
                            <label htmlFor="sort-filter" className="sr-only">
                                Sort records
                            </label>
                            <select
                                id="sort-filter"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                aria-label="Sort records"
                                className="w-full rounded-xl border border-[#e8dfd4] bg-[#fcfaf6] px-3.5 py-2.5 text-sm font-medium text-[#3d3329] outline-none transition focus:border-[#8a6f50] focus:bg-white focus:ring-4 focus:ring-[#8a6f50]/10 dark:border-[#4e4234] dark:bg-[#261f19] dark:text-[#f8f3eb] dark:focus:border-[#8a6f50] dark:focus:bg-[#211c17]"
                            >
                                <option value="name_asc">Sort: Name (A-Z)</option>
                                <option value="name_desc">Sort: Name (Z-A)</option>
                                <option value="id_asc">Sort: ID / Code</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filter Tags */}
                    {hasActiveFilters && (
                        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-[#eee7de] pt-3 text-xs dark:border-[#4e4234]">
                            <span className="font-semibold text-[#887d70] dark:text-[#a99d8f]">Active filters:</span>
                            {search.trim() && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8dfd4] bg-[#f3ebdf] px-2.5 py-1 font-medium text-[#6d5942] dark:border-[#4e4234] dark:bg-[#382f25] dark:text-[#e5dcd1]">
                                    Search: "{search}"
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        aria-label="Remove search filter"
                                        className="text-[#8a6f50] hover:text-[#3d3329] dark:text-[#d3bca2] dark:hover:text-white"
                                    >
                                        <X size={13} aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            {sexFilter !== "all" && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8dfd4] bg-[#f3ebdf] px-2.5 py-1 font-medium text-[#6d5942] dark:border-[#4e4234] dark:bg-[#382f25] dark:text-[#e5dcd1]">
                                    Sex: {sexFilter}
                                    <button
                                        type="button"
                                        onClick={() => setSexFilter("all")}
                                        aria-label="Remove sex filter"
                                        className="text-[#8a6f50] hover:text-[#3d3329] dark:text-[#d3bca2] dark:hover:text-white"
                                    >
                                        <X size={13} aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            {activeTab === "students" && courseFilter !== "all" && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8dfd4] bg-[#f3ebdf] px-2.5 py-1 font-medium text-[#6d5942] dark:border-[#4e4234] dark:bg-[#382f25] dark:text-[#e5dcd1]">
                                    Course: {courseFilter}
                                    <button
                                        type="button"
                                        onClick={() => setCourseFilter("all")}
                                        aria-label="Remove course filter"
                                        className="text-[#8a6f50] hover:text-[#3d3329] dark:text-[#d3bca2] dark:hover:text-white"
                                    >
                                        <X size={13} aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            {sortBy !== "name_asc" && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8dfd4] bg-[#f3ebdf] px-2.5 py-1 font-medium text-[#6d5942] dark:border-[#4e4234] dark:bg-[#382f25] dark:text-[#e5dcd1]">
                                    Sort: {sortBy === "name_desc" ? "Z-A" : "ID"}
                                    <button
                                        type="button"
                                        onClick={() => setSortBy("name_asc")}
                                        aria-label="Reset sort order"
                                        className="text-[#8a6f50] hover:text-[#3d3329] dark:text-[#d3bca2] dark:hover:text-white"
                                    >
                                        <X size={13} aria-hidden="true" />
                                    </button>
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={resetAllFilters}
                                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#8a6f50] transition hover:bg-[#f3ebdf] hover:text-[#735a40] dark:text-[#d3bca2] dark:hover:bg-[#382f25]"
                            >
                                <RotateCcw size={12} aria-hidden="true" />
                                <span>Reset all</span>
                            </button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-[#e8dfd4] bg-white p-6 shadow-sm animate-pulse dark:border-[#4e4234] dark:bg-[#211c17]">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="h-6 w-44 rounded-lg bg-stone-200 dark:bg-stone-800" />
                            <div className="h-8 w-28 rounded-lg bg-stone-100 dark:bg-stone-800/60" />
                        </div>
                        <div className="space-y-3.5">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 py-3 border-b border-stone-100 dark:border-stone-800/60 last:border-none"
                                >
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-stone-200 dark:bg-stone-800" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-4 w-1/3 rounded bg-stone-200 dark:bg-stone-800" />
                                        <div className="h-3 w-1/4 rounded bg-stone-100 dark:bg-stone-800/60" />
                                    </div>
                                    <div className="hidden sm:block h-6 w-20 rounded-full bg-stone-100 dark:bg-stone-800/60" />
                                    <div className="h-8 w-24 rounded-lg bg-stone-200 dark:bg-stone-800" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Students Tab Panel */}
                        {activeTab === "students" && (
                            <div
                                role="tabpanel"
                                id="panel-students"
                                aria-labelledby="tab-students"
                                className="mb-8 overflow-hidden rounded-xl border border-[#e8dfd4] bg-white shadow-sm dark:border-[#4e4234] dark:bg-[#211c17]"
                            >
                                <div className="border-b border-[#e8dfd4] bg-white px-5 py-4 dark:border-[#4e4234] dark:bg-[#211c17]">
                                    <h2 className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                        Students
                                    </h2>

                                    <p className="text-sm text-[#887d70] dark:text-[#a99d8f]">
                                        {filteredStudents.length !== studentPagination.total
                                            ? `${filteredStudents.length} of ${studentPagination.total} student(s)`
                                            : `${studentPagination.total} student(s)`}
                                    </p>
                                </div>

                                <div className="hidden md:block overflow-x-auto scrollbar-thin">
                                    <table className="w-full min-w-[760px] lg:min-w-full table-fixed text-left text-sm">
                                        <colgroup>
                                            <col style={{ width: "15%" }} />
                                            <col style={{ width: "25%" }} />
                                            <col style={{ width: "12%" }} />
                                            <col style={{ width: "14%" }} />
                                            <col style={{ width: "12%" }} />
                                            <col style={{ width: "22%" }} />
                                        </colgroup>
                                        <thead className="border-b border-[#e8dfd4] bg-[#fcfaf6] text-xs font-bold uppercase tracking-wider text-[#887d70] dark:border-[#4e4234] dark:bg-[#29231d] dark:text-[#c4b5a5]">
                                            <tr>
                                                <th className="px-5 py-3.5">
                                                    Student ID
                                                </th>

                                                <th className="px-5 py-3.5">
                                                    Name
                                                </th>

                                                <th className="px-5 py-3.5">
                                                    Course
                                                </th>

                                                <th className="px-5 py-3.5">
                                                    Year Level
                                                </th>

                                                <th className="px-5 py-3.5">
                                                    Sex
                                                </th>

                                                <th className="px-5 py-3.5 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-[#eee7de] dark:divide-[#382f25]">
                                            {filteredStudents.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="px-5 py-8 text-center text-[#887d70] dark:text-[#a99d8f]"
                                                    >
                                                        No students found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredStudents.map(
                                                    (student) => (
                                                        <tr
                                                            key={student.id}
                                                            className="align-middle transition-colors hover:bg-[#fcfaf6] dark:hover:bg-[#2a221a]"
                                                        >
                                                            <td className="px-5 py-4 font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                                                {formatNA(student.student_id)}
                                                            </td>

                                                            <td className="px-5 py-4 text-[#3d3329] dark:text-[#f8f3eb]">
                                                                {formatNA(getFullName(
                                                                    student
                                                                ))}
                                                            </td>

                                                            <td className="px-5 py-4 text-[#766959] dark:text-[#c4b5a5]">
                                                                {formatNA(student.course)}
                                                            </td>

                                                            <td className="px-5 py-4 text-[#766959] dark:text-[#c4b5a5]">
                                                                {formatNA(student.year_level)}
                                                            </td>

                                                            <td className="px-5 py-4 text-[#766959] dark:text-[#c4b5a5]">
                                                                {formatNA(student.sex)}
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openMedicalReport(
                                                                                student
                                                                            )
                                                                        }
                                                                        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#70091f]/40 bg-[#fdf5f3] px-2.5 sm:px-3 text-xs font-semibold text-[#70091f] shadow-xs transition hover:bg-[#70091f] hover:text-white dark:border-[#70091f]/50 dark:bg-[#70091f]/20 dark:text-[#f8a598] cursor-pointer"
                                                                        title="Individual Student Medical Certificate"
                                                                        aria-label="Individual Student Medical Certificate"
                                                                    >
                                                                        <FileBadge size={14} className="shrink-0" />
                                                                        <span>Medical Certificate</span>
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            viewStudentRecord(
                                                                                student
                                                                            )
                                                                        }
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8dfd4] bg-[#fcfaf6] text-[#766959] transition hover:bg-[#f3ebdf] hover:text-[#3d3329] dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#e5dcd1] dark:hover:bg-[#382f25] cursor-pointer"
                                                                        title="View Student Record"
                                                                        aria-label="View Student Record"
                                                                    >
                                                                        <Eye size={15} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openStudentForm(
                                                                                student
                                                                            )
                                                                        }
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50 text-amber-700 transition hover:bg-amber-100 hover:text-amber-800 dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#e5dcd1] dark:hover:border-amber-700/60 dark:hover:text-amber-300 cursor-pointer"
                                                                        title="Edit Student Record"
                                                                        aria-label="Edit Student Record"
                                                                    >
                                                                        <Pencil size={15} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            deleteStudent(
                                                                                student
                                                                            )
                                                                        }
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/80 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700 dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-red-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 cursor-pointer"
                                                                        title="Delete Student Record"
                                                                        aria-label="Delete Student Record"
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Student Card View */}
                                <div className="block md:hidden divide-y divide-[#eee7de] p-3 space-y-3 dark:divide-[#382f25]">
                                    {filteredStudents.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-[#887d70] dark:text-[#a99d8f]">
                                            No students found.
                                        </div>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <div
                                                key={student.id}
                                                className="rounded-xl border border-[#e8dfd4] bg-white p-3.5 shadow-xs dark:border-[#4e4234] dark:bg-[#261f19]"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className="font-mono text-xs font-bold text-[#70091f] dark:text-[#f8a598]">
                                                            {formatNA(student.student_id)}
                                                        </span>
                                                        <h3 className="mt-0.5 text-sm font-bold text-[#3d3329] dark:text-[#f8f3eb]">
                                                            {formatNA(getFullName(student))}
                                                        </h3>
                                                    </div>
                                                    <span className="inline-flex rounded-md border border-[#e8dfd4] bg-[#fcfaf6] px-2 py-0.5 text-[11px] font-medium text-[#766959] dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#c4b5a5]">
                                                        {formatNA(student.sex)}
                                                    </span>
                                                </div>

                                                <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs text-[#766959] dark:text-[#c4b5a5]">
                                                    <span className="rounded-md bg-[#f3ebdf] px-2 py-0.5 text-[11px] font-semibold text-[#8a6f50] dark:bg-[#342a22] dark:text-[#d4b996]">
                                                        {formatNA(student.course)}
                                                    </span>
                                                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                                        {formatNA(student.year_level)}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#eee7de] pt-3 dark:border-[#382f25]">
                                                    <button
                                                        type="button"
                                                        onClick={() => openMedicalReport(student)}
                                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#70091f]/40 bg-[#fdf5f3] px-2.5 text-xs font-semibold text-[#70091f] transition hover:bg-[#70091f] hover:text-white dark:border-[#70091f]/50 dark:bg-[#70091f]/20 dark:text-[#f8a598]"
                                                    >
                                                        <FileBadge size={14} className="shrink-0" />
                                                        <span>Medical Certificate</span>
                                                    </button>

                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => viewStudentRecord(student)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8dfd4] bg-[#fcfaf6] text-[#766959] transition hover:bg-[#f3ebdf] hover:text-[#3d3329] dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#e5dcd1]"
                                                            title="View Student Record"
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openStudentForm(student)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50 text-amber-700 transition hover:bg-amber-100 hover:text-amber-800 dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#e5dcd1]"
                                                            title="Edit Student Record"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteStudent(student)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/80 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700 dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-red-400"
                                                            title="Delete Student Record"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {renderPagination(
                                    studentPagination.current_page,
                                    studentPagination.last_page,
                                    studentPagination.total,
                                    (p) => loadStudentPage(p, search)
                                )}
                            </div>
                        )}

                        {/* Staff Tab Panel */}
                        {activeTab === "staff" && (
                            <div
                                role="tabpanel"
                                id="panel-staff"
                                aria-labelledby="tab-staff"
                                className="mb-8 overflow-hidden rounded-xl border border-[#e8dfd4] bg-white shadow-sm dark:border-[#4e4234] dark:bg-[#211c17]"
                            >
                                <div className="border-b border-[#e8dfd4] bg-white px-5 py-4 dark:border-[#4e4234] dark:bg-[#211c17]">
                                    <h2 className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                        Staff
                                    </h2>

                                    <p className="text-sm text-[#887d70] dark:text-[#a99d8f]">
                                        {filteredStaff.length !== staffPagination.total
                                            ? `${filteredStaff.length} of ${staffPagination.total} staff record(s)`
                                            : `${staffPagination.total} staff record(s)`}
                                    </p>
                                </div>

                                <div className="hidden md:block overflow-x-auto scrollbar-thin">
                                    <table className="w-full min-w-[760px] lg:min-w-full table-fixed text-left text-sm">
                                        <colgroup>
                                            <col style={{ width: "15%" }} />
                                            <col style={{ width: "25%" }} />
                                            <col style={{ width: "12%" }} />
                                            <col style={{ width: "14%" }} />
                                            <col style={{ width: "12%" }} />
                                            <col style={{ width: "22%" }} />
                                        </colgroup>
                                        <thead className="border-b border-[#e8dfd4] bg-[#fcfaf6] text-xs font-bold uppercase tracking-wider text-[#887d70] dark:border-[#4e4234] dark:bg-[#29231d] dark:text-[#c4b5a5]">
                                            <tr>
                                                <th className="px-5 py-3.5">
                                                    Staff ID
                                                </th>

                                                <th className="px-5 py-3.5">
                                                    Name
                                                </th>

                                                <th className="px-5 py-3.5">
                                                    Position
                                                </th>

                                                <th className="px-5 py-3.5">
                                                    Department
                                                </th>

                                                <th className="px-5 py-3.5">
                                                    Sex
                                                </th>

                                                <th className="px-5 py-3.5 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-[#eee7de] dark:divide-[#382f25]">
                                            {filteredStaff.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="px-5 py-8 text-center text-[#887d70] dark:text-[#a99d8f]"
                                                    >
                                                        No staff found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredStaff.map(
                                                    (person) => (
                                                        <tr
                                                            key={person.id}
                                                            className="align-middle transition-colors hover:bg-[#fcfaf6] dark:hover:bg-[#2a221a]"
                                                        >
                                                            <td className="px-5 py-4 font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                                                {formatNA(person.staff_id)}
                                                            </td>

                                                            <td className="px-5 py-4 text-[#3d3329] dark:text-[#f8f3eb]">
                                                                {formatNA(getFullName(
                                                                    person
                                                                ))}
                                                            </td>

                                                            <td className="px-5 py-4 text-[#766959] dark:text-[#c4b5a5]">
                                                                {formatNA(person.position)}
                                                            </td>

                                                            <td className="px-5 py-4 text-[#766959] dark:text-[#c4b5a5]">
                                                                {formatNA(person.department)}
                                                            </td>

                                                            <td className="px-5 py-4 text-[#766959] dark:text-[#c4b5a5]">
                                                                {formatNA(person.sex)}
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openMedicalReport(
                                                                                person,
                                                                                "staff"
                                                                            )
                                                                        }
                                                                        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#70091f]/40 bg-[#fdf5f3] px-2.5 sm:px-3 text-xs font-semibold text-[#70091f] shadow-xs transition hover:bg-[#70091f] hover:text-white dark:border-[#70091f]/50 dark:bg-[#70091f]/20 dark:text-[#f8a598] cursor-pointer"
                                                                        title="Individual Staff Medical Certificate"
                                                                        aria-label="Individual Staff Medical Certificate"
                                                                    >
                                                                        <FileBadge size={14} className="shrink-0" />
                                                                        <span>Medical Certificate</span>
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            viewStaffRecord(
                                                                                person
                                                                            )
                                                                        }
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8dfd4] bg-[#fcfaf6] text-[#766959] transition hover:bg-[#f3ebdf] hover:text-[#3d3329] dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#e5dcd1] dark:hover:bg-[#382f25] cursor-pointer"
                                                                        title="View Staff Record"
                                                                        aria-label="View Staff Record"
                                                                    >
                                                                        <Eye size={15} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openStaffForm(
                                                                                person
                                                                            )
                                                                        }
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50 text-amber-700 transition hover:bg-amber-100 hover:text-amber-800 dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#e5dcd1] dark:hover:border-amber-700/60 dark:hover:text-amber-300 cursor-pointer"
                                                                        title="Edit Staff Record"
                                                                        aria-label="Edit Staff Record"
                                                                    >
                                                                        <Pencil size={15} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            deleteStaff(
                                                                                person
                                                                            )
                                                                        }
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/80 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700 dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-red-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 cursor-pointer"
                                                                        title="Delete Staff Record"
                                                                        aria-label="Delete Staff Record"
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Staff Card View */}
                                <div className="block md:hidden divide-y divide-[#eee7de] p-3 space-y-3 dark:divide-[#382f25]">
                                    {filteredStaff.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-[#887d70] dark:text-[#a99d8f]">
                                            No staff found.
                                        </div>
                                    ) : (
                                        filteredStaff.map((person) => (
                                            <div
                                                key={person.id}
                                                className="rounded-xl border border-[#e8dfd4] bg-white p-3.5 shadow-xs dark:border-[#4e4234] dark:bg-[#261f19]"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className="font-mono text-xs font-bold text-[#70091f] dark:text-[#f8a598]">
                                                            {formatNA(person.staff_id)}
                                                        </span>
                                                        <h3 className="mt-0.5 text-sm font-bold text-[#3d3329] dark:text-[#f8f3eb]">
                                                            {formatNA(getFullName(person))}
                                                        </h3>
                                                    </div>
                                                    <span className="inline-flex rounded-md border border-[#e8dfd4] bg-[#fcfaf6] px-2 py-0.5 text-[11px] font-medium text-[#766959] dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#c4b5a5]">
                                                        {formatNA(person.sex)}
                                                    </span>
                                                </div>

                                                <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs text-[#766959] dark:text-[#c4b5a5]">
                                                    <span className="rounded-md bg-[#f3ebdf] px-2 py-0.5 text-[11px] font-semibold text-[#8a6f50] dark:bg-[#342a22] dark:text-[#d4b996]">
                                                        {formatNA(person.position)}
                                                    </span>
                                                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                                        {formatNA(person.department)}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#eee7de] pt-3 dark:border-[#382f25]">
                                                    <button
                                                        type="button"
                                                        onClick={() => openMedicalReport(person, "staff")}
                                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#70091f]/40 bg-[#fdf5f3] px-2.5 text-xs font-semibold text-[#70091f] transition hover:bg-[#70091f] hover:text-white dark:border-[#70091f]/50 dark:bg-[#70091f]/20 dark:text-[#f8a598]"
                                                    >
                                                        <FileBadge size={14} className="shrink-0" />
                                                        <span>Medical Certificate</span>
                                                    </button>

                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => viewStaffRecord(person)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8dfd4] bg-[#fcfaf6] text-[#766959] transition hover:bg-[#f3ebdf] hover:text-[#3d3329] dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#e5dcd1]"
                                                            title="View Staff Record"
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openStaffForm(person)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50 text-amber-700 transition hover:bg-amber-100 hover:text-amber-800 dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#e5dcd1]"
                                                            title="Edit Staff Record"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteStaff(person)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/80 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700 dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-red-400"
                                                            title="Delete Staff Record"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {renderPagination(
                                    staffPagination.current_page,
                                    staffPagination.last_page,
                                    staffPagination.total,
                                    (p) => loadStaffPage(p, search)
                                )}
                            </div>
                        )}

                        {/* Faculty Tab Panel */}
                        {activeTab === "faculty" && (
                            <div
                                role="tabpanel"
                                id="panel-faculty"
                                aria-labelledby="tab-faculty"
                                className="mb-8 overflow-hidden rounded-xl border border-[#e8dfd4] bg-white shadow-sm dark:border-[#4e4234] dark:bg-[#211c17]"
                            >
                                <div className="border-b border-[#e8dfd4] bg-white px-5 py-4 dark:border-[#4e4234] dark:bg-[#211c17]">
                                    <h2 className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                        Faculty
                                    </h2>

                                    <p className="text-sm text-[#887d70] dark:text-[#a99d8f]">
                                        {filteredFaculties.length !== facultyPagination.total
                                            ? `${filteredFaculties.length} of ${facultyPagination.total} faculty record(s)`
                                            : `${facultyPagination.total} faculty record(s)`}
                                    </p>
                                </div>

                                <div className="hidden md:block overflow-x-auto scrollbar-thin">
                                    <table className="w-full min-w-[760px] lg:min-w-full table-fixed text-left text-sm">
                                        <colgroup>
                                            <col style={{ width: "15%" }} />
                                            <col style={{ width: "25%" }} />
                                            <col style={{ width: "12%" }} />
                                            <col style={{ width: "14%" }} />
                                            <col style={{ width: "12%" }} />
                                            <col style={{ width: "22%" }} />
                                        </colgroup>
                                        <thead className="border-b border-[#e8dfd4] bg-[#fcfaf6] text-xs font-bold uppercase tracking-wider text-[#887d70] dark:border-[#4e4234] dark:bg-[#29231d] dark:text-[#c4b5a5]">
                                            <tr>
                                                <th className="px-5 py-3.5">
                                                    Faculty ID
                                                </th>

                                                <th className="px-5 py-3.5">
                                                    Name
                                                </th>

                                                <th className="px-5 py-3.5">
                                                    Position
                                                </th>

                                                <th className="px-5 py-3.5">
                                                    Department
                                                </th>

                                                <th className="px-5 py-3.5">
                                                    Sex
                                                </th>

                                                <th className="px-5 py-3.5 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-[#eee7de] dark:divide-[#382f25]">
                                            {filteredFaculties.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="px-5 py-8 text-center text-[#887d70] dark:text-[#a99d8f]"
                                                    >
                                                        No faculty found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredFaculties.map(
                                                    (faculty) => (
                                                        <tr
                                                            key={faculty.id}
                                                            className="align-middle transition-colors hover:bg-[#fcfaf6] dark:hover:bg-[#2a221a]"
                                                        >
                                                            <td className="px-5 py-4 font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                                                {formatNA(faculty.employee_id)}
                                                            </td>

                                                            <td className="px-5 py-4 text-[#3d3329] dark:text-[#f8f3eb]">
                                                                {formatNA(getFullName(
                                                                    faculty
                                                                ))}
                                                            </td>

                                                            <td className="px-5 py-4 text-[#766959] dark:text-[#c4b5a5]">
                                                                {formatNA(faculty.position)}
                                                            </td>

                                                            <td className="px-5 py-4 text-[#766959] dark:text-[#c4b5a5]">
                                                                {formatNA(faculty.department)}
                                                            </td>

                                                            <td className="px-5 py-4 text-[#766959] dark:text-[#c4b5a5]">
                                                                {formatNA(faculty.sex)}
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openMedicalReport(
                                                                                faculty,
                                                                                "faculty"
                                                                            )
                                                                        }
                                                                        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#70091f]/40 bg-[#fdf5f3] px-2.5 sm:px-3 text-xs font-semibold text-[#70091f] shadow-xs transition hover:bg-[#70091f] hover:text-white dark:border-[#70091f]/50 dark:bg-[#70091f]/20 dark:text-[#f8a598] cursor-pointer"
                                                                        title="Individual Faculty Medical Certificate"
                                                                        aria-label="Individual Faculty Medical Certificate"
                                                                    >
                                                                        <FileBadge size={14} className="shrink-0" />
                                                                        <span>Medical Certificate</span>
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            viewFacultyRecord(
                                                                                faculty
                                                                            )
                                                                        }
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8dfd4] bg-[#fcfaf6] text-[#766959] transition hover:bg-[#f3ebdf] hover:text-[#3d3329] dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#e5dcd1] dark:hover:bg-[#382f25] cursor-pointer"
                                                                        title="View Faculty Record"
                                                                        aria-label="View Faculty Record"
                                                                    >
                                                                        <Eye size={15} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openFacultyForm(
                                                                                faculty
                                                                            )
                                                                        }
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50 text-amber-700 transition hover:bg-amber-100 hover:text-amber-800 dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#e5dcd1] dark:hover:border-amber-700/60 dark:hover:text-amber-300 cursor-pointer"
                                                                        title="Edit Faculty Record"
                                                                        aria-label="Edit Faculty Record"
                                                                    >
                                                                        <Pencil size={15} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            deleteFaculty(
                                                                                faculty
                                                                            )
                                                                        }
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/80 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700 dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-red-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 cursor-pointer"
                                                                        title="Delete Faculty Record"
                                                                        aria-label="Delete Faculty Record"
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Faculty Card View */}
                                <div className="block md:hidden divide-y divide-[#eee7de] p-3 space-y-3 dark:divide-[#382f25]">
                                    {filteredFaculties.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-[#887d70] dark:text-[#a99d8f]">
                                            No faculty found.
                                        </div>
                                    ) : (
                                        filteredFaculties.map((faculty) => (
                                            <div
                                                key={faculty.id}
                                                className="rounded-xl border border-[#e8dfd4] bg-white p-3.5 shadow-xs dark:border-[#4e4234] dark:bg-[#261f19]"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className="font-mono text-xs font-bold text-[#70091f] dark:text-[#f8a598]">
                                                            {formatNA(faculty.employee_id)}
                                                        </span>
                                                        <h3 className="mt-0.5 text-sm font-bold text-[#3d3329] dark:text-[#f8f3eb]">
                                                            {formatNA(getFullName(faculty))}
                                                        </h3>
                                                    </div>
                                                    <span className="inline-flex rounded-md border border-[#e8dfd4] bg-[#fcfaf6] px-2 py-0.5 text-[11px] font-medium text-[#766959] dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#c4b5a5]">
                                                        {formatNA(faculty.sex)}
                                                    </span>
                                                </div>

                                                <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs text-[#766959] dark:text-[#c4b5a5]">
                                                    <span className="rounded-md bg-[#f3ebdf] px-2 py-0.5 text-[11px] font-semibold text-[#8a6f50] dark:bg-[#342a22] dark:text-[#d4b996]">
                                                        {formatNA(faculty.position)}
                                                    </span>
                                                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                                        {formatNA(faculty.department)}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#eee7de] pt-3 dark:border-[#382f25]">
                                                    <button
                                                        type="button"
                                                        onClick={() => openMedicalReport(faculty, "faculty")}
                                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#70091f]/40 bg-[#fdf5f3] px-2.5 text-xs font-semibold text-[#70091f] transition hover:bg-[#70091f] hover:text-white dark:border-[#70091f]/50 dark:bg-[#70091f]/20 dark:text-[#f8a598]"
                                                    >
                                                        <FileBadge size={14} className="shrink-0" />
                                                        <span>Medical Certificate</span>
                                                    </button>

                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => viewFacultyRecord(faculty)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8dfd4] bg-[#fcfaf6] text-[#766959] transition hover:bg-[#f3ebdf] hover:text-[#3d3329] dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#e5dcd1]"
                                                            title="View Faculty Record"
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openFacultyForm(faculty)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50 text-amber-700 transition hover:bg-amber-100 hover:text-amber-800 dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-[#e5dcd1]"
                                                            title="Edit Faculty Record"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteFaculty(faculty)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/80 bg-red-50 text-red-600 transition hover:bg-red-100 hover:text-red-700 dark:border-[#4e4234] dark:bg-[#2c231a] dark:text-red-400"
                                                            title="Delete Faculty Record"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {renderPagination(
                                    facultyPagination.current_page,
                                    facultyPagination.last_page,
                                    facultyPagination.total,
                                    (p) => loadFacultyPage(p, search)
                                )}
                            </div>
                        )}

                        {hasActiveFilters &&
                            ((activeTab === "students" && filteredStudents.length === 0) ||
                                (activeTab === "staff" && filteredStaff.length === 0) ||
                                (activeTab === "faculty" && filteredFaculties.length === 0)) && (
                                <div className="mb-8 rounded-2xl border border-[#e8dfd4] bg-[#fcfaf6] p-10 text-center dark:border-[#4e4234] dark:bg-[#211c17]">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f3ebdf] text-[#8a6f50] dark:bg-[#382f25] dark:text-[#d3bca2]">
                                        <Search size={22} />
                                    </div>
                                    <h3 className="text-base font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                        No matching {activeTab === "students" ? "student" : activeTab === "staff" ? "staff" : "faculty"} records found
                                    </h3>
                                    <p className="mx-auto mt-1 max-w-sm text-sm text-[#887d70] dark:text-[#a99d8f]">
                                        No results match your active search and filter criteria. Try adjusting your query or resetting filters.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={resetAllFilters}
                                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#70091f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8b1505]"
                                    >
                                        <RotateCcw size={15} />
                                        <span>Reset Filters</span>
                                    </button>
                                </div>
                            )}
                    </>
                )}
            </div>











            <StudentForms
                showStudentForm={showStudentForm}
                editingStudent={Boolean(editingStudent)}
                editingStudentId={editingStudent?.id}
                closeStudentForm={closeStudentForm}
                handleStudentSubmit={handleStudentSubmit}
                studentForm={studentForm}
                setStudentForm={setStudentForm}
                saving={saving}
                showStaffForm={showStaffForm}
                editingStaff={Boolean(editingStaff)}
                editingStaffId={editingStaff?.id}
                closeStaffForm={closeStaffForm}
                handleStaffSubmit={handleStaffSubmit}
                staffForm={staffForm}
                setStaffForm={setStaffForm}
                showFacultyForm={showFacultyForm}
                editingFaculty={Boolean(editingFaculty)}
                editingFacultyId={editingFaculty?.id}
                closeFacultyForm={closeFacultyForm}
                handleFacultySubmit={handleFacultySubmit}
                facultyForm={facultyForm}
                setFacultyForm={setFacultyForm}
                onSwitchCategory={handleSwitchCategory}
                serverError={formError}
                onClearServerError={handleClearServerError}
                students={students}
                staff={staff}
                faculties={faculties}
            />



            {viewingStudent && (
                <Modal
                    title="Student Information"
                    onClose={closeStudentProfile}
                    maxWidth="max-w-4xl"
                >
                    <div className="p-6">

                        <div className="mb-6 flex flex-col gap-3 rounded-xl bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-lg font-semibold text-stone-800">
                                    {formatNA(getFullName(
                                        viewingStudent
                                    ))}
                                </p>

                                <p className="text-sm text-stone-500">
                                    {formatNA(viewingStudent.course)}
                                    {" · "}
                                    {formatNA(viewingStudent.year_level)}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const s = viewingStudent;
                                        setViewingStudent(null);
                                        openMedicalReport(s);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#70091f] px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-[#8b1505] cursor-pointer"
                                >
                                    <FileBadge size={14} className="shrink-0" />
                                    Medical Certificate
                                </button>
                                <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                    ID:{" "}
                                    {formatNA(
                                        viewingStudent.student_id
                                    )}
                                </span>
                            </div>
                        </div>

                        <RecordSection
                            icon={<User size={14} />}
                            title="Personal Information"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoItem
                                    label="Full Name"
                                    value={getFullName(
                                        viewingStudent
                                    )}
                                />

                                <InfoItem
                                    label="Sex"
                                    value={
                                        viewingStudent.sex
                                    }
                                />

                                <InfoItem
                                    label="Birth Date"
                                    value={formatDate(
                                        viewingStudent.birth_date
                                    )}
                                />
                            </div>
                        </RecordSection>

                        <RecordSection
                            icon={<GraduationCap size={14} />}
                            title="Academic Information"
                        >
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <InfoItem
                                    label="Course"
                                    value={
                                        viewingStudent.course
                                    }
                                />

                                <InfoItem
                                    label="Year Level"
                                    value={
                                        viewingStudent.year_level
                                    }
                                />

                                <InfoItem
                                    label="Section"
                                    value={
                                        viewingStudent.section
                                    }
                                />

                                <InfoItem
                                    label="Department"
                                    value={
                                        viewingStudent.department ||
                                        mapCourseToDepartment(viewingStudent.course)
                                    }
                                />
                            </div>
                        </RecordSection>

                        <RecordSection
                            icon={<MapPin size={14} />}
                            title="Contact Information"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoItem
                                    label="Contact Number"
                                    value={
                                        viewingStudent.contact_number
                                    }
                                />

                                <InfoItem
                                    label="Address"
                                    value={
                                        viewingStudent.address
                                    }
                                />
                            </div>
                        </RecordSection>

                        <RecordSection
                            icon={<Stethoscope size={14} />}
                            title="Clinic Visit History"
                        >
                            {Array.isArray(
                                viewingStudent.clinic_visits
                            ) &&
                            viewingStudent
                                .clinic_visits.length > 0 ? (
                                <div className="overflow-hidden rounded-lg border border-[#e8dfd4] dark:border-[#4e4234]">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-[#e8dfd4] bg-[#fcfaf6] text-xs font-bold uppercase tracking-wider text-[#887d70] dark:border-[#4e4234] dark:bg-[#29231d] dark:text-[#c4b5a5]">
                                            <tr>
                                                <th className="px-4 py-3">
                                                    Visit Date
                                                </th>

                                                <th className="px-4 py-3">
                                                    Reason
                                                </th>

                                                <th className="px-4 py-3">
                                                    Nurse
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-stone-100">
                                            {viewingStudent.clinic_visits.map(
                                                (
                                                    visit,
                                                    index
                                                ) => (
                                                    <tr
                                                        key={
                                                            visit.id ||
                                                            index
                                                        }
                                                    >
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {formatDate(
                                                                visit.visit_date
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <ReasonBadge reason={visit.reason} />
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            {formatNA(visit
                                                                .nurse
                                                                ?.name)}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-[#d9cebf] bg-[#fcfaf6] px-5 py-8 text-center dark:border-[#4e4234] dark:bg-[#211c17]">
                                    <p className="text-sm font-medium text-[#766959] dark:text-[#c4b5a5]">
                                        No clinic visits recorded.
                                    </p>
                                </div>
                            )}
                        </RecordSection>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    const s = viewingStudent;
                                    setViewingStudent(null);
                                    openMedicalReport(s, "student");
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#70091f] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#70091f]/20 transition hover:bg-[#8b1505] active:scale-95 cursor-pointer"
                            >
                                <FileText size={16} />
                                View Full Medical Records &amp; History
                            </button>
                        </div>
                    </div>
                </Modal>
            )}





            {viewingStaff && (
                <Modal
                    title="Staff Information"
                    onClose={() =>
                        setViewingStaff(null)
                    }
                >
                    <div className="p-6">

                        <div className="mb-6 rounded-xl bg-amber-50 px-5 py-4">
                            <p className="text-lg font-semibold text-stone-800">
                                {getFullName(
                                    viewingStaff
                                )}
                            </p>

                            <p className="mt-1 text-sm text-stone-500">
                                {viewingStaff.position ||
                                    "-"}
                            </p>

                            <span className="mt-3 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                Staff ID:{" "}
                                {
                                    viewingStaff.staff_id
                                }
                            </span>
                        </div>

                        <RecordSection
                            icon={<User size={14} />}
                            title="Personal Information"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoItem
                                    label="Full Name"
                                    value={getFullName(
                                        viewingStaff
                                    )}
                                />

                                <InfoItem
                                    label="Staff ID"
                                    value={
                                        viewingStaff.staff_id
                                    }
                                />

                                <InfoItem
                                    label="Sex"
                                    value={
                                        viewingStaff.sex
                                    }
                                />

                                <InfoItem
                                    label="Birth Date"
                                    value={formatDate(
                                        viewingStaff.birth_date
                                    )}
                                />
                            </div>
                        </RecordSection>

                        <RecordSection
                            icon={<Briefcase size={14} />}
                            title="Work Information"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoItem
                                    label="Position"
                                    value={
                                        viewingStaff.position
                                    }
                                />

                                <InfoItem
                                    label="Department"
                                    value={
                                        viewingStaff.department
                                    }
                                />
                            </div>
                        </RecordSection>

                        <RecordSection
                            icon={<MapPin size={14} />}
                            title="Contact Information"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoItem
                                    label="Contact Number"
                                    value={
                                        viewingStaff.contact_number
                                    }
                                />

                                <InfoItem
                                    label="Address"
                                    value={
                                        viewingStaff.address
                                    }
                                />
                            </div>
                        </RecordSection>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    const st = viewingStaff;
                                    setViewingStaff(null);
                                    openMedicalReport(st, "staff");
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#70091f] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#70091f]/20 transition hover:bg-[#8b1505] active:scale-95 cursor-pointer"
                            >
                                <FileText size={16} />
                                View Full Medical Records &amp; History
                            </button>
                        </div>
                    </div>
                </Modal>
            )}





            {viewingFaculty && (
                <Modal
                    title="Faculty Information"
                    onClose={() =>
                        setViewingFaculty(null)
                    }
                >
                    <div className="p-6">

                        <div className="mb-6 rounded-xl bg-amber-50 px-5 py-4">
                            <p className="text-lg font-semibold text-stone-800">
                                {getFullName(
                                    viewingFaculty
                                )}
                            </p>

                            <p className="mt-1 text-sm text-stone-500">
                                {viewingFaculty.position ||
                                    "-"}
                            </p>

                            <span className="mt-3 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                Faculty ID:{" "}
                                {
                                    viewingFaculty.employee_id
                                }
                            </span>
                        </div>

                        <RecordSection
                            icon={<User size={14} />}
                            title="Personal Information"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoItem
                                    label="Full Name"
                                    value={getFullName(
                                        viewingFaculty
                                    )}
                                />

                                <InfoItem
                                    label="Faculty ID"
                                    value={
                                        viewingFaculty.employee_id
                                    }
                                />

                                <InfoItem
                                    label="Sex"
                                    value={
                                        viewingFaculty.sex
                                    }
                                />

                                <InfoItem
                                    label="Birth Date"
                                    value={formatDate(
                                        viewingFaculty.birth_date
                                    )}
                                />
                            </div>
                        </RecordSection>

                        <RecordSection
                            icon={<Briefcase size={14} />}
                            title="Work Information"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoItem
                                    label="Position"
                                    value={
                                        viewingFaculty.position
                                    }
                                />

                                <InfoItem
                                    label="Department"
                                    value={
                                        viewingFaculty.department
                                    }
                                />
                            </div>
                        </RecordSection>

                        <RecordSection
                            icon={<MapPin size={14} />}
                            title="Contact Information"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoItem
                                    label="Contact Number"
                                    value={
                                        viewingFaculty.contact_number
                                    }
                                />

                                <InfoItem
                                    label="Address"
                                    value={
                                        viewingFaculty.address
                                    }
                                />
                            </div>
                        </RecordSection>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    const fac = viewingFaculty;
                                    setViewingFaculty(null);
                                    openMedicalReport(fac, "faculty");
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#70091f] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#70091f]/20 transition hover:bg-[#8b1505] active:scale-95 cursor-pointer"
                            >
                                <FileText size={16} />
                                View Full Medical Records &amp; History
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Individual Patient Medical Certificate Modal */}
            {medicalReportStudent && (
                <Modal
                    title={`Individual ${medicalReportType === "faculty" ? "Faculty" : medicalReportType === "staff" ? "Staff" : "Student"} Medical Certificate`}
                    onClose={closeMedicalReport}
                    maxWidth="max-w-5xl"
                >
                    <div className="p-6">
                        {/* Header & Export Actions */}
                        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#70091f]/30 bg-gradient-to-r from-[#70091f]/10 via-[#8b1505]/5 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between dark:border-[#70091f]/50 dark:from-[#70091f]/20">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#70091f] text-white shadow-md shadow-[#70091f]/30">
                                    <Stethoscope size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#2d050d] dark:text-white">
                                        {formatNA(getFullName(medicalReportStudent))}
                                    </h3>
                                    <p className="text-xs text-[#70091f] dark:text-[#f8a598] font-medium">
                                        {medicalReportType === "faculty"
                                            ? `Faculty ID: ${formatNA(medicalReportStudent.employee_id || medicalReportStudent.student_id)} · ${formatNA(medicalReportStudent.position)} · ${formatNA(medicalReportStudent.department)}`
                                            : medicalReportType === "staff"
                                            ? `Staff ID: ${formatNA(medicalReportStudent.staff_id || medicalReportStudent.student_id)} · ${formatNA(medicalReportStudent.position)} · ${formatNA(medicalReportStudent.department)}`
                                            : `Student ID: ${formatNA(medicalReportStudent.student_id)} · ${formatNA(medicalReportStudent.course)} ${medicalReportStudent.year_level ? `- ${medicalReportStudent.year_level}` : ""}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleDownloadCertificate()}
                                    disabled={loadingMedicalReport}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#70091f] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#70091f]/20 transition hover:bg-[#8b1505] active:scale-95 disabled:opacity-50 cursor-pointer"
                                    title="Download Official Medical Certificate"
                                >
                                    <FileBadge size={16} className="shrink-0" />
                                    Download Medical Certificate
                                </button>
                            </div>
                        </div>

                        {/* Patient Demographics Profile */}
                        <div className="mb-6 rounded-2xl border border-[#e8dfd4] bg-[#fcfaf6] p-5 dark:border-[#4e4234] dark:bg-[#211c17]">
                            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#70091f] dark:text-[#f8a598]">
                                {medicalReportType === "faculty" ? "Faculty" : medicalReportType === "staff" ? "Staff" : "Student"} Profile &amp; Demographics
                            </h4>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs sm:text-sm">
                                <div>
                                    <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">
                                        {medicalReportType === "faculty" ? "Faculty ID" : medicalReportType === "staff" ? "Staff ID" : "Student ID"}
                                    </span>
                                    <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                        {formatNA(medicalReportStudent.employee_id || medicalReportStudent.staff_id || medicalReportStudent.student_id)}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Full Name</span>
                                    <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatNA(getFullName(medicalReportStudent))}</span>
                                </div>
                                {medicalReportType === "student" ? (
                                    <>
                                        <div>
                                            <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Course</span>
                                            <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatNA(medicalReportStudent.course)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Year &amp; Section</span>
                                            <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                                {formatNA(
                                                    medicalReportStudent.year_level && medicalReportStudent.section
                                                        ? `${medicalReportStudent.year_level} - ${medicalReportStudent.section}`
                                                        : medicalReportStudent.year_level || medicalReportStudent.section
                                                )}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Department / College</span>
                                            <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                                {formatNA(medicalReportData?.student?.department || medicalReportData?.patient?.department || medicalReportStudent.department || mapCourseToDepartment(medicalReportStudent.course))}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Position</span>
                                            <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatNA(medicalReportStudent.position)}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Department</span>
                                            <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">
                                                {formatNA(medicalReportData?.patient?.department || medicalReportStudent.department)}
                                            </span>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Sex</span>
                                    <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatNA(medicalReportStudent.sex)}</span>
                                </div>
                                <div>
                                    <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Birth Date</span>
                                    <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatDate(medicalReportStudent.birth_date)}</span>
                                </div>
                                <div>
                                    <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Contact Number</span>
                                    <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatNA(medicalReportStudent.contact_number)}</span>
                                </div>
                                <div className={medicalReportType === "student" ? "col-span-3" : "col-span-4 sm:col-span-2"}>
                                    <span className="block text-[11px] font-medium text-[#887d70] dark:text-[#a99d8f]">Address</span>
                                    <span className="font-semibold text-[#3d3329] dark:text-[#f8f3eb]">{formatNA(medicalReportStudent.address)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Medical Consultation History */}
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#70091f] dark:text-[#f8a598]">
                                    Consultation History (Chronological Order)
                                </h4>
                                <span className="text-xs font-medium text-[#887d70] dark:text-[#a99d8f]">
                                    Total Visits: {medicalReportData?.total_visits ?? (medicalReportStudent.clinic_visits?.length || 0)}
                                </span>
                            </div>

                            {loadingMedicalReport ? (
                                <div className="flex h-40 items-center justify-center rounded-xl border border-[#e8dfd4] bg-white dark:border-[#4e4234] dark:bg-[#211c17]">
                                    <div className="flex items-center gap-2 text-sm text-[#70091f]">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#70091f] border-t-transparent" />
                                        <span>Loading official medical records...</span>
                                    </div>
                                </div>
                            ) : (medicalReportData?.visits || medicalReportStudent.clinic_visits || []).length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[#d9cebf] bg-[#fcfaf6] p-8 text-center dark:border-[#4e4234] dark:bg-[#211c17]">
                                    <p className="text-sm font-medium text-[#766959] dark:text-[#c4b5a5]">
                                        No clinic visits on record for this {medicalReportType === "faculty" ? "faculty member" : medicalReportType === "staff" ? "staff member" : "student"}.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-[#e8dfd4] dark:border-[#4e4234]">
                                    <table className="w-full min-w-[850px] text-left text-xs sm:text-sm">
                                        <thead className="border-b border-[#e8dfd4] bg-[#fcfaf6] text-xs font-bold uppercase tracking-wider text-[#887d70] dark:border-[#4e4234] dark:bg-[#29231d] dark:text-[#c4b5a5]">
                                            <tr>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Reason</th>
                                                <th className="px-4 py-3">Symptoms</th>
                                                <th className="px-4 py-3">Temp</th>
                                                <th className="px-4 py-3">BP</th>
                                                <th className="px-4 py-3">Assessment &amp; Treatment</th>
                                                <th className="px-4 py-3">Medicine</th>
                                                <th className="px-4 py-3">Nurse</th>
                                                <th className="px-4 py-3">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#eee7de] dark:divide-[#382f25]">
                                            {(medicalReportData?.visits || medicalReportStudent.clinic_visits || []).map((v: any, idx: number) => (
                                                <tr key={v.id || idx} className="hover:bg-[#fcfaf6] dark:hover:bg-[#2a221a]">
                                                    <td className="px-4 py-3 whitespace-nowrap font-medium text-[#3d3329] dark:text-[#f8f3eb]">
                                                        {formatDate(v.visit_date)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <ReasonBadge reason={v.reason} />
                                                    </td>
                                                    <td className="px-4 py-3 max-w-[150px] truncate text-[#766959] dark:text-[#c4b5a5]" title={v.symptoms || ""}>
                                                        {formatNA(v.symptoms)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[#3d3329] dark:text-[#f8f3eb]">
                                                        {formatTemperature(v.temperature)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[#766959] dark:text-[#c4b5a5]">
                                                        {formatNA(v.blood_pressure)}
                                                    </td>
                                                    <td className="px-4 py-3 max-w-[180px] text-[#766959] dark:text-[#c4b5a5]">
                                                        <div className="truncate font-medium text-[#3d3329] dark:text-[#f8f3eb]" title={v.assessment || ""}>
                                                            {formatNA(v.assessment)}
                                                        </div>
                                                        <div className="truncate text-xs text-[#887d70] dark:text-[#a99d8f]" title={v.treatment || ""}>
                                                            {formatNA(v.treatment)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[#766959] dark:text-[#c4b5a5]">
                                                        {v.medicine ? (
                                                            <span>
                                                                {v.medicine.name} ({v.quantity || 1} {v.medicine.unit || "pcs"})
                                                            </span>
                                                        ) : v.medicine_name ? (
                                                            <span>
                                                                {v.medicine_name} ({v.quantity || 1})
                                                            </span>
                                                        ) : (
                                                            formatNA(null)
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-[#766959] dark:text-[#c4b5a5]">
                                                        {formatNA(v.nurse?.name)}
                                                    </td>
                                                    <td className="px-4 py-3 max-w-[120px] truncate text-[#887d70] dark:text-[#a99d8f]" title={v.remarks || ""}>
                                                        {formatNA(v.remarks)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}





            {confirmation && (
                <ConfirmationModal
                    open={Boolean(confirmation)}
                    title={confirmation.title}
                    message={confirmation.message}
                    confirmText={
                        confirmation.confirmText
                    }
                    danger={confirmation.danger}
                    loading={saving}
                    onClose={() => {
                        if (!saving) {
                            setConfirmation(null);
                        }
                    }}
                    onConfirm={handleConfirmation}
                />
            )}

            <FloatingToast
                message={successToast}
                onClose={() => {
                    setSuccessToast("");
                    setToastAction(undefined);
                }}
                action={toastAction}
            />

            {/* Restore Deleted Patients Modal */}
            <RestorePatientsModal
                open={showRestoreModal}
                onClose={() => setShowRestoreModal(false)}
                onRestored={() => {
                    invalidateRecordCache();
                    fetchData();
                    setInlineNotification({
                        type: "restore",
                        title: "Patient Record Restored",
                        message: "The patient record has been successfully restored.",
                    });
                }}
            />
        </div>
    );
}

export default StudentManagement;
