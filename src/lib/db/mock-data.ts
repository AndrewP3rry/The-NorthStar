import { PracticeQuestion } from "@/types/assessment";

export const mockDailyQuestions: PracticeQuestion[] = [
  {
    id: "8f31c1d8-bfd2-4c8c-b95f-c2ff15bd579a",
    topic: "numerical",
    difficulty: "easy",
    stem: "Một cửa hàng giảm giá 20% từ 500.000đ. Giá sau giảm là bao nhiêu?",
    options: [
      { key: "A", text: "300.000đ" },
      { key: "B", text: "350.000đ" },
      { key: "C", text: "400.000đ" },
      { key: "D", text: "450.000đ" }
    ],
    estimatedTimeSec: 45
  },
  {
    id: "9cf2eca6-cfcf-448a-9e35-17becc3f8af7",
    topic: "verbal",
    difficulty: "medium",
    stem: "Chọn phát biểu hợp lý nhất về kỹ năng ưu tiên công việc trong môi trường áp lực.",
    options: [
      { key: "A", text: "Làm việc theo cảm hứng để tăng sáng tạo." },
      { key: "B", text: "Ưu tiên theo mức độ ảnh hưởng và hạn chót." },
      { key: "C", text: "Luôn làm việc khó nhất trước mọi trường hợp." },
      { key: "D", text: "Chỉ xử lý việc khẩn cấp, bỏ qua việc quan trọng." }
    ],
    estimatedTimeSec: 60
  }
];
