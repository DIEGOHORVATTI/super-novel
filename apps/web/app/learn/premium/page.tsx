import { redirect } from "next/navigation";

import { routes } from "@/lib/routes";

// Paywall switched off. To charge again, restore:
// export const metadata: Metadata = { title: "Premium" };
// export default function PremiumPage() { return <PremiumUpsell />; }
export default function PremiumPage() {
  redirect(routes.home);
}
