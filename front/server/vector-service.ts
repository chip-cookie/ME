/**
 * Vector Service - OpenAI Embeddings based vector operations
 * 
 * Provides:
 * - Text to vector embedding conversion
 * - Cosine similarity calculation
 * - Text chunking for RAG
 */

import { ENV } from "./_core/env";

interface EmbeddingResponse {
    data: Array<{
        embedding: number[];
        index: number;
    }>;
    model: string;
    usage: {
        prompt_tokens: number;
        total_tokens: number;
    };
}

export class VectorService {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = ENV.forgeApiKey || "";
        this.baseUrl = ENV.forgeApiUrl?.replace(/\/$/, "") || "https://forge.manus.im";
    }

    /**
     * Convert text to vector embedding using OpenAI-compatible API
     */
    async embed(text: string): Promise<number[]> {
        if (!this.apiKey) {
            console.warn("[VectorService] No API key, returning mock embedding");
            // Return a simple hash-based mock embedding for testing
            return this.mockEmbed(text);
        }

        try {
            const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: "text-embedding-3-small",
                    input: text.substring(0, 8000), // Limit input length
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[VectorService] Embedding failed:", errorText);
                return this.mockEmbed(text);
            }

            const result: EmbeddingResponse = await response.json();
            return result.data[0].embedding;
        } catch (error) {
            console.error("[VectorService] Embedding error:", error);
            return this.mockEmbed(text);
        }
    }

    /**
     * Mock embedding for fallback (simple hash-based)
     */
    private mockEmbed(text: string): number[] {
        const dims = 256;
        const embedding: number[] = new Array(dims).fill(0);

        // Simple hash-based embedding
        const words = text.toLowerCase().split(/\s+/);
        for (const word of words) {
            for (let i = 0; i < word.length; i++) {
                const idx = (word.charCodeAt(i) * (i + 1)) % dims;
                embedding[idx] += 1 / words.length;
            }
        }

        // Normalize
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            console.warn("[VectorService] Vector length mismatch");
            return 0;
        }

        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            magnitudeA += vecA[i] * vecA[i];
            magnitudeB += vecB[i] * vecB[i];
        }

        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);

        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }

        return dotProduct / (magnitudeA * magnitudeB);
    }

    /**
     * Split text into chunks for embedding
     */
    chunkText(text: string, maxChunkLength: number = 500): string[] {
        // First, split by double newlines (paragraphs)
        const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);

        const chunks: string[] = [];
        let currentChunk = "";

        for (const para of paragraphs) {
            if (para.length > maxChunkLength) {
                // Split long paragraphs by sentences
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = "";
                }

                // Split by Korean/English sentence endings
                const sentences = para.split(/(?<=[.!?。])\s+/);
                for (const sentence of sentences) {
                    if ((currentChunk + " " + sentence).length <= maxChunkLength) {
                        currentChunk = currentChunk ? currentChunk + " " + sentence : sentence;
                    } else {
                        if (currentChunk) chunks.push(currentChunk.trim());
                        currentChunk = sentence;
                    }
                }
            } else if ((currentChunk + "\n\n" + para).length <= maxChunkLength) {
                currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
            } else {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = para;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        // Filter out very short chunks
        return chunks.filter(c => c.length >= 50);
    }
}

// Singleton instance
export const vectorService = new VectorService();
