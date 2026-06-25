/*
 * Unified Vulnerability Intelligence dossier.
 *
 * Collapses defensive vulnerability evidence — NVD CVE, CISA KEV, GitHub GHSA
 * advisory, OSV vulnerability, and CISA ICS/advisory — into one dossier per CVE
 * (records without a CVE link keep their own native identity). Each source keeps
 * its own provenance, freshness, proof link, and confidence; nothing is merged
 * into a single unverified claim. Defensive metadata only — exploitation status
 * is shown only when CISA KEV / NVD / GHSA assert it, never inferred and never
 * accompanied by exploitation guidance. No dossier renders without proof.
 */
import { Link2, ShieldAlert } from 'lucide-react'
import { ProvenanceBadge } from '../ui/ProvenanceBadge'
import { FreshnessBadge } from '../ui/FreshnessBadge'
import { selectVulnerabilityDossiers, type VulnerabilityDossier } from './vulnerabilityTrailSelect'
import type { CisaAdvisory, GhsaAdvisory, KevVulnerability, NvdCve, OsvVulnerability, WorldIntelEvent } from '../../worldIntel'
import './CveSourceTrailPanel.css'

const UNAVAILABLE = 'DATA_UNAVAILABLE'

export function CveSourceTrailPanel({ events, limit = 8, now }: { events: WorldIntelEvent[]; limit?: number; now: number }) {
  const dossiers = selectVulnerabilityDossiers(events, limit)
  return (
    <section className="cve-trail">
      <header className="cve-trail-head">
        <span>Vulnerability Intelligence</span>
        <strong>{dossiers.length > 0 ? `${dossiers.length} dossiers` : UNAVAILABLE}</strong>
      </header>
      {dossiers.length > 0 ? (
        <div className="cve-trail-stack">
          {dossiers.map((dossier) => (
            <DossierCard key={dossier.key} dossier={dossier} now={now} />
          ))}
        </div>
      ) : (
        <div className="cve-trail-empty">
          <strong>{UNAVAILABLE}</strong>
          <p>
            No proven vulnerability records available. The NVD / CISA KEV / GitHub GHSA / OSV / CISA advisory connectors
            returned nothing, were rate-limited, or are disabled — or no record carried a complete source trail. Nothing
            is fabricated.
          </p>
        </div>
      )}
    </section>
  )
}

function DossierCard({ dossier, now }: { dossier: VulnerabilityDossier; now: number }) {
  return (
    <article className="cve-row">
      <div className="cve-row-head">
        <strong>{dossier.cveId ?? dossier.key}</strong>
        {dossier.exploited && (
          <span className="cve-kev-badge" title="Known-exploited per CISA KEV / NVD / GHSA — defensive status only">
            <ShieldAlert size={11} /> known exploited
          </span>
        )}
        <span className="cve-srccount">{dossier.sourceCount} source{dossier.sourceCount === 1 ? '' : 's'}</span>
        <FreshnessBadge size="sm" now={now} retrievedAt={dossier.latestRetrievedAt} />
      </div>

      {dossier.nvd && <NvdSection cve={dossier.nvd} now={now} />}
      {dossier.kev && <KevSection kev={dossier.kev} now={now} />}
      {dossier.ghsa.map((ghsa) => (
        <GhsaSection key={ghsa.id} ghsa={ghsa} now={now} />
      ))}
      {dossier.osv.map((osv) => (
        <OsvSection key={osv.id} osv={osv} now={now} />
      ))}
      {dossier.cisa.map((cisa) => (
        <CisaSection key={cisa.id} cisa={cisa} now={now} />
      ))}
    </article>
  )
}

function SourceHead({ label, provenance, retrievedAt, now }: { label: string; provenance: string; retrievedAt: number; now: number }) {
  return (
    <div className="cve-source-head">
      <span className="cve-source-tag">{label}</span>
      <ProvenanceBadge value={provenance} size="sm" />
      <FreshnessBadge size="sm" now={now} retrievedAt={retrievedAt} />
    </div>
  )
}

function NvdSection({ cve, now }: { cve: NvdCve; now: number }) {
  return (
    <div className="cve-source-section">
      <SourceHead label="NVD" provenance={cve.provenance} retrievedAt={cve.retrievedAt} now={now} />
      <p className="cve-desc">{cve.description || 'No English description provided by NVD.'}</p>
      <div className="cve-meta">
        {cve.cvss ? (
          <span className={`cve-severity sev-${cve.cvss.baseSeverity.toLowerCase()}`}>
            CVSS {cve.cvss.version} · {cve.cvss.baseScore} {cve.cvss.baseSeverity}
          </span>
        ) : (
          <span className="cve-severity sev-none">CVSS not assigned</span>
        )}
        <span>{cve.vulnStatus}</span>
        <span>{cve.confidence}% confidence</span>
      </div>
      {cve.cweIds.length > 0 && (
        <div className="cve-cwe">
          {cve.cweIds.map((cwe) => (
            <span key={cwe}>{cwe}</span>
          ))}
        </div>
      )}
      {cve.vendorProducts.length > 0 && <small>Affected: {cve.vendorProducts.slice(0, 4).join(', ')}</small>}
      <a href={cve.sourceUrl} target="_blank" rel="noreferrer">
        <Link2 size={12} /> NVD source trail
      </a>
    </div>
  )
}

