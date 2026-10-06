import {
  state, availableRoleColors, roleColorsMap, statusColorsMap,
  agencyRoles, permsGroups, agencyMembers, masterWorkspacesData,
  clientUsers, agencyPerformanceData, liveMappedAccounts, validUnmappedAccounts
} from './data.js';

let selectedRoleColor = availableRoleColors[0];
let editingClientUserId = null;
let pendingAgencyAssignments = [];

// Initialize data structures
const performanceData = { mta: { platforms: [], campaigns: [], adGroups: [], ads: [] } };
const rawAds = Array.from({length: 12}, (_, i) => ({
  id: `a${i+1}`, adGroupId: `ag${(i%4)+1}`, 
  name: `Ad Creative Q${(i%4)+1} - Variant ${i}`, 
  spendValue: 500 + (i*120), impressions: 10000 + (i*5000), 
  clicks: 500 + (i*200), conversions: 10 + i*5, 
  format: ['Text/Search', 'Image', 'Video', 'Carousel'][i%4], 
  status: i % 5 === 0 ? 'Paused' : (i % 7 === 0 ? 'Attention Required' : 'Active')
}));

const rawAdGroups = [
  { id: 'ag1', campaignId: 'c1', name: 'Search - Brand Exact', status: 'Active' },
  { id: 'ag2', campaignId: 'c1', name: 'Search - Non-Brand Broad', status: 'Active' },
  { id: 'ag3', campaignId: 'c2', name: 'Retargeting - 30D Visitors', status: 'Attention Required' },
  { id: 'ag4', campaignId: 'c3', name: 'Display - Cart Abandoners', status: 'Active' }
];

const rawCampaigns = [
  { id: 'c1', platformId: 'p1', name: 'Search Campaign', status: 'Active' },
  { id: 'c2', platformId: 'p2', name: 'Paid Social Campaign', status: 'Attention Required' },
  { id: 'c3', platformId: 'p1', name: 'Display Remarketing', status: 'Active' }
];

const rawPlatforms = [{ id: 'p1', name: 'Google', status: 'Active' }, { id: 'p2', name: 'Meta', status: 'Active' }];

const workspaceMetricSeed = [
  [18200, 12640, 382000, 218, 'google,meta'], [12400, 9140, 291000, 184, 'google,meta'], [8000, 6020, 208000, 136, 'google'], [6500, 4880, 165000, 108, 'meta'],
  [9200, 7040, 231000, 149, 'google,meta'], [14100, 10860, 344000, 206, 'google,meta'], [22000, 15120, 468000, 294, 'google,meta'], [5400, 3910, 127000, 76, 'meta'],
  [11300, 8230, 276000, 171, 'google'], [7800, 5650, 190000, 121, 'google,meta']
];

masterWorkspacesData.forEach((ws, i) => { 
  const m = workspaceMetricSeed[i % workspaceMetricSeed.length]; 
  ws.platforms = m[4]; 
  ws.spendValue = m[0]; 
  ws.clicks = m[1]; 
  ws.impressions = m[2]; 
  ws.conversions = m[3]; 
  ws.cplValue = m[0] / m[3]; 
  ws.cpm = m[2] ? (m[0] / m[2]) * 1000 : 0;
  ws.cpc = m[1] ? m[0] / m[1] : 0;
  ws.spend = `$${m[0].toLocaleString()}`; 
});

rawAds.forEach(ad => {
  const ag = rawAdGroups.find(x => x.id === ad.adGroupId);
  const camp = rawCampaigns.find(x => x.id === ag?.campaignId);
  const plat = rawPlatforms.find(x => x.id === camp?.platformId);
  ad.adGroupName = ag?.name || '';
  ad.campaignId = camp?.id || '';
  ad.campaignName = camp?.name || '';
  ad.platformId = plat?.id || '';
  ad.platformName = plat?.name || '';
  ad.platform = plat?.name || '';
  performanceData.mta.ads.push(ad);
});

[
  { target: performanceData.mta.adGroups, source: rawAdGroups, childList: performanceData.mta.ads, childKey: 'adGroupId', parentId: 'campaignId' },
  { target: performanceData.mta.campaigns, source: rawCampaigns, childList: performanceData.mta.adGroups, childKey: 'campaignId', parentId: 'platformId' },
  { target: performanceData.mta.platforms, source: rawPlatforms, childList: performanceData.mta.campaigns, childKey: 'platformId', parentId: null }
].forEach(level => {
  level.source.forEach(item => {
    const children = level.childList.filter(c => c[level.childKey] === item.id);
    const obj = { ...item, spendValue: 0, impressions: 0, clicks: 0, conversions: 0, childCount: children.length, formats: new Set() };
    if (item.format) obj.formats.add(item.format);
    children.forEach(c => {
      obj.spendValue += c.spendValue; 
      obj.impressions += c.impressions; 
      obj.clicks += c.clicks; 
      obj.conversions += c.conversions;
      if (c.formats) c.formats.forEach(f => obj.formats.add(f));
      if (c.format) obj.formats.add(c.format);
    });
    obj.formats = Array.from(obj.formats).sort();
    if (children.length > 0) {
      obj.platform = children[0].platform || obj.name;
      obj.platformName = children[0].platformName || obj.name;
      if (level.target === performanceData.mta.adGroups) obj.campaignName = children[0].campaignName;
    }
    level.target.push(obj);
  });
});

['platforms', 'campaigns', 'adGroups', 'ads'].forEach(key => {
  performanceData.mta[key].forEach(item => {
    item.ctr = item.impressions ? (item.clicks / item.impressions) * 100 : 0;
    item.cpc = item.clicks ? item.spendValue / item.clicks : 0;
    item.costPerConversion = item.conversions ? item.spendValue / item.conversions : 0;
    item.cpm = item.impressions ? (item.spendValue / item.impressions) * 1000 : 0;
    item.spend = `$${item.spendValue.toLocaleString()}`;
  });
});

const clientDailyChartData = Array.from({length: 30}, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  const base = Math.sin(i) * 30;
  return {
    date: d.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' }),
    spend: 400 + base + (Math.random()*20),
    clicks: 320 + (base*0.8) + (Math.random()*10),
    conversions: 12 + (base*0.05) + (Math.random()*2)
  };
});

const clientHeatmapBase = Array.from({length: 7}, () => 
  Array.from({length: 24}, (_, h) => {
    const peak = (h >= 9 && h <= 17) ? 20 : 0;
    return 30 + peak + (Math.random()*15);
  })
);

function getRoleColor(roleName) {
  return roleColorsMap[roleName] || 'bg-slate-200/60 text-slate-700'; 
}

function renderColorSelector(disabled = false) {
  const container = document.getElementById('role-color-selector');
  if (!container) return;
  container.innerHTML = availableRoleColors.map(colorClass => {
    const isSelected = selectedRoleColor === colorClass;
    const ringClasses = isSelected ? 'ring-2 ring-offset-2 ring-brand-500 scale-110 shadow-md' : 'opacity-70 ' + (disabled ? '' : 'hover:opacity-100 hover:scale-105');
    const cursor = disabled ? 'cursor-not-allowed' : 'cursor-pointer';
    const onClick = disabled ? '' : `onclick="selectRoleColor('${colorClass}')"`;
    return `
    <div ${onClick} class="${colorClass} w-9 h-9 rounded-full ${cursor} transition-all flex items-center justify-center shadow-sm ${ringClasses}">
        <span class="text-[13px] font-bold">Aa</span>
    </div>`;
  }).join('');
}

function selectRoleColor(colorClass) {
  selectedRoleColor = colorClass;
  renderColorSelector();
  markRoleModalModified();
}

function markRoleModalModified() {
  if (state.editingRoleIdx !== null && agencyRoles[state.editingRoleIdx].isLocked) return;
  const btn = document.getElementById('btn-save-role');
  if (btn) btn.classList.add('has-input');
}

function platformLogo(platform, size='sm', removeMargin=false) {
  const normalized = String(platform || '').toLowerCase();
  const isMeta = normalized.includes('meta');
  const px = size === 'lg' ? 24 : 16;
  const src = isMeta
    ? 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Meta_Platforms_logo.svg'
    : 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Google_Ads_icon.svg';
  const alt = isMeta ? 'Meta' : 'Google';
  const styleAttr = removeMargin ? ' style="margin-right: 0;"' : '';
  return `<img class="brand-platform-logo${size === 'lg' ? ' brand-platform-logo-lg' : ' brand-platform-logo-sm'}" src="${src}" width="${px}" height="${px}" alt="${alt}" loading="lazy"${styleAttr}>`;
}

function parseCurrency(value) {
  return Number(String(value || '0').replace(/[^0-9.-]/g, '')) || 0;
}

function metricHeatStyle(value, values, metric){
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return '';
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const ratio = max === min ? 0.5 : (Number(value) - min) / (max - min);
  const n = Math.max(0, Math.min(1, metric === 'ctr' ? ratio : 1 - ratio));
  const hue = 10 + (n * 90); 
  return `background:hsl(${hue}, 60%, 80%);`;
}

function showNotification(message, icon = '✨') {
  const toast = document.getElementById('canvas-toast');
  const msgElem = document.getElementById('toast-message');
  const iconElem = document.getElementById('toast-icon');
  if (!toast || !msgElem) return;
  msgElem.innerText = message;
  if (iconElem) iconElem.innerText = icon;
  toast.style.display = 'flex';
  setTimeout(() => { toast.style.display = 'none'; }, 3200);
}

function openCreateOrgModal() {
  const modal = document.getElementById('create-workspace-modal');
  const input = document.getElementById('new-workspace-name-input');
  const btn = document.getElementById('btn-create-workspace');
  if (!modal) return;
  if (input) input.value = '';
  if (btn) btn.classList.remove('has-input');
  modal.style.display = 'flex';
  setTimeout(() => input?.focus(), 50);
  window.lucide?.createIcons();
}

function closeCreateOrgModal() {
  const modal = document.getElementById('create-workspace-modal');
  if (modal) modal.style.display = 'none';
}

function markCreateOrgModalModified() {
  const input = document.getElementById('new-workspace-name-input');
  const btn = document.getElementById('btn-create-workspace');
  if (btn && input) {
    btn.classList.toggle('has-input', input.value.trim().length > 0);
  }
}

function createWorkspaceSubmit() {
  const input = document.getElementById('new-workspace-name-input');
  const name = input?.value.trim();
  if (!name) {
    showNotification('Please enter a workspace name.', '⚠️');
    return;
  }

  // Check if workspace already exists
  const existing = masterWorkspacesData.find(w => w.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    showNotification(`Workspace "${name}" already exists. Navigating to settings.`, 'ℹ️');
    closeCreateOrgModal();
    inspectClientWorkspace(existing.name, 'client-profile');
    return;
  }

  // Add new workspace to dataset
  const newWorkspace = {
    name: name,
    contact: 'Unassigned',
    accountManagers: ['Jungkook Jeon'],
    platforms: '',
    spendValue: 0,
    clicks: 0,
    impressions: 0,
    conversions: 0,
    cplValue: 0,
    cpm: 0,
    cpc: 0,
    spend: '$0'
  };

  masterWorkspacesData.unshift(newWorkspace);

  // Update tables, datalists and switchers
  renderWorkspaceTable();
  renderWorkspaceDatalist();
  renderSwitcherList();
  renderUnlinkedWorkspaces();

  closeCreateOrgModal();

  // Navigate directly to the newly created workspace's settings page
  inspectClientWorkspace(name, 'client-profile');
  showNotification(`Workspace "${name}" created!`, '🎉');
}

function switchAgencyTab(tab) {
  const btnMembers = document.getElementById('tab-btn-members');
  const btnRoles = document.getElementById('tab-btn-roles');
  if (btnMembers && btnRoles) {
    btnMembers.classList.toggle('active', tab === 'members');
    btnRoles.classList.toggle('active', tab === 'roles');
  }
  document.getElementById('tab-content-members').style.display = tab === 'members' ? 'block' : 'none';
  document.getElementById('tab-content-roles').style.display = tab === 'roles' ? 'block' : 'none';
  setTimeout(() => { window.lucide?.createIcons(); }, 10);
}

