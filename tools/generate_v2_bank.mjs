import fs from 'fs';
import path from 'path';

const TOPICS = ['NUMERICAL', 'VERBAL', 'LOGICAL', 'DATA', 'VISUAL'];
const DIFFICULTY_DIST = {
  EASY: 5,
  MEDIUM: 20,
  HARD: 25
};

const subCategories = {
  NUMERICAL: ['Arithmetic', 'Algebra', 'Geometry', 'Probability', 'Business Math'],
  VERBAL: ['Synonyms', 'Antonyms', 'Grammar', 'Inference', 'Sentence Completion'],
  LOGICAL: ['Series', 'Syllogism', 'Arrangement', 'Coding', 'Blood Relations'],
  DATA: ['Chart Analysis', 'Table Reading', 'Percentages', 'Comparison', 'Trend Projection'],
  VISUAL: ['Rotation', 'Symmetry', 'Pattern Completion', '3D View', 'Visual Logic']
};

function generateQuestions() {
  const bank = [];
  
  TOPICS.forEach(topic => {
    let qIndex = 1;
    ['EASY', 'MEDIUM', 'HARD'].forEach(difficulty => {
      const count = DIFFICULTY_DIST[difficulty];
      const subs = subCategories[topic];
      
      for (let i = 0; i < count; i++) {
        const sub = subs[i % subs.length];
        const patternId = `${topic.toLowerCase()}_v2_${difficulty.toLowerCase()}_${qIndex}`;
        
        // Simplified templates for pattern generation
        let stem = `[${sub}] `;
        let explanation = "";
        
        if (topic === 'NUMERICAL') {
          const val1 = Math.floor(Math.random() * 100) + 10;
          if (sub === 'Arithmetic') {
            stem += `Một cửa hàng nhập hàng với giá ${val1}0k, bán lãi ${difficulty === 'HARD' ? 15 : 10}%. Giá bán là bao nhiêu?`;
            explanation = `Giá bán = Vốn + Lãi = ${val1}0 + ${val1}0 * ${difficulty === 'HARD' ? 0.15 : 0.1}`;
          } else if (sub === 'Algebra') {
            const x = Math.floor(Math.random() * 10) + 2;
            stem += `Tính giá trị của biểu thức: ${val1} + (X * 5) = ${val1 + x * 5}. X là?`;
            explanation = `X = (${val1 + x * 5} - ${val1}) / 5 = ${x}`;
          } else {
            stem += `Câu hỏi mẫu cho ${sub} mức độ ${difficulty}. Tính toán các giá trị dựa trên giả định thực tế.`;
            explanation = `Giải quyết theo công thức chuẩn của ${sub}.`;
          }
        } else if (topic === 'VERBAL') {
          if (sub === 'Synonyms') {
            stem += `Từ nào sau đây gần nghĩa nhất với từ "Minh bạch"?`;
          } else if (sub === 'Inference') {
            stem += `Dựa vào đoạn văn trên, ta có thể suy luận điều gì về thái độ của tác giả?`;
          } else {
            stem += `Chọn từ phù hợp nhất để hoàn thiện câu sau: "Dù gặp nhiều khó khăn, họ vẫn ___ thực hiện mục tiêu."`;
          }
          explanation = `Phân tích ngữ cảnh và sắc thái ý nghĩa của từ trong câu.`;
        } else {
          stem += `Mẫu câu hỏi ${sub} - ${difficulty}. Yêu cầu tư duy phân tích và phán đoán logic.`;
          explanation = `Dùng phương pháp loại trừ hoặc suy luận trực tiếp để tìm đáp án.`;
        }

        bank.push({
          id: patternId,
          topic,
          difficulty,
          subCategory: sub,
          stem,
          options: [
            { key: 'A', text: 'Đáp án A (Gợi ý)' },
            { key: 'B', text: 'Đáp án B (Chính xác)' },
            { key: 'C', text: 'Đáp án C (Nhiễu)' },
            { key: 'D', text: 'Đáp án D (Nhiễu)' }
          ],
          answer: 'B',
          explanation,
          language: 'vi'
        });
        qIndex++;
      }
    });
  });

  return bank;
}

const result = generateQuestions();
const outputDir = './.tmp/pipeline';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(
  path.join(outputDir, 'expanded_v2_generated.json'),
  JSON.stringify({ total: result.length, questions: result }, null, 2)
);

console.log(`Generated ${result.length} questions to .tmp/pipeline/expanded_v2_generated.json`);
