import { prisma } from "@/lib/prisma";
import { DealStatus, LeadStatus, TaskStatus } from "@prisma/client";

export async function getDashboardMetrics(workspaceId: string, dateRange?: "month" | "quarter" | "year" | "all") {
  let dateFilter: Date | undefined = undefined;
  const now = new Date();
  if (dateRange === "month") {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (dateRange === "quarter") {
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    dateFilter = new Date(now.getFullYear(), quarterMonth, 1);
  } else if (dateRange === "year") {
    dateFilter = new Date(now.getFullYear(), 0, 1);
  }

  const dealWhere: any = { workspaceId };
  const leadWhere: any = { workspaceId };
  if (dateFilter) {
    dealWhere.createdAt = { gte: dateFilter };
    leadWhere.createdAt = { gte: dateFilter };
  }

  const [
    orgCount,
    contactCount,
    leadCount,
    convertedLeadCount,
    openDeals,
    wonDeals,
    lostDeals,
    allStages,
    overdueTasksCount,
    completedActivitiesCount,
    upcomingFollowUps,
    recentActivities,
    upcomingTasks,
  ] = await Promise.all([
    prisma.organization.count({ where: { workspaceId } }),
    prisma.contact.count({ where: { workspaceId } }),
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.count({ where: { ...leadWhere, status: LeadStatus.CONVERTED } }),
    prisma.deal.findMany({
      where: { ...dealWhere, status: DealStatus.OPEN },
      select: { value: true },
    }),
    prisma.deal.findMany({
      where: { ...dealWhere, status: DealStatus.WON },
      select: { value: true },
    }),
    prisma.deal.findMany({
      where: { ...dealWhere, status: DealStatus.LOST },
      select: { value: true },
    }),
    prisma.pipelineStage.findMany({
      where: { workspaceId },
      orderBy: { displayOrder: "asc" },
      include: {
        deals: {
          where: dealWhere,
          select: { value: true },
        },
      },
    }),
    prisma.task.count({
      where: {
        workspaceId,
        dueDate: { lt: new Date() },
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      },
    }),
    prisma.activity.count({ where: { workspaceId } }),
    prisma.lead.findMany({
      where: {
        workspaceId,
        nextFollowUp: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        },
        status: { notIn: [LeadStatus.CONVERTED, LeadStatus.UNQUALIFIED] },
      },
      include: {
        contact: { select: { firstName: true, lastName: true } },
        organization: { select: { name: true } },
      },
      take: 5,
      orderBy: { nextFollowUp: "asc" },
    }),
    prisma.activity.findMany({
      where: { workspaceId },
      take: 8,
      orderBy: { date: "desc" },
      include: {
        author: { select: { id: true, name: true } },
        organization: { select: { name: true } },
        deal: { select: { title: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        workspaceId,
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      },
      take: 5,
      orderBy: { dueDate: "asc" },
      include: {
        assignedUser: { select: { id: true, name: true } },
      },
    }),
  ]);

  const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const wonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const totalDecided = wonDeals.length + lostDeals.length;
  const winRate = totalDecided > 0 ? Math.round((wonDeals.length / totalDecided) * 100) : 0;
  const conversionRate = leadCount > 0 ? Math.round((convertedLeadCount / leadCount) * 100) : 0;

  // Stage distribution
  const stageDistribution = allStages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    color: stage.color,
    count: stage.deals.length,
    value: stage.deals.reduce((acc, d) => acc + d.value, 0),
  }));

  // Lead sources
  const leadsBySource = await prisma.lead.groupBy({
    by: ["source"],
    where: leadWhere,
    _count: { id: true },
  });

  const sourceDistribution = leadsBySource.map((s) => ({
    source: s.source || "Unknown",
    count: s._count.id,
  }));

  return {
    metrics: {
      organizations: orgCount,
      contacts: contactCount,
      leads: leadCount,
      openDeals: openDeals.length,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length,
      pipelineValue,
      wonRevenue,
      winRate,
      conversionRate,
      overdueTasks: overdueTasksCount,
      completedActivities: completedActivitiesCount,
    },
    stageDistribution,
    sourceDistribution,
    upcomingFollowUps,
    recentActivities,
    upcomingTasks,
  };
}

export async function getDetailedReports(workspaceId: string) {
  const [deals, leads, members] = await Promise.all([
    prisma.deal.findMany({
      where: { workspaceId },
      include: {
        stage: true,
        owner: { select: { id: true, name: true } },
        organization: { select: { name: true } },
      },
    }),
    prisma.lead.findMany({
      where: { workspaceId },
      include: {
        owner: { select: { id: true, name: true } },
      },
    }),
    prisma.workspaceMembership.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  // Sales rep performance
  const repStats = members.map((m) => {
    const userDeals = deals.filter((d) => d.ownerId === m.userId);
    const wonDeals = userDeals.filter((d) => d.status === DealStatus.WON);
    const wonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const pipelineValue = userDeals
      .filter((d) => d.status === DealStatus.OPEN)
      .reduce((sum, d) => sum + d.value, 0);
    const userLeads = leads.filter((l) => l.ownerId === m.userId);

    return {
      userId: m.userId,
      userName: m.user.name,
      userEmail: m.user.email,
      role: m.role,
      dealCount: userDeals.length,
      wonCount: wonDeals.length,
      wonRevenue,
      pipelineValue,
      leadCount: userLeads.length,
    };
  });

  return {
    repStats,
    totalDeals: deals.length,
    totalLeads: leads.length,
  };
}
