import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";

const TOPICS = ["numerical", "verbal", "data_interpretation", "logical", "visual"];

function hashInt(input) {
  return Number.parseInt(createHash("sha256").update(input).digest("hex").slice(0, 12), 16);
}

function seededPick(pool, count, seed, exclude = new Set()) {
  const available = pool.filter((item) => !exclude.has(item.id));
  const source = available.length >= count ? available : pool;
  const selected = [];
  const used = new Set();

  let i = 0;
  while (selected.length < count && i < 300) {
    const idx = (hashInt(`${seed}-${i}`) + i * 11) % source.length;
    const candidate = source[idx];
    if (!used.has(candidate.id)) {
      used.add(candidate.id);
      selected.push(candidate);
    }
    i += 1;
  }

  return selected;
}

function shuffle(list, seed) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = hashInt(`${seed}-sh-${i}`) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function difficultyByIndex(index) {
  if (index <= 3) return "easy";
  if (index <= 7) return "medium";
  return "hard";
}

function exp(a, b, c) {
  return `${a}. ${b}. ${c}.`;
}

function svgShape(seed) {
  const x = 24 + (seed % 32);
  const y = 24 + ((seed * 3) % 28);
  return `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='180'>
  <rect x='10' y='10' width='340' height='160' fill='white' stroke='#CBD5E1' stroke-width='2'/>
  <rect x='${x}' y='${y}' width='52' height='52' fill='#0EA5E9'/>
  <circle cx='${x + 210}' cy='${y + 26}' r='18' fill='#1E3A8A'/>
  <polygon points='${x + 148},${y + 62} ${x + 126},${y + 102} ${x + 170},${y + 102}' fill='#F97316'/>
  <text x='20' y='152' font-size='13' fill='#0F172A'>Quan sát hình và chọn nhận định đúng.</text>
</svg>`;
}

function svgMatrix(a, b, c, d) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='340' height='220'>
  <rect x='20' y='20' width='180' height='140' fill='white' stroke='#334155' stroke-width='2'/>
  <line x1='80' y1='20' x2='80' y2='160' stroke='#334155'/>
  <line x1='140' y1='20' x2='140' y2='160' stroke='#334155'/>
  <line x1='20' y1='66' x2='200' y2='66' stroke='#334155'/>
  <line x1='20' y1='112' x2='200' y2='112' stroke='#334155'/>
  <text x='42' y='50' font-size='20'>${a}</text>
  <text x='102' y='50' font-size='20'>${b}</text>
  <text x='162' y='50' font-size='20'>?</text>
  <text x='42' y='96' font-size='20'>${c}</text>
  <text x='102' y='96' font-size='20'>?</text>
  <text x='162' y='96' font-size='20'>${d}</text>
  <text x='42' y='142' font-size='20'>?</text>
  <text x='102' y='142' font-size='20'>${a + b}</text>
  <text x='162' y='142' font-size='20'>${d + 2}</text>
  <text x='20' y='195' font-size='13'>Tìm giá trị thiếu theo quy luật.</text>
</svg>`;
}

function svgSet(seed) {
  const n = 3 + (seed % 3);
  return `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='210'>
  <rect x='20' y='20' width='130' height='130' fill='none' stroke='#0F766E' stroke-width='2'/>
  <rect x='110' y='20' width='130' height='130' fill='none' stroke='#1D4ED8' stroke-width='2'/>
  <text x='45' y='45' font-size='14'>Set A</text>
  <text x='170' y='45' font-size='14'>Set B</text>
  <circle cx='120' cy='85' r='35' fill='#0EA5E9' opacity='0.35'/>
  <text x='42' y='82' font-size='13'>${n} tam giác</text>
  <text x='160' y='82' font-size='13'>${n + 1} hình tròn</text>
  <text x='20' y='185' font-size='13'>Figure mục tiêu thuộc set nào?</text>
