import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = new Hono();

// Get all students
app.get("/students", async (c) => {
  const students = await prisma.student.findMany();
  return c.json(students);
});

// Get all students with proctor details
app.get("/students/enriched", async (c) => {
  const students = await prisma.student.findMany({
    include: { proctor: true },
  });
  return c.json(students);
});

// Get all professors
app.get("/professors", async (c) => {
  const professors = await prisma.professor.findMany();
  return c.json(professors);
});

// Create a new student (Ensure no duplicate AadharNumber)
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

// Create a new professor (Ensure no duplicate AadharNumber)
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

// Get all students under a professor's proctorship
app.get("/professors/:professorId/proctorships", async (c) => {
  const professorId = c.req.param("professorId");
  const students = await prisma.student.findMany({
    where: { proctorId: professorId },
  });
  return c.json(students);
});

// Update student details
app.patch("/students/:studentId", async (c) => {
  const studentId = c.req.param("studentId");
  const data = await c.req.json();

  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data,
  });
  return c.json(updatedStudent);
});

// Update professor details
app.patch("/professors/:professorId", async (c) => {
  const professorId = c.req.param("professorId");
  const data = await c.req.json();
  const updatedProfessor = await prisma.professor.update({
    where: { id: professorId },
    data,
  });
  return c.json(updatedProfessor);
});

// Delete student
app.delete("/students/:studentId", async (c) => {
  const studentId = c.req.param("studentId");
  await prisma.student.delete({ where: { id: studentId } });
  return c.status(204).body(null);
});

// Delete professor
app.delete("/professors/:professorId", async (c) => {
  const professorId = c.req.param("professorId");
  await prisma.professor.delete({ where: { id: professorId } });
  return c.status(204).body(null);
});

// Assign student under a professor’s proctorship
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

// Get student's library membership
app.get("/students/:studentId/library-membership", async (c) => {
  const studentId = c.req.param("studentId");
  const membership = await prisma.libraryMembership.findUnique({
    where: { studentId },
  });
  if (!membership) return c.json({ error: "Not found" });
  return c.json(membership);
});

// Create library membership for a student
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

// Update library membership
app.patch("/students/:studentId/library-membership", async (c) => {
  const studentId = c.req.param("studentId");
  const data = await c.req.json();
  const updatedMembership = await prisma.libraryMembership.update({
    where: { studentId },
    data,
  });
  return c.json(updatedMembership);
});

// Delete library membership
app.delete("/students/:studentId/library-membership", async (c) => {
  const studentId = c.req.param("studentId");
  await prisma.libraryMembership.delete({ where: { studentId } });
  return c.status(204).body(null);
});

// Start server
serve(app);
console.log("Server running on http://localhost:3000");