function renderAgencyMembers() {
  const tbody = document.getElementById('agency-team-tbody');
  const searchInput = document.getElementById('agency-user-search')?.value.toLowerCase() || '';
  const roleFilter = document.getElementById('agency-role-filter')?.value || 'all';
  if (!tbody) return;

  const filtered = agencyMembers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchInput) || m.email.toLowerCase().includes(searchInput);
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const tableCount = document.getElementById('total-users-table-count');
  if (tableCount) tableCount.innerText = filtered.length;

  const roleCounts = {};
  agencyRoles.forEach(r => roleCounts[r.name] = 0);
  agencyMembers.forEach(m => { 
    if (roleCounts[m.role] !== undefined) roleCounts[m.role]++; 
    else roleCounts[m.role] = 1; 
  });
  
  const pillContainer = document.getElementById('roles-pill-container');
  if (pillContainer) {
    const MAX_ROLES_TO_SHOW = 12;
    const rolesToShow = agencyRoles.slice(0, MAX_ROLES_TO_SHOW);
    const hiddenRolesCount = agencyRoles.length - MAX_ROLES_TO_SHOW;

    let rolesHtml = rolesToShow.map(r => {
      return `
      <span class="inline-flex items-center justify-center rounded-full ${getRoleColor(r.name)} px-3 py-1.5 text-[12px] font-semibold shadow-sm">
          ${r.name} <span class="ml-2 opacity-70">${roleCounts[r.name]}</span>
      </span>`;
    }).join('');

    if (hiddenRolesCount > 0) {
      rolesHtml += `
      <span class="inline-flex items-center justify-center rounded-full bg-slate-200/60 px-3 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm">
          +${hiddenRolesCount} more
      </span>`;
    }
    pillContainer.innerHTML = rolesHtml;
  }

  const roleSelect = document.getElementById('agency-role-filter');
  const inviteSelect = document.getElementById('quick-invite-role');
  
  if (roleSelect && roleSelect.options.length <= 1) { 
    roleSelect.innerHTML = `<option value="all">Filter by Role: All</option>` + 
      agencyRoles.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
  }
  if (inviteSelect) {
    inviteSelect.innerHTML = agencyRoles.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-12 text-center text-[13px] text-slate-500 border-b-0">No users found matching your filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(m => {
    let workspacesHtml = '';
    if (m.workspaces.length > 0) {
      const visible = m.workspaces.slice(0, 2).join(', ');
      const hiddenCount = m.workspaces.length > 2 ? `<span class="text-slate-400 font-semibold ml-1">+${m.workspaces.length - 2} more</span>` : '';
      workspacesHtml = `${visible}${hiddenCount}`;
    } else {
      workspacesHtml = `<span class="text-slate-400 italic">Unassigned</span>`;
    }
    
    return `
    <tr>
        <td style="padding-left: 24px;">
            <div class="flex min-w-0 items-center gap-3.5">
                <div class="grid h-10 w-10 flex-none place-items-center rounded-full bg-white/60 text-[13px] font-bold text-brand-600 shadow-sm border border-white/40">
                    ${m.initials}
                </div>
                <div class="min-w-0">
                    <div class="truncate text-[14px] font-semibold text-slate-900">${m.name}</div>
                    <div class="truncate text-[13px] text-slate-500">${m.email}</div>
                </div>
            </div>
        </td>
        <td><div class="truncate text-[13px] text-slate-600 font-medium max-w-[260px]">${workspacesHtml}</div></td>
        <td><span class="inline-flex max-w-full truncate rounded-full px-3 py-1 text-[12px] font-semibold ${getRoleColor(m.role)} shadow-sm">${m.role}</span></td>
        <td>
            <div class="flex items-center gap-2 text-[13px] font-medium capitalize text-slate-700">
                <span class="h-2 w-2 rounded-full ${statusColorsMap[m.status]} shadow-sm"></span>
                ${m.status}
            </div>
        </td>
        <td style="text-align: right; padding-right: 24px;">
            <button class="btn-integ" style="padding: 6px 16px; font-size: 12px;" onclick="openManageUserModal(${m.id})">Manage Access</button>
        </td>
    </tr>`;
  }).join('');
}

function sendQuickInvite() {
  const email = document.getElementById('quick-invite-email')?.value.trim();
  const role = document.getElementById('quick-invite-role')?.value;
  if (!email) { showNotification('Please enter an email address.', '⚠️'); return; }
  
  agencyMembers.unshift({
    id: Date.now(),
    name: 'Pending User',
    email: email,
    initials: email.substring(0,2).toUpperCase(),
    role: role,
    workspaces: [],
    status: 'Invited'
  });
  
  document.getElementById('quick-invite-email').value = '';
  document.getElementById('quick-invite-btn').classList.remove('has-input');
  renderAgencyMembers();
  showNotification(`Invitation sent to ${email}`, '✉️');
}

function renderRolesList() {
  const tbody = document.getElementById('agency-roles-tbody');
  if (!tbody) return;

  const roleCounts = {};
  agencyRoles.forEach(r => roleCounts[r.name] = 0);
  agencyMembers.forEach(m => { if (roleCounts[m.role] !== undefined) roleCounts[m.role]++; });

  const permLabelMap = {};
  permsGroups.forEach(g => g.keys.forEach(k => permLabelMap[k.id] = k.label));

  tbody.innerHTML = agencyRoles.map((r, idx) => {
    const count = roleCounts[r.name];
    const activePerms = r.perms.filter(pId => pId !== 'perm-ws-view');
    const permStrings = activePerms.map(pId => permLabelMap[pId]).join(', ');
    const displayPerms = permStrings ? permStrings : '<span class="text-slate-400 italic">View only</span>';
    const actionsHtml = r.isLocked 
      ? `<button class="btn-integ" style="padding: 6px 12px; font-size: 12px; opacity: 0.8;" onclick="openEditRoleModal(${idx})">View</button>` 
      : `<button class="btn-integ" style="padding: 6px 12px; font-size: 12px;" onclick="openEditRoleModal(${idx})">Edit</button>`;

    return `
    <tr>
        <td style="padding-left: 24px;">
            <span class="inline-flex max-w-full truncate rounded-full px-3 py-1 text-[12px] font-semibold ${getRoleColor(r.name)} shadow-sm">
                ${r.name}
            </span>
        </td>
        <td><div class="text-[13px] text-slate-600 leading-relaxed font-medium">${displayPerms}</div></td>
        <td><span class="text-[13px] font-semibold text-slate-700">${count}</span> <span class="text-[12px] text-slate-500">users</span></td>
        <td style="text-align: right; padding-right: 24px;">${actionsHtml}</td>
    </tr>`;
  }).join('');
}

function openCreateRoleModal() {
  state.editingRoleIdx = null;
  const modal = document.getElementById('role-modal');
  if (modal) {
    document.getElementById('role-modal-title').innerText = 'Create Custom Role';
    document.getElementById('role-modal-subtitle').innerText = 'Define granular access for specific agency members.';
    document.getElementById('role-name-input').value = '';
    document.getElementById('role-name-input').disabled = false;
    document.getElementById('btn-delete-role').style.display = 'none';
    document.getElementById('role-save-note').style.display = 'inline-block';
    document.getElementById('btn-save-role').innerText = 'Create Role';
    document.getElementById('btn-save-role').classList.remove('has-input');

    ['perm-ws-create', 'perm-ws-client', 'perm-ws-agency', 'perm-ad-map', 'perm-team-invite', 'perm-team-role'].forEach(id => {
      const cb = document.getElementById(id);
      if (cb) { cb.checked = false; cb.disabled = false; cb.parentElement.classList.remove('disabled-cb'); }
    });

    selectedRoleColor = availableRoleColors[0];
    renderColorSelector(false);
    modal.style.display = 'flex';
  }
}

function openEditRoleModal(idx) {
  state.editingRoleIdx = idx;
  const role = agencyRoles[idx];
  const modal = document.getElementById('role-modal');
  
  if (modal) {
    document.getElementById('role-modal-title').innerText = role.isLocked ? 'View Role' : 'Edit Custom Role';
    document.getElementById('role-modal-subtitle').innerText = role.isLocked ? 'This is a system role and cannot be modified.' : 'Update access permissions for this role.';
    document.getElementById('role-name-input').value = role.name;
    document.getElementById('role-name-input').disabled = role.isLocked;
    document.getElementById('btn-delete-role').style.display = role.isLocked ? 'none' : 'inline-flex';
    document.getElementById('role-save-note').style.display = 'none';
    document.getElementById('btn-save-role').innerText = role.isLocked ? 'Close' : 'Save Changes';
    document.getElementById('btn-save-role').classList.remove('has-input');
    
    ['perm-ws-create', 'perm-ws-client', 'perm-ws-agency', 'perm-ad-map', 'perm-team-invite', 'perm-team-role'].forEach(id => {
      const cb = document.getElementById(id);
      if (cb) { 
        cb.checked = role.perms.includes(id); 
        cb.disabled = role.isLocked; 
        if (role.isLocked) cb.parentElement.classList.add('disabled-cb');
        else cb.parentElement.classList.remove('disabled-cb');
      }
    });

    selectedRoleColor = roleColorsMap[role.name] || availableRoleColors[0];
    renderColorSelector(role.isLocked);
    modal.style.display = 'flex';
  }
}

function saveRole() {
  if (state.editingRoleIdx !== null && agencyRoles[state.editingRoleIdx].isLocked) {
    closeRoleModal();
    return;
  }

  const name = document.getElementById('role-name-input')?.value.trim();
  if (!name) { showNotification('Please provide a name for the custom role.', '⚠️'); return; }

  const selectedPerms = ['perm-ws-view'];
  ['perm-ws-create', 'perm-ws-client', 'perm-ws-agency', 'perm-ad-map', 'perm-team-invite', 'perm-team-role'].forEach(id => {
    if (document.getElementById(id)?.checked) selectedPerms.push(id);
  });

  if (state.editingRoleIdx !== null) {
    const oldName = agencyRoles[state.editingRoleIdx].name;
    agencyRoles[state.editingRoleIdx].name = name;
    agencyRoles[state.editingRoleIdx].perms = selectedPerms;
    if (oldName !== name) {
      agencyMembers.forEach(m => { if (m.role === oldName) m.role = name; });
      delete roleColorsMap[oldName];
    }
    roleColorsMap[name] = selectedRoleColor;
    showNotification(`Role '${name}' updated successfully!`, '✅');
  } else {
    roleColorsMap[name] = selectedRoleColor;
    agencyRoles.push({ name: name, isLocked: false, perms: selectedPerms });
    showNotification(`Custom role '${name}' created!`, '✅');
  }

  const roleSelect = document.getElementById('agency-role-filter');
  if (roleSelect) roleSelect.innerHTML = ''; 
  renderRolesList();
  renderAgencyMembers();
  closeRoleModal();
  switchAgencyTab('roles');
}

function closeRoleModal() {
  document.getElementById('role-modal').style.display = 'none';
}

function deleteCurrentRole() {
  if (state.editingRoleIdx !== null && !agencyRoles[state.editingRoleIdx].isLocked) {
    const roleName = agencyRoles[state.editingRoleIdx].name;
    if (confirm(`Are you sure you want to delete '${roleName}'? Users with this role will be downgraded to Viewer.`)) {
      agencyMembers.forEach(m => { if (m.role === roleName) m.role = 'Viewer'; });
      agencyRoles.splice(state.editingRoleIdx, 1);
      const roleSelect = document.getElementById('agency-role-filter');
      if (roleSelect) roleSelect.innerHTML = '';
      renderRolesList();
      renderAgencyMembers();
      showNotification('Role deleted successfully.', '🗑️');
      closeRoleModal();
    }
  }
}

function openManageUserModal(userId) {
  const user = agencyMembers.find(m => m.id === userId);
  if (!user) return;
  state.currentlyManagingUserId = userId;

  document.getElementById('manage-user-avatar').innerText = user.initials;
  document.getElementById('manage-user-name').innerText = user.name;
  document.getElementById('manage-user-email').innerText = user.email;

  const roleSelect = document.getElementById('manage-user-role');
  roleSelect.innerHTML = agencyRoles.map(r => `<option value="${r.name}" ${r.name === user.role ? 'selected' : ''}>${r.name}</option>`).join('');

  document.getElementById('manage-user-ws-search').value = '';
  renderManageUserWorkspaces();

  const saveBtn = document.getElementById('btn-save-user-management');
  if (saveBtn) saveBtn.classList.remove('has-input');

  document.getElementById('user-management-modal').style.display = 'flex';
  window.lucide?.createIcons();
}

function closeManageUserModal() {
  document.getElementById('user-management-modal').style.display = 'none';
  state.currentlyManagingUserId = null;
}

function renderManageUserWorkspaces() {
  const user = agencyMembers.find(m => m.id === state.currentlyManagingUserId);
  if (!user) return;
  const listEl = document.getElementById('manage-user-ws-list');
  let html = '';
  let selectedCount = 0;

  masterWorkspacesData.forEach((ws) => {
    const isSelected = user.workspaces.includes(ws.name);
    if (isSelected) selectedCount++;
    html += `
    <label class="custom-checkbox-wrap ws-item-label" style="padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; transition: background 0.15s ease;" onmouseenter="this.style.background='rgba(15,23,42,0.03)'" onmouseleave="this.style.background='transparent'">
        <input type="checkbox" value="${ws.name}" class="manage-user-ws-cb" ${isSelected ? 'checked' : ''} onchange="updateManageUserWsCount()">
        <div class="custom-checkbox-box"><i data-lucide="check" stroke-width="3"></i></div>
        <span style="font-weight: 600; color: var(--text-dark); flex: 1;">${ws.name}</span>
    </label>`;
  });
  listEl.innerHTML = html;
  document.getElementById('manage-user-ws-count').innerText = `${selectedCount} Selected`;
}

function filterManageUserWorkspaces() {
  const query = (document.getElementById('manage-user-ws-search').value || '').toLowerCase();
  const labels = document.querySelectorAll('.ws-item-label');
  labels.forEach(lbl => {
    const wsName = lbl.querySelector('input').value.toLowerCase();
    lbl.style.display = wsName.includes(query) ? 'flex' : 'none';
  });
}

function updateManageUserWsCount() {
  const cbs = document.querySelectorAll('.manage-user-ws-cb:checked');
  document.getElementById('manage-user-ws-count').innerText = `${cbs.length} Selected`;
  markUserManagementModified();
}

function markUserManagementModified() {
  const btn = document.getElementById('btn-save-user-management');
  if (btn) btn.classList.add('has-input');
}

function saveUserManagement() {
  const user = agencyMembers.find(m => m.id === state.currentlyManagingUserId);
  if (!user) return;
  user.role = document.getElementById('manage-user-role').value;
  user.workspaces = Array.from(document.querySelectorAll('.manage-user-ws-cb:checked')).map(cb => cb.value);

  closeManageUserModal();
  renderAgencyMembers();
  renderRolesList();
  showNotification(`Updated access for ${user.name}`, '✅');
}

