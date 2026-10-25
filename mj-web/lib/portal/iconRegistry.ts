// Curated icon set for portfolio content. Firestore stores the icon name as
// a string; portfolio pages look it up here to render the Lucide component.
// Add entries as new sections need them — keep the list short so admins get
// a manageable picker.

import type { LucideIcon } from "lucide-react";
import {
    Award,
    Beaker,
    Binary,
    BookOpen,
    Building2,
    Calculator,
    Calendar,
    Camera,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    FileText,
    Globe2,
    GraduationCap,
    Heart,
    Languages,
    Lightbulb,
    Mail,
    MapPin,
    Palette,
    Phone,
    Shield,
    Star,
    Target,
    Trophy,
    Users,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Youtube,
} from "lucide-react";

export type IconName =
    | "Award" | "Beaker" | "Binary" | "BookOpen" | "Building2"
    | "Calculator" | "Calendar" | "Camera" | "CheckCircle2" | "ClipboardCheck"
    | "Clock" | "FileText" | "Globe2" | "GraduationCap" | "Heart"
    | "Languages" | "Lightbulb" | "Mail" | "MapPin" | "Palette"
    | "Phone" | "Shield" | "Star" | "Target" | "Trophy" | "Users"
    | "Facebook" | "Twitter" | "Instagram" | "Linkedin" | "Youtube";

export const ICON_MAP: Record<IconName, LucideIcon> = {
    Award, Beaker, Binary, BookOpen, Building2,
    Calculator, Calendar, Camera, CheckCircle2, ClipboardCheck,
    Clock, FileText, Globe2, GraduationCap, Heart,
    Languages, Lightbulb, Mail, MapPin, Palette,
    Phone, Shield, Star, Target, Trophy, Users,
    Facebook, Twitter, Instagram, Linkedin, Youtube,
};

export const ICON_NAMES = Object.keys(ICON_MAP) as IconName[];

export function isIconName(v: unknown): v is IconName {
    return typeof v === "string" && v in ICON_MAP;
}

export function getIcon(name: string | null | undefined): LucideIcon | null {
    if (!name || !isIconName(name)) return null;
    return ICON_MAP[name];
}
