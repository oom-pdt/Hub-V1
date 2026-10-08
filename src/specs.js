// Screen Specifications by Hannah
// Editable directly for rapid spec updates across all 6 screens

export const screenSpecs = {
  'agency-home': {
    title: '1. Agency Master Hub & Dashboard',
    author: 'Hannah',
    updatedAt: 'Oct 6, 2026',
    notes: `
### Screen Purpose & Objectives
Central command dashboard for agency administrators managing hundreds of client ad accounts and multi-tenant workspaces. Designed for portfolio-level performance monitoring, account triage, and proprietary cross-client benchmarking.

### Key Functional Specifications
- **Workspace Switcher**: Top header switcher provides instant searching and navigation between the agency macro-view and individual client workspaces. 
- **Unified Portfolio KPIs (KPIs TBC)**: Displays aggregate, cross-platform metrics across all active client workspaces (e.g., Total Managed Accounts, Total Ad Spend, Blended CPM, CPC, CPA).
- **Action-Required Alerts**: Dynamically alerts agency admins to unmapped ad accounts, failed syncs, or workspaces lacking ad accounts, providing direct 1-click links to resolve the issues.
- **Client Workspace Directory Table**: A universally searchable and sortable list of all client workspaces. Displays top-level comparative KPIs (Spend, Conversions, CPA) to help admins quickly identify outliers and navigate directly into specific client dashboards.
- **Cross-Client Campaigns**: I included this in the prototype - but I don't actually think it's needed for v1 since pulling KPIs for campaigns across all users might be too heavy. The Workspace Directory table above should suffice for cross-client comparison without campaign-level granularity.
`
  },

  'agency-internal-org': {
    title: '2. Agency Team Members & Custom Roles',
    author: 'Hannah',
    updatedAt: 'Oct 6, 2026',
    notes: `
### Screen Purpose & Objectives
Centralized administration hub for agency access control. Enables authorized administrators to configure custom roles, invite new team members, and strictly govern which client workspaces each team member can view and manage.

### Key Functional Specifications
- **Role Builder & Permission Matrix**: Interface to create, edit, and delete custom agency roles. Includes a granular permission selection (e.g., view dashboards, manage other users' permissions, manage integrations in v2) tied to each role.
- **User Invitation Workflow**: Streamlined invite module where authorized admins input an email address and assign an initial role to onboard new agency staff.
- **Agency User Directory**: A management table listing all active and pending agency users, displaying their current role and account status. 
- **Workspace Assignment Controls**: Within the user directory, admins can modify an existing user's role and explicitly assign or revoke access to specific client workspaces, dictating exactly which clients populate in that user's Workspace Switcher.
`
  },

  'agency-adaccounts': {
    title: '3. Ad Account Discovery & Workspace Linking',
    author: 'Hannah',
    updatedAt: 'Oct 6, 2026',
    notes: `
### Screen Purpose & Objectives
Administrative mapping interface designed to bridge external ad platforms with internal client profiles. Enables agency admins to efficiently triage unlinked assets and manage the connective tissue between master ad accounts and client workspaces.

### Key Functional Specifications
- **Orphaned Workspaces**: A dedicated list of client workspaces that currently have zero connected ad accounts. Features an inline search-and-select tool allowing admins to query available ad accounts by name or ID and attach them directly within the row.
- **Unconnected Ad Account Queue**: A queue displaying active Meta and Google ad accounts pulled from the master agency connections that are not yet assigned to any client profile. Includes an inline search tool to find and assign the correct target workspace directly from the list.
- **Active Connections Directory**: A live inventory of successfully mapped setups. Displays any workspace that has at least one active ad account linked (Google, Meta, or both), allowing admins to verify active syncs, review existing pairings, and identify workspaces that may be missing a secondary platform connection.
`
  },

  'agency-orgs': {
    title: '4. Client Workspaces Directory & Creation',
    author: 'Hannah',
    updatedAt: 'Oct 6, 2026',
    notes: `
### Screen Purpose & Objectives
Directory for creating and locating client environments, separating configuration workflows from the Agency Home analytics dashboard.

**Key Functional Specifications**
- **Workspace Creation**: Requires a "Workspace Name" input. Routes users directly to the specific workspace settings screen upon creation.
- **Workspace Directory List**: Table listing all created workspaces.
- **Management Routing**: Includes a "Manage Workspace" action in each row linking to the corresponding workspace settings screen.
`
  },

  'client-home': {
    title: '1. Workspace Home & Analytics',
    author: 'Hannah',
    updatedAt: 'Oct 7, 2026',
    notes: `### Screen Purpose & Objectives
Client-facing workspace home providing a simplified, unified overview of Meta and Google Ads performance. Designed to deliver high-value insights that eliminate the client's need to access native ad platforms, while also serving as an inspection view for agency administrators.

### Key Functional Specifications (All metrics TBC)
- **Top-Level KPI Cards**: Displays critical, aggregate metrics spanning all campaigns and ad platforms. Exact values (e.g., Total Spend, CPA, Conversions) are placeholders pending final feedback from performance marketing and account management teams.
- **Global Event-Based Date Filter**: Universally filters all dashboard data by the exact date the action (e.g., click, conversion) occurred within the selected timeframe, independent of events higher up in the funnel.
- **Hierarchical Campaign Breakdown Table**: A mandatory data table enabling users to drill down through performance tiers (Platform -> Campaign -> Ad Group -> Ad) to compare key statistics. Includes capabilities to filter by specific data views.
- **Table Filters**: Allows filtering the table by specific campaigns, ad groups, or ads simultaneously. Includes real-time keyword search, type tabs (\`All\`, \`Campaigns\`, \`Ad Groups\`, \`Ads\`).
- **Graphic Visualizations (Provisional)**: Proposed visual components currently include a Daily Performance Graph (Spend/Clicks/Conversions) and an Optimization Heatmap (Hour of Day x Day of Week). These specific formats are conceptual placeholders; the final visuals will be dictated by account management feedback to ensure only high-impact, highly relevant data is presented. Low-interest charts will be removed or replaced.`
  },

  'client-profile': {
    title: '2. Workspace Settings & Permissions',
    author: 'Hannah',
    updatedAt: 'Oct 6, 2026',
    notes: `
### Screen Purpose & Objectives
Configuration screen for individual workspaces. UI components adjust visibility and editability based on viewer role (Client vs. Agency) and assigned permissions.

**Key Functional Specifications**
- **Client Member Management**: Invites client-side members and toggles permissions between "View Dashboard" and "Manage Members". 
  - *Visibility/Editability:* Visible and editable by authorized Client users and authorized Agency users.
- **Agency Access Governance**: Assigns or revokes specific agency staff access to the workspace. Agency Admins inherit global access and populate in this list by default.
  - *Visibility/Editability:* Hidden from Client users. Visible and editable by authorized Agency users.
- **Ad Platform Linking**: Inputs Google/Meta Account IDs to link or unlink ad platforms to the workspace.
  - *Visibility/Editability:* Visible to all users. Editable by Agency users with specific linking permissions. Read-only for Client users and unauthorized Agency users.
`
  }
};
