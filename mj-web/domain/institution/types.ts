// Institution Domain Types

export interface Institution {
    id: string;
    name: string;
    tagline: string;
    description: string;
    foundedYear: number;
    address: Address;
    contact: ContactInfo;
    accreditation: string[];
    socialLinks: SocialLinks;
}

export interface Address {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
}

export interface ContactInfo {
    phone: string[];
    email: string[];
    website?: string;
}

export interface SocialLinks {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
}

export interface Statistic {
    label: string;
    value: number;
    suffix?: string;
    prefix?: string;
}
