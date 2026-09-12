import { prisma } from "./prisma";
import { requireTeacher } from "./auth";

interface CreateTimelineEventArgs {
  studentId: number;
  relatedType: string;
  relatedId: number;
  eventType: string;
  title: string;
  description?: string;
  eventDate?: Date;
}

export async function createTimelineEvent(args: CreateTimelineEventArgs) {
  const teacher = await requireTeacher();
  const student = await prisma.student.findFirst({ where: { id: args.studentId, teacherId: teacher.id }, select: { id: true } });
  if (!student) throw new Error("Student not found");
  await prisma.timelineEvent.create({
    data: {
      studentId: args.studentId,
      relatedType: args.relatedType,
      relatedId: args.relatedId,
      eventType: args.eventType,
      title: args.title,
      description: args.description ?? null,
      eventDate: args.eventDate ?? new Date(),
    },
  });
}