function renderPermissionPill(permission) {
  if (permission === 'View') {
    return `<span class="inline-flex items-center rounded-full bg-slate-200/60 px-2.5 py-1 text-[12px] font-semibold text-slate-700">View</span>`;
  }
  if (permission === 'Manage Members') {
    return `<span class="inline-flex items-center rounded-full bg-brand-500/10 px-2.5 py-1 text-[12px] font-semibold text-brand-600">Manage Members</span>`;
  }
  return `<span class="inline-flex items-center rounded-full bg-slate-200/60 px-2.5 py-1 text-[12px] font-semibold text-slate-700">${permission}</span>`;
}

let modalPrimaryContactState = false;

function updateModalPrimaryButtonUI() {
  const btn = document.getElementById('btn-toggle-primary');
  const badge = document.getElementById('primary-contact-status-badge');
  const hint = document.getElementById('primary-contact-hint');
  if (!btn) return;

  const otherPrimary = clientUsers.find(u => u.isPrimary && u.id !== editingClientUserId);

  if (modalPrimaryContactState) {
    btn.className = 'btn-integ bg-amber-100/90 text-amber-800 hover:bg-amber-200 text-xs px-3.5 py-2 font-semibold transition-all shrink-0 cursor-pointer shadow-none';
    btn.innerText = '★ Designated Primary';
    if (badge) badge.style.display = 'inline-flex';
    if (hint) hint.innerText = 'This user is designated as the sole Primary Contact for this workspace.';
  } else {
    btn.className = 'config-soft-btn text-xs px-3.5 py-2 font-semibold transition-all shrink-0 cursor-pointer';
    btn.innerText = 'Set as Primary';
    if (badge) badge.style.display = 'none';
    if (hint) {
      if (otherPrimary) {
        hint.innerText = `Only 1 primary contact per workspace. Currently: ${otherPrimary.email}. Click button to switch.`;
      } else {
        hint.innerText = 'Only 1 primary contact per workspace. Click button to designate.';
      }
    }
  }
}

function togglePrimaryContactState() {
  modalPrimaryContactState = !modalPrimaryContactState;
  updateModalPrimaryButtonUI();
  markClientUserModalModified();
}

function setPrimaryContactDirectly(userId) {
  const user = clientUsers.find(u => u.id === userId);
  if (!user) return;
  clientUsers.forEach(u => { u.isPrimary = false; });
  user.isPrimary = true;
  const ws = masterWorkspacesData.find(w => w.name === state.currentActiveClient);
  if (ws) ws.contact = user.email;
  renderWorkspaceTable();
  renderClientUsers();
  showNotification(`${user.name || user.email} is now the Primary Contact.`, '★');
}

function renderClientUsers() {
  const tbody = document.getElementById('client-users-tbody');
  if (!tbody) return;
  tbody.innerHTML = clientUsers.map(u => {
    const hasManage = u.canManage || u.role === 'Manage Members';
    const permissionsText = hasManage ? 'View, Manage members' : 'View Only';

    return `
    <tr>
      <td>
        <div class="flex items-center gap-2">
          <strong>${u.name || 'Pending User'}</strong>
          ${u.isPrimary ? '<span class="inline-flex items-center rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">Primary Contact</span>' : ''}
        </div>
      </td>
      <td>${u.email}</td>
      <td><span class="text-[13px] text-slate-700 font-medium">${permissionsText}</span></td>
      <td><span class="slot-pill-check ${u.status === 'Active' ? 'check-active' : 'check-warning'}">${u.status}</span></td>
      <td class="org-action-col">
        <button class="btn-integ px-3 py-1.5 text-xs font-semibold" onclick="openClientUserModal('edit', ${u.id})">Edit</button>
      </td>
    </tr>`;
  }).join('');
}

function openClientUserModal(mode, userId = null) {
  editingClientUserId = userId;
  const modal = document.getElementById('client-user-modal');
  const title = document.getElementById('client-user-modal-title');
  const subtitle = document.getElementById('client-user-modal-subtitle');
  const emailInput = document.getElementById('client-user-email');
  const btnSave = document.getElementById('btn-save-client-user');
  const managePermCb = document.getElementById('client-perm-manage');

  if (!modal) return;
  btnSave.classList.remove('has-input');

  if (mode === 'edit' && userId) {
    const user = clientUsers.find(u => u.id === userId);
    if (!user) return;
    title.innerText = 'Edit Workspace Permissions';
    subtitle.innerText = 'Configure permissions and contact status for this workspace.';
    emailInput.value = user.email;
    emailInput.disabled = true;
    emailInput.classList.add('opacity-60', 'cursor-not-allowed');
    if (managePermCb) managePermCb.checked = !!(user.canManage || user.role === 'Manage Members');
    modalPrimaryContactState = !!user.isPrimary;
    updateModalPrimaryButtonUI();
    btnSave.innerText = 'Save Changes';
  } else {
    title.innerText = 'Invite Workspace User';
    subtitle.innerText = 'Add a client collaborator to this workspace.';
    emailInput.value = '';
    emailInput.disabled = false;
    emailInput.classList.remove('opacity-60', 'cursor-not-allowed');
    if (managePermCb) managePermCb.checked = false;
    modalPrimaryContactState = false;
    updateModalPrimaryButtonUI();
    btnSave.innerText = 'Send Invite';
  }
  modal.style.display = 'flex';
  window.lucide?.createIcons();
}

function closeClientUserModal() {
  document.getElementById('client-user-modal').style.display = 'none';
  editingClientUserId = null;
}

function markClientUserModalModified() {
  document.getElementById('btn-save-client-user').classList.add('has-input');
}

function saveClientUser() {
  const email = document.getElementById('client-user-email').value.trim();
  const canManage = document.getElementById('client-perm-manage')?.checked || false;
  const isPrimary = modalPrimaryContactState;

  if (!email) {
    showNotification('Please provide a valid email address.', '⚠️');
    return;
  }

  // Enforce strictly only 1 primary contact per workspace
  if (isPrimary) {
    clientUsers.forEach(u => {
      u.isPrimary = false;
    });
    // Sync with master workspaces contact
    const ws = masterWorkspacesData.find(w => w.name === state.currentActiveClient);
    if (ws) ws.contact = email;
    renderWorkspaceTable();
  }

  if (editingClientUserId) {
    const user = clientUsers.find(u => u.id === editingClientUserId);
    if (user) {
      user.canManage = canManage;
      user.role = canManage ? 'Manage Members' : 'View Only';
      user.isPrimary = isPrimary;
      showNotification('Permissions updated successfully.', '✅');
    }
  } else {
    clientUsers.push({
      id: Date.now(),
      name: '',
      email: email,
      canManage: canManage,
      role: canManage ? 'Manage Members' : 'View Only',
      status: 'Invited',
      isPrimary: isPrimary
    });
    showNotification('Invite sent successfully.', '✉️');
  }

  renderClientUsers();
  closeClientUserModal();
}

function populateFilterCampaigns() {
  const list = document.getElementById('filter-campaign-checklist');
  if (!list) return;
  list.innerHTML = performanceData.mta.campaigns.map(c => `
    <label class="filter-campaign-item">
        <input type="checkbox" value="${c.id}" onchange="toggleAdvancedFilterItem('campaign', '${c.id}', this)" ${state.activeAdvFilters.campaigns.has(c.id) ? 'checked' : ''}>
        <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</span>
    </label>
  `).join('');
}

function toggleAdvancedFilterPanel() {
  const panel = document.getElementById('advanced-filter-panel');
  if (!panel) return;
  if (panel.style.display === 'none' || !panel.style.display) {
    populateFilterCampaigns();
    panel.style.display = 'block';
  } else {
    panel.style.display = 'none';
  }
}

function toggleAdvancedFilterItem(category, value, elem) {
  let targetSet;
  if (category === 'platform') targetSet = state.activeAdvFilters.platforms;
  if (category === 'status') targetSet = state.activeAdvFilters.statuses;
  if (category === 'format') targetSet = state.activeAdvFilters.formats;
  if (category === 'campaign') targetSet = state.activeAdvFilters.campaigns;

  if (category === 'campaign') {
    if (elem.checked) targetSet.add(value);
    else targetSet.delete(value);
  } else {
    if (targetSet.has(value)) {
      targetSet.delete(value);
      elem.classList.remove('selected');
    } else {
      targetSet.add(value);
      elem.classList.add('selected');
    }
  }
  filterPerformanceTable();
}

function clearAllAdvancedFilters() {
  state.activeAdvFilters.platforms.clear();
  state.activeAdvFilters.statuses.clear();
  state.activeAdvFilters.formats.clear();
  state.activeAdvFilters.campaigns.clear();
  document.querySelectorAll('.filter-select-pill').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.filter-campaign-item input').forEach(el => el.checked = false);
  filterPerformanceTable();
}

function sortHeader(label, key, sortState, handler, extraClass='') {
  const active = sortState.key === key;
  const arrow = active ? (sortState.direction === 'asc' ? '↑' : '↓') : '↕';
  return `<th class="sortable-th ${active ? 'sort-active ' : ''}${extraClass}" onclick="${handler}('${key}')">${label}<span class="sort-indicator">${arrow}</span></th>`;
}

function toggleTableSort(table, key) {
  if (table.key === key) table.direction = table.direction === 'asc' ? 'desc' : 'asc';
  else { table.key = key; table.direction = 'asc'; }
}

function setClientTableSort(key) {
  toggleTableSort(state.clientTableSort, key);
  renderPerformanceTable();
}

function setAgencyTableSort(key) {
  toggleTableSort(state.agencyTableSort, key);
  renderAgencyPerformanceTable();
}

function switchPerformanceView(view) {
  state.currentPerformanceView = view;
  ['platform', 'campaign', 'adgroup', 'ad'].forEach(v => {
    document.getElementById(`view-tab-${v}`)?.classList.toggle('active', v === state.currentPerformanceView);
  });
  renderPerformanceTable();
}

function filterPerformanceTable() {
  state.campaignSearchQuery = (document.getElementById('campaign-search-input')?.value || '').toLowerCase().trim();
  renderPerformanceTable();
}

function drillDownPerformance(level, filterId, filterName) {
  state.activePerfFilter = { level, id: filterId, name: filterName };
  const badge = document.getElementById('active-perf-filter-badge');
  const textEl = document.getElementById('active-perf-filter-text');
  
  if (badge && textEl) {
    badge.style.display = 'flex';
    const levelLabel = level === 'platform' ? 'Platform' : level === 'campaign' ? 'Campaign' : 'Ad Group';
    textEl.innerHTML = `Filtered for ${levelLabel}: <strong>${filterName}</strong>`;
  }

  if (level === 'platform') switchPerformanceView('campaign');
  else if (level === 'campaign') switchPerformanceView('adgroup');
  else if (level === 'adgroup') switchPerformanceView('ad');
}

function clearPerformanceFilter() {
  state.activePerfFilter = null;
  const badge = document.getElementById('active-perf-filter-badge');
  if (badge) badge.style.display = 'none';
  switchPerformanceView('platform');
}

function getSortableValue(item, key) {
  if (key === 'name') return String(item.name || '').toLowerCase();
  if (key === 'status') return 'enabled';
  if (key === 'spend' || key === 'spendValue') return Number(item.spendValue || 0);
  if (['impressions', 'clicks', 'conversions', 'ctr', 'cpc', 'costPerConversion', 'cpm'].includes(key)) return Number(item[key] || 0);
  return String(item[key] || '').toLowerCase();
}

