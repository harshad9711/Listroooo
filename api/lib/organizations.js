import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { deliverWebhook, WEBHOOK_EVENTS } from './webhooks.js';
import pino from 'pino';

const logger = pino({ name: 'organizations' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =========================
// ORGANIZATION MANAGEMENT
// =========================

export async function createOrganization(userId, organizationData) {
  try {
    const { name, description, plan = 'free' } = organizationData;

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data: existing } = await supabase
        .from('veo_organizations')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('veo_organizations')
      .insert({
        name,
        slug,
        description,
        plan,
        settings: {
          features: getPlanFeatures(plan),
          limits: getPlanLimits(plan),
        },
      })
      .select()
      .single();

    if (orgError) {
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('veo_organization_members')
      .insert({
        organization_id: organization.id,
        user_id: userId,
        role: 'owner',
        permissions: {
          '*': true, // Owner has all permissions
        },
      });

    if (memberError) {
      // Clean up organization if member creation fails
      await supabase.from('veo_organizations').delete().eq('id', organization.id);
      throw new Error(`Failed to add owner to organization: ${memberError.message}`);
    }

    // Send webhook
    await deliverWebhook(organization.id, WEBHOOK_EVENTS.ORGANIZATION_UPDATED, {
      event_type: WEBHOOK_EVENTS.ORGANIZATION_UPDATED,
      organization_id: organization.id,
      organization: organization,
      timestamp: new Date().toISOString(),
    });

    logger.info({ organizationId: organization.id, userId }, 'Organization created');
    return organization;
  } catch (error) {
    logger.error({ userId, error: error.message }, 'Failed to create organization');
    throw error;
  }
}

export async function getOrganization(organizationId) {
  try {
    const { data, error } = await supabase
      .from('veo_organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error) {
      throw new Error(`Organization not found: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error({ organizationId, error: error.message }, 'Failed to get organization');
    throw error;
  }
}

export async function getUserOrganizations(userId) {
  try {
    const { data, error } = await supabase
      .from('veo_organization_members')
      .select(`
        role,
        permissions,
        joined_at,
        veo_organizations!inner(*)
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user organizations: ${error.message}`);
    }

    return data.map(member => ({
      ...member.veo_organizations,
      role: member.role,
      permissions: member.permissions,
      joined_at: member.joined_at,
    }));
  } catch (error) {
    logger.error({ userId, error: error.message }, 'Failed to get user organizations');
    throw error;
  }
}

export async function updateOrganization(organizationId, userId, updateData) {
  try {
    // Check if user has permission to update organization
    const member = await getOrganizationMember(organizationId, userId);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new Error('Insufficient permissions to update organization');
    }

    const { name, description, settings } = updateData;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (settings !== undefined) updateFields.settings = settings;

    const { data, error } = await supabase
      .from('veo_organizations')
      .update(updateFields)
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update organization: ${error.message}`);
    }

    // Send webhook
    await deliverWebhook(organizationId, WEBHOOK_EVENTS.ORGANIZATION_UPDATED, {
      event_type: WEBHOOK_EVENTS.ORGANIZATION_UPDATED,
      organization_id: organizationId,
      organization: data,
      timestamp: new Date().toISOString(),
    });

    logger.info({ organizationId, userId }, 'Organization updated');
    return data;
  } catch (error) {
    logger.error({ organizationId, userId, error: error.message }, 'Failed to update organization');
    throw error;
  }
}

export async function deleteOrganization(organizationId, userId) {
  try {
    // Check if user is owner
    const member = await getOrganizationMember(organizationId, userId);
    if (!member || member.role !== 'owner') {
      throw new Error('Only organization owners can delete organizations');
    }

    // Delete organization (cascade will handle related records)
    const { error } = await supabase
      .from('veo_organizations')
      .delete()
      .eq('id', organizationId);

    if (error) {
      throw new Error(`Failed to delete organization: ${error.message}`);
    }

    logger.info({ organizationId, userId }, 'Organization deleted');
    return { success: true };
  } catch (error) {
    logger.error({ organizationId, userId, error: error.message }, 'Failed to delete organization');
    throw error;
  }
}

// =========================
// MEMBER MANAGEMENT
// =========================

export async function addMember(organizationId, userId, memberData) {
  try {
    // Check if user has permission to add members
    const currentMember = await getOrganizationMember(organizationId, userId);
    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      throw new Error('Insufficient permissions to add members');
    }

    const { userEmail, role = 'member', permissions = {} } = memberData;

    // Get user by email (assuming you have a users table)
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError || !targetUser) {
      throw new Error('User not found');
    }

    // Check if user is already a member
    const existingMember = await getOrganizationMember(organizationId, targetUser.id);
    if (existingMember) {
      throw new Error('User is already a member of this organization');
    }

    // Add member
    const { data, error } = await supabase
      .from('veo_organization_members')
      .insert({
        organization_id: organizationId,
        user_id: targetUser.id,
        role,
        permissions,
        invited_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add member: ${error.message}`);
    }

    // Send webhook
    await deliverWebhook(organizationId, WEBHOOK_EVENTS.MEMBER_ADDED, {
      event_type: WEBHOOK_EVENTS.MEMBER_ADDED,
      organization_id: organizationId,
      member_id: data.id,
      user_id: targetUser.id,
      role,
      invited_by: userId,
      timestamp: new Date().toISOString(),
    });

    logger.info({ organizationId, userId, memberId: data.id }, 'Member added');
    return data;
  } catch (error) {
    logger.error({ organizationId, userId, error: error.message }, 'Failed to add member');
    throw error;
  }
}

export async function getOrganizationMembers(organizationId, userId) {
  try {
    // Check if user has permission to view members
    const member = await getOrganizationMember(organizationId, userId);
    if (!member) {
      throw new Error('User is not a member of this organization');
    }

    const { data, error } = await supabase
      .from('veo_organization_members')
      .select(`
        id,
        role,
        permissions,
        joined_at,
        invited_by,
        users!inner(id, email, name)
      `)
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get organization members: ${error.message}`);
    }

    return data.map(member => ({
      id: member.id,
      role: member.role,
      permissions: member.permissions,
      joined_at: member.joined_at,
      invited_by: member.invited_by,
      user: member.users,
    }));
  } catch (error) {
    logger.error({ organizationId, userId, error: error.message }, 'Failed to get organization members');
    throw error;
  }
}

