import type { Db } from "@/db/client"
import {
  getUnreadDesignRequestForClient as getUnreadDesignRequestRow,
  listDesignReplyMarkersForClient,
} from "@/db/design-requests"
import { isDesignThreadUnread } from "@/shared/design"

/**
 * How many of a client's threads the studio has answered since they last looked.
 * Client-safe (no server-only imports) so both the home banner (browser client,
 * RLS-scoped) and My Space (server client) ask the same question.
 *
 * Filters on `clientId` explicitly: RLS scopes a normal client, but the owner's
 * reads-all policy would otherwise count the whole studio on her own My Space.
 */
export async function unreadStudioReplyCount(
  db: Db,
  clientId: string,
): Promise<number> {
  const markers = await listDesignReplyMarkersForClient(db, clientId)

  return markers.filter((m) =>
    isDesignThreadUnread(m.client_seen_at, m.last_artist_reply_at),
  ).length
}

/** The most recent thread a client hasn't read yet — its id, so the banner can
    link straight to it instead of a tab. Returns null when nothing is unread. */
export async function getUnreadDesignRequestForClient(
  db: Db,
  clientId: string,
): Promise<{ id: string } | null> {
  const row = await getUnreadDesignRequestRow(db, clientId)
  if (!row) {
    return null
  }
  if (isDesignThreadUnread(row.client_seen_at, row.last_artist_reply_at)) {
    return { id: row.id }
  }

  return null
}

