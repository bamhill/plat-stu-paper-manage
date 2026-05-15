import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.timelineEvent.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.thesisReview.deleteMany();
  await prisma.revision.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.paperVersion.deleteMany();
  await prisma.paper.deleteMany();
  await prisma.thesis.deleteMany();
  await prisma.student.deleteMany();

  // Students
  const liu = await prisma.student.create({
    data: {
      name: "刘欣雨",
      studentNo: "20243001",
      degreeType: "工学硕士",
      enrollmentYear: 2024,
      direction: "管理科学与工程",
      supervisor: "待定",
      status: "active",
    },
  });

  const qiu = await prisma.student.create({
    data: {
      name: "邱澳雪",
      studentNo: "20243002",
      degreeType: "工业工程专硕",
      enrollmentYear: 2024,
      direction: "工业工程",
      supervisor: "待定",
      status: "active",
    },
  });

  const chen = await prisma.student.create({
    data: {
      name: "陈儒全",
      studentNo: "20243003",
      degreeType: "MBA全日制",
      enrollmentYear: 2024,
      direction: "工商管理",
      supervisor: "待定",
      status: "active",
    },
  });

  console.log("Seed data created: 刘欣雨, 邱澳雪, 陈儒全");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
