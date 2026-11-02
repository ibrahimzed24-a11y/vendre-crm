import { z } from "zod";
import { LeadStatus, Priority, DealStatus, ActivityType, TaskStatus, ResearchCategory, Role } from "@prisma/client";

export const OrganizationInputSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(255),
  website: z.string().url("Must be a valid URL").or(z.literal("")).nullable().optional(),
  industry: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")).nullable().optional(),
  address: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

export const ContactInputSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  organizationId: z.string().uuid().nullable().optional(),
  jobTitle: z.string().max(150).nullable().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  whatsApp: z.string().max(50).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  linkedInUrl: z.string().url("Must be a valid URL").or(z.literal("")).nullable().optional(),
  notes: z.string().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

export const LeadInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  contactId: z.string().uuid().nullable().optional(),
  organizationId: z.string().uuid().nullable().optional(),
  source: z.string().max(100).default("Inbound"),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  estimatedValue: z.number().min(0).default(0),
  expectedCloseDate: z.string().or(z.date()).nullable().optional(),
  nextFollowUp: z.string().or(z.date()).nullable().optional(),
  description: z.string().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

export const LeadConvertSchema = z.object({
  leadId: z.string().uuid("Invalid lead ID"),
  dealTitle: z.string().min(1, "Deal title is required").max(255),
  stageId: z.string().uuid("Destination stage is required"),
  value: z.number().min(0, "Value must be positive").default(0),
  currency: z.string().default("USD"),
  expectedCloseDate: z.string().or(z.date()).nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

export const DealInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  stageId: z.string().uuid("Stage is required"),
  organizationId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  value: z.number().min(0).default(0),
  currency: z.string().max(10).default("USD"),
  probability: z.number().min(0).max(100).default(50),
  expectedCloseDate: z.string().or(z.date()).nullable().optional(),
  status: z.nativeEnum(DealStatus).default(DealStatus.OPEN),
  description: z.string().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

export const DealStageMoveSchema = z.object({
  dealId: z.string().uuid(),
  destinationStageId: z.string().uuid(),
});

export const PipelineStageInputSchema = z.object({
  name: z.string().min(1, "Stage name is required").max(100),
  displayOrder: z.number().int().min(1),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color").default("#3B82F6"),
  isWon: z.boolean().default(false),
  isLost: z.boolean().default(false),
});

export const ActivityInputSchema = z.object({
  type: z.nativeEnum(ActivityType),
  subject: z.string().min(1, "Subject is required").max(255),
  description: z.string().nullable().optional(),
  organizationId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  dealId: z.string().uuid().nullable().optional(),
  outcome: z.string().max(255).nullable().optional(),
  date: z.string().or(z.date()).default(() => new Date().toISOString()),
});

export const TaskInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().nullable().optional(),
  assignedUserId: z.string().uuid().nullable().optional(),
  organizationId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  dealId: z.string().uuid().nullable().optional(),
  dueDate: z.string().or(z.date()).nullable().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.PENDING),
});

export const ResearchInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  category: z.nativeEnum(ResearchCategory).default(ResearchCategory.MARKET),
  description: z.string().min(1, "Description is required"),
  sourceUrl: z.string().url("Must be valid URL").or(z.literal("")).nullable().optional(),
  organizationId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
});

export const DuplicateMergeSchema = z.object({
  candidateId: z.string().uuid(),
  entityType: z.enum(["ORGANIZATION", "CONTACT"]),
  primaryRecordId: z.string().uuid(),
  duplicateRecordId: z.string().uuid(),
  fieldStrategy: z.record(z.string(), z.enum(["primary", "duplicate"])).optional(),
});
