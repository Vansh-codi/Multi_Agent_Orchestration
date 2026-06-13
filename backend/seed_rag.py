
from tools.rag_retriever import add_documents


texts = [
    "Redis is an in-memory key-value store used for caching.",
    "RAG combines retrieval and generation using vector databases.",
    "FastAPI is a modern async Python web framework.",
]

ids = [
    "doc1",
    "doc2",
    "doc3",
]

try:

    add_documents(
        texts=texts,
        ids=ids,
        filename="seed_docs"
    )

    print("RAG database seeded successfully.")

except Exception as e:

    print("SEED ERROR:")
    print(str(e))