function renderPerformanceTable() {
  const thead = document.getElementById('performance-table-head');
  const tbody = document.getElementById('campaign-table-body');
  if (!thead || !tbody) return;
  
  let dataset = [];
  let nextLevel = '';

  if (state.currentPerformanceView === 'platform') { dataset = [...performanceData.mta.platforms]; nextLevel = 'campaign'; }
  else if (state.currentPerformanceView === 'campaign') { dataset = [...performanceData.mta.campaigns]; nextLevel = 'adgroup'; }
  else if (state.currentPerformanceView === 'adgroup') { dataset = [...performanceData.mta.adGroups]; nextLevel = 'ad'; }
  else if (state.currentPerformanceView === 'ad') { dataset = [...performanceData.mta.ads]; nextLevel = null; }

  if (state.activePerfFilter) {
    if (state.activePerfFilter.level === 'platform') dataset = dataset.filter(x => x.platformId === state.activePerfFilter.id || x.id === state.activePerfFilter.id);
    else if (state.activePerfFilter.level === 'campaign') dataset = dataset.filter(x => x.campaignId === state.activePerfFilter.id || x.id === state.activePerfFilter.id);
    else if (state.activePerfFilter.level === 'adgroup') dataset = dataset.filter(x => x.adGroupId === state.activePerfFilter.id || x.id === state.activePerfFilter.id);
  }

  if (state.activeAdvFilters.platforms.size > 0) dataset = dataset.filter(x => state.activeAdvFilters.platforms.has(x.platformName || x.name));
  if (state.activeAdvFilters.statuses.size > 0) dataset = dataset.filter(x => state.activeAdvFilters.statuses.has(x.status));
  if (state.activeAdvFilters.formats.size > 0) {
    dataset = dataset.filter(x => x.formats ? x.formats.some(f => state.activeAdvFilters.formats.has(f)) : state.activeAdvFilters.formats.has(x.format));
  }
  if (state.activeAdvFilters.campaigns.size > 0) {
    dataset = dataset.filter(x => state.currentPerformanceView === 'campaign' ? state.activeAdvFilters.campaigns.has(x.id) : (state.currentPerformanceView === 'platform' ? true : state.activeAdvFilters.campaigns.has(x.campaignId)));
  }

  if (state.campaignSearchQuery) {
    dataset = dataset.filter(x => `${x.name || ''} ${x.platformName || ''} ${x.campaignName || ''} ${x.adGroupName || ''}`.toLowerCase().includes(state.campaignSearchQuery));
  }

  dataset.sort((a, b) => {
    const av = getSortableValue(a, state.clientTableSort.key);
    const bv = getSortableValue(b, state.clientTableSort.key);
    const result = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return state.clientTableSort.direction === 'asc' ? result : -result;
  });

  let primaryColName = 'Name';
  if (state.currentPerformanceView === 'platform') primaryColName = 'Platform Name';
  if (state.currentPerformanceView === 'campaign') primaryColName = 'Campaign Name';
  if (state.currentPerformanceView === 'adgroup') primaryColName = 'Ad Group Name';
  if (state.currentPerformanceView === 'ad') primaryColName = 'Ad Name';

  const commonHeaders = [
    sortHeader('Format', 'format', state.clientTableSort, 'setClientTableSort'),
    sortHeader('Status', 'status', state.clientTableSort, 'setClientTableSort'),
    sortHeader('Spend', 'spendValue', state.clientTableSort, 'setClientTableSort'),
    sortHeader('Impressions', 'impressions', state.clientTableSort, 'setClientTableSort'),
    sortHeader('CPM', 'cpm', state.clientTableSort, 'setClientTableSort', 'metric-col-cpm'),
    sortHeader('Clicks', 'clicks', state.clientTableSort, 'setClientTableSort'),
    sortHeader('CTR', 'ctr', state.clientTableSort, 'setClientTableSort', 'metric-col-ctr'),
    sortHeader('CPC', 'cpc', state.clientTableSort, 'setClientTableSort', 'metric-col-cpc'),
    sortHeader('Conversions', 'conversions', state.clientTableSort, 'setClientTableSort'),
    sortHeader('Cost per<br>Conversion', 'costPerConversion', state.clientTableSort, 'setClientTableSort', 'metric-col-cpa')
  ].join('');
  
  const platformHeader = state.currentPerformanceView !== 'platform' ? sortHeader('Platform', 'platformName', state.clientTableSort, 'setClientTableSort') : '';
  thead.innerHTML = `<tr>${sortHeader(primaryColName, 'name', state.clientTableSort, 'setClientTableSort')}${platformHeader}${commonHeaders}${nextLevel ? '<th>Action</th>' : ''}</tr>`;

  if (!dataset.length) {
    tbody.innerHTML = `<tr><td colspan="13" style="text-align:center;color:var(--text-muted);padding:40px;">No data matches criteria.</td></tr>`;
    return;
  }

  const ctrValues = dataset.map(x => x.ctr);
  const cpcValues = dataset.map(x => x.cpc);
  const cpaValues = dataset.map(x => x.costPerConversion);
  const cpmValues = dataset.map(x => x.cpm);
  
  tbody.innerHTML = dataset.map(item => {
    let secondary = '';
    if (state.currentPerformanceView === 'adgroup' || state.currentPerformanceView === 'ad') {
      secondary = `<span class="ad-table-campaign">${item.campaignName}</span>`;
    }

    let primaryNameHtml = `<strong class="ad-table-primary">${item.name}</strong>`;
    if (state.currentPerformanceView === 'platform') {
      primaryNameHtml = `<span class="table-brand-name">${platformLogo(item.platformName, 'sm')}<strong>${item.name}</strong></span>`;
    }

    let actionHtml = '';
    if (nextLevel) {
      const btnLabel = nextLevel === 'campaign' ? 'Campaigns' : nextLevel === 'adgroup' ? 'Ad Groups' : 'Ads';
      actionHtml = `<td><button class="btn-integ" style="padding:4px 10px;font-size:11px" onclick="event.stopPropagation();drillDownPerformance('${state.currentPerformanceView}', '${item.id}', '${item.name.replace(/'/g, "\\'")}')">View ${btnLabel} (${item.childCount}) →</button></td>`;
    }

    const trClick = nextLevel ? ` style="cursor:pointer" onclick="drillDownPerformance('${state.currentPerformanceView}', '${item.id}', '${item.name.replace(/'/g, "\\'")}')"` : '';
    let statusClass = item.status === 'Paused' ? 'status-paused' : (item.status === 'Attention Required' ? 'status-attention' : 'status-active');

    let formatsHtml = '';
    if (item.formats && item.formats.length > 0) {
      formatsHtml = `<span class="format-pill">${item.formats[0]}</span>`;
      if (item.formats.length === 2) formatsHtml += `<span class="format-pill">${item.formats[1]}</span>`;
      else if (item.formats.length > 2) formatsHtml += `<span class="format-pill" title="${item.formats.slice(1).join(', ')}">+${item.formats.length - 1}</span>`;
    } else if (item.format) {
      formatsHtml = `<span class="format-pill">${item.format}</span>`;
    } else {
      formatsHtml = `<span class="text-[11px] text-slate-400 italic">Mixed</span>`;
    }

    const platformCell = state.currentPerformanceView !== 'platform' ? `<td><span class="platform-pill">${platformLogo(item.platformName, 'sm', true)}${item.platformName}</span></td>` : '';

    return `
    <tr${trClick}>
      <td><div style="display:flex;flex-direction:column;justify-content:center;min-width:0;">${secondary}${primaryNameHtml}</div></td>
      ${platformCell}
      <td><div style="display: flex; gap: 4px; align-items: center; white-space: nowrap;">${formatsHtml}</div></td>
      <td><span class="status-tag ${statusClass}">${item.status}</span></td>
      <td>${item.spend}</td>
      <td>${item.impressions.toLocaleString()}</td>
      <td class="metric-heat-cell" style="${metricHeatStyle(item.cpm, cpmValues, 'cpm')}">$${item.cpm.toFixed(2)}</td>
      <td>${item.clicks.toLocaleString()}</td>
      <td class="metric-heat-cell" style="${metricHeatStyle(item.ctr, ctrValues, 'ctr')}">${item.ctr.toFixed(2)}%</td>
      <td class="metric-heat-cell" style="${metricHeatStyle(item.cpc, cpcValues, 'cpc')}">$${item.cpc.toFixed(2)}</td>
      <td>${item.conversions.toLocaleString()}</td>
      <td class="metric-heat-cell" style="${metricHeatStyle(item.costPerConversion, cpaValues, 'cpa')}">$${item.costPerConversion.toFixed(2)}</td>
      ${actionHtml}
    </tr>`;
  }).join('');
}

function renderAgencyPerformanceTable() {
  const thead = document.getElementById('agency-performance-table-head');
  const tbody = document.getElementById('agency-campaign-table-body');
  const searchInput = document.getElementById('agency-campaign-search');
  if (!thead || !tbody) return;
  
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  let dataset = [...agencyPerformanceData.campaigns].filter(c => (c.platform === 'Google' || c.platform === 'Meta'));
  
  if (query) {
    dataset = dataset.filter(c => c.client.toLowerCase().includes(query) || c.platform.toLowerCase().includes(query) || c.name.toLowerCase().includes(query));
  }
  
  dataset.forEach((c, i) => { 
    if (c.impressions == null) { 
      c.impressions = 90000 + i * 17000; 
      c.clicks = 4200 + i * 640; 
      c.conversions = c.conversions || 60 + i * 9; 
    } 
    c.ctr = c.impressions ? (c.clicks / c.impressions) * 100 : 0; 
    c.cpc = parseCurrency(c.spend) / Math.max(1, c.clicks); 
    c.costPerConversion = parseCurrency(c.spend) / Math.max(1, c.conversions); 
    c.cpm = c.impressions ? (parseCurrency(c.spend) / c.impressions) * 1000 : 0; 
  });
  
  const key = state.agencyTableSort.key;
  dataset.sort((a, b) => {
    const mapA = { client: a.client, name: a.name, spend: parseCurrency(a.spend), impressions: a.impressions, clicks: a.clicks, ctr: a.ctr, cpc: a.cpc, cpm: a.cpm, conversions: a.conversions, costPerConversion: a.costPerConversion };
    const mapB = { client: b.client, name: b.name, spend: parseCurrency(b.spend), impressions: b.impressions, clicks: b.clicks, ctr: b.ctr, cpc: b.cpc, cpm: b.cpm, conversions: b.conversions, costPerConversion: b.costPerConversion };
    const av = mapA[key];
    const bv = mapB[key]; 
    const result = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv)); 
    return state.agencyTableSort.direction === 'asc' ? result : -result;
  });
  
  const headers = [
    sortHeader('Client Workspace', 'client', state.agencyTableSort, 'setAgencyTableSort'),
    sortHeader('Platform', 'platform', state.agencyTableSort, 'setAgencyTableSort'),
    sortHeader('Campaign Name', 'name', state.agencyTableSort, 'setAgencyTableSort'),
    sortHeader('Spend', 'spend', state.agencyTableSort, 'setAgencyTableSort'),
    sortHeader('Impressions', 'impressions', state.agencyTableSort, 'setAgencyTableSort'),
    sortHeader('CPM', 'cpm', state.agencyTableSort, 'setAgencyTableSort', 'metric-col-cpm'),
    sortHeader('Clicks', 'clicks', state.agencyTableSort, 'setAgencyTableSort'),
    sortHeader('CTR', 'ctr', state.agencyTableSort, 'setAgencyTableSort', 'metric-col-ctr'),
    sortHeader('CPC', 'cpc', state.agencyTableSort, 'setAgencyTableSort', 'metric-col-cpc'),
    sortHeader('Platform<br>Conversions', 'conversions', state.agencyTableSort, 'setAgencyTableSort'),
    sortHeader('Cost per<br>Conversion', 'costPerConversion', state.agencyTableSort, 'setAgencyTableSort', 'metric-col-cpa'),
    '<th>Action</th>'
  ];
  thead.innerHTML = `<tr>${headers.join('')}</tr>`;
  
  const ctrValues = dataset.map(c => c.ctr);
  const cpcValues = dataset.map(c => c.cpc);
  const cpaValues = dataset.map(c => c.costPerConversion);
  const cpmValues = dataset.map(c => c.cpm);
  
  if (!dataset.length) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;color:var(--text-muted);padding:40px;">No campaigns match criteria.</td></tr>';
    return;
  }
  
  tbody.innerHTML = dataset.map(c => `
    <tr>
      <td><strong class="dashboard-workspace-link" onclick="inspectClientWorkspace('${c.client}','client-home')">${c.client}</strong></td>
      <td><span class="platform-pill">${platformLogo(c.platform, 'sm', true)}${c.platform}</span></td>
      <td><strong class="ad-table-primary">${c.name}</strong></td>
      <td>${c.spend}</td>
      <td>${c.impressions.toLocaleString()}</td>
      <td class="metric-heat-cell" style="${metricHeatStyle(c.cpm, cpmValues, 'cpm')}">$${c.cpm.toFixed(2)}</td>
      <td>${c.clicks.toLocaleString()}</td>
      <td class="metric-heat-cell" style="${metricHeatStyle(c.ctr, ctrValues, 'ctr')}">${c.ctr.toFixed(2)}%</td>
      <td class="metric-heat-cell" style="${metricHeatStyle(c.cpc, cpcValues, 'cpc')}">$${c.cpc.toFixed(2)}</td>
      <td>${c.conversions.toLocaleString()}</td>
      <td class="metric-heat-cell" style="${metricHeatStyle(c.costPerConversion, cpaValues, 'cpa')}">$${c.costPerConversion.toFixed(2)}</td>
      <td><button class="btn-integ" style="padding:4px 10px;font-size:11px" onclick="inspectClientWorkspace('${c.client}','client-home')">Go to workspace →</button></td>
    </tr>`).join('');
}

