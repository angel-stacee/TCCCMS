export type PeriodType = "daily" | "weekly" | "monthly" | "yearly" | "custom" | "all";
export type PatientTypeFilter = "all" | "student" | "faculty" | "staff";

export type TopDepartment = {
    department: string;
    short_name: string;
    visits: number;
    percentage: number;
    is_highest?: boolean;
};

export type TopSymptom = {
    symptom: string;
    count: number;
    percentage: number;
};

export type AnalyticsSummary = {
    total_visits: number;
    top_department: TopDepartment;
    top_symptom: TopSymptom;
    total_departments: number;
    patient_type_counts: {
        student_visits: number;
        faculty_visits: number;
        staff_visits: number;
    };
};

export type DepartmentVisit = {
    department: string;
    short_name: string;
    visits: number;
    percentage: number;
    is_highest: boolean;
};

export type CommonSymptom = {
    rank: number;
    symptom: string;
    count: number;
    percentage: number;
};

export type DepartmentSymptomDetail = {
    department: string;
    short_name: string;
    total_visits: number;
    top_symptom: string;
    symptoms: Array<{ symptom: string; count: number }>;
};

export type GroupedComparison = {
    data: Array<Record<string, any>>;
    symptom_keys: string[];
};

export type AnalyticsReport = {
    summary: AnalyticsSummary;
    visits_by_department: DepartmentVisit[];
    common_symptoms: CommonSymptom[];
    department_symptoms: DepartmentSymptomDetail[];
    grouped_comparison: GroupedComparison;
    period: {
        type: PeriodType;
        label: string;
        start_date: string;
        end_date: string;
        month: number;
        year: number;
    };
    all_departments: string[];
    generated_at: string;
};

export type AnalyticsFilterState = {
    periodType: PeriodType;
    date: string; // YYYY-MM-DD
    month: number;
    year: number;
    startDate: string;
    endDate: string;
    patientType: PatientTypeFilter;
};
