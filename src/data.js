// State & Initial Data for Galaxis Hub Prototype
export const state = {
  loggedInAccountType: 'AGENCY',
  activeViewMode: 'CLIENT',
  currentActiveClient: 'Acme APAC Pte Ltd',
  currentScreenId: 'client-home',
  orgSettingsRoleMode: 'agency',
  triageVisible: false,
  currentPerformanceView: 'campaign',
  selectedCampaignFilter: null,
  campaignSearchQuery: '',
  activePerfFilter: null,
  clientTableSort: { key: 'spendValue', direction: 'desc' },
  agencyTableSort: { key: 'spend', direction: 'desc' },
  activeAdvFilters: {
    platforms: new Set(),
    statuses: new Set(),
    formats: new Set(),
    campaigns: new Set()
  },
  dashboardDateFilters: {
    client: { mode: 'past', pastNumber: 30, pastUnit: 'days', currentUnit: 'day' },
    agency: { mode: 'past', pastNumber: 30, pastUnit: 'days', currentUnit: 'day' }
  },
  currentlyManagingUserId: null,
  editingRoleIdx: null,
  pendingMapPlatform: null,
  pendingMapId: null,
  pendingMapName: null,
  pendingUnmapId: null,
  pendingUnmapPlatform: null,
  clientHeatmapMetric: 'spend',
  currentWorkspacePage: 1,
  workspacePageSize: 10
};

export const availableRoleColors = [
  'bg-brand-500/10 text-brand-600',
  'bg-blue-100/80 text-blue-700',
  'bg-teal-100/80 text-teal-700',
  'bg-emerald-100/80 text-emerald-700',
  'bg-green-100/80 text-green-700',
  'bg-purple-100/80 text-purple-700',
  'bg-fuchsia-100/80 text-fuchsia-700',
  'bg-pink-100/80 text-pink-700',
  'bg-rose-100/80 text-rose-700',
  'bg-orange-100/80 text-orange-700',
  'bg-stone-200/80 text-stone-700'
];

export const roleColorsMap = {
  'Agency Admin': 'bg-rose-100/80 text-rose-700',
  'Owner': 'bg-brand-500/10 text-brand-600',
  'Account Manager': 'bg-blue-100/80 text-blue-700',
  'Viewer': 'bg-teal-100/80 text-teal-700',
  'Frontend Engineer': 'bg-purple-100/80 text-purple-700',
  'Data Analyst': 'bg-orange-100/80 text-orange-700',
  'UX Researcher': 'bg-green-100/80 text-green-700',
  'Backend Engineer': 'bg-indigo-100/80 text-indigo-700',
  'Product Manager': 'bg-pink-100/80 text-pink-700',
  'Contractor': 'bg-stone-200/80 text-stone-700'
};

export const statusColorsMap = {
  'Active': 'bg-emerald-500',
  'Invited': 'bg-amber-500',
  'Deactivated': 'bg-slate-300'
};

export let agencyRoles = [
  { name: 'Agency Admin', isLocked: true, perms: ['perm-ws-view', 'perm-ws-create', 'perm-ws-client', 'perm-ws-agency', 'perm-ad-map', 'perm-team-invite', 'perm-team-role'] },
  { name: 'Owner', isLocked: true, perms: ['perm-ws-view', 'perm-ws-create', 'perm-ws-client', 'perm-ws-agency', 'perm-ad-map', 'perm-team-invite', 'perm-team-role'] },
  { name: 'Account Manager', isLocked: false, perms: ['perm-ws-view', 'perm-ws-client', 'perm-ad-map'] },
  { name: 'Viewer', isLocked: false, perms: ['perm-ws-view'] },
  { name: 'Data Analyst', isLocked: false, perms: ['perm-ws-view', 'perm-ws-client'] }
];

export const permsGroups = [
  { group: 'Workspace Management', keys: [ {id: 'perm-ws-view', label: 'View assigned workspaces'}, {id: 'perm-ws-create', label: 'Create new workspaces'}, {id: 'perm-ws-client', label: 'Manage clients in workspaces'}, {id: 'perm-ws-agency', label: 'Assign & Unassign agency user to workspaces'} ] },
  { group: 'Ad Account Permissions', keys: [ {id: 'perm-ad-map', label: 'Link & Unlink ad accounts to workspaces'} ] },
  { group: 'Agency User Permissions', keys: [ {id: 'perm-team-invite', label: 'Invite new agency users'}, {id: 'perm-team-role', label: 'Create & edit agency roles'} ] }
];

export let agencyMembers = [
  { id: 1, name: 'Ada Anand', email: 'ada@northwind.co', initials: 'AA', role: 'Agency Admin', workspaces: ['Acme APAC Pte Ltd', 'OOm Digital Group'], status: 'Active' },
  { id: 2, name: 'Ada Lindqvist', email: 'lindqvist@northwind.co', initials: 'AL', role: 'Data Analyst', workspaces: ['Apex Media Singapore'], status: 'Active' },
  { id: 3, name: 'Amara Lovelace', email: 'amara@northwind.co', initials: 'AL', role: 'Account Manager', workspaces: ['Acme APAC Pte Ltd'], status: 'Active' },
  { id: 4, name: 'Jungkook Jeon', email: 'jk@galaxis.ai', initials: 'JJ', role: 'Owner', workspaces: ['OOm Digital Group', 'Acme APAC Pte Ltd'], status: 'Active' }
];

export const masterWorkspacesData = [
  { name: 'Acme APAC Pte Ltd', contact: 'sarah@acme.com', accountManagers: ['Jungkook Jeon'] },
  { name: 'OOm Digital Group', contact: 'hello@oomdigital.com.sg', accountManagers: ['Jungkook Jeon'] },
  { name: 'Institute for Growth', contact: 'dean@growth.edu.sg' },
  { name: 'Apex Media Singapore', contact: 'contact@apexmedia.sg' },
  { name: 'Fintech Velocity Ltd', contact: 'finance@velocity.io' }
];

export let clientUsers = [
  { id: 1, name: 'Sarah Jenkins', email: 'sarah@acme.com', role: 'Manage Members', canManage: true, status: 'Active', isPrimary: true },
  { id: 2, name: 'David Lim', email: 'david@acme.com', role: 'View Only', canManage: false, status: 'Active', isPrimary: false }
];

export const agencyPerformanceData = {
  campaigns: [
    { client: 'OOm Digital Group', name: 'WhatsApp Lead Gen', platform: 'Meta', spend: '$12,400', conversions: 342, adCount: 2 },
    { client: 'Fintech Velocity Ltd', name: 'Search Intent', platform: 'Google', spend: '$22,000', conversions: 395, adCount: 3 },
    { client: 'Acme APAC Pte Ltd', name: 'Search Singapore', platform: 'Google', spend: '$18,200', conversions: 410, adCount: 3 }
  ]
};

export let liveMappedAccounts = [
  { client: 'Acme APAC Pte Ltd', platform: 'meta', name: 'Acme APAC - Meta Ads', id: 'act_98241028' },
  { client: 'OOm Digital Group', platform: 'google', name: 'OOm Digital - Lead Campaigns', id: '#778-901-2244' }
];

export const validUnmappedAccounts = [
  { platform: 'google', id: '#998-234-1102', name: 'APAC Search Brand Expansion' },
  { platform: 'meta', id: 'act_4920194820', name: 'Meta CTWA Direct Promo' }
];
