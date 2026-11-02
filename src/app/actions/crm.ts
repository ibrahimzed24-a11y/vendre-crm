"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/auth";
import * as orgService from "@/services/organization.service";
import * as contactService from "@/services/contact.service";
import * as leadService from "@/services/lead.service";
import * as dealService from "@/services/deal.service";
import * as pipelineService from "@/services/pipeline.service";
import * as activityService from "@/services/activity.service";
import * as taskService from "@/services/task.service";
import * as researchService from "@/services/research.service";
import * as duplicateService from "@/services/duplicate.service";

// ======================= ORGANIZATIONS =======================
export async function createOrganizationAction(data: unknown) {
  const ctx = await requireAuthContext();
  const result = await orgService.createOrganization({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    data,
  });
  revalidatePath("/organizations");
  revalidatePath("/");
  return { success: true, data: result };
}

export async function updateOrganizationAction(id: string, data: unknown) {
  const ctx = await requireAuthContext();
  const result = await orgService.updateOrganization({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
    data,
  });
  revalidatePath("/organizations");
  revalidatePath(`/organizations/${id}`);
  return { success: true, data: result };
}

export async function deleteOrganizationAction(id: string) {
  const ctx = await requireAuthContext();
  const result = await orgService.deleteOrganization({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
  });
  revalidatePath("/organizations");
  revalidatePath("/");
  return result;
}

// ======================= CONTACTS =======================
export async function createContactAction(data: unknown) {
  const ctx = await requireAuthContext();
  const result = await contactService.createContact({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    data,
  });
  revalidatePath("/contacts");
  revalidatePath("/");
  return { success: true, data: result };
}

export async function updateContactAction(id: string, data: unknown) {
  const ctx = await requireAuthContext();
  const result = await contactService.updateContact({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
    data,
  });
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  return { success: true, data: result };
}

export async function deleteContactAction(id: string) {
  const ctx = await requireAuthContext();
  const result = await contactService.deleteContact({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
  });
  revalidatePath("/contacts");
  revalidatePath("/");
  return result;
}

// ======================= LEADS =======================
export async function createLeadAction(data: unknown) {
  const ctx = await requireAuthContext();
  const result = await leadService.createLead({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    data,
  });
  revalidatePath("/leads");
  revalidatePath("/");
  return { success: true, data: result };
}

export async function updateLeadAction(id: string, data: unknown) {
  const ctx = await requireAuthContext();
  const result = await leadService.updateLead({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
    data,
  });
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { success: true, data: result };
}

export async function deleteLeadAction(id: string) {
  const ctx = await requireAuthContext();
  const result = await leadService.deleteLead({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
  });
  revalidatePath("/leads");
  revalidatePath("/");
  return result;
}

export async function convertLeadToDealAction(data: unknown) {
  const ctx = await requireAuthContext();
  const result = await leadService.convertLeadToDeal({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    data,
  });
  revalidatePath("/leads");
  revalidatePath("/deals");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return { success: true, data: result };
}

// ======================= DEALS =======================
export async function createDealAction(data: unknown) {
  const ctx = await requireAuthContext();
  const result = await dealService.createDeal({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    data,
  });
  revalidatePath("/deals");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return { success: true, data: result };
}

export async function updateDealAction(id: string, data: unknown) {
  const ctx = await requireAuthContext();
  const result = await dealService.updateDeal({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
    data,
  });
  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/");
  return { success: true, data: result };
}

export async function moveDealStageAction(data: unknown) {
  const ctx = await requireAuthContext();
  const result = await dealService.moveDealStage({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    data,
  });
  revalidatePath("/deals");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return { success: true, data: result };
}

export async function deleteDealAction(id: string) {
  const ctx = await requireAuthContext();
  const result = await dealService.deleteDeal({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
  });
  revalidatePath("/deals");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return result;
}

// ======================= PIPELINE STAGES =======================
export async function createPipelineStageAction(data: unknown) {
  const ctx = await requireAuthContext();
  const result = await pipelineService.createPipelineStage({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    data,
  });
  revalidatePath("/pipeline");
  revalidatePath("/settings");
  return { success: true, data: result };
}

export async function updatePipelineStageAction(id: string, data: unknown) {
  const ctx = await requireAuthContext();
  const result = await pipelineService.updatePipelineStage({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
    data,
  });
  revalidatePath("/pipeline");
  revalidatePath("/settings");
  return { success: true, data: result };
}

export async function deletePipelineStageAction(id: string, reassignmentStageId?: string) {
  const ctx = await requireAuthContext();
  const result = await pipelineService.deletePipelineStage({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
    reassignmentStageId,
  });
  revalidatePath("/pipeline");
  revalidatePath("/settings");
  return result;
}

// ======================= ACTIVITIES =======================
export async function createActivityAction(data: unknown) {
  const ctx = await requireAuthContext();
  const result = await activityService.createActivity({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    data,
  });
  revalidatePath("/activities");
  revalidatePath("/");
  return { success: true, data: result };
}

export async function deleteActivityAction(id: string) {
  const ctx = await requireAuthContext();
  const result = await activityService.deleteActivity({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
  });
  revalidatePath("/activities");
  revalidatePath("/");
  return result;
}

// ======================= TASKS =======================
export async function createTaskAction(data: unknown) {
  const ctx = await requireAuthContext();
  const result = await taskService.createTask({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    data,
  });
  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true, data: result };
}

export async function updateTaskAction(id: string, data: unknown) {
  const ctx = await requireAuthContext();
  const result = await taskService.updateTask({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
    data,
  });
  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true, data: result };
}

export async function deleteTaskAction(id: string) {
  const ctx = await requireAuthContext();
  const result = await taskService.deleteTask({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
  });
  revalidatePath("/tasks");
  revalidatePath("/");
  return result;
}

// ======================= RESEARCH =======================
export async function createResearchAction(data: unknown) {
  const ctx = await requireAuthContext();
  const result = await researchService.createResearch({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    data,
  });
  revalidatePath("/research");
  return { success: true, data: result };
}

export async function deleteResearchAction(id: string) {
  const ctx = await requireAuthContext();
  const result = await researchService.deleteResearch({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    id,
  });
  revalidatePath("/research");
  return result;
}

// ======================= DUPLICATES =======================
export async function triggerScanDuplicatesAction() {
  const ctx = await requireAuthContext();
  const result = await duplicateService.scanForDuplicates(ctx.workspace.id);
  revalidatePath("/duplicates");
  return { success: true, data: result };
}

export async function dismissDuplicateCandidateAction(candidateId: string) {
  const ctx = await requireAuthContext();
  const result = await duplicateService.dismissDuplicateCandidate({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    candidateId,
  });
  revalidatePath("/duplicates");
  return { success: true, data: result };
}

export async function mergeDuplicateRecordsAction(data: unknown) {
  const ctx = await requireAuthContext();
  const result = await duplicateService.mergeDuplicateRecords({
    workspaceId: ctx.workspace.id,
    userId: ctx.user.id,
    userRole: ctx.membership.role,
    data,
  });
  revalidatePath("/duplicates");
  revalidatePath("/organizations");
  revalidatePath("/contacts");
  revalidatePath("/");
  return result;
}