</svg>`;
}

function numerical(index, seed) {
  const n = (seed % 70) + 1;
  const base = 100000 + n * 7000;
  const pct = 5 + (n % 6) * 3;
  const rev = 210 + n * 9;
  const cost = 140 + n * 6;
  const speed = 30 + (n % 7) * 6;
  const time = 2 + (n % 4);
  const dist = speed * time;
  const list = [
    {
      stem: `Giá gốc ${base}đ tăng ${pct}%. Giá mới là?`,
      options: [`${Math.round(base * (1 + (pct - 3) / 100))}đ`, `${Math.round(base * (1 + pct / 100))}đ`, `${Math.round(base * (1 + (pct + 3) / 100))}đ`, `${Math.round(base * (1 + (pct + 6) / 100))}đ`],
      correct: "B",
      explanation: exp(`Lấy ${base} nhân ${1 + pct / 100} để tính giá mới`, `Kết quả là ${Math.round(base * (1 + pct / 100))}đ`, "Đối chiếu đáp án thấy phương án B trùng khớp"),
    },
    {
      stem: `Doanh thu ${rev} triệu, chi phí ${cost} triệu. Lợi nhuận là?`,
      options: [`${rev - cost}`, `${rev + cost}`, `${cost - rev}`, `${rev - cost + 10}`],
      correct: "A",
      explanation: exp("Lợi nhuận bằng doanh thu trừ chi phí", `Ta có ${rev} - ${cost} = ${rev - cost}`, "Vì vậy đáp án đúng là A"),
    },
    {
      stem: `Xe chạy ${speed} km/h trong ${time} giờ. Quãng đường là?`,
      options: [`${dist}`, `${dist + speed}`, `${dist - time}`, `${speed + time}`],
      correct: "A",
      explanation: exp("Quãng đường bằng vận tốc nhân thời gian", `Tính được ${speed} x ${time} = ${dist} km`, "Do đó chọn A"),
    },
    {
      stem: `Tổng 60 sản phẩm, tỉ lệ lỗi ${pct}%. Số sản phẩm lỗi gần nhất là?`,
      options: [`${Math.round((60 * pct) / 100)}`, `${Math.round((60 * (pct + 4)) / 100)}`, `${Math.round((60 * (pct - 4)) / 100)}`, `${60 - Math.round((60 * pct) / 100)}`],
      correct: "A",
      explanation: exp("Số lỗi bằng tổng nhân tỉ lệ lỗi", `60 x ${pct}% ≈ ${Math.round((60 * pct) / 100)}`, "Nên chọn phương án A"),
    },
    {
      stem: `Ba số là ${n + 8}, ${n + 18}, ${n + 28}. Trung bình cộng là?`,
      options: [`${n + 18}`, `${n + 19}`, `${n + 17}`, `${3 * n + 54}`],
      correct: "A",
      explanation: exp("Trung bình cộng bằng tổng chia 3", `(${n + 8}+${n + 18}+${n + 28})/3 = ${n + 18}`, "Vì vậy đáp án A đúng"),
    },
    {
      stem: `Đầu tư ${50 + n} triệu, lãi kép ${pct}%/năm trong 2 năm. Giá trị gần nhất là?`,
      options: [`${Math.round((50 + n) * Math.pow(1 + pct / 100, 2))}`, `${Math.round((50 + n) * (1 + pct / 100))}`, `${50 + n}`, `${Math.round((50 + n) * Math.pow(1 + pct / 100, 2)) + 5}`],
      correct: "A",
      explanation: exp("Dùng công thức P(1+r)^2 cho lãi kép 2 năm", `Thay số ra khoảng ${Math.round((50 + n) * Math.pow(1 + pct / 100, 2))}`, "Do đó phương án A chính xác"),
    },
    {
      stem: `Chi phí cố định ${30 + n} triệu, lãi/gói 25 nghìn. Hòa vốn cần bán?`,
      options: [`${Math.ceil(((30 + n) * 1000) / 25)}`, `${Math.ceil(((30 + n) * 1000) / 25) + 20}`, `${Math.ceil(((30 + n) * 1000) / 25) - 20}`, `${30 + n}`],
      correct: "A",
      explanation: exp("Đổi đơn vị triệu sang nghìn để đồng nhất", `Số gói = ${(30 + n) * 1000}/25 ≈ ${Math.ceil(((30 + n) * 1000) / 25)}`, "Vì thế đáp án A đúng"),
    },
    {
      stem: `Lớp có tỉ lệ nam:nữ là 3:2, tổng ${40 + n}. Số nam gần nhất là?`,
      options: [`${Math.round(((40 + n) * 3) / 5)}`, `${Math.round(((40 + n) * 2) / 5)}`, `${Math.round(((40 + n) * 3) / 5) + 2}`, `${Math.round(((40 + n) * 3) / 5) - 2}`],
      correct: "A",
      explanation: exp("Tổng phần bằng 5 nên nam chiếm 3/5", `Lấy ${40 + n} x 3/5 ≈ ${Math.round(((40 + n) * 3) / 5)}`, "Do đó chọn A"),
    },
    {
      stem: `Giá ${base}đ, giảm ${pct}% rồi giảm tiếp 5%. Giá cuối gần nhất là?`,
      options: [`${Math.round(base * (1 - pct / 100) * 0.95)}đ`, `${Math.round(base * (1 - (pct + 5) / 100))}đ`, `${base}đ`, `${Math.round(base * (1 - pct / 100) * 0.95) + 1000}đ`],
      correct: "A",
      explanation: exp("Giảm liên tiếp phải nhân hai hệ số còn lại", `Giá cuối ≈ ${Math.round(base * (1 - pct / 100) * 0.95)}đ`, "Vì vậy đáp án A đúng"),
    },
    {
      stem: `Sản lượng tăng từ ${70 + n} lên ${90 + n}. Mức tăng phần trăm là?`,
      options: [`${Math.round((20 / (70 + n)) * 100)}%`, `${Math.round((20 / (90 + n)) * 100)}%`, `${Math.round((10 / (70 + n)) * 100)}%`, `${Math.round((20 / (70 + n)) * 100) + 5}%`],
      correct: "A",
      explanation: exp("Phần trăm tăng = (mới-cũ)/cũ", `Ta có 20/${70 + n} ≈ ${Math.round((20 / (70 + n)) * 100)}%`, "Nên đáp án A hợp lý"),
    },
    {
      stem: `Điểm Quiz ${6 + (n % 3)}, Mid ${7 + (n % 3)}, Final ${8 + (n % 2)} với trọng số 20-30-50. Điểm tổng gần nhất là?`,
      options: [`${Math.round(((6 + (n % 3)) * 0.2 + (7 + (n % 3)) * 0.3 + (8 + (n % 2)) * 0.5) * 10) / 10}`, `${Math.round((((6 + (n % 3)) + (7 + (n % 3)) + (8 + (n % 2))) / 3) * 10) / 10}`, `${Math.round(((6 + (n % 3)) * 0.2 + (7 + (n % 3)) * 0.3 + (8 + (n % 2)) * 0.5) * 10) / 10 + 0.5}`, `${8 + (n % 2)}`],
      correct: "A",
      explanation: exp("Điểm tổng là trung bình có trọng số 20-30-50", "Nhân từng điểm với trọng số rồi cộng", "Kết quả trùng với phương án A"),
    },
    {
      stem: "Pha dung dịch 20% và 40% để được 30%, tổng 12 lít. Lượng dung dịch 20% là?",
      options: ["6 lít", "4 lít", "8 lít", "12 lít"],
      correct: "A",
      explanation: exp("30% nằm chính giữa 20% và 40%", "Vì thế hai lượng dung dịch phải bằng nhau", "Tổng 12 lít nên mỗi phần là 6 lít"),
    },
  ];

  return list[index];
}

function verbal(index, seed) {
  const kinds = ["Suy luận đoạn văn", "Kết luận hợp lý", "Giả định ẩn", "Phát biểu mâu thuẫn", "Ưu tiên hành động", "Điền ý thiếu", "Đánh giá lập luận", "Nhận diện thiên kiến", "Tóm tắt ý chính", "Thông điệp phù hợp", "Sửa câu rõ nghĩa", "Fact vs Opinion"];
  
  if (index % 4 === 0) {
    const contexts = [
      { c: "thiếu dữ liệu", opt: ["Đưa ra quyết định ngay lập tức dựa trên cảm tính", "Thu thập thêm dữ liệu hoặc đưa ra các giả định có căn cứ", "Bỏ qua vấn đề và tập trung vào việc khác", "Báo cáo thất bại do không có thông tin"], ans: "B", exp: "Khi thiếu dữ liệu, việc thu thập thêm hoặc lập giả định có căn cứ là cách tiếp cận chuyên nghiệp nhất." },
      { c: "xung đột ưu tiên", opt: ["Làm mọi thứ cùng lúc", "Đẩy việc cho người khác", "Đánh giá lại mức độ quan trọng và khẩn cấp của từng task", "Bỏ qua các task khó"], ans: "C", exp: "Khi có xung đột ưu tiên, ma trận quan trọng - khẩn cấp là công cụ tốt nhất để sắp xếp công việc." },
      { c: "deadline gấp", opt: ["Cắt giảm chất lượng tối đa để kịp tiến độ", "Báo cáo trễ hạn", "Thương lượng lại scope hoặc xin thêm nguồn lực", "Làm việc quá sức liên tục"], ans: "C", exp: "Thương lượng scope và nguồn lực giúp đảm bảo tiến độ mà không hy sinh hoàn toàn chất lượng hay sức khỏe." }
    ];
    const item = contexts[seed % 3];
    return {
      stem: `[${kinds[index]}] Trong tình huống ${item.c}, lựa chọn hành động nào sau đây là phù hợp nhất?`,
      options: item.opt,
      correct: item.ans,
      explanation: exp("Phân tích tình huống thực tế trong công việc", item.exp, `Vì vậy, phương án ${item.ans} là chính xác`)
    };
  } else if (index % 4 === 1) {
    const passages = [
      { p: "Công ty A tăng trưởng 20% năm ngoái nhờ vào sản phẩm mới, nhưng chi phí R&D cũng tăng đột biến.", q: "Kết luận nào sau đây hợp lý nhất?", opt: ["Sản phẩm mới không mang lại lợi nhuận", "Tăng trưởng của công ty A có sự đóng góp lớn từ R&D", "Công ty A sắp phá sản", "Doanh thu năm nay chắc chắn sẽ giảm"], ans: "B", exp: "Đoạn văn nêu rõ tăng trưởng nhờ sản phẩm mới và chi phí R&D tăng, cho thấy sự đầu tư mạnh vào R&D." },
      { p: "Việc sử dụng AI trong lập trình giúp tăng năng suất 30%, nhưng lại gây ra mối lo ngại về bảo mật mã nguồn.", q: "Nhận định nào sau đây thể hiện giả định ẩn?", opt: ["AI lập trình rất an toàn", "Năng suất lập trình viên không thể tăng thêm", "Mã nguồn do AI xử lý có nguy cơ bị rò rỉ", "AI sẽ thay thế lập trình viên hoàn toàn"], ans: "C", exp: "Lo ngại về bảo mật ngầm định rằng mã nguồn chia sẻ với AI có thể không an toàn." },
      { p: "Sếp yêu cầu báo cáo vào sáng mai, nhưng hệ thống dữ liệu hiện đang bảo trì đến chiều.", q: "Đâu là thông điệp phù hợp nhất để gửi sếp?", opt: ["Hệ thống hỏng rồi, tôi không làm đâu", "Tôi sẽ gửi báo cáo muộn vì lỗi hệ thống", "Dữ liệu đang bảo trì, tôi sẽ chuẩn bị trước khung báo cáo và điền số liệu ngay khi hệ thống mở lại", "Để mai tôi báo cáo miệng"], ans: "C", exp: "Phương án C thể hiện tính chủ động và chuyên nghiệp nhất trong việc xử lý sự cố." }
    ];
    const item = passages[seed % 3];
    return {
      stem: `[${kinds[index]}] Đọc đoạn sau: "${item.p}"\n${item.q}`,
      options: item.opt,
      correct: item.ans,
      explanation: exp("Đọc hiểu và phân tích văn bản", item.exp, `Đáp án ${item.ans} là phù hợp nhất`)
    };
  } else if (index % 4 === 2) {
    const claims = [
      { c: "Sản phẩm A tốt hơn B vì A đắt hơn.", q: "Lập luận trên mắc lỗi ngụy biện nào?", opt: ["Ngụy biện tấn công cá nhân", "Đánh tráo khái niệm", "Cho rằng giá cả luôn tỷ lệ thuận với chất lượng", "Ngụy biện đám đông"], ans: "C", exp: "Lập luận này mắc lỗi đánh đồng giá trị kinh tế với chất lượng thực tế." },
      { c: "Tất cả những người thành công đều dậy sớm. Tôi dậy sớm, nên tôi sẽ thành công.", q: "Lập luận này sai ở đâu?", opt: ["Dậy sớm không tốt cho sức khỏe", "Đảo ngược điều kiện cần và đủ", "Chưa định nghĩa thành công", "Sử dụng sai thì của động từ"], ans: "B", exp: "Dậy sớm có thể là điểm chung của người thành công, nhưng không phải điều kiện đủ để đảm bảo thành công." },
      { c: "Chúng ta phải chọn giữa việc giảm giá hoặc mất khách hàng.", q: "Đây là ví dụ của loại thiên kiến nào?", opt: ["Thiên kiến xác nhận", "Thiên kiến kẻ sống sót", "Ngụy biện bộ đôi sai lầm (False Dilemma)", "Hiệu ứng mỏ neo"], ans: "C", exp: "Ngụy biện bộ đôi sai lầm ép người nghe chọn 1 trong 2 lựa chọn trong khi có thể có các giải pháp khác." }
    ];
    const item = claims[seed % 3];
    return {
      stem: `[${kinds[index]}] ${item.c} ${item.q}`,
      options: item.opt,
      correct: item.ans,
      explanation: exp("Đánh giá lập luận logic và nhận diện lỗi ngụy biện", item.exp, `Đáp án đúng là ${item.ans}`)
    };
  } else {
    const texts = [
      { t: "Doanh số giảm 10% trong quý 3 do yếu tố mùa vụ. Tuy nhiên, khách hàng mới tăng 5%.", q: "Đâu là câu Tóm tắt ý chính tốt nhất?", opt: ["Quý 3 là quý thất bại thảm hại.", "Dù doanh số giảm do mùa vụ, công ty vẫn thu hút được khách hàng mới.", "Khách hàng mới tăng 5% sẽ bù đắp doanh số giảm.", "Yếu tố mùa vụ luôn làm giảm doanh số."], ans: "B", exp: "Tóm tắt cần bao quát cả hai vế: sự sụt giảm doanh số và điểm tích cực về khách hàng mới." },
      { t: "Tôi nghĩ rằng dự án X sẽ vượt ngân sách vì đội ngũ quản lý quá yếu kém.", q: "Phát biểu trên là Fact (sự thật) hay Opinion (ý kiến)?", opt: ["Fact, vì dự án chắc chắn vượt ngân sách", "Opinion, vì chứa các từ đánh giá chủ quan", "Cả Fact và Opinion", "Không phải Fact cũng không phải Opinion"], ans: "B", exp: "Câu chứa cụm từ 'Tôi nghĩ rằng' và 'yếu kém' thể hiện đánh giá chủ quan cá nhân." },
      { t: "Nhà cung cấp chậm giao hàng 3 ngày, ảnh hưởng đến tiến độ sản xuất.", q: "Cách diễn đạt nào sau đây rõ nghĩa và khách quan nhất trong email nhắc nhở?", opt: ["Các anh làm ăn chậm chạp quá, ảnh hưởng hết đến chúng tôi.", "Vì sao các anh lại giao hàng muộn 3 ngày?", "Theo lịch trình, lô hàng cần giao vào ngày X. Xin vui lòng cập nhật tiến độ vì việc chậm trễ đang ảnh hưởng đến sản xuất.", "Giao hàng ngay đi không chúng tôi kiện."], ans: "C", exp: "Phương án C vừa cung cấp thông tin cụ thể (ngày X), vừa nêu rõ lý do và yêu cầu hành động một cách chuyên nghiệp." }
    ];
    const item = texts[seed % 3];
    return {
      stem: `[${kinds[index]}] ${item.t}\n${item.q}`,
      options: item.opt,
      correct: item.ans,
      explanation: exp("Phân tích từ vựng và ngữ cảnh giao tiếp", item.exp, `Chính xác nhất là ${item.ans}`)
    };
  }
}

function dataInterpretation(index, seed) {
  const kinds = ["So sánh tăng trưởng", "Tính tỷ trọng", "Xác định giá trị thấp nhất", "Chênh lệch hai nhóm", "Tăng trưởng gộp", "Xu hướng theo chuỗi", "Outlier", "Tăng trưởng bình quân", "Biểu đồ phân tích", "Tính lợi nhuận", "Before-after", "Ước lượng mẫu"];
  
  if (index % 3 === 0) {
    const q1 = 120 + seed * 5;
    const q2 = q1 + 15 + (seed % 4) * 5;
    const c1 = 80 + seed * 2;
    const c2 = c1 + 25 + (seed % 3) * 5;
    
    return {
      stem: `[${kinds[index]}] Năm 1: Doanh thu = ${q1}, Chi phí = ${c1}. Năm 2: Doanh thu = ${q2}, Chi phí = ${c2}. Nhận định nào sau đây là đúng về Lợi nhuận (Doanh thu - Chi phí)?`,
      options: [
        "Lợi nhuận Năm 2 cao hơn Năm 1",
        "Lợi nhuận Năm 2 thấp hơn Năm 1",
        "Lợi nhuận không thay đổi",
        "Tốc độ tăng doanh thu lớn hơn tốc độ tăng chi phí"
      ],
      correct: (q2 - c2) > (q1 - c1) ? "A" : (q2 - c2) < (q1 - c1) ? "B" : "C",
      explanation: exp("Lợi nhuận = Doanh thu - Chi phí", `Năm 1: ${q1} - ${c1} = ${q1 - c1}. Năm 2: ${q2} - ${c2} = ${q2 - c2}.`, `So sánh hai giá trị này để tìm đáp án.`),
    };
  }

  if (index % 3 === 1) {
    const share = 15 + (seed % 6) * 5;
    const total = 500 + seed * 100;
    const ans = Math.round((total * share) / 100);
    const wrong1 = Math.round((total * (share + 5)) / 100);
    const wrong2 = Math.round((total * (share - 5)) / 100);
    
    return {
      stem: `[${kinds[index]}] Một công ty có tổng ngân sách marketing là ${total} triệu. Họ dành ${share}% cho quảng cáo mạng xã hội và 20% cho sự kiện. Số tiền dành cho quảng cáo mạng xã hội là bao nhiêu?`,
      options: [`${ans} triệu`, `${wrong1} triệu`, `${wrong2} triệu`, `${ans + 20} triệu`],
      correct: "A",
      explanation: exp("Tính giá trị từ tỷ trọng phần trăm", `Lấy ${total} x ${share}% = ${ans} triệu`, "Vì vậy đáp án A đúng"),
    };
  }

  const m1 = 100 + seed * 2;
  const m2 = m1 + 20 - (seed % 5);
  const m3 = m2 - 15 + (seed % 10);
  const avg = Math.round((m1 + m2 + m3) / 3);
  
  return {
    stem: `[${kinds[index]}] Số lượng truy cập website trong 3 tháng liên tiếp lần lượt là: ${m1}, ${m2}, ${m3}. Trung bình mỗi tháng có khoảng bao nhiêu lượt truy cập?`,
    options: [`${avg}`, `${avg + 10}`, `${avg - 10}`, `${m2}`],
    correct: "A",
    explanation: exp("Tính trung bình cộng của chuỗi số", `Trung bình = (${m1} + ${m2} + ${m3}) / 3 = ${avg}`, "Nên đáp án A chính xác"),
  };
}

function logical(index, seed) {
  const kinds = ["Suy luận mệnh đề", "Đúng-sai", "Chuỗi ký hiệu", "Quan hệ tập hợp", "Loại trừ", "Sắp xếp thứ tự", "Điều kiện cần-đủ", "Mã hóa", "Vị trí chỗ ngồi", "Quan hệ huyết thống", "Tam đoạn luận", "Phương hướng"];

  const subjects = [
    { a: "Mèo", b: "Động vật có vú", c: "Sinh vật" },
    { a: "Nhân viên IT", b: "Người biết code", c: "Người thích cà phê" },
    { a: "Hoa hồng", b: "Hoa", c: "Thực vật" },
    { a: "Kỹ sư", b: "Người học toán", c: "Người thông minh" }
  ];
  
  const item = subjects[seed % 4];

  if (index % 4 === 0) {
    return {
      stem: `[${kinds[index]}] Nếu "Mọi ${item.a} đều là ${item.b}" và "Mọi ${item.b} đều là ${item.c}", kết luận nào sau đây CẦN PHẢI ĐÚNG?`,
      options: [
        `Mọi ${item.a} đều là ${item.c}`,
        `Mọi ${item.c} đều là ${item.a}`,
        `Một số ${item.a} không phải là ${item.c}`,
        `Không có ${item.b} nào là ${item.a}`
      ],
      correct: "A",
      explanation: exp("Sử dụng tính chất bắc cầu của tập hợp", "Nếu tập con nằm trong tập cha, thì nó cũng nằm trong tập cha lớn hơn", "Nên đáp án A luôn đúng"),
    };
  }
  
  if (index % 4 === 1) {
    const people = ["An", "Bình", "Cường", "Dũng", "Hoa"];
    const p1 = people[seed % 5];
    const p2 = people[(seed + 1) % 5];
    const p3 = people[(seed + 2) % 5];
    return {
      stem: `[${kinds[index]}] Trong một cuộc đua, ${p1} về đích trước ${p2}. ${p3} về đích sau ${p2}. Ai là người về đích cuối cùng trong ba người này?`,
      options: [`${p1}`, `${p2}`, `${p3}`, `Không thể xác định`],
      correct: "C",
      explanation: exp("Phân tích thứ tự", `${p1} trước ${p2}, ${p2} trước ${p3}`, `Vậy thứ tự là ${p1} -> ${p2} -> ${p3}, người cuối là ${p3}`),
    };
  }

  if (index % 4 === 2) {
    const locs = ["Bắc", "Nam", "Đông", "Tây"];
    const d1 = locs[seed % 4];
    const d2 = locs[(seed + 1) % 4];
    return {
      stem: `[${kinds[index]}] A đi về hướng ${d1} 5km, sau đó rẽ phải và đi thêm 3km. B đi về hướng ${d2} 5km. Nếu A và B xuất phát cùng 1 điểm, có thể kết luận gì về vị trí của họ?`,
      options: [
        `Khoảng cách của A đến điểm xuất phát lớn hơn B`,
        `Khoảng cách của B đến điểm xuất phát lớn hơn A`,
        `Khoảng cách của A và B đến điểm xuất phát bằng nhau`,
        `Không thể tính được khoảng cách`
      ],
      correct: "A",
      explanation: exp("Sử dụng định lý Pytago", `Khoảng cách A = căn(5^2 + 3^2) > 5. Khoảng cách B = 5.`, `Nên A cách xa điểm xuất phát hơn B`),
    };
  }

  return {
    stem: `[${kinds[index]}] Cho mệnh đề: "Nếu trời mưa thì đường ướt". Sự kiện "đường ướt" xảy ra, ta có thể kết luận chắc chắn điều gì?`,
    options: [
      `Trời đã mưa`,
      `Trời không mưa`,
      `Không thể kết luận chắc chắn trời có mưa hay không`,
      `Đường ướt vì lý do khác`
    ],
    correct: "C",
    explanation: exp("Lỗi ngụy biện khẳng định hậu kiện", "Đường ướt có thể do xe phun nước hoặc nguyên nhân khác", "Do đó không thể kết luận chắc chắn trời đã mưa"),
  };
}

function svgGrid(rows, cols, data, extraText = "") {
  const cellSize = 60;
  const width = Math.max(340, cols * cellSize + 40);
  const height = rows * cellSize + (extraText ? 60 : 40);
  
  let svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>\n`;
  svg += `  <rect x='20' y='20' width='${cols * cellSize}' height='${rows * cellSize}' fill='white' stroke='#334155' stroke-width='2'/>\n`;
  
  for (let i = 1; i < cols; i++) {
    svg += `  <line x1='${20 + i * cellSize}' y1='20' x2='${20 + i * cellSize}' y2='${20 + rows * cellSize}' stroke='#334155'/>\n`;
  }
  for (let i = 1; i < rows; i++) {
    svg += `  <line x1='20' y1='${20 + i * cellSize}' x2='${20 + cols * cellSize}' y2='${20 + i * cellSize}' stroke='#334155'/>\n`;
  }
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = data[r][c];
      if (val !== undefined && val !== null && val !== "") {
        svg += `  <text x='${20 + c * cellSize + cellSize/2}' y='${20 + r * cellSize + cellSize/2 + 7}' font-size='22' text-anchor='middle'>${val}</text>\n`;
      }
    }
  }
  
  if (extraText) {
    svg += `  <text x='20' y='${20 + rows * cellSize + 25}' font-size='14' fill='#0F172A'>${extraText}</text>\n`;
  }
  
  svg += `</svg>`;
  return svg;
}

