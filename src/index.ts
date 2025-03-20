import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = new Hono();

app.get("/students", async (c) => {
  const students = await prisma.student.findMany();
  return c.json(students);
});

app.get("/students/enriched", async (c) => {
  const students = await prisma.student.findMany({
    include: { proctor: true },
  });
  return c.json(students);
});

app.get("/professors", async (c) => {
  const professors = await prisma.professor.findMany();
  return c.json(professors);
});

app.post("/students", async (c) => {
  const { name, dateOfBirth, aadharNumber, proctorId } = await c.req.json();
  try {
    const student = await prisma.student.create({
      data: {
        name,
        dateOfBirth: new Date(dateOfBirth),
        aadharNumber,
        proctorId,
      },
    });
    return c.json(student, 201);
  } catch (error) {
    return c.json({ error: "Student with this Aadhar already exists" }, 400);
  }
});

app.post("/professors", async (c) => {
  const { name, seniority, aadharNumber } = await c.req.json();
  try {
    const professor = await prisma.professor.create({
      data: { name, seniority, aadharNumber },
    });
    return c.json(professor, 201);
  } catch (error) {
    return c.json({ error: "Professor with this Aadhar already exists" }, 401);
  }
});

app.get("/professors/:professorId/proctorships", async (c) => {
  const professorId = c.req.param("professorId");
  const students = await prisma.student.findMany({
    where: { proctorId: professorId },
  });
  return c.json(students);
});

app.patch("/students/:studentId", async (c) => {
  const studentId = c.req.param("studentId");
  const data = await c.req.json();

  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data,
  });
  return c.json(updatedStudent);
});

app.patch("/professors/:professorId", async (c) => {
  const professorId = c.req.param("professorId");
  const data = await c.req.json();
  const updatedProfessor = await prisma.professor.update({
    where: { id: professorId },
    data,
  });
  return c.json(updatedProfessor);
});

app.delete("/students/:studentId", async (c) => {
  const studentId = c.req.param("studentId");
  await prisma.student.delete({ where: { id: studentId } });
  return c.status(204).body(null);
});

app.delete("/professors/:professorId", async (c) => {
  const professorId = c.req.param("professorId");
  await prisma.professor.delete({ where: { id: professorId } });
  return c.status(204).body(null);
});

app.post("/professors/:professorId/proctorships", async (c) => {
  const professorId = c.req.param("professorId");
  const { studentId } = await c.req.json();
  try {
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { proctorId: professorId },
    });
    return c.json(updatedStudent);
  } catch (error) {
    return c.json({ error: "Invalid professor or student ID" }, 400);
  }
});

app.get("/students/:studentId/library-membership", async (c) => {
  const studentId = c.req.param("studentId");
  const membership = await prisma.libraryMembership.findUnique({
    where: { studentId },
  });
  if (!membership) return c.json({ error: "Not found" });
  return c.json(membership);
});

app.post("/students/:studentId/library-membership", async (c) => {
  const studentId = c.req.param("studentId");
  const { issueDate, expiryDate } = await c.req.json();

  try {
    const membership = await prisma.libraryMembership.create({
      data: {
        studentId,
        issueDate: new Date(issueDate),
        expiryDate: new Date(expiryDate),
      },
    });
    return c.json(membership);
  } catch (error) {
    return c.json({ error: "Library membership already exists" });
  }
});

app.patch("/students/:studentId/library-membership", async (c) => {
  const studentId = c.req.param("studentId");
  const data = await c.req.json();
  const updatedMembership = await prisma.libraryMembership.update({
    where: { studentId },
    data,
  });
  return c.json(updatedMembership);
});

app.delete("/students/:studentId/library-membership", async (c) => {
  const studentId = c.req.param("studentId");
  await prisma.libraryMembership.delete({ where: { studentId } });
  return c.status(204).body(null);
});

serve(app);
console.log("Server running on http://localhost:3000");