function renderWorkspaceTable() {
  const tbody = document.getElementById('master-workspace-tbody');
  const searchInput = document.getElementById('workspace-search-input');
  const pageInfo = document.getElementById('workspace-pagination-info');
  const controls = document.getElementById('workspace-pagination-controls');
  if (!tbody) return;

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filtered = masterWorkspacesData.filter(ws => ws.name.toLowerCase().includes(query) || ws.contact.toLowerCase().includes(query));
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / state.workspacePageSize) || 1;
  if (state.currentWorkspacePage > totalPages) state.currentWorkspacePage = totalPages;

  const startIndex = (state.currentWorkspacePage - 1) * state.workspacePageSize;
  const endIndex = Math.min(startIndex + state.workspacePageSize, totalItems);
  const pageData = filtered.slice(startIndex, endIndex);

  const cpmValues = filtered.map(ws => ws.cpm);
  const cpcValues = filtered.map(ws => ws.cpc);
  const cpaValues = filtered.map(ws => ws.cplValue);

  if (pageInfo) { 
    pageInfo.innerText = totalItems > 0 ? `Showing ${startIndex + 1}–${endIndex} of ${totalItems} workspaces` : `No workspaces match search`; 
  }

  if (pageData.length === 0) { 
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 40px;">No workspaces found matching "${query}".</td></tr>`; 
  } else {
    tbody.innerHTML = pageData.map(ws => {
      let platformsHtml = '';
      if (ws.platforms.includes('google')) {
        platformsHtml += `<span class="platform-pill"><img class="brand-platform-logo brand-platform-logo-sm" style="margin-right: 0;" src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Google_Ads_icon.svg" width="16" height="16" alt="Google Ads" loading="lazy">Google</span>`;
      }
      if (ws.platforms.includes('meta')) {
        platformsHtml += `<span class="platform-pill"><img class="brand-platform-logo brand-platform-logo-sm" style="margin-right: 0;" src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Meta_Platforms_logo.svg" width="16" height="16" alt="Meta" loading="lazy">Meta</span>`;
      }
      return `
      <tr>
        <td><strong class="dashboard-workspace-link" onclick="inspectClientWorkspace('${ws.name}', 'client-home')">${ws.name}</strong></td>
        <td>${ws.contact}</td>
        <td><div style="display:flex;gap:8px;align-items:center;flex-wrap:nowrap;white-space:nowrap;">${platformsHtml}</div></td>
        <td>${ws.spend}</td>
        <td class="metric-heat-cell" style="${metricHeatStyle(ws.cpm, cpmValues, 'cpm')}">$${ws.cpm.toFixed(2)}</td>
        <td class="metric-heat-cell" style="${metricHeatStyle(ws.cpc, cpcValues, 'cpc')}">$${ws.cpc.toFixed(2)}</td>
        <td class="metric-heat-cell" style="${metricHeatStyle(ws.cplValue, cpaValues, 'cpa')}">$${ws.cplValue.toFixed(2)}</td>
        <td><button class="btn-integ dashboard-action-btn" style="padding:6px 12px;font-size:12px;" onclick="inspectClientWorkspace('${ws.name}', 'client-home')">Go to workspace →</button></td>
      </tr>`;
    }).join('');
  }

  if (controls) {
    let pagesHtml = Array.from({ length: totalPages }, (_, i) => i + 1)
      .map(p => `<button class="page-btn ${p === state.currentWorkspacePage ? 'active' : ''}" onclick="goToWorkspacePage(${p})">${p}</button>`)
      .join('');
    controls.innerHTML = `
      <button class="page-btn" ${state.currentWorkspacePage === 1 ? 'disabled' : ''} onclick="goToWorkspacePage(${state.currentWorkspacePage - 1})">← Prev</button>
      ${pagesHtml}
      <button class="page-btn" ${state.currentWorkspacePage === totalPages ? 'disabled' : ''} onclick="goToWorkspacePage(${state.currentWorkspacePage + 1})">Next →</button>
    `;
  }
}

function filterWorkspaceTable() { state.currentWorkspacePage = 1; renderWorkspaceTable(); }
function goToWorkspacePage(page) { state.currentWorkspacePage = page; renderWorkspaceTable(); }

function renderWorkspaceDatalist() {
  const dl = document.getElementById('datalist-workspaces');
  if (dl) dl.innerHTML = masterWorkspacesData.map(ws => `<option value="${ws.name}"></option>`).join('');
}

function renderClientDailyChart() {
  const svg = document.getElementById('client-daily-chart-svg'); 
  if (!svg) return;
  const wrap = document.getElementById('client-daily-chart');
  const W = wrap.clientWidth || 760;
  const H = wrap.clientHeight || 240;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  
  const p = { l: 44, r: 44, t: 20, b: 34 };
  const iw = W - p.l - p.r;
  const ih = H - p.t - p.b;
  const xs = i => p.l + i * iw / (clientDailyChartData.length - 1);
  const ys = v => p.t + ih - (v / 500) * ih;
  const yl = v => p.t + ih - (v / 1000) * ih;
  const yp = v => p.t + ih - (v / 30) * ih;
  
  let o = '';
  [0, 125, 250, 375, 500].forEach(v => {
    const y = ys(v);
    o += `<line x1="${p.l}" y1="${y}" x2="${W - p.r}" y2="${y}" stroke="rgba(255,255,255,0.4)" stroke-dasharray="3 4"/>`;
    o += `<text x="${p.l - 8}" y="${y + 4}" text-anchor="end" fill="#64748b" font-size="11">${v}</text>`;
  });
  
  [0, 250, 500, 750, 1000].forEach(v => {
    const y = yl(v);
    o += `<text x="${W - p.r + 8}" y="${y + 4}" fill="#64748b" font-size="11">${v}</text>`;
  });
  
  clientDailyChartData.forEach((d, i) => {
    if (i % 5 === 0 || i === 29) {
      o += `<text x="${xs(i)}" y="${H - 10}" text-anchor="middle" fill="#64748b" font-size="11">${d.date}</text>`;
    }
  });
  
  const line = (key, fn, color, w) => {
    const points = clientDailyChartData.map((d, i) => `${xs(i)},${fn(d[key])}`).join(' ');
    return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  };
  
  o += line('spend', ys, '#4f86df', 2.4);
  o += line('clicks', yl, '#6366f1', 2.4);
  o += line('conversions', yp, '#10b981', 2.4);
  
  clientDailyChartData.forEach((d, i) => {
    o += `<circle data-index="${i}" cx="${xs(i)}" cy="${yl(d.clicks)}" r="5" fill="transparent"/>`;
  });
  
  svg.innerHTML = o;
  svg.querySelectorAll('circle[data-index]').forEach(pt => {
    pt.addEventListener('mouseenter', e => showClientDailyTooltip(+pt.dataset.index, e));
    pt.addEventListener('mouseleave', hideClientDailyTooltip);
  });
}

function showClientDailyTooltip(i, e) {
  const t = document.getElementById('client-daily-tooltip');
  const w = document.getElementById('client-daily-chart');
  if (!t || !w) return;
  const d = clientDailyChartData[i];
  t.innerHTML = `
      <div class="daily-tooltip-date">${d.date}</div>
      <div class="daily-tooltip-row"><span>Spend (SGD)</span><strong>${d.spend.toLocaleString('en-SG',{minimumFractionDigits:2})}</strong></div>
      <div class="daily-tooltip-row"><span>Conversions</span><strong>${d.conversions}</strong></div>
      <div class="daily-tooltip-row"><span>Clicks</span><strong>${d.clicks}</strong></div>
  `;
  const r = w.getBoundingClientRect();
  t.style.left = `${Math.min(Math.max(e.clientX - r.left + 10, 8), w.clientWidth - 160)}px`;
  t.style.top = '34px';
  t.classList.add('show');
}

function hideClientDailyTooltip() {
  document.getElementById('client-daily-tooltip')?.classList.remove('show');
}

function setClientHeatmapMetric(metric) {
  state.clientHeatmapMetric = metric;
  document.getElementById('client-heatmap-spend')?.classList.toggle('active', metric === 'spend');
  document.getElementById('client-heatmap-cpl')?.classList.toggle('active', metric === 'cpl');
  renderClientHeatmap();
}

function renderClientHeatmap() {
  const root = document.getElementById('client-hourly-heatmap');
  if (!root) return;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = clientHeatmapBase.map(row => 
    row.map(v => state.clientHeatmapMetric === 'spend' ? v : Math.max(8, Math.round(v / 58 * 36)))
  );
  
  const flat = values.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  
  let h = '<div class="heatmap-corner"></div>';
  for (let i = 0; i < 24; i++) h += `<div class="heatmap-hour">${i % 3 === 0 ? i : ''}</div>`;
  
  values.forEach((row, r) => {
    h += `<div class="heatmap-day">${days[r]}</div>`;
    row.forEach((v, c) => {
      const n = (v - min) / Math.max(1, max - min);
      const hue = 100 - (n * 90);
      const bg = `hsl(${hue}, 60%, 80%)`;
      const unit = state.clientHeatmapMetric === 'spend' ? 'SGD' : 'SGD per conversion';
      h += `<div class="heatmap-cell" style="background:${bg}" title="${days[r]} ${String(c).padStart(2, '0')}:00 · ${v.toFixed(2)} ${unit}"></div>`;
    });
  });
  
  root.innerHTML = h;
  document.getElementById('client-heatmap-legend-min').textContent = `${min.toFixed(2)} ${state.clientHeatmapMetric === 'spend' ? 'SGD' : 'SGD per conversion'}`;
  document.getElementById('client-heatmap-legend-max').textContent = `${max.toFixed(2)} ${state.clientHeatmapMetric === 'spend' ? 'SGD' : 'SGD per conversion'}`;
}

function initClientAnalyticsCharts() {
  renderClientDailyChart();
  renderClientHeatmap();
}

function mappedAccountCell(account, platform) {
  if (!account) return '<span class="slot-pill-check check-warning"><i data-lucide="alert-circle" class="w-4 h-4"></i> Not linked</span>';
  return `
    <div style="display:flex; align-items:center; gap:12px;">
      ${platformLogo(platform === 'google' ? 'Google Ads' : 'Meta', 'sm', true)}
      <div style="display:flex; flex-direction:column; justify-content:center; min-width:0;">
        <strong style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:13px; color:var(--text-dark);">${account.name}</strong>
        <code style="font-size:11px; color:var(--text-muted); font-weight:600; line-height:1.2; margin-top:2px;">${account.id}</code>
      </div>
    </div>
  `;
}

function renderLiveMappedAccounts() {
  const tbody = document.getElementById('live-mapped-tbody');
  if (!tbody) return;
  const clients = [...new Set(liveMappedAccounts.map(x => x.client))];
  tbody.innerHTML = clients.map(client => {
    const google = liveMappedAccounts.find(x => x.client === client && x.platform === 'google');
    const meta = liveMappedAccounts.find(x => x.client === client && x.platform === 'meta');
    return `
    <tr>
        <td><strong class="dashboard-workspace-link" onclick="inspectClientWorkspace('${client}', 'client-home')">${client}</strong></td>
        <td>${mappedAccountCell(google, 'google')}</td>
        <td>${mappedAccountCell(meta, 'meta')}</td>
        <td><button class="btn-integ" style="padding:6px 12px;font-size:12px;" onclick="inspectClientWorkspace('${client}', 'client-profile')">Manage Workspace →</button></td>
    </tr>`;
  }).join('');
  setTimeout(() => { window.lucide?.createIcons(); }, 10);
}

function generateAccountDropdown(platform, rowId) {
  const mappedIds = new Set(liveMappedAccounts.map(a => a.id));
  const options = validUnmappedAccounts
    .filter(a => a.platform === platform && !mappedIds.has(a.id))
    .map(a => `<option value="${a.name} [${a.id}]"></option>`).join('');
    
  return `
    <div style="position:relative; width:100%;">
      <input type="text" id="unlinked-${platform}-${rowId}" class="search-input w-full px-3 py-2 text-sm" placeholder="Search & select..." list="dl-${platform}-${rowId}" oninput="checkInlineMapping(${rowId}, '${platform}')">
      <datalist id="dl-${platform}-${rowId}">${options}</datalist>
      <div id="rich-${platform}-${rowId}" style="display:none; align-items:center; justify-content:space-between; padding:8px 12px; border:1px solid rgba(255,255,255,0.4); border-radius:var(--radius-sm); background:rgba(255,255,255,0.4);">
         <div id="rich-content-${platform}-${rowId}" style="flex:1; min-width:0;"></div>
         <button type="button" style="background:transparent; border:none; cursor:pointer; color:var(--text-muted); padding:4px;" onclick="clearSingleInlineMapping(${rowId}, '${platform}')"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>
    </div>
  `;
}

function checkInlineMapping(rowId, platform) {
  if (platform) {
    const input = document.getElementById(`unlinked-${platform}-${rowId}`);
    const richDiv = document.getElementById(`rich-${platform}-${rowId}`);
    const richContent = document.getElementById(`rich-content-${platform}-${rowId}`);
    const val = input.value.trim();
    const match = val.match(/(.+) \[(.+)\]/);
    if (match) {
      input.style.display = 'none'; 
      richDiv.style.display = 'flex'; 
      richContent.innerHTML = mappedAccountCell({name: match[1], id: match[2]}, platform);
    } else {
      input.style.display = 'block'; 
      richDiv.style.display = 'none';
    }
  }
  const g = document.getElementById(`unlinked-google-${rowId}`)?.value.trim();
  const m = document.getElementById(`unlinked-meta-${rowId}`)?.value.trim();
  const btn = document.getElementById(`btn-save-map-${rowId}`);
  if (btn) btn.classList.toggle('btn-integ-primary', !!(g || m));
  updateSaveAllButton();
  window.lucide?.createIcons();
}

function clearSingleInlineMapping(rowId, platform) {
  const input = document.getElementById(`unlinked-${platform}-${rowId}`);
  if (input) { input.value = ''; checkInlineMapping(rowId, platform); }
}

function updateSaveAllButton() {
  const allInputs = document.querySelectorAll('#unlinked-workspaces-tbody .search-input');
  const hasValue = Array.from(allInputs).some(inp => inp.value.trim() !== '');
  const btn = document.getElementById('btn-save-all-maps');
  if (btn) btn.classList.toggle('btn-integ-primary', hasValue);
}

function saveAllInlineMappings() {
  const rows = document.querySelectorAll('#unlinked-workspaces-tbody tr');
  let savedAny = false;
  rows.forEach((tr) => {
    const rowId = tr.dataset.rowId; 
    const clientName = tr.dataset.client;
    if (rowId && clientName) {
      const g = document.getElementById(`unlinked-google-${rowId}`)?.value.trim();
      const m = document.getElementById(`unlinked-meta-${rowId}`)?.value.trim();
      if (g || m) { mapUnlinkedWorkspace(clientName, rowId); savedAny = true; }
    }
  });
  if (!savedAny) showNotification('No links to save.', 'ℹ️');
}