function visual(index, seed) {
  const kinds = [
    "Ma trận số", "Sudoku 3x3", "Dãy số quy luật", "Điền ô trống",
    "Hình vuông ma thuật", "Latin Square", "Hàng số tổng", "Quy luật đan xen",
    "Ma trận nhân", "Chuỗi số cấp số", "Sudoku 4x4", "Dãy số Fibonacci"
  ];
  
  if (index === 0) {
    const sum = 15 + (seed % 10);
    const a = Math.floor(sum / 3) - 1;
    const b = Math.floor(sum / 3);
    const missing = sum - a - b;
    return {
      stem: `[${kinds[index]}] Mỗi hàng có tổng bằng ${sum}. Điền ô ?:`,
      options: [`${missing}`, `${missing + 1}`, `${missing - 1}`, `${missing + 2}`],
      correct: "A",
      explanation: exp("Tổng mỗi hàng đều bằng nhau", `Ta có phương trình: ${a} + ${b} + ? = ${sum}`, `Giải ra được số cần tìm là ${missing}`),
      questionType: "image",
      imageSvg: svgGrid(1, 3, [[a, b, "?"]], `Tổng các số là ${sum}`),
    };
  }
  
  if (index === 1) {
    const nums = [1 + (seed % 5), 2 + (seed % 5), 3 + (seed % 5)];
    return {
      stem: `[${kinds[index]}] Điền số vào ô ? trong lưới Sudoku 3x3:`,
      options: [`${nums[0]}`, `${nums[1]}`, `${nums[2]}`, `${nums[0] + 1}`],
      correct: "A",
      explanation: exp("Đây là dạng hình vuông Latin (tương tự Sudoku 3x3)", "Mỗi hàng và cột đều phải chứa đủ 3 số phân biệt", `Ô cuối cùng ở Hàng 3 phải là ${nums[0]} để không bị trùng lặp`),
      questionType: "image",
      imageSvg: svgGrid(3, 3, [
        [nums[0], nums[1], nums[2]],
        [nums[2], nums[0], nums[1]],
        [nums[1], nums[2], "?"]
      ], "Mỗi hàng và cột chứa 3 số phân biệt."),
    };
  }
  
  if (index === 2) {
    const start = 2 + (seed % 5);
    const diff = 3 + (seed % 4);
    const seq = [start, start + diff, start + diff * 2, start + diff * 3];
    return {
      stem: `[${kinds[index]}] Điền số tiếp theo vào dãy số:`,
      options: [`${start + diff * 4}`, `${start + diff * 5}`, `${start + diff * 4 - 1}`, `${start + diff * 4 + 1}`],
      correct: "A",
      explanation: exp("Dãy số là một cấp số cộng", `Khoảng cách giữa các số liên tiếp đều đặn là ${diff}`, `Nên số tiếp theo là ${seq[3]} + ${diff} = ${start + diff * 4}`),
      questionType: "image",
      imageSvg: svgGrid(1, 5, [[seq[0], seq[1], seq[2], seq[3], "?"]]),
    };
  }

  if (index === 3) {
    const a = 3 + (seed % 5);
    const b = 5 + (seed % 4);
    const c = 4 + (seed % 6);
    const d = a + b - c;
    return {
      stem: `[${kinds[index]}] Tổng các số trên mỗi hàng là bằng nhau. Điền ô ?:`,
      options: [`${d}`, `${d + 1}`, `${d - 1}`, `${d + 2}`],
      correct: "A",
      explanation: exp("Tổng hàng 1 bằng tổng hàng 2", `Hàng 1 có tổng là ${a} + ${b} = ${a + b}`, `Nên ô còn thiếu là ${a + b} - ${c} = ${d}`),
      questionType: "image",
      imageSvg: svgGrid(2, 2, [
        [a, b],
        [c, "?"]
      ], "Tổng hàng 1 bằng tổng hàng 2"),
    };
  }

  if (index === 4) {
    const c = 5 + (seed % 5); 
    const sum = 3 * c;
    const a = c - 1;
    const b = c + 1;
    return {
      stem: `[${kinds[index]}] Hình vuông ma thuật 3x3 có tổng hàng, cột, chéo bằng ${sum}. Điền ô ?:`,
      options: [`${b}`, `${b + 1}`, `${b - 1}`, `${b + 2}`],
      correct: "A",
      explanation: exp("Trong hình vuông ma thuật, tổng hai ô đối diện cộng với ô trung tâm bằng tổng của một hàng", `Tổng đường chéo là ${sum}`, `Nên ô góc đối diện là ${sum} - ${a} - ${c} = ${b}`),
      questionType: "image",
      imageSvg: svgGrid(3, 3, [
        [a, "", ""],
        ["", c, ""],
        ["", "", "?"]
      ]),
    };
  }

  if (index === 5) {
    return {
      stem: `[${kinds[index]}] Mỗi hàng và cột chứa các số 1, 2, 3, 4. Điền ô ?:`,
      options: ["3", "1", "2", "4"],
      correct: "A",
      explanation: exp("Đây là lưới Latin Square 4x4", "Mỗi hàng và mỗi cột phải có đủ các số từ 1 đến 4", "Hàng 4 còn thiếu số 3"),
      questionType: "image",
      imageSvg: svgGrid(4, 4, [
        [1, 2, 3, 4],
        [2, 3, 4, 1],
        [3, 4, 1, 2],
        [4, 1, 2, "?"]
      ]),
    };
  }

  if (index === 6) {
    const x = 1 + (seed % 3);
    const y = 2 + (seed % 3);
    const z = 3 + (seed % 3);
    const sum = x + y + z;
    return {
      stem: `[${kinds[index]}] Số cuối cùng bằng tổng ba số đầu tiên:`,
      options: [`${sum}`, `${sum + 1}`, `${sum - 1}`, `${sum + 2}`],
      correct: "A",
      explanation: exp("Quy luật hàng số tổng", "Số thứ tư bằng tổng 3 số trước đó", `${x} + ${y} + ${z} = ${sum}`),
      questionType: "image",
      imageSvg: svgGrid(1, 4, [[x, y, z, "?"]]),
    };
  }

  if (index === 7) {
    const start1 = 2 + (seed % 3);
    const diff1 = 2;
    const start2 = 10 + (seed % 3);
    const diff2 = -1;
    
    const ans = start1 + diff1 * 3;
    const optB = start2 + diff2 * 3;
    const finalOptB = (ans === optB) ? optB + 1 : optB;

    return {
      stem: `[${kinds[index]}] Tìm số tiếp theo của dãy số có quy luật đan xen:`,
      options: [`${ans}`, `${finalOptB}`, `${ans - 1}`, `${ans + 4}`],
      correct: "A",
      explanation: exp("Dãy số gồm hai chuỗi đan xen nhau", `Chuỗi 1 tăng ${diff1}, chuỗi 2 giảm ${Math.abs(diff2)}`, `Số tiếp theo thuộc chuỗi 1: ${start1 + diff1 * 2} + ${diff1} = ${ans}`),
      questionType: "image",
      imageSvg: svgGrid(1, 7, [[start1, start2, start1 + diff1, start2 + diff2, start1 + diff1 * 2, start2 + diff2 * 2, "?"]], "Quy luật đan xen"),
    };
  }

  if (index === 8) {
    const x = 2 + (seed % 3);
    const y = 3 + (seed % 3);
    const factor = 2;
    const m1 = x;
    const m2 = y * factor;
    const m3 = y;
    const m4 = x * factor;
    return {
      stem: `[${kinds[index]}] Tích các số trên hai đường chéo bằng nhau. Điền ô ?:`,
      options: [`${m4}`, `${m4 + 1}`, `${m4 - 1}`, `${m4 + 2}`],
      correct: "A",
      explanation: exp("Tích hai đường chéo bằng nhau", `${m1} x ? = ${m2} x ${m3}`, `? = (${m2} x ${m3}) / ${m1} = ${m4}`),
      questionType: "image",
      imageSvg: svgGrid(2, 2, [
        [m1, m2],
        [m3, "?"]
      ], "Tích hai đường chéo bằng nhau"),
    };
  }

  if (index === 9) {
    const start = 2 + (seed % 3);
    const r = 2 + (seed % 2);
    const seq = [start, start * r, start * r * r, start * r * r * r];
    return {
      stem: `[${kinds[index]}] Điền số tiếp theo vào dãy số:`,
      options: [`${seq[3] * r}`, `${seq[3] * r + start}`, `${seq[3] * r - 1}`, `${seq[3] * r + 1}`],
      correct: "A",
      explanation: exp("Dãy số là cấp số nhân", `Mỗi số hạng gấp ${r} lần số trước đó`, `Số tiếp theo là ${seq[3]} x ${r} = ${seq[3] * r}`),
      questionType: "image",
      imageSvg: svgGrid(1, 5, [[seq[0], seq[1], seq[2], seq[3], "?"]]),
    };
  }

  if (index === 10) {
    return {
      stem: `[${kinds[index]}] Vùng 2x2 chứa các số từ 1 đến 4. Điền ô ?:`,
      options: ["2", "1", "3", "4"],
      correct: "A",
      explanation: exp("Đây là quy luật Sudoku 4x4 cơ bản", "Mỗi vùng 2x2 phải chứa đủ 4 số 1, 2, 3, 4", "Vì đã có 1, 3, 4 nên ô còn thiếu là 2"),
      questionType: "image",
      imageSvg: svgGrid(2, 2, [
        [1, 3],
        [4, "?"]
      ], "Mỗi vùng 2x2 chứa các số từ 1 đến 4"),
    };
  }

  // index === 11
  const f1 = 1 + (seed % 3);
  const f2 = 2 + (seed % 4);
  const f3 = f1 + f2;
  const f4 = f2 + f3;
  const f5 = f3 + f4;
  return {
    stem: `[${kinds[index]}] Điền số tiếp theo vào dãy số:`,
    options: [`${f4 + f5}`, `${f4 + f5 + 1}`, `${f4 + f5 - 1}`, `${f5 * 2}`],
    correct: "A",
    explanation: exp("Dãy số tuân theo quy luật giống Fibonacci", "Mỗi số hạng bằng tổng của 2 số liền trước nó", `Số tiếp theo sẽ là ${f4} + ${f5} = ${f4 + f5}`),
    questionType: "image",
    imageSvg: svgGrid(1, 6, [[f1, f2, f3, f4, f5, "?"]], "Quy luật dãy số cộng"),
  };
}

