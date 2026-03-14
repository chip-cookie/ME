import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'posts');

export interface PostFrontmatter {
    title: string;
    slug: string;
    description?: string;
    author?: string;
    date?: string;
    tags?: string[];
    featured?: boolean;
}

export interface Post {
    frontmatter: PostFrontmatter;
    content: string;
    slug: string;
}

export interface PostSummary {
    frontmatter: PostFrontmatter;
    slug: string;
}

/**
 * Get all posts (metadata only, no content)
 */
export function getAllPosts(): PostSummary[] {
    if (!fs.existsSync(CONTENT_DIR)) {
        return [];
    }

    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));

    const posts = files.map(filename => {
        const filePath = path.join(CONTENT_DIR, filename);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data } = matter(fileContent);

        const slug = data.slug || filename.replace(/\.mdx?$/, '');

        return {
            frontmatter: {
                title: data.title || 'Untitled',
                slug,
                description: data.description,
                author: data.author,
                date: data.date,
                tags: data.tags,
                featured: data.featured,
            },
            slug,
        };
    });

    // Sort by date (newest first)
    return posts.sort((a, b) => {
        const dateA = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0;
        const dateB = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0;
        return dateB - dateA;
    });
}

/**
 * Get a single post by slug (includes content)
 */
export function getPostBySlug(slug: string): Post | null {
    if (!fs.existsSync(CONTENT_DIR)) {
        return null;
    }

    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));

    for (const filename of files) {
        const filePath = path.join(CONTENT_DIR, filename);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        const postSlug = data.slug || filename.replace(/\.mdx?$/, '');

        if (postSlug === slug) {
            return {
                frontmatter: {
                    title: data.title || 'Untitled',
                    slug: postSlug,
                    description: data.description,
                    author: data.author,
                    date: data.date,
                    tags: data.tags,
                    featured: data.featured,
                },
                content,
                slug: postSlug,
            };
        }
    }

    return null;
}

/**
 * Get featured posts
 */
export function getFeaturedPosts(): PostSummary[] {
    return getAllPosts().filter(post => post.frontmatter.featured);
}