function renderUnlinkedWorkspaces() {
  const tbody = document.getElementById('unlinked-workspaces-tbody');
  const countLabel = document.getElementById('unlinked-workspaces-count');
  if (!tbody) return;

  const mappedClientNames = new Set(liveMappedAccounts.map(a => a.client));
  const unlinkedWorkspaces = masterWorkspacesData.filter(ws => !mappedClientNames.has(ws.name)).slice(0, 5);

  if (countLabel) countLabel.innerText = unlinkedWorkspaces.length;
  if (unlinkedWorkspaces.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--text-muted);">All client workspaces have at least one mapped ad account.</td></tr>`; 
    return;
  }
  
  tbody.innerHTML = unlinkedWorkspaces.map((ws, idx) => `
    <tr data-row-id="${idx}" data-client="${ws.name}">
      <td><strong class="dashboard-workspace-link" onclick="inspectClientWorkspace('${ws.name}', 'client-profile')">${ws.name}</strong></td>
      <td>${generateAccountDropdown('google', idx)}</td>
      <td>${generateAccountDropdown('meta', idx)}</td>
      <td><button id="btn-save-map-${idx}" class="btn-integ" style="padding:6px 12px;font-size:12px;" onclick="mapUnlinkedWorkspace('${ws.name}', ${idx})">Save</button></td>
    </tr>`).join('');
  updateSaveAllButton();
}

function mapUnlinkedWorkspace(clientName, rowId) {
  const googleVal = document.getElementById(`unlinked-google-${rowId}`)?.value.trim() || '';
  const metaVal = document.getElementById(`unlinked-meta-${rowId}`)?.value.trim() || '';
  if (!googleVal && !metaVal) { 
    showNotification('Please select at least one account to link.', '⚠️'); 
    return false; 
  }

  let mappedCount = 0;
  const processMapping = (val, platform) => {
    if (!val) return;
    const match = val.match(/(.+) \[(.+)\]/);
    const id = match ? match[2] : val; 
    const name = match ? match[1] : 'Mapped Account';
    liveMappedAccounts.push({ client: clientName, platform, name, id });
    mappedCount++;
  };

  processMapping(googleVal, 'google'); 
  processMapping(metaVal, 'meta');
  
  showNotification(`Successfully linked ${mappedCount} account(s) to ${clientName}!`, '✅');
  renderUnlinkedWorkspaces(); 
  renderLiveMappedAccounts(); 
  renderWorkspaceAdAccounts();
  return true;
}

function filterUnmappedAccounts(platform) {
  document.querySelectorAll('[data-unmapped-platform]').forEach(btn => btn.classList.toggle('active', btn.dataset.unmappedPlatform === platform));
  document.querySelectorAll('#unmapped-accounts-tbody tr[data-platform]').forEach(row => { 
    row.style.display = (platform === 'all' || row.dataset.platform === platform) ? '' : 'none'; 
  });
}

function checkUnmappedQueueMapping(rowId) {
  const val = document.getElementById(`unmapped-select-${rowId}`)?.value.trim();
  const btn = document.getElementById(`btn-assign-${rowId}`);
  if (btn) btn.classList.toggle('btn-integ-primary', !!val);
}

function assignUnmappedAccount(rowId, accountName, accountId) {
  const input = document.getElementById(`unmapped-select-${rowId}`);
  if (!input || !input.value) { 
    showNotification('Please select a target Client Workspace first!', '⚠️'); 
    return; 
  }
  
  const targetOrg = input.value.trim(); 
  const row = document.getElementById(`unmapped-row-${rowId}`);
  const platform = accountId.startsWith('#') ? 'google' : 'meta';
  const existing = liveMappedAccounts.findIndex(x => x.client === targetOrg && x.platform === platform);
  const mapped = { client: targetOrg, platform, name: accountName, id: accountId };
  
  if (existing >= 0) liveMappedAccounts[existing] = mapped; 
  else liveMappedAccounts.push(mapped);
  
  if (row) row.remove();
  renderLiveMappedAccounts(); 
  renderUnlinkedWorkspaces();
  showNotification(`Successfully linked ${accountId} to ${targetOrg}!`, '✅');
}

function promptUnmap(accountId, platform) { 
  state.pendingUnmapId = accountId; 
  state.pendingUnmapPlatform = platform; 
  document.getElementById('unmap-warning-modal').style.display = 'flex'; 
}

function closeUnmapWarning() { 
  document.getElementById('unmap-warning-modal').style.display = 'none'; 
  state.pendingUnmapId = null; 
  state.pendingUnmapPlatform = null; 
}

function confirmUnmapAccount() {
  if (state.pendingUnmapId) {
    const idx = liveMappedAccounts.findIndex(x => x.client === state.currentActiveClient && x.id === state.pendingUnmapId);
    if (idx !== -1) liveMappedAccounts.splice(idx, 1);
    showNotification(`${state.pendingUnmapPlatform === 'google' ? 'Google' : 'Meta'} account unlinked successfully.`, 'ℹ️');
    renderWorkspaceAdAccounts(); 
    renderLiveMappedAccounts(); 
    renderUnlinkedWorkspaces();
  }
  closeUnmapWarning();
}

function renderWorkspaceAdAccounts() {
  const container = document.getElementById('org-mapping-grid');
  if (!container) return;
  const clientGoogle = liveMappedAccounts.find(x => x.client === state.currentActiveClient && x.platform === 'google');
  const clientMeta = liveMappedAccounts.find(x => x.client === state.currentActiveClient && x.platform === 'meta');
  const isAgency = state.orgSettingsRoleMode === 'agency';

  const renderCard = (platform, account, title, inputId, funcName, defaultVal = '') => {
    const logo = platformLogo(platform, 'lg', true);
    if (account) {
      return `
        <div class="glass-panel" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between; border-radius: var(--radius-lg); height: 100%;">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.4);">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${logo}
                <h4 style="font-size: 16px; font-weight: 600; color: var(--text-dark);">${title}</h4>
              </div>
              <span class="slot-pill-check check-active"><i data-lucide="check" class="w-4 h-4"></i> Synced</span>
            </div>
            <div style="margin-bottom: 24px;">
              <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Account Name</div>
              <div style="font-size: 15px; font-weight: 600; color: var(--text-dark); margin-bottom: 16px;">${account.name}</div>
              <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Account ID</div>
              <div><code style="font-size: 13px; font-weight: 500; color: var(--text-dark); padding: 4px 8px; background: rgba(255,255,255,0.5); border-radius: 6px;">${account.id}</code></div>
            </div>
          </div>
          ${isAgency ? `<button class="btn-integ btn-danger" style="width: 100%; padding: 10px; font-size: 13px; border-radius: 12px;" onclick="promptUnmap('${account.id}', '${platform}')">Unlink Account</button>` : ''}
        </div>
      `;
    } else {
      return `
        <div style="background: rgba(255,255,255,0.2); border: 2px dashed rgba(255,255,255,0.6); border-radius: var(--radius-lg); padding: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; height: 100%; min-height: 300px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; opacity: 0.7;">
            ${logo}
            <h4 style="font-size: 18px; font-weight: 600; color: var(--text-dark);">${title}</h4>
          </div>
          <span class="slot-pill-check" style="background: rgba(255,255,255,0.4); color: var(--text-slate-600); border-color: rgba(255,255,255,0.4); margin-bottom: 24px;"><i data-lucide="unlink" class="w-4 h-4"></i> Not Connected</span>
          ${isAgency ? `
          <div style="width: 100%; max-width: 280px; display: flex; flex-direction: column; gap: 12px;">
            <input id="${inputId}" class="search-input w-full px-4 py-3 text-center" value="${defaultVal}" placeholder="Enter exact Account ID">
            <button class="btn-integ btn-integ-primary w-full py-3 text-sm rounded-xl font-semibold" onclick="${funcName}()">Search & Link →</button>
          </div>` : `
          <span style="font-size: 13px; color: var(--text-muted); max-width: 260px; line-height: 1.5;">Contact your Agency Admin to link a ${title} to this workspace.</span>`}
        </div>
      `;
    }
  };

  container.innerHTML = `
    ${renderCard('google', clientGoogle, 'Google', 'available-google-cids-search', 'searchAndMapGoogleCid', '#998-234-1102')}
    ${renderCard('meta', clientMeta, 'Meta', 'available-meta-account-search', 'searchAndMapMetaAccount')}
  `;
  window.lucide?.createIcons();
}

function promptMapConfirm(platform, id, name) {
  state.pendingMapPlatform = platform; 
  state.pendingMapId = id; 
  state.pendingMapName = name;
  document.getElementById('map-confirm-platform-name').innerText = platform === 'google' ? 'Google' : 'Meta';
  document.getElementById('map-confirm-account-name').innerText = name;
  document.getElementById('map-confirm-account-id').innerText = id;
  document.getElementById('map-confirm-target-org').innerText = state.currentActiveClient;
  document.getElementById('map-confirm-modal').style.display = 'flex';
}

function closeMapConfirm() { 
  document.getElementById('map-confirm-modal').style.display = 'none'; 
  state.pendingMapPlatform = null; 
  state.pendingMapId = null; 
  state.pendingMapName = null; 
}

function confirmMapAccount() {
  if (state.pendingMapId && state.pendingMapPlatform && state.pendingMapName) {
    liveMappedAccounts.push({ client: state.currentActiveClient, platform: state.pendingMapPlatform, name: state.pendingMapName, id: state.pendingMapId });
    const inputId = state.pendingMapPlatform === 'google' ? 'available-google-cids-search' : 'available-meta-account-search';
    if (document.getElementById(inputId)) document.getElementById(inputId).value = '';
    showNotification(`Linked ${state.pendingMapPlatform === 'google' ? 'Google' : 'Meta'} Account to Workspace!`, '✅');
    renderWorkspaceAdAccounts(); 
    renderLiveMappedAccounts(); 
    renderUnlinkedWorkspaces();
  }
  closeMapConfirm();
}

function searchAndMapGoogleCid() {
  const v = document.getElementById('available-google-cids-search')?.value.trim();
  if (!v) { showNotification('Enter a Google Customer ID first.', '⚠️'); return; }
  const account = validUnmappedAccounts.find(a => a.platform === 'google' && a.id === v);
  if (!account) { showNotification('Invalid ID or no matching Google account exists.', '❌'); return; }
  promptMapConfirm('google', account.id, account.name);
}

function searchAndMapMetaAccount() {
  const v = document.getElementById('available-meta-account-search')?.value.trim();
  if (!v) { showNotification('Enter a Meta Ad Account ID first.', '⚠️'); return; }
  const account = validUnmappedAccounts.find(a => a.platform === 'meta' && a.id === v);
  if (!account) { showNotification('Invalid ID or no matching Meta account exists.', '❌'); return; }
  promptMapConfirm('meta', account.id, account.name);
}

function handleBrandClick() {
  if (state.loggedInAccountType === 'AGENCY') { jumpToScreen('agency-home'); } 
  else { jumpToScreen('client-home'); initClientAnalyticsCharts(); }
}

function updateTopBarUI() {
  const agencyLabel = document.getElementById('brand-agency-label');
  const switcherWrap = document.getElementById('workspace-switcher-wrap');
  const quickBackBtn = document.getElementById('quick-back-hub-btn');
  const switcherPrefix = document.getElementById('switcher-prefix');
  const switcherTitle = document.getElementById('switcher-active-org-name');
  const switcherDot = document.getElementById('switcher-status-dot');

  if (state.loggedInAccountType === 'AGENCY') {
    if (agencyLabel) agencyLabel.style.display = 'inline-flex';
    if (switcherWrap) switcherWrap.style.display = 'block';
  } else {
    if (agencyLabel) agencyLabel.style.display = 'none';
    if (switcherWrap) switcherWrap.style.display = 'none';
    if (quickBackBtn) quickBackBtn.style.display = 'none';
    return;
  }

  if (state.activeViewMode === 'AGENCY') {
    if (switcherPrefix) switcherPrefix.innerText = 'AGENCY HUB';
    if (switcherTitle) switcherTitle.innerText = 'All Client Workspaces (612 Total)';
    if (switcherDot) switcherDot.className = 'switcher-dot master';
    if (quickBackBtn) quickBackBtn.style.display = 'none';
  } else {
    if (switcherPrefix) switcherPrefix.innerText = 'CLIENT WORKSPACE';
    if (switcherTitle) switcherTitle.innerText = state.currentActiveClient;
    if (switcherDot) switcherDot.className = 'switcher-dot';
    if (quickBackBtn) quickBackBtn.style.display = 'flex';
  }
  renderSwitcherList();
}

function toggleSwitcherDropdown(event) {
  if (event) event.stopPropagation();
  const wrap = document.getElementById('workspace-switcher-wrap');
  if (!wrap) return;
  const isOpen = wrap.classList.contains('open');
  if (isOpen) { closeSwitcherDropdown(); } 
  else {
    wrap.classList.add('open');
    const searchField = document.getElementById('switcher-search-input');
    if (searchField) { 
      searchField.value = ''; 
      document.getElementById('switcher-clear-btn').style.display = 'none'; 
      renderSwitcherList(); 
      setTimeout(() => searchField.focus(), 50); 
    }
  }
}

function closeSwitcherDropdown() { 
  const wrap = document.getElementById('workspace-switcher-wrap'); 
  if (wrap) wrap.classList.remove('open'); 
}

function clearSwitcherSearch() {
  const searchField = document.getElementById('switcher-search-input');
  if (searchField) { 
    searchField.value = ''; 
    document.getElementById('switcher-clear-btn').style.display = 'none'; 
    renderSwitcherList(); 
    searchField.focus(); 
  }
}

function filterSwitcherDropdown(query) {
  const clearBtn = document.getElementById('switcher-clear-btn');
  if (clearBtn) clearBtn.style.display = query.trim().length > 0 ? 'inline-block' : 'none';
  renderSwitcherList(query.toLowerCase().trim());
}

