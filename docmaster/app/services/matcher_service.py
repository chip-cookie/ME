import os
import chromadb
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


class MatcherService:
    def __init__(self):
        model_name = os.getenv(
            "EMBEDDING_MODEL",
            "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
        )
        self.encoder = SentenceTransformer(model_name)
        self.chroma = chromadb.HttpClient(
            host=os.getenv("CHROMA_HOST", "localhost"),
            port=int(os.getenv("CHROMA_PORT", "8100")),
        )
        self.collection = self.chroma.get_or_create_collection("docmaster_documents")

    # ------------------------------------------------------------------
    # Similarity
    # ------------------------------------------------------------------

    def calculate_similarity(self, jd_text: str, doc_text: str) -> float:
        embs = self.encoder.encode([jd_text, doc_text])
        return float(cosine_similarity([embs[0]], [embs[1]])[0][0])

    # ------------------------------------------------------------------
    # ChromaDB CRUD
    # ------------------------------------------------------------------

    def store_document(self, doc_id: str, markdown: str, metadata: dict) -> None:
        embedding = self.encoder.encode(markdown).tolist()
        self.collection.upsert(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[markdown],
            metadatas=[metadata],
        )

    def search_similar(self, query: str, n_results: int = 5, where: dict = None) -> list[dict]:
        embedding = self.encoder.encode(query).tolist()
        kwargs = {"query_embeddings": [embedding], "n_results": n_results}
        if where:
            kwargs["where"] = where
        results = self.collection.query(**kwargs)
        items = []
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
