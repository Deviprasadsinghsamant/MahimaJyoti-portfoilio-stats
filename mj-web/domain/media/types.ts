// Media Domain Types

export type MediaCategory = "campus" | "events" | "sports" | "academics" | "general";

export interface MediaItem {
    id: string;
    title: string;
    description?: string;
    category: MediaCategory;
    url: string;
    thumbnailUrl?: string;
    type: "image" | "video";
    uploadedAt: string;
    uploadedBy: string;
    tags?: string[];
}

export interface GalleryAlbum {
    id: string;
    title: string;
    description?: string;
    coverImageUrl: string;
    items: MediaItem[];
    createdAt: string;
}
