// Every photo slot on the public website: the shape it's shown in, the size to
// upload, and the size it's stored at. The admin upload field shows these and
// resizes to `maxEdge` before uploading; HOW_TO_UPDATE.md documents the same
// numbers — keep them in step.
//
// "recommended" is about twice the largest size the slot is drawn at on a
// desktop screen, so photos stay sharp on high-density (retina / phone) screens.

export type ImageSlot =
    | "hero"
    | "whyChoose"
    | "pathway"
    | "testimonial"
    | "principal"
    | "infrastructure"
    | "faculty"
    | "gallery";

export interface ImageSpec {
    label: string;
    // Display shape, e.g. "16:9".
    ratio: string;
    // Tailwind aspect class for previews.
    aspectClass: string;
    orientation: "landscape" | "portrait" | "square";
    recommended: [number, number];
    // Smaller than this looks blurry where it's shown.
    minimum: [number, number];
    // Uploads are scaled down so their longest side is at most this.
    maxEdge: number;
    tip: string;
}

export const IMAGE_SPECS: Record<ImageSlot, ImageSpec> = {
    hero: {
        label: "Home page banner (hero) background",
        ratio: "16:9",
        aspectClass: "aspect-[16/9]",
        orientation: "landscape",
        recommended: [1920, 1080],
        minimum: [1280, 720],
        maxEdge: 1920,
        tip: "A wide campus or assembly photo. It's shown dimmed behind white text and cropped on phones, so keep the main subject in the centre.",
    },
    whyChoose: {
        label: "Home page “Why choose us” photo",
        ratio: "4:3",
        aspectClass: "aspect-[4/3]",
        orientation: "landscape",
        recommended: [1200, 900],
        minimum: [800, 600],
        maxEdge: 1600,
        tip: "Students in class, a lab, or campus life.",
    },
    pathway: {
        label: "Academic pathway card photo",
        ratio: "16:9",
        aspectClass: "aspect-[16/9]",
        orientation: "landscape",
        recommended: [1200, 675],
        minimum: [800, 450],
        maxEdge: 1200,
        tip: "Optional banner at the top of the card — students of that level in class.",
    },
    testimonial: {
        label: "Testimonial photo",
        ratio: "1:1",
        aspectClass: "aspect-square",
        orientation: "square",
        recommended: [400, 400],
        minimum: [200, 200],
        maxEdge: 400,
        tip: "Optional. Head and shoulders, face centred — shown as a small circle.",
    },
    principal: {
        label: "Principal's photo",
        ratio: "4:5",
        aspectClass: "aspect-[4/5]",
        orientation: "portrait",
        recommended: [800, 1000],
        minimum: [480, 600],
        maxEdge: 1000,
        tip: "Formal portrait, head and shoulders, plain background.",
    },
    infrastructure: {
        label: "Infrastructure photo",
        ratio: "4:3",
        aspectClass: "aspect-[4/3]",
        orientation: "landscape",
        recommended: [1200, 900],
        minimum: [800, 600],
        maxEdge: 1200,
        tip: "Optional. The facility itself — library, lab, hostel, playground.",
    },
    faculty: {
        label: "Faculty photo",
        ratio: "4:3",
        aspectClass: "aspect-[4/3]",
        orientation: "landscape",
        recommended: [1200, 900],
        minimum: [600, 450],
        maxEdge: 1200,
        tip: "Head and shoulders with space either side; the face should sit in the middle third.",
    },
    gallery: {
        label: "Gallery photo",
        ratio: "4:3",
        aspectClass: "aspect-[4/3]",
        orientation: "landscape",
        recommended: [1600, 1200],
        minimum: [1024, 768],
        maxEdge: 1600,
        tip: "Landscape works best. Thumbnails are cropped to 4:3; the full photo shows when opened.",
    },
};

// Largest file accepted from the computer; it's resized before upload.
export const MAX_PICK_BYTES = 25 * 1024 * 1024;