export async function updateMember(organizationId, userId, memberId, updateData) {
  try {
    // Check if user has permission to update members
    const currentMember = await getOrganizationMember(organizationId, userId);
    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      throw new Error('Insufficient permissions to update members');
    }

    // Prevent non-owners from updating owners
    const targetMember = await getOrganizationMember(organizationId, memberId);
    if (targetMember.role === 'owner' && currentMember.role !== 'owner') {
      throw new Error('Only owners can update other owners');
    }

    const { role, permissions } = updateData;

    const updateFields = {};
    if (role !== undefined) updateFields.role = role;
    if (permissions !== undefined) updateFields.permissions = permissions;

    const { data, error } = await supabase
      .from('veo_organization_members')
      .update(updateFields)
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update member: ${error.message}`);
    }

    logger.info({ organizationId, userId, memberId }, 'Member updated');
    return data;
  } catch (error) {
    logger.error({ organizationId, userId, memberId, error: error.message }, 'Failed to update member');
    throw error;
  }
}

export async function removeMember(organizationId, userId, memberId) {
  try {
    // Check if user has permission to remove members
    const currentMember = await getOrganizationMember(organizationId, userId);
    if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
      throw new Error('Insufficient permissions to remove members');
    }

    // Prevent owners from removing themselves
    const targetMember = await getOrganizationMember(organizationId, memberId);
    if (targetMember.user_id === userId) {
      throw new Error('Cannot remove yourself from the organization');
    }

    // Prevent non-owners from removing owners
    if (targetMember.role === 'owner' && currentMember.role !== 'owner') {
      throw new Error('Only owners can remove other owners');
    }

    // Remove member
    const { error } = await supabase
      .from('veo_organization_members')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }

    // Send webhook
    await deliverWebhook(organizationId, WEBHOOK_EVENTS.MEMBER_REMOVED, {
      event_type: WEBHOOK_EVENTS.MEMBER_REMOVED,
      organization_id: organizationId,
      member_id: memberId,
      user_id: targetMember.user_id,
      removed_by: userId,
      timestamp: new Date().toISOString(),
    });

    logger.info({ organizationId, userId, memberId }, 'Member removed');
    return { success: true };
  } catch (error) {
    logger.error({ organizationId, userId, memberId, error: error.message }, 'Failed to remove member');
    throw error;
  }
}

// =========================
// PERMISSION CHECKING
// =========================

export async function getOrganizationMember(organizationId, userId) {
  try {
    const { data, error } = await supabase
      .from('veo_organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    logger.error({ organizationId, userId, error: error.message }, 'Failed to get organization member');
    return null;
  }
}

export async function checkPermission(organizationId, userId, permission) {
  try {
    const member = await getOrganizationMember(organizationId, userId);
    if (!member) {
      return false;
    }

    // Check role-based permissions
    if (member.role === 'owner') {
      return true;
    }

    if (member.role === 'admin' && !permission.includes('owner')) {
      return true;
    }

    // Check specific permissions
    if (member.permissions && member.permissions[permission] === true) {
      return true;
    }

    // Check wildcard permissions
    if (member.permissions && member.permissions['*'] === true) {
      return true;
    }

    return false;
  } catch (error) {
    logger.error({ organizationId, userId, permission, error: error.message }, 'Failed to check permission');
    return false;
  }
}

export async function requirePermission(organizationId, userId, permission) {
  const hasPermission = await checkPermission(organizationId, userId, permission);
  if (!hasPermission) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

// =========================
// PLAN MANAGEMENT
// =========================

export async function updatePlan(organizationId, userId, newPlan) {
  try {
    // Check if user is owner
    const member = await getOrganizationMember(organizationId, userId);
    if (!member || member.role !== 'owner') {
      throw new Error('Only organization owners can change plans');
    }

    // Update organization plan
    const { data, error } = await supabase
      .from('veo_organizations')
      .update({
        plan: newPlan,
        settings: {
          features: getPlanFeatures(newPlan),
          limits: getPlanLimits(newPlan),
        },
      })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update plan: ${error.message}`);
    }

    // Send webhook
    await deliverWebhook(organizationId, WEBHOOK_EVENTS.ORGANIZATION_UPDATED, {
      event_type: WEBHOOK_EVENTS.ORGANIZATION_UPDATED,
      organization_id: organizationId,
      organization: data,
      timestamp: new Date().toISOString(),
    });

    logger.info({ organizationId, userId, newPlan }, 'Plan updated');
    return data;
  } catch (error) {
    logger.error({ organizationId, userId, newPlan, error: error.message }, 'Failed to update plan');
    throw error;
  }
}