function KevSection({ kev, now }: { kev: KevVulnerability; now: number }) {
  return (
    <div className="cve-source-section">
      <SourceHead label="CISA KEV" provenance={kev.provenance} retrievedAt={kev.retrievedAt} now={now} />
      <p className="cve-desc">{kev.vulnerabilityName || kev.shortDescription}</p>
      <div className="cve-meta">
        <span>{kev.vendorProject} · {kev.product}</span>
        <span>added {kev.dateAdded.slice(0, 10)}</span>
        {kev.dueDate && <span>remediate by {kev.dueDate.slice(0, 10)}</span>}
        {kev.knownRansomwareCampaignUse && <span className="cve-severity sev-high">ransomware-linked</span>}
      </div>
      {kev.requiredAction && <small>Required action (CISA): {kev.requiredAction}</small>}
      <a href={kev.sourceCatalogUrl || kev.sourceUrl} target="_blank" rel="noreferrer">
        <Link2 size={12} /> CISA KEV catalog
      </a>
    </div>
  )
}

function GhsaSection({ ghsa, now }: { ghsa: GhsaAdvisory; now: number }) {
  return (
    <div className="cve-source-section">
      <SourceHead label={`GHSA · ${ghsa.ghsaId}`} provenance={ghsa.provenance} retrievedAt={ghsa.retrievedAt} now={now} />
      <p className="cve-desc">{ghsa.summary}</p>
      <div className="cve-meta">
        <span className={`cve-severity sev-${ghsa.severity.toLowerCase()}`}>{ghsa.severity || 'severity n/a'}</span>
        {ghsa.withdrawnAt && <span>withdrawn {ghsa.withdrawnAt.slice(0, 10)}</span>}
        <span>updated {ghsa.updatedAt.slice(0, 10)}</span>
      </div>
      {ghsa.packages.length > 0 && (
        <div className="cve-cwe">
          {ghsa.packages.slice(0, 4).map((pkg) => (
            <span key={`${pkg.ecosystem}:${pkg.name}`} className="cve-pkg">
              {pkg.ecosystem}:{pkg.name}
              {pkg.firstPatched ? ` → ${pkg.firstPatched}` : ''}
            </span>
          ))}
        </div>
      )}
      <a href={ghsa.sourceUrl} target="_blank" rel="noreferrer">
        <Link2 size={12} /> GitHub advisory
      </a>
    </div>
  )
}

function OsvSection({ osv, now }: { osv: OsvVulnerability; now: number }) {
  return (
    <div className="cve-source-section">
      <SourceHead label={`OSV · ${osv.osvId}`} provenance={osv.provenance} retrievedAt={osv.retrievedAt} now={now} />
      <p className="cve-desc">{osv.summary || osv.details || 'No OSV summary provided.'}</p>
      <div className="cve-meta">
        {osv.ecosystem && <span>{osv.ecosystem}</span>}
        {osv.severity && <span>{osv.severity}</span>}
        {osv.aliases.length > 0 && <span>aliases: {osv.aliases.slice(0, 4).join(', ')}</span>}
      </div>
      {osv.affectedPackages.length > 0 && (
        <div className="cve-cwe">
          {osv.affectedPackages.slice(0, 4).map((pkg) => (
            <span key={`${pkg.ecosystem}:${pkg.name}`} className="cve-pkg">
              {pkg.ecosystem}:{pkg.name}
              {pkg.fixed ? ` → ${pkg.fixed}` : ''}
            </span>
          ))}
        </div>
      )}
      <a href={osv.sourceUrl} target="_blank" rel="noreferrer">
        <Link2 size={12} /> OSV record
      </a>
    </div>
  )
}

function CisaSection({ cisa, now }: { cisa: CisaAdvisory; now: number }) {
  return (
    <div className="cve-source-section">
      <SourceHead label={`CISA · ${cisa.advisoryId}`} provenance={cisa.provenance} retrievedAt={cisa.retrievedAt} now={now} />
      <p className="cve-desc">{cisa.title || cisa.summary}</p>
      <div className="cve-meta">
        {cisa.vendors.length > 0 && <span>vendors: {cisa.vendors.slice(0, 3).join(', ')}</span>}
        {cisa.products.length > 0 && <span>products: {cisa.products.slice(0, 3).join(', ')}</span>}
        <span>updated {cisa.updated.slice(0, 10)}</span>
      </div>
      <a href={cisa.sourceUrl} target="_blank" rel="noreferrer">
        <Link2 size={12} /> CISA advisory
      </a>
    </div>
  )
}
