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
    campaigns: new Set(),
    selectedEntities: new Set()
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

export const defaultScreenSpecs = {
  'agency-home': {
    title: 'Agency Master Hub & Dashboard',
    author: 'Hannah',
    updatedAt: 'Oct 6, 2026',
    notes: `### Screen Purpose & Objectives\nCentral command dashboard for agency administrators managing hundreds of client ad accounts and multi-tenant workspaces.\n\n### Key Functional Specifications\n- **Unified Portfolio KPIs**: Displays 5 aggregate metrics across 612 client workspaces (Total Managed Accounts, $142.8k Spend, $13.60 CPM, $0.95 CPC, $65.38 CPA).\n- **Action-Required Triage**: Dynamically alerts agency admins to unmapped ad accounts and workspaces lacking ad accounts with direct 1-click links to resolve.\n- **Workspace Switcher**: Top header switcher provides instant searching across 600+ client accounts and switching between agency overview and client workspace views.\n- **Global Sync Status**: Live pill indicating sync state with Google Ads and Meta Ads platform APIs.`
  },
  'agency-internal-org': {
    title: 'Agency Team Members & Custom Roles',
    author: 'Hannah',
    updatedAt: 'Oct 6, 2026',
    notes: `### Screen Purpose & Objectives\nManage internal agency personnel, team assignments, and create reusable custom permission roles.\n\n### Key Functional Specifications\n- **Custom Role Creator**: Create custom roles with custom label names and 8 borderless color badges (Violet, Indigo, Teal, Emerald, etc.).\n- **Granular Permissions**: Workspace Management (View/Manage), Analytics access, Ad Accounts linking rights, and User management.\n- **Member Workspace Assignment**: Manage user modal allows assigning agency team members to specific client workspaces with fast search and count indicators.\n- **Fast Invite**: Email input modal for immediate team onboarding.`
  },
  'agency-adaccounts': {
    title: 'Ad Account Discovery & Workspace Linking',
    author: 'Hannah',
    updatedAt: 'Oct 6, 2026',
    notes: `### Screen Purpose & Objectives\nTriage and map discovered Google & Meta advertising accounts to the correct client workspace.\n\n### Key Functional Specifications\n- **Unlinked Account Queue**: Shows accounts discovered via Google/Meta OAuth that need client workspace assignment.\n- **Inline Fast Mapping**: In-row dropdown to pick a client workspace and link with one click.\n- **CID & ID Manual Search**: Modal to look up specific Google CID numbers (#000-000-0000) or Meta Account IDs.\n- **Safe Unlink Confirmation**: Warning modal prevents accidental unlinking by requiring confirmation and explaining analytics impact.`
  },
  'agency-orgs': {
    title: 'Client Workspaces Directory & Creation',
    author: 'Hannah',
    updatedAt: 'Oct 6, 2026',
    notes: `### Screen Purpose & Objectives\nMaster searchable directory of all client workspaces under agency management.\n\n### Key Functional Specifications\n- **Create Client Workspace**: Modal to input workspace name, automatically adding the workspace and immediately redirecting to its Settings page.\n- **Multi-Tenant Search & Sorting**: Real-time filtering across 600+ workspaces by name, active ad platform, spend, and conversion volumes.\n- **Workspace Drilldown**: Clicking any row immediately switches view into that client workspace's dedicated analytics environment.`
  },
  'client-home': {
    title: '1. Workspace Home & Analytics',
    author: 'Hannah',
    updatedAt: 'Oct 7, 2026',
    notes: `### Screen Purpose & Objectives
Client-facing workspace home providing a simplified, unified overview of Meta and Google Ads performance. Designed to deliver high-value insights that eliminate the client's need to access native ad platforms, while also serving as an inspection view for agency administrators.

### Key Functional Specifications (All metrics TBC)
- **Top-Level KPI Cards**: Displays critical, aggregate metrics spanning all campaigns and ad platforms. Exact values (e.g., Total Spend, CPA, Conversions) are placeholders pending final feedback from performance marketing and account management teams.
- **Hierarchical Campaign Breakdown Table**: A mandatory data table enabling users to drill down through performance tiers (Platform -> Campaign -> Ad Group -> Ad) to compare key statistics. Includes capabilities to filter by specific data views.
- **Multi-Selectable Searchable Entity Dropdown Filter**: Allows filtering the table by specific campaigns, ad groups, or ads simultaneously. Includes real-time keyword search, type tabs (\`All\`, \`Campaigns\`, \`Ad Groups\`, \`Ads\`), quick actions (\`Select all shown\`, \`Deselect all\`), and a counter badge on the trigger button. Sits prominently above the table and action CTAs with a high stacking order (\`z-index: 9999\`) so it lays seamlessly over charts below without being masked.
- **Selected Filters Tag Bar**: Displays dismissible chips for each selected campaign/ad group/ad directly beneath controls with 1-click removal and "Clear all" button.
- **Graphic Visualizations (Provisional)**: Proposed visual components currently include a Daily Performance Graph (Spend/Clicks/Conversions) and an Optimization Heatmap (Hour of Day x Day of Week). These specific formats are conceptual placeholders; the final visuals will be dictated by account management feedback to ensure only high-impact, highly relevant data is presented. Low-interest charts will be removed or replaced.`
  },
  'client-profile': {
    title: 'Client Workspace Settings & Permissions',
    author: 'Hannah',
    updatedAt: 'Oct 6, 2026',
    notes: `### Screen Purpose & Objectives\nClient workspace administration, user permissions, primary contact assignment, and connected ad accounts.\n\n### Key Functional Specifications\n- **Simplified Permissions Format**: Permissions displayed as comma-separated string: "View, Manage members" or "View Only" (no unnecessary badges).\n- **Strict Single Primary Contact**: Exactly 1 Primary Contact per workspace. Selecting a primary contact automatically clears previous primary user.\n- **Permission Configuration**: "View workspace analytics (Default)" is permanently checked and disabled. "Manage members" is an optional checkbox.\n- **Action Button**: Standardized "Edit" button for updating user permissions.`
  }
};

