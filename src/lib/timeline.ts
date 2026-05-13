import { prisma } from "./prisma";

interface CreateTimelineEventArgs {
  studentId: number;
  relatedType: string;
  relatedId: number;
  eventType: string;
  title: string;
  description?: string;
}

export async function createTimelineEvent(args: CreateTimelineEventArgs) {
  await prisma.timelineEvent.create({
    data: {
      studentId: args.studentId,
      relatedType: args.relatedType,
      relatedId: args.relatedId,
      eventType: args.eventType,
      title: args.title,
      description: args.description ?? null,
      eventDate: new Date(),
    },
  });
}
