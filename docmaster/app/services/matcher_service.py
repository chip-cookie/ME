import os
import chromadb
from sklearn.metrics.pairwise import cosine_similarity

# Temporarily bypassed due to WinError 1114
# from sentence_transformers import SentenceTransformer

class MatcherService:
    def __init__(self):
        model_name = os.getenv(
            "EMBEDDING_MODEL",
            "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
        )
        self.encoder = None # SentenceTransformer(model_name)
        self.chroma = chromadb.HttpClient(
            host=os.getenv("CHROMA_HOST", "localhost"),
            port=int(os.getenv("CHROMA_PORT", "8100")),
        )
        self.collection = self.chroma.get_or_create_collection("docmaster_documents")

    # ------------------------------------------------------------------
    # Similarity
    # ------------------------------------------------------------------

    def calculate_similarity(self, jd_text: str, doc_text: str) -> float:
        # Mock calculation since encoder is disabled
        # embs = self.encoder.encode([jd_text, doc_text])
        # return float(cosine_similarity([embs[0]], [embs[1]])[0][0])
        return 0.8  # Mock value

    # ------------------------------------------------------------------
    # ChromaDB CRUD
    # ------------------------------------------------------------------

    def store_document(self, doc_id: str, markdown: str, metadata: dict) -> None:
        # Mock random embedding
        embedding = [0.1] * 384
        # embedding = self.encoder.encode(markdown).tolist()
        self.collection.upsert(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[markdown],
            metadatas=[metadata],
        )

    def search_similar(self, query: str, n_results: int = 5, where: dict = None) -> list[dict]:
        embedding = [0.1] * 384
        # embedding = self.encoder.encode(query).tolist()
        kwargs = {"query_embeddings": [embedding], "n_results": n_results}
        if where:
            kwargs["where"] = where
        results = self.collection.query(**kwargs)
        items = []
        if results and results.get("ids") and len(results["ids"]) > 0 and len(results["ids"][0]) > 0:
            for i, doc_id in enumerate(results["ids"][0]):
                items.append(
                    {
                        "id": doc_id,
                        "document": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "distance": results["distances"][0][i],
                    }
                )
        return items

    def delete_document(self, doc_id: str) -> None:
        self.collection.delete(ids=[doc_id])
