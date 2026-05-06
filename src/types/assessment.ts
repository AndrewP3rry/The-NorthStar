export type OptionKey = "A" | "B" | "C" | "D";

export type PracticeQuestion = {
  id: string;
  topic: "numerical" | "verbal" | "logical" | "data_interpretation" | "visual";
  difficulty: "easy" | "medium" | "hard";
  stem: string;
  options: { key: OptionKey; text: string }[];
  estimatedTimeSec: number;
  questionType?: "text" | "image";
  imageSvg?: string | null;
  patternId?: string;
};
