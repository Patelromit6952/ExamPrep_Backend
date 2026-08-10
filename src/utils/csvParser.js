import { parse } from "csv-parse/sync";

/**
 * Parses a CSV buffer into an array of plain row objects using the header
 * row as keys. Expected columns for question bulk-upload:
 * questionText, optionA, optionB, optionC, optionD, correctOption, marks, topic, difficulty, explanation
 */
export const parseQuestionsCsv = (buffer) => {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
};

/**
 * Converts one raw CSV row into the shape expected by the Question model.
 * Throws a descriptive error if the row is invalid so the caller can
 * collect per-row error messages.
 */
export const mapCsvRowToQuestion = (row, rowIndex, examId, sectionId) => {
  const required = [
    "questionText",
    "optionA",
    "optionB",
    "optionC",
    "optionD",
    "correctOption",
    "marks",
  ];

  for (const field of required) {
    if (!row[field] || String(row[field]).trim() === "") {
      throw new Error(`Row ${rowIndex}: missing required field "${field}"`);
    }
  }

  const optionMap = { A: "optA", B: "optB", C: "optC", D: "optD" };
  const correctKey = String(row.correctOption).trim().toUpperCase();

  if (!["A", "B", "C", "D"].includes(correctKey)) {
    throw new Error(
      `Row ${rowIndex}: correctOption must be one of A, B, C, D (got "${row.correctOption}")`
    );
  }

  const marks = Number(row.marks);
  if (Number.isNaN(marks) || marks <= 0) {
    throw new Error(`Row ${rowIndex}: marks must be a positive number`);
  }

  const options = [
    { id: "optA", text: row.optionA.trim() },
    { id: "optB", text: row.optionB.trim() },
    { id: "optC", text: row.optionC.trim() },
    { id: "optD", text: row.optionD.trim() },
  ];

  return {
    examId,
    sectionId: sectionId || null,
    questionText: row.questionText.trim(),
    options,
    correctOptionId: optionMap[correctKey],
    marks,
    topic: row.topic ? row.topic.trim() : "General",
    difficulty: ["easy", "medium", "hard"].includes(
      (row.difficulty || "").trim().toLowerCase()
    )
      ? row.difficulty.trim().toLowerCase()
      : "medium",
    explanation: row.explanation ? row.explanation.trim() : "",
  };
};