function renderSwitcherList(searchQuery = '') {
  const listContainer = document.getElementById('switcher-orgs-list-container');
  const countLabel = document.getElementById('switcher-count-label');
  const agencyMasterRow = document.getElementById('switcher-agency-master-row');
  const checkMaster = document.getElementById('check-agency-master');

  if (agencyMasterRow && checkMaster) {
    if (state.activeViewMode === 'AGENCY') { 
      agencyMasterRow.classList.add('selected'); 
      checkMaster.style.display = 'inline-block'; 
    } else { 
      agencyMasterRow.classList.remove('selected'); 
      checkMaster.style.display = 'none'; 
    }
  }
  if (!listContainer) return;

  const filtered = masterWorkspacesData.filter(ws => ws.name.toLowerCase().includes(searchQuery) || ws.contact.toLowerCase().includes(searchQuery));
  if (countLabel) countLabel.innerText = filtered.length;

  if (filtered.length === 0) { 
    listContainer.innerHTML = `<div style="padding: 24px 12px; text-align: center; color: var(--text-muted); font-size: 13px;">No client workspace found matching "<strong>${searchQuery}</strong>"</div>`; 
    return; 
  }

  listContainer.innerHTML = filtered.map(ws => {
    const isSelected = (state.activeViewMode === 'CLIENT' && ws.name === state.currentActiveClient);
    const initials = ws.name.split(' ').map(w => w[0]).slice(0, 2).join('');
    return `
      <div class="switcher-org-row ${isSelected ? 'selected' : ''}" onclick="selectWorkspaceFromSwitcher('${ws.name}')">
        <div class="switcher-row-left">
          <div class="switcher-row-avatar">${initials}</div>
          <div class="switcher-row-text">
            <span class="switcher-row-name">${ws.name}</span>
            <span class="switcher-row-sub">${ws.contact}</span>
          </div>
        </div>
        <div class="switcher-row-right">
          <span class="switcher-spend-pill">${ws.spend}</span>
          <span class="switcher-current-check"><i data-lucide="check" class="w-4 h-4"></i></span>
        </div>
      </div>
    `;
  }).join('');
  window.lucide?.createIcons();
}

function selectWorkspaceFromSwitcher(target) {
  closeSwitcherDropdown();
  if (target === '__agency_master__') {
    state.activeViewMode = 'AGENCY'; 
    jumpToScreen('agency-home'); 
    showNotification('Switched to Agency Master Overview', '⚡');
  } else {
    state.currentActiveClient = target;
    const homeTitle = document.getElementById('client-home-org-title');
    if (homeTitle) homeTitle.innerText = target;
    renderWorkspaceAdAccounts();
    renderClientAgencyAccess();
    if (state.currentScreenId.startsWith('agency-')) jumpToScreen('client-home'); 
    else jumpToScreen(state.currentScreenId);
    showNotification(`Switched to workspace: ${target}`, '🏢');
  }
  updateTopBarUI();
}

function jumpToScreen(screenId) {
  state.currentScreenId = screenId;
  const select = document.getElementById('dev-screen-select');
  if (select) select.value = screenId;

  if (screenId.startsWith('agency-')) {
    state.activeViewMode = 'AGENCY';
  } else {
    state.activeViewMode = 'CLIENT';
    const homeTitle = document.getElementById('client-home-org-title');
    if (homeTitle) homeTitle.innerText = state.currentActiveClient;
  }

  updateTopBarUI();
  renderSidebarNav();
  renderDevSubtoggles(screenId);

  document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`screen-${screenId}`);
  if (target) target.classList.add('active');

  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) sidebar.classList.remove('open');
  
  window.lucide?.createIcons();
  if (screenId === 'client-home') setTimeout(initClientAnalyticsCharts, 50);
}

function inspectClientWorkspace(clientName, screenTarget) {
  state.currentActiveClient = clientName;
  const homeTitle = document.getElementById('client-home-org-title');
  if (homeTitle) homeTitle.innerText = clientName;
  renderWorkspaceAdAccounts();
  renderClientAgencyAccess();
  jumpToScreen(screenTarget);
}

function renderSidebarNav() {
  const container = document.getElementById('sidebar-nav-content');
  if (!container) return;
  if (state.activeViewMode === 'AGENCY') {
    container.innerHTML = `
      <div class="nav-section-label">Agency</div>
      <a href="#" class="nav-link ${state.currentScreenId === 'agency-home' ? 'active' : ''}" onclick="jumpToScreen('agency-home'); return false;">
        <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Home
      </a>
      <a href="#" class="nav-link ${state.currentScreenId === 'agency-internal-org' ? 'active' : ''}" onclick="jumpToScreen('agency-internal-org'); return false;">
        <i data-lucide="users" class="w-4 h-4"></i> Agency Team
      </a>
      <a href="#" class="nav-link ${state.currentScreenId === 'agency-adaccounts' ? 'active' : ''}" onclick="jumpToScreen('agency-adaccounts'); return false;">
        <i data-lucide="link" class="w-4 h-4"></i> Ad Account Linking
      </a>
      <div class="nav-section-label" style="margin-top:20px;">Client</div>
      <a href="#" class="nav-link ${state.currentScreenId === 'agency-orgs' ? 'active' : ''}" onclick="jumpToScreen('agency-orgs'); return false;">
        <i data-lucide="briefcase" class="w-4 h-4"></i> Workspaces
      </a>
    `;
  } else {
    container.innerHTML = `
      <div class="nav-section-label">Client Workspace</div>
      <a href="#" class="nav-link ${state.currentScreenId === 'client-home' ? 'active' : ''}" onclick="jumpToScreen('client-home'); return false;">
        <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Workspace Home
      </a>
      <a href="#" class="nav-link ${state.currentScreenId === 'client-profile' ? 'active' : ''}" onclick="jumpToScreen('client-profile'); return false;">
        <i data-lucide="settings" class="w-4 h-4"></i> Workspace Settings
      </a>
    `;
  }
  window.lucide?.createIcons();
}

function toggleSidebar() { 
  const sidebar = document.getElementById('app-sidebar'); 
  if (sidebar) sidebar.classList.toggle('open'); 
}

const devSubtoggles = {
  'agency-home': [ { label: 'With Triage (Default)', action: "setTriageState('show')" }, { label: 'Clean (No Alerts)', action: "setTriageState('hide')" } ],
  'client-profile': [ { label: 'Agency Admin (Can Map)', action: "setOrgRoleMode('agency')" }, { label: 'Client User (View Only)', action: "setOrgRoleMode('client')" } ],
};

function renderDevSubtoggles(screenId) {
  const container = document.getElementById('proto-subtoggles');
  if (!container) return;
  container.innerHTML = '';
  if (devSubtoggles[screenId] && devSubtoggles[screenId].length > 0) {
    devSubtoggles[screenId].forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'dev-btn';
      if ((t.action.includes("'agency'") && state.orgSettingsRoleMode === 'agency') || 
          (t.action.includes("'client'") && state.orgSettingsRoleMode === 'client') ||
          (t.action.includes("setTriageState('show')") && state.triageVisible) ||
          (t.action.includes("setTriageState('hide')") && !state.triageVisible)
         ) { btn.classList.add('active'); }
      btn.innerText = t.label;
      btn.setAttribute('onclick', `handleDevSubtoggle(this, "${t.action.replace(/"/g, '\\"')}")`);
      container.appendChild(btn);
    });
  } else {
    const note = document.createElement('span'); 
    note.style.fontSize = '10.5px'; 
    note.style.color = '#78350f'; 
    note.innerText = 'Default state only'; 
    container.appendChild(note);
  }
}

function handleDevSubtoggle(btn, action) {
  const siblings = btn.parentElement.querySelectorAll('.dev-btn');
  siblings.forEach(b => b.classList.remove('active')); 
  btn.classList.add('active');
  new Function(action)();
}

function setTriageState(targetState) {
  state.triageVisible = (targetState === 'show');
  const card = document.getElementById('agency-triage-card');
  if (card) card.style.display = state.triageVisible ? 'block' : 'none';
  showNotification(state.triageVisible ? 'Action Required alerts visible.' : 'Action Required alerts hidden.', state.triageVisible ? '🚨' : '🧹');
}

function setOrgRoleMode(role) {
  state.orgSettingsRoleMode = role;
  const notice = document.getElementById('org-admapping-permission-notice');
  const agencyAccessSection = document.getElementById('agency-access-section');

  if (role === 'client') {
    if (notice) notice.style.display = 'inline-block';
    if (agencyAccessSection) agencyAccessSection.style.display = 'none';
    showNotification('Viewing Workspace Settings as Client User', '🔒');
  } else {
    if (notice) notice.style.display = 'none';
    if (agencyAccessSection) agencyAccessSection.style.display = 'block';
    showNotification('Viewing Workspace Settings as Agency Admin', '🔓');
  }
  renderWorkspaceAdAccounts();
}

function formatDashboardDate(value) { 
  if (!value) return ''; 
  const d = value instanceof Date ? value : new Date(value + 'T00:00:00'); 
  return d.toLocaleDateString('en-SG', {day: 'numeric', month: 'short', year: 'numeric'}); 
}

function toDateInputValue(d) { 
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0'); 
  return `${y}-${m}-${day}`; 
}

function subtractDate(d, n, unit) { 
  const x = new Date(d); 
  if (unit === 'days') x.setDate(x.getDate() - n); 
  if (unit === 'weeks') x.setDate(x.getDate() - (n * 7)); 
  if (unit === 'months') x.setMonth(x.getMonth() - n); 
  if (unit === 'years') x.setFullYear(x.getFullYear() - n); 
  return x; 
}

function getConfiguredDateRange(scope) {
  const cfg = state.dashboardDateFilters[scope]; 
  const today = new Date(); 
  today.setHours(0, 0, 0, 0);
  let start, end;
  if (cfg.mode === 'past') { 
    start = subtractDate(today, Math.max(1, Number(cfg.pastNumber) || 30), cfg.pastUnit); 
    start.setDate(start.getDate() + 1); 
    end = today; 
  } else if (cfg.mode === 'current') { 
    end = today; 
    start = today; 
  } else {
    start = new Date((document.getElementById(`${scope}-date-range-start`) || {}).value + 'T00:00:00');
    end = new Date((document.getElementById(`${scope}-date-range-end`) || {}).value + 'T00:00:00');
    if (isNaN(start) || isNaN(end)) return null;
    if (start > end) [start, end] = [end, start];
  }
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

function rangeLabel(range) { 
  return `${formatDashboardDate(range.start)} – ${formatDashboardDate(range.end)}`; 
}

function updateDateFilterPreview(scope) {
  const cfg = state.dashboardDateFilters[scope];
  const past = document.getElementById(`${scope}-date-past-preview`);
  const current = document.getElementById(`${scope}-date-current-preview`);
  const range = document.getElementById(`${scope}-date-range-preview`);
  
  if (past) { 
    const r = {...cfg, mode: 'past'}; 
    const old = state.dashboardDateFilters[scope]; 
    state.dashboardDateFilters[scope] = r; 
    const resolved = getConfiguredDateRange(scope); 
    state.dashboardDateFilters[scope] = old; 
    past.textContent = resolved ? rangeLabel(resolved) : ''; 
  }
  if (current) { 
    const r = {...cfg, mode: 'current'}; 
    const old = state.dashboardDateFilters[scope]; 
    state.dashboardDateFilters[scope] = r; 
    const resolved = getConfiguredDateRange(scope); 
    state.dashboardDateFilters[scope] = old; 
    current.textContent = resolved ? rangeLabel(resolved) : ''; 
  }
  if (range) { 
    const rs = document.getElementById(`${scope}-date-range-start`);
    const re = document.getElementById(`${scope}-date-range-end`); 
    range.textContent = (rs.value && re.value) ? rangeLabel({start: rs.value, end: re.value}) : 'Choose a start and end date'; 
  }
}

function switchDateFilterTab(scope, mode) {
  state.dashboardDateFilters[scope].mode = mode;
  const bar = document.getElementById(`${scope}-date-filter`);
  bar.querySelectorAll('.date-filter-tab').forEach(t => t.classList.toggle('active', t.dataset.dateTab === mode));
  bar.querySelectorAll('.date-filter-panel').forEach(p => p.hidden = p.dataset.datePanel !== mode);
  updateDateFilterPreview(scope);
}

function toggleDateFilter(scope) {
  const bar = document.getElementById(`${scope}-date-filter`); 
  if (!bar) return;
  const open = bar.classList.toggle('open');
  const trigger = document.getElementById(`${scope}-date-filter-trigger`); 
  if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    const current = getConfiguredDateRange(scope);
    const rs = document.getElementById(`${scope}-date-range-start`);
    const re = document.getElementById(`${scope}-date-range-end`);
    if (current && rs && re && !rs.value) { 
      rs.value = current.start; 
      re.value = current.end; 
    }
    updateDateFilterPreview(scope);
  }
}

