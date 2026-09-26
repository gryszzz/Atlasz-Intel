# Meridian / NOEMA file bridge v1

This contract is mirrored in both repositories. The identical synthetic fixture
`meridian-request.json` lives under Meridian's `test/fixtures` and NOEMA's
`tests/fixtures`. It is test data only, never runtime evidence.

## Operator workflow

1. Expand a selected event in Meridian's default world interface.
2. In **NOEMA · Evidence review**, enter a question and export `meridian-request.json`.
3. Install NOEMA (`pip install -e ".[dev]"` in a Python 3.12+ virtual environment),
   then run from the directory containing the downloaded request:

   ```sh
   noema-meridian meridian-request.json --output noema-review.json --db /path/to/noema.db
   ```

4. Keep the same Meridian event open and import `noema-review.json`.

The CLI never overwrites an existing output. Use a new filename or deliberately
remove your previous output to repeat a transfer. The database audit is idempotent
for the same request ID and digest; reuse of an ID with changed content is rejected.
The current UI retains request/review only in memory. Reloading or selecting another
event requires a new export/review cycle. Durable task recovery is the next phase.

## Envelope

Both directions use UTF-8 JSON with exactly three envelope fields:

- `schema`: `meridian.noema.request.v1` or `meridian.noema.review.v1`.
- `payload`: a JSON **string**, whose exact UTF-8 bytes are hashed.
- `sha256`: lowercase 64-character SHA-256 of that string.

Do not parse and reserialize the payload before checking its hash. No cross-language
JSON canonicalization is assumed. Maximum encoded envelope size is 65,536 bytes.
This is integrity checking, not a signature or trusted transport. Imported review
text is displayed as plain text, never executed or inserted as HTML.

## Request payload

`requestId`, `createdAt` (timezone-aware), `question`, and `evidence` are required.
The evidence object contains `eventId`, `title`, `summary`, `sourceId`, `sourceUrl`,
`sourceProvenance`, `eventAt`, `sourceRetrievedAt`, `upstreamPayloadHash`, and
`freshness`.

V1 sends one bounded excerpt. `sourceRetrievedAt` is always null and `freshness`
is `unassessed`: the common Meridian event shape does not contain a universal
retrieval timestamp. `eventAt` is the existing event timestamp, not proof of when
NOEMA or its forecaster knew the information. The transfer hash covers the excerpt;
`upstreamPayloadHash` only references the original payload, which is not transferred.

Source URLs must be HTTPS without credentials, query parameters, or fragments.
V1 rejects query-bearing URLs rather than silently changing the source identity;
this means some otherwise valid source events cannot yet be exported. Future source
URL support needs an explicit redaction and canonical-source policy.

Allowed provenance: live, delayed, stale-cache, offline-cache, public-unauthenticated,
public-disclosure, official-api, media-observation, rss-public, verified. These labels
are carried assertions from Meridian, not independently verified by the bridge.
Simulated, unavailable, auth-gated, derived, inferred, and unknown labels are rejected.
No confidence value, claimed exposure, raw provider payload, credential, or executable
action is included. Future timestamps and unknown request fields fail closed.

## Review payload

Required identity: `requestId`, `requestSha256`, `eventId`, `generatedAt`.
Fixed semantics: `method=deterministic-evidence-review-v1`, `basis=analysis`,
`status=needs-more-evidence`.

`findings` contain bounded text and `evidenceIds` referring only to the exported
event. `unknowns`, `nextChecks`, and `nonClaims` must be nonempty bounded arrays.
Meridian rejects mismatched identities, failed hashes, unsupported methods, invalid
timestamps, and uncited findings. It does not treat a matching hash as an authentic
NOEMA signature, proof of a claim, or independent corroboration.

The first reviewer attributes the supplied excerpt and lists missing retrieval,
source-payload verification, corroboration, and causal evidence. It does not answer
the question by fetching new information or using an LLM. Media and cached-source
limitations are explicitly retained. Reviews live in the separate `meridian_reviews`
audit table, never the forecast ledger or source evidence store.

## Evolution

V2 will add durable jobs and authenticated local transport with explicit capability
negotiation. Original-source retrieval and availability times, domain freshness,
entity mapping, and source-payload verification need dedicated schemas and tests
before forecast eligibility. Neither v1 nor the proposed research transport grants
trading, signing, or payment authority.
