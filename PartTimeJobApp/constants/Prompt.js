import dedent from 'dedent';

export default {
    GenerateTrendingJob: dedent`
    Bạn hãy gợi ý 1 số công việc bán thời gian đang thịnh hành tại Việt Nam trong năm 2024.
    Công việc này phải phù hợp với sinh viên, có thể làm tại nhà hoặc làm online, có thể làm theo ca, lương từ 5 triệu đến 10 triệu đồng mỗi tháng.
    Trả về công việc dưới dạng JSON, mỗi công việc là một đối tượng JSON riêng biệt.
    Công việc ngắn tầm 2 từ thôi
    Chỉ cần tên công việc không cần giải thích gì thêm.
    Cần 5 công việc khác nhau, mỗi công việc là một đối tượng JSON riêng biệt.
    Trả về bằng tiếng Việt, không cần giải thích gì thêm.
    `,
}