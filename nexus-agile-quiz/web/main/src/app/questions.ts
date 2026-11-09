export type OptionId = "a" | "b" | "c" | "d";

export interface QuestionDef {
  id: string;
  promptKey: string;
  options: { id: OptionId; labelKey: string }[];
  correct: OptionId;
  funFactKey: string;
}

const QUESTION_BANK: QuestionDef[] = [
  {
    id: "sprint",
    promptKey: "quiz.q1.prompt",
    options: [
      { id: "a", labelKey: "quiz.q1.a" },
      { id: "b", labelKey: "quiz.q1.b" },
      { id: "c", labelKey: "quiz.q1.c" },
      { id: "d", labelKey: "quiz.q1.d" },
    ],
    correct: "b",
    funFactKey: "quiz.q1.funFact",
  },
  {
    id: "daily-scrum",
    promptKey: "quiz.q2.prompt",
    options: [
      { id: "a", labelKey: "quiz.q2.a" },
      { id: "b", labelKey: "quiz.q2.b" },
      { id: "c", labelKey: "quiz.q2.c" },
      { id: "d", labelKey: "quiz.q2.d" },
    ],
    correct: "c",
    funFactKey: "quiz.q2.funFact",
  },
  {
    id: "definition-of-done",
    promptKey: "quiz.q3.prompt",
    options: [
      { id: "a", labelKey: "quiz.q3.a" },
      { id: "b", labelKey: "quiz.q3.b" },
      { id: "c", labelKey: "quiz.q3.c" },
      { id: "d", labelKey: "quiz.q3.d" },
    ],
    correct: "a",
    funFactKey: "quiz.q3.funFact",
  },
  {
    id: "product-owner",
    promptKey: "quiz.q4.prompt",
    options: [
      { id: "a", labelKey: "quiz.q4.a" },
      { id: "b", labelKey: "quiz.q4.b" },
      { id: "c", labelKey: "quiz.q4.c" },
      { id: "d", labelKey: "quiz.q4.d" },
    ],
    correct: "b",
    funFactKey: "quiz.q4.funFact",
  },
  {
    id: "user-story",
    promptKey: "quiz.q5.prompt",
    options: [
      { id: "a", labelKey: "quiz.q5.a" },
      { id: "b", labelKey: "quiz.q5.b" },
      { id: "c", labelKey: "quiz.q5.c" },
      { id: "d", labelKey: "quiz.q5.d" },
    ],
    correct: "c",
    funFactKey: "quiz.q5.funFact",
  },
  {
    id: "retrospective",
    promptKey: "quiz.q6.prompt",
    options: [
      { id: "a", labelKey: "quiz.q6.a" },
      { id: "b", labelKey: "quiz.q6.b" },
      { id: "c", labelKey: "quiz.q6.c" },
      { id: "d", labelKey: "quiz.q6.d" },
    ],
    correct: "d",
    funFactKey: "quiz.q6.funFact",
  },
  {
    id: "velocity",
    promptKey: "quiz.q7.prompt",
    options: [
      { id: "a", labelKey: "quiz.q7.a" },
      { id: "b", labelKey: "quiz.q7.b" },
      { id: "c", labelKey: "quiz.q7.c" },
      { id: "d", labelKey: "quiz.q7.d" },
    ],
    correct: "b",
    funFactKey: "quiz.q7.funFact",
  },
  {
    id: "kanban-wip",
    promptKey: "quiz.q8.prompt",
    options: [
      { id: "a", labelKey: "quiz.q8.a" },
      { id: "b", labelKey: "quiz.q8.b" },
      { id: "c", labelKey: "quiz.q8.c" },
      { id: "d", labelKey: "quiz.q8.d" },
    ],
    correct: "b",
    funFactKey: "quiz.q8.funFact",
  },
  {
    id: "backlog-refinement",
    promptKey: "quiz.q9.prompt",
    options: [
      { id: "a", labelKey: "quiz.q9.a" },
      { id: "b", labelKey: "quiz.q9.b" },
      { id: "c", labelKey: "quiz.q9.c" },
      { id: "d", labelKey: "quiz.q9.d" },
    ],
    correct: "a",
    funFactKey: "quiz.q9.funFact",
  },
  {
    id: "mvp",
    promptKey: "quiz.q10.prompt",
    options: [
      { id: "a", labelKey: "quiz.q10.a" },
      { id: "b", labelKey: "quiz.q10.b" },
      { id: "c", labelKey: "quiz.q10.c" },
      { id: "d", labelKey: "quiz.q10.d" },
    ],
    correct: "b",
    funFactKey: "quiz.q10.funFact",
  },
];

export function pickQuestions(): QuestionDef[] {
  const count = 5;
  const allQuestions = [...QUESTION_BANK];
  for (let i = QUESTION_BANK.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j]!, allQuestions[i]!];
  }
  return allQuestions.slice(0, count);
}
