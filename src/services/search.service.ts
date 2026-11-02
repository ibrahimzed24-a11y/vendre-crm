import { prisma } from "@/lib/prisma";

export interface SearchResultItem {
  id: string;
  type: "organization" | "contact" | "lead" | "deal" | "task" | "activity";
  title: string;
  subtitle: string;
  url: string;
}

export async function globalSearch(workspaceId: string, query: string): Promise<SearchResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const [orgs, contacts, leads, deals, tasks] = await Promise.all([
    prisma.organization.findMany({
      where: {
        workspaceId,
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { city: { contains: trimmed, mode: "insensitive" } },
          { email: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, industry: true, city: true },
    }),
    prisma.contact.findMany({
      where: {
        workspaceId,
        OR: [
          { firstName: { contains: trimmed, mode: "insensitive" } },
          { lastName: { contains: trimmed, mode: "insensitive" } },
          { email: { contains: trimmed, mode: "insensitive" } },
          { phone: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true },
    }),
    prisma.lead.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          { description: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, title: true, status: true, estimatedValue: true },
    }),
    prisma.deal.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          { description: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, title: true, value: true, status: true },
    }),
    prisma.task.findMany({
      where: {
        workspaceId,
        title: { contains: trimmed, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, title: true, status: true, priority: true },
    }),
  ]);

  const results: SearchResultItem[] = [];

  orgs.forEach((o) =>
    results.push({
      id: o.id,
      type: "organization",
      title: o.name,
      subtitle: [o.industry, o.city].filter(Boolean).join(" • ") || "Organization",
      url: `/organizations/${o.id}`,
    })
  );

  contacts.forEach((c) =>
    results.push({
      id: c.id,
      type: "contact",
      title: `${c.firstName} ${c.lastName}`,
      subtitle: [c.jobTitle, c.email].filter(Boolean).join(" • ") || "Contact",
      url: `/contacts/${c.id}`,
    })
  );

  leads.forEach((l) =>
    results.push({
      id: l.id,
      type: "lead",
      title: l.title,
      subtitle: `Lead • ${l.status} • $${l.estimatedValue.toLocaleString()}`,
      url: `/leads/${l.id}`,
    })
  );

  deals.forEach((d) =>
    results.push({
      id: d.id,
      type: "deal",
      title: d.title,
      subtitle: `Deal • ${d.status} • $${d.value.toLocaleString()}`,
      url: `/deals/${d.id}`,
    })
  );

  tasks.forEach((t) =>
    results.push({
      id: t.id,
      type: "task",
      title: t.title,
      subtitle: `Task • ${t.status} (${t.priority})`,
      url: `/tasks`,
    })
  );

  return results;
}