function closeDateFilter(scope) {
  const bar = document.getElementById(`${scope}-date-filter`); 
  if (bar) bar.classList.remove('open');
  const trigger = document.getElementById(`${scope}-date-filter-trigger`); 
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function applyDateFilter(scope) {
  const cfg = state.dashboardDateFilters[scope];
  cfg.pastNumber = Math.max(1, Number(document.getElementById(`${scope}-date-past-number`).value) || 30);
  cfg.pastUnit = document.getElementById(`${scope}-date-past-unit`).value;
  cfg.currentUnit = document.getElementById(`${scope}-date-current-unit`).value;
  
  const resolved = getConfiguredDateRange(scope);
  if (!resolved) return;
  
  const label = document.getElementById(`${scope}-date-range-label`);
  if (label) { 
    label.textContent = cfg.mode === 'past' ? `Past ${cfg.pastNumber} ${cfg.pastUnit}` : cfg.mode === 'current' ? `Current ${cfg.currentUnit}` : rangeLabel(resolved); 
  }
  closeDateFilter(scope);
  if (scope === 'client') renderPerformanceTable(); else renderAgencyPerformanceTable();
}

function renderClientAgencyAccess() {
  const tbody = document.getElementById('client-agency-access-tbody');
  const datalist = document.getElementById('datalist-unassigned-agency-users');
  if(!tbody) return;

  const liveUsers = agencyMembers.filter(m => m.workspaces.includes(state.currentActiveClient));
  const unassignedUsers = agencyMembers.filter(m => !m.workspaces.includes(state.currentActiveClient) && !pendingAgencyAssignments.includes(m.id));
  if(datalist) {
    datalist.innerHTML = unassignedUsers.map(m => `<option value="${m.name} (${m.email})" data-id="${m.id}"></option>`).join('');
  }

  let html = '';
  const pendingUsers = agencyMembers.filter(m => pendingAgencyAssignments.includes(m.id));
  
  pendingUsers.forEach(u => {
    let statusColor = u.status === 'Active' ? 'check-active' : 'check-warning';
    html += `
      <tr class="bg-amber-50/40">
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td><span class="platform-badge ${getRoleColor(u.role)} px-2.5 py-1 rounded-full text-[11px] font-semibold">${u.role}</span></td>
        <td><span class="slot-pill-check ${statusColor}">${u.status}</span></td>
        <td class="text-right">
            <div class="flex justify-end gap-2">
                <button class="config-soft-btn text-xs px-3 py-1.5" onclick="removePendingAgencyUser(${u.id})">Remove</button>
                <button class="btn-integ btn-integ-primary text-xs px-3 py-1.5" onclick="saveAgencyUser(${u.id})">Save</button>
            </div>
        </td>
      </tr>
    `;
  });

  liveUsers.forEach(u => {
    html += `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td><span class="platform-badge ${getRoleColor(u.role)} px-2.5 py-1 rounded-full text-[11px] font-semibold">${u.role}</span></td>
        <td><span class="slot-pill-check check-active">Active</span></td>
        <td class="text-right">
            <button class="config-soft-btn text-xs px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-transparent shadow-none" onclick="revokeAgencyUser(${u.id})">Revoke Access</button>
        </td>
      </tr>
    `;
  });

  if(liveUsers.length === 0 && pendingUsers.length === 0) {
    html = `<tr><td colspan="5" class="text-center py-8 text-slate-500 text-[13px]">No agency users have access. Search above to assign.</td></tr>`;
  }

  tbody.innerHTML = html;
  const btnSaveAll = document.getElementById('btn-save-all-agency');
  if (btnSaveAll) btnSaveAll.style.display = pendingUsers.length > 0 ? 'inline-block' : 'none';
}

function handleQueueAgencyUser(input) {
  const val = input.value;
  const datalist = document.getElementById('datalist-unassigned-agency-users');
  if(!datalist) return;
  const options = Array.from(datalist.options);
  const match = options.find(opt => opt.value === val);
  if(match) {
    const id = parseInt(match.getAttribute('data-id'));
    if(!pendingAgencyAssignments.includes(id)) {
      pendingAgencyAssignments.push(id);
      renderClientAgencyAccess();
      input.value = '';
    }
  }
}

function removePendingAgencyUser(id) {
  pendingAgencyAssignments = pendingAgencyAssignments.filter(x => x !== id);
  renderClientAgencyAccess();
}

function saveAgencyUser(id) {
  const user = agencyMembers.find(m => m.id === id);
  if(user) {
    user.workspaces.push(state.currentActiveClient);
    pendingAgencyAssignments = pendingAgencyAssignments.filter(x => x !== id);
    renderClientAgencyAccess();
    renderAgencyMembers(); 
    showNotification(`Access granted to ${user.name}`, '✅');
  }
}

function saveAllAgencyUserAssignments() {
  pendingAgencyAssignments.forEach(id => {
    const user = agencyMembers.find(m => m.id === id);
    if(user && !user.workspaces.includes(state.currentActiveClient)) {
      user.workspaces.push(state.currentActiveClient);
    }
  });
  const count = pendingAgencyAssignments.length;
  pendingAgencyAssignments = [];
  renderClientAgencyAccess();
  renderAgencyMembers();
  showNotification(`Saved access for ${count} user(s)`, '✅');
}

function revokeAgencyUser(id) {
  const user = agencyMembers.find(m => m.id === id);
  if(user) {
    user.workspaces = user.workspaces.filter(ws => ws !== state.currentActiveClient);
    renderClientAgencyAccess();
    renderAgencyMembers();
    showNotification(`Access revoked for ${user.name}`, 'ℹ️');
  }
}

function injectDateFilters() {
  ['agency', 'client'].forEach(scope => {
    const mount = document.getElementById(`${scope}-date-filter-mount`);
    if (!mount) return;
    mount.innerHTML = `
      <div class="date-filter-bar m-0 p-0 border-0 shadow-none bg-transparent" id="${scope}-date-filter">
        <button type="button" class="date-filter-trigger" id="${scope}-date-filter-trigger" aria-expanded="false" onclick="toggleDateFilter('${scope}')">
          <i data-lucide="calendar" class="w-4 h-4 text-slate-500"></i>
          <span id="${scope}-date-range-label">Past 30 days</span>
          <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i>
        </button>
        <div class="date-filter-popover glass-panel rounded-2xl" id="${scope}-date-filter-popover">
          <div class="date-filter-tabs">
            <button type="button" class="date-filter-tab active" data-date-tab="past" onclick="switchDateFilterTab('${scope}','past')">Past</button>
            <button type="button" class="date-filter-tab" data-date-tab="current" onclick="switchDateFilterTab('${scope}','current')">Current</button>
            <button type="button" class="date-filter-tab" data-date-tab="range" onclick="switchDateFilterTab('${scope}','range')">Date Range</button>
          </div>
          <div class="date-filter-panel" data-date-panel="past">
            <div class="date-filter-config-row"><span class="date-filter-word">Past</span><input id="${scope}-date-past-number" class="date-config-input number" type="number" min="1" value="30"><select id="${scope}-date-past-unit" class="date-config-select unit"><option value="days">days</option><option value="weeks">weeks</option><option value="months">months</option><option value="years">years</option></select></div>
            <div id="${scope}-date-past-preview" class="date-filter-preview"></div>
          </div>
          <div class="date-filter-panel" data-date-panel="current" hidden>
            <div class="date-filter-config-row"><span class="date-filter-word">Current</span><select id="${scope}-date-current-unit" class="date-config-select current-unit"><option value="day">day</option><option value="week">week</option><option value="month">month</option><option value="year">year</option></select></div>
            <div id="${scope}-date-current-preview" class="date-filter-preview"></div>
          </div>
          <div class="date-filter-panel" data-date-panel="range" hidden>
            <div class="date-range-row"><input id="${scope}-date-range-start" class="date-config-input" type="date"><span class="date-filter-sep">→</span><input id="${scope}-date-range-end" class="date-config-input" type="date"></div>
            <div id="${scope}-date-range-preview" class="date-filter-preview"></div>
          </div>
          <div class="date-filter-actions"><button type="button" class="date-filter-cancel" onclick="closeDateFilter('${scope}')">Cancel</button><button type="button" class="date-filter-apply" onclick="applyDateFilter('${scope}')">Apply</button></div>
        </div>
      </div>
    `;
  });
}

function initStaticMocks() {
  const qTbody = document.getElementById('unmapped-accounts-tbody');
  if (qTbody) {
    const qData = [
      { p: 'google', n: 'APAC Search Brand Expansion', id: '#998-234-1102' },
      { p: 'meta', n: 'Meta CTWA Direct Inbound Promo', id: 'act_4920194820' },
      { p: 'google', n: 'Regional Growth Display Ads', id: '#552-901-7744' }
    ];
    qTbody.innerHTML = qData.map((a, i) => `
      <tr id="unmapped-row-${i+1}" data-platform="${a.p}">
        <td><span class="table-brand-name">${platformLogo(a.p, 'sm', true)}<strong>${a.p === 'google' ? 'Google' : 'Meta'}</strong></span></td>
        <td><strong>${a.n}</strong></td>
        <td><code>${a.id}</code></td>
        <td><input type="text" id="unmapped-select-${i+1}" class="search-input h-9 font-medium w-[240px] px-3 text-[13px]" placeholder="Search workspace..." list="datalist-workspaces" oninput="checkUnmappedQueueMapping(${i+1})" autocomplete="off"></td>
        <td><button id="btn-assign-${i+1}" class="btn-integ" onclick="assignUnmappedAccount(${i+1}, '${a.n}', '${a.id}')">Link Account</button></td>
      </tr>
    `).join('');
  }

  const orgsTbody = document.getElementById('agency-orgs-tbody');
  if (orgsTbody) {
    orgsTbody.innerHTML = masterWorkspacesData.slice(0, 2).map(ws => `
      <tr>
        <td><strong class="dashboard-workspace-link" onclick="inspectClientWorkspace('${ws.name}','client-profile')">${ws.name}</strong></td>
        <td>${ws.contact}</td>
        <td><div class="flex gap-2 items-center flex-nowrap whitespace-nowrap"><span class="platform-pill">${platformLogo('google', 'sm', true)}Google</span><span class="platform-pill">${platformLogo('meta', 'sm', true)}Meta</span></div></td>
        <td><span class="text-[13px] font-semibold text-slate-800">Jungkook Jeon</span></td>
        <td><button class="btn-integ px-3 py-1.5 text-xs" onclick="inspectClientWorkspace('${ws.name}','client-profile')">Manage Workspace →</button></td>
      </tr>
    `).join('');
  }

  renderClientUsers();
  renderClientAgencyAccess();
}

// Bind all to window so HTML event handlers work seamlessly
Object.assign(window, {
  jumpToScreen, toggleSidebar, handleBrandClick, toggleSwitcherDropdown,
  clearSwitcherSearch, filterSwitcherDropdown, selectWorkspaceFromSwitcher,
  filterWorkspaceTable, goToWorkspacePage, renderAgencyPerformanceTable,
  inspectClientWorkspace, openCreateOrgModal, switchAgencyTab, renderAgencyMembers,
  openCreateRoleModal, sendQuickInvite, selectRoleColor, markRoleModalModified,
  openEditRoleModal, saveRole, closeRoleModal, deleteCurrentRole,
  openManageUserModal, closeManageUserModal, filterManageUserWorkspaces,
  updateManageUserWsCount, saveUserManagement, openClientUserModal,
  closeClientUserModal, markClientUserModalModified, saveClientUser,
  saveAllInlineMappings, filterUnmappedAccounts, checkInlineMapping,
  clearSingleInlineMapping, mapUnlinkedWorkspace, checkUnmappedQueueMapping,
  assignUnmappedAccount, promptUnmap, closeUnmapWarning, confirmUnmapAccount,
  searchAndMapGoogleCid, searchAndMapMetaAccount, closeMapConfirm, confirmMapAccount,
  setClientHeatmapMetric, switchPerformanceView, toggleAdvancedFilterPanel,
  filterPerformanceTable, toggleAdvancedFilterItem, clearAllAdvancedFilters,
  clearPerformanceFilter, setClientTableSort, setAgencyTableSort,
  handleQueueAgencyUser, saveAllAgencyUserAssignments, removePendingAgencyUser,
  saveAgencyUser, revokeAgencyUser, handleDevSubtoggle, setTriageState,
  setOrgRoleMode, toggleDateFilter, switchDateFilterTab, applyDateFilter,
  closeDateFilter, drillDownPerformance, togglePrimaryContactState, setPrimaryContactDirectly,
  closeCreateOrgModal, markCreateOrgModalModified, createWorkspaceSubmit
});

document.addEventListener('click', function(e) {
  if (!e.target.closest('.date-filter-bar')) {
    document.querySelectorAll('.date-filter-bar.open').forEach(bar => { 
      bar.classList.remove('open'); 
      const t = bar.querySelector('.date-filter-trigger'); 
      if (t) t.setAttribute('aria-expanded', 'false'); 
    });
  }
  const wrap = document.getElementById('workspace-switcher-wrap');
  if (wrap && wrap.classList.contains('open') && !wrap.contains(e.target)) {
    closeSwitcherDropdown();
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { 
    if (document.getElementById('unmap-warning-modal')?.style.display !== 'none') closeUnmapWarning(); 
    if (document.getElementById('map-confirm-modal')?.style.display !== 'none') closeMapConfirm();
    if (document.getElementById('role-modal')?.style.display !== 'none') closeRoleModal();
    if (document.getElementById('user-management-modal')?.style.display !== 'none') closeManageUserModal();
    if (document.getElementById('client-user-modal')?.style.display !== 'none') closeClientUserModal();
    if (document.getElementById('create-workspace-modal')?.style.display !== 'none') closeCreateOrgModal();
  }
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (state.currentScreenId === 'client-home') renderClientDailyChart();
  }, 50); 
});

function initApp() {
  injectDateFilters();
  initStaticMocks();
  window.lucide?.createIcons();
  renderWorkspaceDatalist();
  renderWorkspaceTable();
  renderLiveMappedAccounts();
  renderUnlinkedWorkspaces();
  renderAgencyPerformanceTable();
  renderPerformanceTable();
  renderWorkspaceAdAccounts();
  renderAgencyMembers();
  renderRolesList();
  renderColorSelector();
  jumpToScreen('client-home');
  updateTopBarUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
