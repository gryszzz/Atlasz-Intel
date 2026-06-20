---
name: retrieval-and-vector-search
description: >-
  Build retrieval / RAG over a corpus — chunking, embeddings, vector + hybrid
  search, reranking, and evaluation. Use for semantic search, "ask my docs", or
  precedent matching. Triggers: "vector search", "RAG", "embeddings", "semantic
  search", "retrieve relevant", "Qdrant/Faiss/Weaviate".
---

# Retrieval & vector search

Make a corpus queryable by meaning, with honest grounding.

## Pipeline

1. **Chunk** — split by structure (headings/sentences), ~200–500 tokens, small
   overlap. Bad chunking caps retrieval quality more than the model does.
2. **Embed** — a real embedding model for semantics; a lexical/hashing vector is
   a cheap honest fallback (label it as such — that's what Atlasz's precedent
   engine uses). Store vector + source ID + timestamp.
3. **Index** — Faiss (in-proc), Qdrant/Weaviate/Milvus (service). HNSW for ANN.
4. **Retrieve** — top-k by cosine; **hybrid** (dense + BM25/keyword) beats either
   alone for names/IDs.
5. **Rerank** — a cross-encoder over the top-k sharpens precision.
6. **Ground** — feed retrieved chunks to the LLM **with citations**; answer only
   from retrieved context; no hit → say so.

## Honesty

Every answer cites its source chunks (id + URL). Similarity ≠ truth — a close
match is a lead, not a fact. Detect stale embeddings (re-embed on content change,
keyed by content hash).

## Evaluate

Build a labeled query set; measure recall@k + answer faithfulness. Tune chunking/
hybrid weights/rerank against it — not by vibes. Pairs with
[[ai-agent-architecture]] (retrieval as a tool) and [[entity-resolution-graphs]].
