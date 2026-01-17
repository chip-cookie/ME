/**
 * Vector Store - In-memory storage for vector chunks
 * 
 * Stores text chunks with their embeddings for:
 * - Writing style profiles
 * - Interview style profiles
 * 
 * Provides top-k similarity search for RAG
 */

import { vectorService } from "./vector-service";

export interface VectorChunk {
    id: string;
    profileId: number;
    profileType: "writing" | "interview";
    text: string;
    embedding: number[];
    chunkIndex: number;
    createdAt: Date;
}

class VectorStore {
    private chunks: Map<string, VectorChunk> = new Map();

    /**
     * Add chunks from a style profile
     */
    async addProfileChunks(
        profileId: number,
        profileType: "writing" | "interview",
        text: string
    ): Promise<string[]> {
        // Split text into chunks
        const textChunks = vectorService.chunkText(text);
        const chunkIds: string[] = [];

        for (let i = 0; i < textChunks.length; i++) {
            const chunkText = textChunks[i];
            const id = `${profileType}_${profileId}_${i}_${Date.now()}`;

            // Generate embedding
            const embedding = await vectorService.embed(chunkText);

            const chunk: VectorChunk = {
                id,
                profileId,
                profileType,
                text: chunkText,
                embedding,
                chunkIndex: i,
                createdAt: new Date(),
            };

            this.chunks.set(id, chunk);
            chunkIds.push(id);
        }

        return chunkIds;
    }

    /**
     * Remove all chunks for a profile
     */
    removeProfileChunks(profileId: number, profileType: "writing" | "interview"): void {
        const keysToRemove: string[] = [];

        this.chunks.forEach((chunk, key) => {
            if (chunk.profileId === profileId && chunk.profileType === profileType) {
                keysToRemove.push(key);
            }
        });

        keysToRemove.forEach(key => this.chunks.delete(key));
    }

    /**
     * Search for top-k most similar chunks
     */
    async searchSimilar(
        query: string,
        profileId: number,
        profileType: "writing" | "interview",
        topK: number = 3
    ): Promise<{ chunk: VectorChunk; score: number }[]> {
        // Get query embedding
        const queryEmbedding = await vectorService.embed(query);

        // Filter chunks by profile
        const profileChunks: VectorChunk[] = [];
        this.chunks.forEach(chunk => {
            if (chunk.profileId === profileId && chunk.profileType === profileType) {
                profileChunks.push(chunk);
            }
        });

        if (profileChunks.length === 0) {
            return [];
        }

        // Score each chunk
        const scored = profileChunks.map(chunk => ({
            chunk,
            score: vectorService.cosineSimilarity(queryEmbedding, chunk.embedding),
        }));

        // Sort by score descending and take top-k
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.min(topK, scored.length));
    }

    /**
     * Calculate average similarity between text and all profile chunks
     */
    async calculateProfileSimilarity(
        text: string,
        profileId: number,
        profileType: "writing" | "interview"
    ): Promise<number> {
        const textEmbedding = await vectorService.embed(text);

        const profileChunks: VectorChunk[] = [];
        this.chunks.forEach(chunk => {
            if (chunk.profileId === profileId && chunk.profileType === profileType) {
                profileChunks.push(chunk);
            }
        });

        if (profileChunks.length === 0) {
            return 0;
        }

        // Calculate similarity with each chunk
        const similarities = profileChunks.map(chunk =>
            vectorService.cosineSimilarity(textEmbedding, chunk.embedding)
        );

        // Return average similarity
        return similarities.reduce((sum, s) => sum + s, 0) / similarities.length;
    }

    /**
     * Get statistics
     */
    getStats(): { totalChunks: number; byType: Record<string, number> } {
        const byType: Record<string, number> = { writing: 0, interview: 0 };

        this.chunks.forEach(chunk => {
            byType[chunk.profileType] = (byType[chunk.profileType] || 0) + 1;
        });

        return {
            totalChunks: this.chunks.size,
            byType,
        };
    }
}

// Singleton instance
export const vectorStore = new VectorStore();
