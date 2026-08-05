// Academics Domain Types

export type BoardType = "BSE" | "CHSE" | "UTKAL";
export type ProgramLevel = "Primary" | "Intermediate" | "Graduation";
export type StreamType = "Science" | "Arts" | "Commerce" | "General";

export interface AcademicProgram {
    id: string;
    title: string;
    level: ProgramLevel;
    board: BoardType;
    streams?: StreamType[];
    description: string;
    classRange?: string;
    features: string[];
    subjects: Subject[];
    eligibility: string[];
}

export interface Subject {
    id: string;
    name: string;
    code?: string;
    isOptional?: boolean;
}

export interface AcademicCalendar {
    id: string;
    programId: string;
    year: string;
    events: CalendarEvent[];
}

export interface CalendarEvent {
    date: string;
    title: string;
    type: "exam" | "holiday" | "event" | "deadline";
}
