# backend/tools/rag_retriever.py
import re
import structlog
from langchain_core.tools import tool
import chromadb
from chromadb.utils import embedding_functions

log = structlog.get_logger()

_client = chromadb.PersistentClient(path="./chroma_db")

embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

_collection = _client.get_or_create_collection(
    name="agentops_docs",
    embedding_function=embedding_fn,
)

# Retrieval tuning
TOP_K = 10
FINAL_RESULTS = 3
MAX_GAP = 0.25

@tool
def rag_tool(
    query: str,
    context_files: list[str] | None = None,
    threshold: float = 1.5,
    user_id: str = "",
) -> dict:
    """Retrieve relevant documents from the local knowledge base."""

    try:

        is_csv = bool(context_files and any(f.startswith("csv_") for f in context_files))

        query_expanded = query
        q = query.lower()

        # FIX 3: Column-name-aware query expansion for tabular data
        if "highest" in q or "maximum" in q or "max" in q:
            query_expanded += " ANNUAL JAN-FEB MAR-MAY JUN-SEP OCT-DEC maximum"

        if "lowest" in q or "minimum" in q or "min" in q:
            query_expanded += " ANNUAL JAN-FEB MAR-MAY JUN-SEP OCT-DEC minimum"

        if "temperature" in q:
            query_expanded += " ANNUAL seasonal mean YEAR"

        if "year" in q:
            query_expanded += " YEAR column"

        # FIX 3: Match year tokens as they appear in CSV chunks (e.g. "1990.0")
        years = re.findall(r'\b(1[89]\d{2}|20\d{2})\b', q)
        for yr in years:
            query_expanded += f" {yr}.0 YEAR row"

        if not context_files:
            return {
                "answer": "No context files selected.",
                "distance": None,
                "similarity": 0,
                "threshold": threshold,
                "sources": [],
                "chunks": [],
            }

        log.info(
            "rag_security",
            user_id=user_id,
            context_files=context_files,
        )

        # FIX 4: Increase TOP_K for CSV files to get more candidates
        top_k = 15 if is_csv else TOP_K

        query_args = {
            "query_texts": [query_expanded],
            "n_results": top_k,
            "where": {
                "$and": [
                    {"user_id": user_id},
                    {"filename": {"$in": context_files}},
                ]
            },
        }

        log.info(
            "rag_where",
            where=query_args["where"],
        )
        peek = _collection.get(
            where={
                "$and": [
                    {"user_id": user_id},
                    {"filename": {"$in": context_files}},
                ]
            }
        )

        print("========== CHROMA QUERY ==========")
        print("FILES:", context_files)
        print("USER:", user_id)
        print("MATCHING DOCS:", len(peek.get("ids", [])))

        results = _collection.query(**query_args)

        docs = results.get("documents", [[]])[0]
        distances = results.get("distances", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

        log.info(
            "rag_distances",
            distances=distances,
        )

        # Auto-calibrate threshold for CSVs based on actual distance distribution.
        # Handles any CSV type (numeric, text, medical, sales etc.) without
        # per-file hardcoding — floor = best distance + small buffer.
        effective_threshold = threshold
        if is_csv and distances:
            min_dist = min(distances)
            effective_threshold = max(threshold, min_dist + 0.15)

        # FIX 1: Log effective_threshold, not original threshold
        log.info(
            "rag_threshold",
            threshold=effective_threshold,
        )

        log.info(
            "rag_query",
            query=query[:60],
            context_files=context_files,
            docs_found=len(docs),
        )

        if not docs:
            return {
                "answer": "No relevant documents found in the knowledge base.",
                "distance": None,
                "similarity": 0,
                "threshold": threshold,
                "chunks": [],
                "sources": [],
            }

        # Filter by threshold
        chunks = []

        for doc, dist, meta in zip(docs, distances, metadatas):
            # FIX 6: CSV chunks are never summaries — don't skip chunk 0 for CSVs
            if (
                not is_csv
                and meta.get("level") == "summary"
                and len(docs) > 1
            ):
                continue
            if dist > effective_threshold:
                continue
            chunks.append({
                "source": meta.get("filename", "unknown"),
                "content": doc,
                "distance": round(dist, 3),
                "filetype": meta.get("filetype", "unknown"),
            })

        chunks.sort(key=lambda x: x["distance"])

        if not chunks:
            return {
                "answer": "No relevant documents found in the knowledge base.",
                "distance": None,
                "similarity": 0,
                "threshold": threshold,
                "sources": [],
                "chunks": [],
            }

        best_distance = chunks[0]["distance"]

        # FIX 5: Widen MAX_GAP for CSV files so nearby chunks aren't cut off
        max_gap = 0.4 if is_csv else MAX_GAP

        chunks = [
            c
            for c in chunks
            if c["distance"] <= best_distance + max_gap
        ]

        final_results = min(FINAL_RESULTS, len(chunks))
        chunks = chunks[:final_results]

        if not chunks:
            return {
                "answer": "No relevant documents found in the knowledge base.",
                "distance": None,
                "similarity": 0,
                "threshold": threshold,
                "sources": [],
                "chunks": [],
            }

        similarity = max(
            0,
            min(
                100,
                round(
                    (2.0 - best_distance) / 2.0 * 100
                )
            )
        )

        quality = "low"
        if best_distance < 0.7:
            quality = "excellent"
        elif best_distance < 1.0:
            quality = "good"
        elif best_distance < 1.3:
            quality = "fair"
        else:
            quality = "weak"

        log.info(
            "rag_retrieved",
            context_files=context_files,
            found=True,
            similarity=similarity,
            distance=best_distance,
            task_id=None,
        )

        # --- CSV direct answer extraction (no LLM) ---
        direct_answer = None

        if is_csv:

            # --- Path 1: Numeric/year-based CSV (e.g. temperature, sales by year) ---
            all_rows = []

            for chunk in chunks:
                for line in chunk["content"].splitlines():
                    match = re.match(
                        r"^\s*(1[89]\d{2}|20\d{2})\.?\d*[\s,]+([\d.]+)",
                        line.strip(),
                    )
                    if match:
                        all_rows.append({
                            "line": line.strip(),
                            "year": match.group(1),
                            "annual": float(match.group(2)),
                        })

            years_in_query = re.findall(r'\b(1[89]\d{2}|20\d{2})\b', q)
            filtered_rows = (
                [r for r in all_rows if r["year"] in years_in_query]
                if years_in_query
                else all_rows
            )

            if filtered_rows:
                year_label = f" in {years_in_query[0]}" if years_in_query else ""

                if "highest" in q or "maximum" in q or "max" in q:
                    best_row = max(filtered_rows, key=lambda r: r["annual"])
                    direct_answer = (
                        f"Highest value{year_label}: {best_row['annual']} "
                        f"(Year: {best_row['year']})\n"
                        f"Full row: {best_row['line']}"
                    )

                elif "lowest" in q or "minimum" in q or "min" in q:
                    best_row = min(filtered_rows, key=lambda r: r["annual"])
                    direct_answer = (
                        f"Lowest value{year_label}: {best_row['annual']} "
                        f"(Year: {best_row['year']})\n"
                        f"Full row: {best_row['line']}"
                    )

                elif years_in_query:
                    direct_answer = "\n".join(
                        f"Year {r['year']}: {r['line']}"
                        for r in filtered_rows
                    )

            # --- Path 2: Text/categorical CSV (e.g. medical, HR, sales with names) ---
            # Runs for any CSV where Path 1 found no year-based rows
            if not direct_answer:
                stopwords = {
                    "which", "were", "with", "the", "and", "for",
                    "name", "names", "show", "list", "find", "get",
                    "what", "how", "many", "all", "is", "are", "of",
                    "who", "where", "when", "that", "this", "has",
                    "have", "been", "diagnosis", "diagnosed",
                }
                # Extract meaningful words from the query
                keywords_lower = [
                    kw.lower() for kw in re.findall(r'\b[A-Za-z]{2,}\b', q)
                    if kw.lower() not in stopwords
                ]
                # Also extract uppercase tokens directly from original query
                # (e.g. TMC, MDS, NIL, MOD — column values in categorical CSVs)
                upper_keywords = [
                    kw.lower() for kw in re.findall(r'\b[A-Z]{2,}\b', query)
                ]
                keywords_lower = list(set(keywords_lower + upper_keywords))

                matched_lines = []
                seen = set()

                for chunk in chunks:
                    for line in chunk["content"].splitlines():
                        line_stripped = line.strip()
                        # Skip empty lines, header lines, and separator lines
                        if not line_stripped or line_stripped.startswith("---"):
                            continue
                        if line_stripped.lower() in seen:
                            continue
                        if any(kw in line_stripped.lower() for kw in keywords_lower):
                            matched_lines.append(line_stripped)
                            seen.add(line_stripped.lower())

                if matched_lines:
                    direct_answer = "\n".join(matched_lines)

        # Use direct answer for CSV if extracted, else fall back to raw chunks
        final_answer = (
            direct_answer
            if direct_answer
            else "\n\n---\n\n".join(chunk["content"] for chunk in chunks)
        )

        return {
            "quality": quality,
            "top_k": top_k,
            "docs_found": len(docs),
            "best_distance": round(best_distance, 3),
            "retrieval_mode": "vector",
            "retrieved_chunks": len(chunks),
            "answer": final_answer,
            "chunks": chunks,
            "distance": round(best_distance, 3),
            "similarity": similarity,
            "threshold": threshold,
            "sources": list(
                {
                    chunk["source"]
                    for chunk in chunks
                }
            ),
        }

    except Exception as e:

        log.error(
            "rag_error",
            error=str(e),
        )

        return {
            "answer": "RAG retrieval failed.",
            "chunks": [],
            "distance": None,
            "similarity": 0,
            "threshold": threshold,
            "sources": [],
        }


def add_documents(
    texts: list[str],
    ids: list[str],
    filename: str,
    user_id: str = "anonymous",
) -> None:

    if not texts:
        return

    try:
        _collection.delete(
            where={
                "user_id": user_id,
                "filename": filename,
            }
        )
    except Exception:
        pass

    try:

        is_csv = filename.startswith("csv_")

        metadatas = []

        for idx, _ in enumerate(texts):
            metadatas.append({
                "filename": filename,
                "source": "upload",
                "user_id": user_id,
                "filetype": filename.split("_")[0],
                "chunk_index": idx,
                "total_chunks": len(texts),
                # FIX 6: CSV chunks are all leaf — chunk 0 is not a summary
                "level": "leaf" if is_csv else ("summary" if idx == 0 else "leaf"),
            })

        _collection.upsert(
            documents=texts,
            ids=ids,
            metadatas=metadatas,
        )
        peek = _collection.get(
            where={
                "user_id": user_id,
                "filename": filename,
            }
        )

        print("========== CHROMA INSERT ==========")
        print("FILE:", filename)
        print("USER:", user_id)
        print("INSERTED DOCS:", len(peek.get("ids", [])))

        log.info(
            "docs_added",
            count=len(texts),
            filename=filename,
            user=user_id,
        )

    except Exception as e:
        log.error(
            "add_document_error",
            error=str(e),
        )