// =========================
// HELPER FUNCTIONS
// =========================

function getPlanFeatures(plan) {
  const features = {
    free: {
      video_generation: true,
      templates: true,
      brand_kits: true,
      api_access: false,
      webhooks: false,
      analytics: false,
      priority_support: false,
    },
    pro: {
      video_generation: true,
      templates: true,
      brand_kits: true,
      api_access: true,
      webhooks: true,
      analytics: true,
      priority_support: true,
    },
    enterprise: {
      video_generation: true,
      templates: true,
      brand_kits: true,
      api_access: true,
      webhooks: true,
      analytics: true,
      priority_support: true,
      custom_integrations: true,
      sso: true,
      audit_logs: true,
    },
  };

  return features[plan] || features.free;
}

function getPlanLimits(plan) {
  const limits = {
    free: {
      renders_per_day: 5,
      api_calls_per_hour: 100,
      storage_gb: 1,
      team_members: 1,
    },
    pro: {
      renders_per_day: 100,
      api_calls_per_hour: 1000,
      storage_gb: 10,
      team_members: 5,
    },
    enterprise: {
      renders_per_day: 1000,
      api_calls_per_hour: 10000,
      storage_gb: 100,
      team_members: 50,
    },
  };

  return limits[plan] || limits.free;
}

// =========================
// EXPORTS
// =========================

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

export const PERMISSIONS = {
  // Organization management
  ORG_UPDATE: 'org.update',
  ORG_DELETE: 'org.delete',
  ORG_BILLING: 'org.billing',
  
  // Member management
  MEMBERS_VIEW: 'members.view',
  MEMBERS_ADD: 'members.add',
  MEMBERS_UPDATE: 'members.update',
  MEMBERS_REMOVE: 'members.remove',
  
  // Resource management
  VIDEOS_CREATE: 'videos.create',
  VIDEOS_READ: 'videos.read',
  VIDEOS_UPDATE: 'videos.update',
  VIDEOS_DELETE: 'videos.delete',
  
  TEMPLATES_CREATE: 'templates.create',
  TEMPLATES_READ: 'templates.read',
  TEMPLATES_UPDATE: 'templates.update',
  TEMPLATES_DELETE: 'templates.delete',
  
  BRAND_KITS_CREATE: 'brand_kits.create',
  BRAND_KITS_READ: 'brand_kits.read',
  BRAND_KITS_UPDATE: 'brand_kits.update',
  BRAND_KITS_DELETE: 'brand_kits.delete',
  
  // Admin permissions
  ADMIN_ALL: 'admin.*',
};

