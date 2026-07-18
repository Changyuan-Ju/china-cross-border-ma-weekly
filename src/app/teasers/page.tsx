import type { Metadata } from "next";
import { TeaserLogin } from "@/components/teasers/TeaserLogin";
import { TeaserWorkspace } from "@/components/teasers/TeaserWorkspace";
import { DEFAULT_TEASER_USERNAME, getTeaserSession, teaserAuthIsConfigured } from "@/lib/teasers/auth";
import { readTeaserDashboard } from "@/lib/teasers/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teaser项目资料智库",
  description: "私有Teaser结构化项目资料库与数据洞察工作台",
  authors: [{ name: "Changyuan Ju" }],
  creator: "Changyuan Ju",
  robots: { index: false, follow: false }
};

export default async function TeasersPage() {
  const session = await getTeaserSession();
  if (!session) return <TeaserLogin configured={teaserAuthIsConfigured()} defaultUsername={process.env.TEASER_ADMIN_USERNAME || DEFAULT_TEASER_USERNAME} />;
  return <TeaserWorkspace initialData={await readTeaserDashboard()} username={session.username} />;
}
