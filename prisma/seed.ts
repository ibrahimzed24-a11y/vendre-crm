import { PrismaClient, Role, LeadStatus, Priority, DealStatus, ActivityType, TaskStatus, ResearchCategory, DuplicateEntityType, DuplicateStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning existing records...");
  await prisma.importRowError.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.duplicateCandidate.deleteMany();
  await prisma.researchRecord.deleteMany();
  await prisma.task.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.workspaceMembership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating workspaces...");
  const wsVendre = await prisma.workspace.create({
    data: {
      name: "VENDRE Sales",
      slug: "vendre-sales",
    },
  });

  const wsAgency = await prisma.workspace.create({
    data: {
      name: "Agency Sales",
      slug: "agency-sales",
    },
  });

  console.log("Creating default pipeline stages for both workspaces...");
  const stageDefs = [
    { name: "New Opportunity", displayOrder: 1, color: "#3B82F6", isWon: false, isLost: false },
    { name: "Qualification", displayOrder: 2, color: "#6366F1", isWon: false, isLost: false },
    { name: "Discovery", displayOrder: 3, color: "#8B5CF6", isWon: false, isLost: false },
    { name: "Proposal", displayOrder: 4, color: "#EC4899", isWon: false, isLost: false },
    { name: "Negotiation", displayOrder: 5, color: "#F59E0B", isWon: false, isLost: false },
    { name: "Won", displayOrder: 6, color: "#10B981", isWon: true, isLost: false },
    { name: "Lost", displayOrder: 7, color: "#EF4444", isWon: false, isLost: true },
  ];

  const vendreStages = [];
  for (const s of stageDefs) {
    const stage = await prisma.pipelineStage.create({
      data: {
        workspaceId: wsVendre.id,
        name: s.name,
        displayOrder: s.displayOrder,
        color: s.color,
        isWon: s.isWon,
        isLost: s.isLost,
      },
    });
    vendreStages.push(stage);
  }

  const agencyStages = [];
  for (const s of stageDefs) {
    const stage = await prisma.pipelineStage.create({
      data: {
        workspaceId: wsAgency.id,
        name: s.name,
        displayOrder: s.displayOrder,
        color: s.color,
        isWon: s.isWon,
        isLost: s.isLost,
      },
    });
    agencyStages.push(stage);
  }

  console.log("Creating users and memberships...");
  const defaultPasswordHash = await bcrypt.hash("Vendre2025!", 10);

  // Users
  const userOwner = await prisma.user.create({
    data: {
      name: "Ibrahim Zed",
      email: "owner@vendre.com",
      passwordHash: defaultPasswordHash,
    },
  });

  const userAdmin = await prisma.user.create({
    data: {
      name: "Sarah Jenkins",
      email: "admin@vendre.com",
      passwordHash: defaultPasswordHash,
    },
  });

  const userManager = await prisma.user.create({
    data: {
      name: "Marcus Vance",
      email: "manager@vendre.com",
      passwordHash: defaultPasswordHash,
    },
  });

  const userSales = await prisma.user.create({
    data: {
      name: "David Miller",
      email: "sales@vendre.com",
      passwordHash: defaultPasswordHash,
    },
  });

  const userAgencyLead = await prisma.user.create({
    data: {
      name: "Elena Rostova",
      email: "agency.lead@vendre.com",
      passwordHash: defaultPasswordHash,
    },
  });

  const userAgencySales = await prisma.user.create({
    data: {
      name: "Lucas Thorne",
      email: "agency.sales@vendre.com",
      passwordHash: defaultPasswordHash,
    },
  });

  const userViewer = await prisma.user.create({
    data: {
      name: "Claire Dupont",
      email: "viewer@vendre.com",
      passwordHash: defaultPasswordHash,
    },
  });

  // Memberships
  // Owner is in BOTH workspaces
  await prisma.workspaceMembership.create({
    data: { userId: userOwner.id, workspaceId: wsVendre.id, role: Role.OWNER },
  });
  await prisma.workspaceMembership.create({
    data: { userId: userOwner.id, workspaceId: wsAgency.id, role: Role.OWNER },
  });

  // VENDRE Sales Members
  await prisma.workspaceMembership.create({
    data: { userId: userAdmin.id, workspaceId: wsVendre.id, role: Role.ADMIN },
  });
  await prisma.workspaceMembership.create({
    data: { userId: userManager.id, workspaceId: wsVendre.id, role: Role.MANAGER },
  });
  await prisma.workspaceMembership.create({
    data: { userId: userSales.id, workspaceId: wsVendre.id, role: Role.SALES },
  });
  await prisma.workspaceMembership.create({
    data: { userId: userViewer.id, workspaceId: wsVendre.id, role: Role.VIEW_ONLY },
  });

  // Agency Sales Members
  await prisma.workspaceMembership.create({
    data: { userId: userAgencyLead.id, workspaceId: wsAgency.id, role: Role.MANAGER },
  });
  await prisma.workspaceMembership.create({
    data: { userId: userAgencySales.id, workspaceId: wsAgency.id, role: Role.SALES },
  });

  console.log("Seeding VENDRE Sales records...");
  // Organizations
  const orgApex = await prisma.organization.create({
    data: {
      workspaceId: wsVendre.id,
      name: "Apex Logistics International",
      website: "https://apexlogistics.example.com",
      industry: "Supply Chain & Logistics",
      country: "United States",
      city: "Chicago",
      phone: "+1 312 555 0192",
      email: "inquiries@apexlogistics.example.com",
      address: "200 N Michigan Ave, Suite 1400",
      description: "Midwest freight distributor evaluating enterprise tracking CRM integration.",
      ownerId: userSales.id,
      createdById: userAdmin.id,
    },
  });

  const orgNordic = await prisma.organization.create({
    data: {
      workspaceId: wsVendre.id,
      name: "Nordic Clean Energy",
      website: "https://nordicclean.example.com",
      industry: "Renewable Energy",
      country: "Sweden",
      city: "Stockholm",
      phone: "+46 8 555 0143",
      email: "contact@nordicclean.example.com",
      address: "Sveavägen 44",
      description: "Solar and offshore wind provider looking for procurement workflow automation.",
      ownerId: userManager.id,
      createdById: userAdmin.id,
    },
  });

  const orgHelios = await prisma.organization.create({
    data: {
      workspaceId: wsVendre.id,
      name: "Helios Medical Devices",
      website: "https://heliosmed.example.com",
      industry: "Healthcare",
      country: "Germany",
      city: "Munich",
      phone: "+49 89 555 0281",
      email: "office@heliosmed.example.com",
      address: "Maximilianstraße 12",
      description: "Class II diagnostic imaging manufacturer with multi-regional distributor network.",
      ownerId: userSales.id,
      createdById: userOwner.id,
    },
  });

  // Contacts
  const contactJohn = await prisma.contact.create({
    data: {
      workspaceId: wsVendre.id,
      organizationId: orgApex.id,
      firstName: "John",
      lastName: "Kowalski",
      jobTitle: "VP of Global Supply",
      email: "j.kowalski@apexlogistics.example.com",
      phone: "+1 312 555 0193",
      whatsApp: "+1 312 555 0193",
      country: "United States",
      city: "Chicago",
      linkedInUrl: "https://linkedin.com/in/johnkowalski-supply",
      notes: "Primary sponsor. Prefers concise email briefings and quantitative ROI models.",
      ownerId: userSales.id,
      createdById: userSales.id,
    },
  });

  const contactAstrid = await prisma.contact.create({
    data: {
      workspaceId: wsVendre.id,
      organizationId: orgNordic.id,
      firstName: "Astrid",
      lastName: "Lindqvist",
      jobTitle: "Head of Procurement",
      email: "astrid.l@nordicclean.example.com",
      phone: "+46 8 555 0144",
      whatsApp: "+46 8 555 0144",
      country: "Sweden",
      city: "Stockholm",
      linkedInUrl: "https://linkedin.com/in/astrid-lindqvist-nordic",
      notes: "Budget signed off for Q1. Key decision criteria is strict security and on-premise portability.",
      ownerId: userManager.id,
      createdById: userManager.id,
    },
  });

  const contactKlaus = await prisma.contact.create({
    data: {
      workspaceId: wsVendre.id,
      organizationId: orgHelios.id,
      firstName: "Klaus",
      lastName: "Weber",
      jobTitle: "Director of Digital Operations",
      email: "klaus.weber@heliosmed.example.com",
      phone: "+49 89 555 0282",
      whatsApp: "+49 89 555 0282",
      country: "Germany",
      city: "Munich",
      linkedInUrl: "https://linkedin.com/in/klaus-weber-med",
      notes: "Technical evaluator. Highly interested in API export and transactional audit trail.",
      ownerId: userSales.id,
      createdById: userOwner.id,
    },
  });

  // Leads
  const leadApex = await prisma.lead.create({
    data: {
      workspaceId: wsVendre.id,
      title: "Apex North American Fleet Modernization",
      contactId: contactJohn.id,
      organizationId: orgApex.id,
      source: "Outbound Referral",
      status: LeadStatus.QUALIFIED,
      priority: Priority.HIGH,
      estimatedValue: 125000.0,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      nextFollowUp: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      description: "Comprehensive software rollout for 45 logistics dispatch stations.",
      ownerId: userSales.id,
      createdById: userSales.id,
    },
  });

  const leadNordic = await prisma.lead.create({
    data: {
      workspaceId: wsVendre.id,
      title: "Nordic Grid Vendor Portal Expansion",
      contactId: contactAstrid.id,
      organizationId: orgNordic.id,
      source: "Inbound Webinar",
      status: LeadStatus.CONTACTED,
      priority: Priority.URGENT,
      estimatedValue: 195000.0,
      expectedCloseDate: new Date(Date.now() + 45 * 24 * 3600 * 1000),
      nextFollowUp: new Date(Date.now() + 1 * 24 * 3600 * 1000),
      description: "Procurement pipeline overhaul across 3 Scandinavian offices.",
      ownerId: userManager.id,
      createdById: userManager.id,
    },
  });

  // Deals
  const dealHelios = await prisma.deal.create({
    data: {
      workspaceId: wsVendre.id,
      title: "Helios Enterprise Medical Portal",
      stageId: vendreStages[3].id, // Proposal
      organizationId: orgHelios.id,
      contactId: contactKlaus.id,
      value: 280000.0,
      currency: "USD",
      probability: 70,
      expectedCloseDate: new Date(Date.now() + 20 * 24 * 3600 * 1000),
      status: DealStatus.OPEN,
      description: "Full private CRM installation with custom audit compliance modules.",
      ownerId: userSales.id,
      createdById: userOwner.id,
    },
  });

  const dealWonApex = await prisma.deal.create({
    data: {
      workspaceId: wsVendre.id,
      title: "Apex Midwest Pilot License",
      stageId: vendreStages[5].id, // Won
      organizationId: orgApex.id,
      contactId: contactJohn.id,
      value: 65000.0,
      currency: "USD",
      probability: 100,
      expectedCloseDate: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      status: DealStatus.WON,
      description: "Phase 1 proof-of-concept license successfully completed and paid.",
      ownerId: userSales.id,
      createdById: userSales.id,
    },
  });

  // Activities
  await prisma.activity.create({
    data: {
      workspaceId: wsVendre.id,
      type: ActivityType.MEETING,
      subject: "Architecture & Security Alignment Call",
      description: "Reviewed self-hosted container deployment, data isolation guarantees, and RBAC matrix with Klaus Weber.",
      organizationId: orgHelios.id,
      contactId: contactKlaus.id,
      dealId: dealHelios.id,
      outcome: "Positive. Security team approved moving to Proposal stage.",
      authorId: userSales.id,
      date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    },
  });

  await prisma.activity.create({
    data: {
      workspaceId: wsVendre.id,
      type: ActivityType.CALL,
      subject: "Budget confirmation with Astrid",
      description: "Astrid confirmed board allocation of $200k for European grid software.",
      organizationId: orgNordic.id,
      contactId: contactAstrid.id,
      leadId: leadNordic.id,
      outcome: "Budget confirmed. Scheduling technical demo.",
      authorId: userManager.id,
      date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
    },
  });

  // Tasks
  await prisma.task.create({
    data: {
      workspaceId: wsVendre.id,
      title: "Deliver Helios MSA and Security Whitepaper",
      description: "Send PDF breakdown of local database isolation and role matrix.",
      assignedUserId: userSales.id,
      createdById: userManager.id,
      organizationId: orgHelios.id,
      contactId: contactKlaus.id,
      dealId: dealHelios.id,
      dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000),
      priority: Priority.URGENT,
      status: TaskStatus.IN_PROGRESS,
    },
  });

  await prisma.task.create({
    data: {
      workspaceId: wsVendre.id,
      title: "Schedule Q1 Apex Executive Review",
      description: "Review initial pilot telemetry and discuss phase 2 expansion.",
      assignedUserId: userSales.id,
      createdById: userSales.id,
      organizationId: orgApex.id,
      contactId: contactJohn.id,
      dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      priority: Priority.MEDIUM,
      status: TaskStatus.PENDING,
    },
  });

  // Research Records
  await prisma.researchRecord.create({
    data: {
      workspaceId: wsVendre.id,
      title: "European Grid Modernization Regulatory Mandates 2026",
      category: ResearchCategory.INDUSTRY,
      description: "EU Directive 2025/18 requires all regional renewable operators to enforce strict localized audit logging and tamper-proof records.",
      sourceUrl: "https://ec.europa.eu/energy/guidelines-2026",
      organizationId: orgNordic.id,
      authorId: userManager.id,
    },
  });

  // Audit Logs
  await prisma.auditLog.create({
    data: {
      workspaceId: wsVendre.id,
      userId: userOwner.id,
      action: "DEAL_CREATE",
      entityType: "DEAL",
      entityId: dealHelios.id,
      metadata: { title: dealHelios.title, value: dealHelios.value },
    },
  });

  console.log("Seeding Agency Sales records (isolated workspace)...");
  // Agency Org
  const orgQuantum = await prisma.organization.create({
    data: {
      workspaceId: wsAgency.id,
      name: "Quantum Growth Partners",
      website: "https://quantumgrowth.example.com",
      industry: "Digital Marketing & Media",
      country: "United Kingdom",
      city: "London",
      phone: "+44 20 7946 0912",
      email: "hello@quantumgrowth.example.com",
      address: "100 Bishopsgate, Level 18",
      description: "Performance marketing firm managing multi-million quarterly ad spend.",
      ownerId: userAgencySales.id,
      createdById: userAgencyLead.id,
    },
  });

  // Agency Contact
  const contactOliver = await prisma.contact.create({
    data: {
      workspaceId: wsAgency.id,
      organizationId: orgQuantum.id,
      firstName: "Oliver",
      lastName: "Sterling",
      jobTitle: "Managing Partner",
      email: "oliver@quantumgrowth.example.com",
      phone: "+44 20 7946 0913",
      whatsApp: "+44 20 7946 0913",
      country: "United Kingdom",
      city: "London",
      linkedInUrl: "https://linkedin.com/in/oliver-sterling-quantum",
      notes: "Looking to outsource end-to-end B2B outbound pipeline development.",
      ownerId: userAgencySales.id,
      createdById: userAgencyLead.id,
    },
  });

  // Agency Deal
  await prisma.deal.create({
    data: {
      workspaceId: wsAgency.id,
      title: "Quantum Growth Retainer Q1-Q2",
      stageId: agencyStages[2].id, // Discovery
      organizationId: orgQuantum.id,
      contactId: contactOliver.id,
      value: 72000.0,
      currency: "USD",
      probability: 60,
      expectedCloseDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
      status: DealStatus.OPEN,
      description: "6-month dedicated sales development rep and pipeline acquisition package.",
      ownerId: userAgencySales.id,
      createdById: userAgencyLead.id,
    },
  });

  // Agency Audit
  await prisma.auditLog.create({
    data: {
      workspaceId: wsAgency.id,
      userId: userAgencyLead.id,
      action: "ORG_CREATE",
      entityType: "ORGANIZATION",
      entityId: orgQuantum.id,
      metadata: { name: orgQuantum.name },
    },
  });

  console.log("Database seeded successfully with fully isolated multi-workspace records!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
