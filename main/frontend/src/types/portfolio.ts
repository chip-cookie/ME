export interface ProjectTag {
    name: string;
}

export interface ProjectData {
    id: string;
    title: string;
    description: string;
    tags: ProjectTag[];
    link: string;
    date?: string; // "YYYY.MM - YYYY.MM"
}

export interface SkillItem {
    name: string;
    level: "Expert" | "Advanced" | "Intermediate";
}

export interface SkillCategory {
    title: string;
    items: SkillItem[];
}

export interface AwardData {
    title: string;
    date: string;
    type: "Award" | "Certificate";
}

export interface ProfileData {
    name: string;
    title: string;
    bio: string;
    email: string;
    phone: string;
    website: string;
    image?: string; // 이미지 경로 추가
}

export interface PortfolioData {
    profile: ProfileData;
    projects: ProjectData[];
    skills: SkillCategory[];
    awards: AwardData[];
}
