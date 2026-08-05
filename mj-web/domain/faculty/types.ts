// Faculty Domain Types

export interface FacultyMember {
    id: string;
    name: string;
    role: string;
    department: string;
    subject: string;
    qualification: string;
    experience: string;
    bio?: string;
    email?: string;
    photoUrl?: string;
    specializations?: string[];
    publications?: string[];
    joinedYear?: number;
    isActive: boolean;
}

export interface Department {
    id: string;
    name: string;
    head?: string;
    description?: string;
    facultyCount: number;
}
