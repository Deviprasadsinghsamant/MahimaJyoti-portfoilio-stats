// Events & Notices Domain Types

export type NoticeCategory = "Admissions" | "Academics" | "Events" | "Notice" | "General";
export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface Notice {
    id: string;
    title: string;
    content: string;
    category: NoticeCategory;
    date: string;
    isImportant: boolean;
    attachmentUrl?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    endDate?: string;
    venue: string;
    status: EventStatus;
    imageUrl?: string;
    organizer?: string;
    registrationUrl?: string;
}
