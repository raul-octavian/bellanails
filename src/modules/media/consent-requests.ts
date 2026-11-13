import type { Db } from "@/db/client"
import { countRequestedFor as countRequestedDataConsents } from "@/db/client-consents"
import { getPendingDataConsentForClient } from "@/db/client-consents"
import {
  countRequestedReleasesForClient,
  getPendingReleaseForClient,
} from "@/db/media-releases"

/**
 * Count of requests awaiting the client's decision (media releases + data-use).
 * Client-safe (no server-only imports) so both the home banner (browser client)
 * and My Space (server client) can use it. Filters on `clientId` explicitly —
 * RLS scopes a normal client, but the OWNER's owner-reads-all policy would
 * otherwise count the whole studio on their own personal surface.
 */
export async function pendingRequestCount(
  db: Db,
  clientId: string,
): Promise<number> {
  const [media, data] = await Promise.all([
    countRequestedReleasesForClient(db, clientId),
    countRequestedDataConsents(db, clientId),
  ])

  return media + data
}

/** The most recent pending consent request for this client — its id plus a
    tag saying whether it's a media release or a data consent, so the banner
    can link straight to it instead of a tab. Returns null when nothing is
    pending. Client-safe under RLS. */
export async function getPendingConsentRequestForClient(
  db: Db,
  clientId: string,
): Promise<{ id: string; kind: "release" | "data_consent" } | null> {
  const [release, dataConsent] = await Promise.all([
    getPendingReleaseForClient(db, clientId),
    getPendingDataConsentForClient(db, clientId),
  ])

  if (release) {
    return { id: release.id, kind: "release" }
  }
  if (dataConsent) {
    return { id: dataConsent.id, kind: "data_consent" }
  }

  return null
}

