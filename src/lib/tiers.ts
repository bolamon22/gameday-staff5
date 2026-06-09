export type TierKey = 'starter' | 'pro' | 'enterprise'

export interface TierDef {
  label: string
  price: string
  description: string
  color: string
  borderColor: string
  features: string[]
  locked: string[]
}

export const TIERS: Record<TierKey, TierDef> = {
  starter: {
    label: 'Starter',
    price: 'Free',
    description: 'For getting started with your first tournament.',
    color: 'bg-slate-50 border-slate-300',
    borderColor: 'border-slate-300',
    features: [
      '1 active tournament',
      'Staff pool & scheduling',
      'Team & player registration',
      'Manual payments (Check, Zelle)',
      'Drag-and-drop scheduler',
      'Tournament management tools',
    ],
    locked: [
      'Unlimited tournaments',
      'Payment integrations (Stripe, QuickBooks, PayPal)',
      'AI assistant',
      'Email / coach notifications',
      'Copy tournament',
      'Multi-user orgs with roles',
      'White-label & API access',
    ],
  },
  pro: {
    label: 'Pro',
    price: '$79 / mo',
    description: 'For organizations running multiple events.',
    color: 'bg-blue-50 border-blue-300',
    borderColor: 'border-blue-400',
    features: [
      'Unlimited tournaments',
      'All Starter features',
      'Payment integrations (Stripe, QuickBooks, PayPal)',
      'AI assistant',
      'Email notifications & coach alerts',
      'Copy tournament for annual events',
      'Draft / publish schedule versioning',
      'Priority support',
    ],
    locked: [
      'White-label branding',
      'Multi-user orgs with roles',
      'API access',
    ],
  },
  enterprise: {
    label: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations and multi-org platforms.',
    color: 'bg-purple-50 border-purple-300',
    borderColor: 'border-purple-400',
    features: [
      'Everything in Pro',
      'White-label branding',
      'Multi-user orgs with roles (Owner / Admin / Staff)',
      'API access',
      'Dedicated account support',
      'Custom integrations',
    ],
    locked: [],
  },
}

export const TIER_ORDER: TierKey[] = ['starter', 'pro', 'enterprise']

export function getUpgradeTiers(current: TierKey): TierKey[] {
  const idx = TIER_ORDER.indexOf(current)
  return TIER_ORDER.slice(idx + 1)
}
