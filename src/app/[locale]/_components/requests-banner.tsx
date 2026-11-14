"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import { AttentionBanner, bannerBar } from "@/components/ui/attention-banner"
import {
  getUnreadDesignRequestForClient,
  unreadStudioReplyCount,
} from "@/modules/design/unread"
import {
  getPendingConsentRequestForClient,
  pendingRequestCount,
} from "@/modules/media/consent-requests"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useSupabaseBrowserClient } from "@/platform/supabase/client"
import { routes, requestPath, requestConsentPath } from "@/config/routes"

/**
 * What is waiting for a client, at the top of the home page: pending consent
 * requests, and threads the studio has answered since they last looked. Two
 * lines rather than one sum — "a request for you" and "we've replied" ask for
 * different things, and merging them would mislabel both.
 *
 * Client component so the page stays static — signed-out visitors and clients
 * with nothing waiting render nothing.
 */
export function RequestsBanner() {
  const { clientId } = useCurrentUser()
  const t = useTranslations("bookings")
  const supabase = useSupabaseBrowserClient()

  const { data: count = 0 } = useQuery({
    queryKey: ["pending-requests", clientId],
    queryFn: () => pendingRequestCount(supabase, clientId!),
    enabled: Boolean(clientId),
  })
  const { data: pendingConsent } = useQuery({
    queryKey: ["pending-consent-request", clientId],
    queryFn: () => getPendingConsentRequestForClient(supabase, clientId!),
    enabled: Boolean(clientId),
  })
  const { data: replies = 0 } = useQuery({
    queryKey: ["unread-design-replies", clientId],
    queryFn: () => unreadStudioReplyCount(supabase, clientId!),
    enabled: Boolean(clientId),
  })
  const { data: unreadRequest } = useQuery({
    queryKey: ["unread-design-request", clientId],
    queryFn: () => getUnreadDesignRequestForClient(supabase, clientId!),
    enabled: Boolean(clientId),
  })

  if (!clientId) {
    return null
  }

  const tap = t("requestBannerTap")

  return (
    <>
      {replies > 0 && unreadRequest ? (
        <AttentionBanner
          href={requestPath(unreadRequest.id)}
          className={bannerBar}
          text={t("replyBanner", { count: replies })}
          tap={tap}
        />
      ) : null}
      {count > 0 ? (
        <AttentionBanner
          href={
            pendingConsent
              ? requestConsentPath(pendingConsent.id)
              : { pathname: routes.appointments, query: { tab: "permissions" } }
          }
          className={bannerBar}
          text={t("requestBanner", { count })}
          tap={tap}
        />
      ) : null}
    </>
  )
}