function buildQuestion(topic, patternIndex, daySeed) {
  const seed = (hashInt(`${daySeed}-${topic}-${patternIndex}`) % 70) + 1;
  let payload;
  if (topic === "numerical") payload = numerical(patternIndex, seed);
  else if (topic === "verbal") payload = verbal(patternIndex, seed);
  else if (topic === "data_interpretation") payload = dataInterpretation(patternIndex, seed);
  else if (topic === "visual") payload = visual(patternIndex, seed);
  else payload = logical(patternIndex, seed);

  return {
    question_id: randomUUID(),
    topic,
    difficulty: difficultyByIndex(patternIndex),
    language: "vi",
    stem: payload.stem,
    options: payload.options.map((text, idx) => ({ key: ["A", "B", "C", "D"][idx], text })),
    correct_option: payload.correct,
    explanation: payload.explanation,
    estimated_time_sec: difficultyByIndex(patternIndex) === "hard" ? 90 : difficultyByIndex(patternIndex) === "medium" ? 60 : 45,
    created_at: new Date().toISOString(),
    pattern_id: `${topic}_${patternIndex + 1}`,
    question_type: payload.questionType ?? "text",
    image_svg: payload.imageSvg ?? null,
  };
}

async function readUsage() {
  try {
    return JSON.parse(await readFile(".tmp/pipeline/pattern_usage.json", "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  const daySeed = process.argv[2] ?? new Date().toISOString().slice(0, 10);
  const usage = await readUsage();
  const last = usage.last ?? {};

  const questions = [];
  for (const topic of TOPICS) {
    const patternPool = Array.from({ length: 12 }, (_, i) => ({ id: `${topic}_${i + 1}`, index: i }));
    const selected = seededPick(patternPool, 6, `${daySeed}-${topic}`, new Set(last[topic] ?? []));

    for (const p of selected) {
      questions.push(buildQuestion(topic, p.index, `${daySeed}-${p.id}`));
    }

    usage.last = usage.last ?? {};
    usage.last[topic] = selected.map((s) => s.id);
  }

  const shuffled = shuffle(questions, daySeed);

  await mkdir(".tmp/pipeline", { recursive: true });
  await writeFile(".tmp/pipeline/generated.json", JSON.stringify({ questions: shuffled }, null, 2));
  await writeFile(".tmp/pipeline/pattern_usage.json", JSON.stringify({ ...usage, updatedAt: new Date().toISOString() }, null, 2));

  console.log(`Generated ${shuffled.length} draft questions for ${daySeed}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
