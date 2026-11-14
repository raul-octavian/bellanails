import type { Db, Insert, Row, Update } from "./client"

/** `client_consents` — data-use agreements that are about the person rather
    than one image (marketing contact, testimonial use). One row per
    (client, purpose). */

export type DataConsentRow = Pick<Row<"client_consents">, "purpose" | "status">

export async function listDataConsents(
  db: Db,
  clientId: string,
): Promise<DataConsentRow[]> {
  const { data, error } = await db
    .from("client_consents")
    .select("purpose, status")
    .eq("client_id", clientId)
  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function findDataConsent(
  db: Db,
  clientId: string,
  purpose: string,
): Promise<Pick<Row<"client_consents">, "id" | "client_id"> | null> {
  const { data } = await db
    .from("client_consents")
    .select("id, client_id")
    .eq("client_id", clientId)
    .eq("purpose", purpose)
    .maybeSingle()

  return data ?? null
}

/** Requests awaiting this client's decision. */
export async function countRequestedFor(
  db: Db,
  clientId: string,
): Promise<number> {
  const { count } = await db
    .from("client_consents")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("status", "requested")

  return count ?? 0
}

/** The most recent pending data consent for this client — its id, so the
    banner can link straight to it instead of a tab. Client-safe under RLS. */
export async function getPendingDataConsentForClient(
  db: Db,
  clientId: string,
): Promise<{ id: string } | null> {
  const { data } = await db
    .from("client_consents")
    .select("id")
    .eq("client_id", clientId)
    .eq("status", "requested")
    .order("requested_at", { ascending: false })
    .limit(1)

  return data?.[0] ?? null
}

export async function updateDataConsent(
  db: Db,
  consentId: string,
  values: Update<"client_consents">,
): Promise<{ ok: boolean }> {
  const { error } = await db
    .from("client_consents")
    .update(values)
    .eq("id", consentId)

  return { ok: !error }
}

export async function withdrawDataConsentFor(
  db: Db,
  clientId: string,
  purpose: string,
): Promise<{ ok: boolean }> {
  const { error } = await db
    .from("client_consents")
    .update({ status: "withdrawn", withdrawn_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .eq("purpose", purpose)

  return { ok: !error }
}

export async function upsertDataConsent(
  db: Db,
  values: Insert<"client_consents">,
): Promise<{ ok: boolean }> {
  const { error } = await db
    .from("client_consents")
    .upsert(values, { onConflict: "client_id,purpose" })

  return { ok: !error }
}

/** One consent row, scoped to the client who owns it — used to authorize a
    client opening a consent request by id. The service key bypasses RLS, so
    the caller must still match client_id in the query; the page is never the
    authorization boundary. */
export async function getClientConsentRowByIdAndClient(
  db: Db,
  id: string,
  clientId: string,
): Promise<Pick<Row<"client_consents">, "id" | "client_id"> | null> {
  const { data } = await db
    .from("client_consents")
    .select("id, client_id")
    .eq("id", id)
    .eq("client_id", clientId)
    .maybeSingle()

  return data ?? null
}
