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
    Mõi lần ra mõi công việc khac nhau, không được trùng lặp.
    Trả ra dữ liệu có dạng: 
    [
  {
    "cong_viec": "Sáng tạo nội dung"
  },
  {
    "cong_viec": "Quản lý dự án"
  },
  {
    "cong_viec": "Hỗ trợ kỹ thuật"
  },
  {
    "cong_viec": "Dịch sách"
  },
  {
    "cong_viec": "Giảng viên online"
  }
]
 LOG  Item: {"cong_viec": "Sáng tạo nội dung"}
 LOG  Item: {"cong_viec": "Quản lý dự án"}
 LOG  Item: {"cong_viec": "Hỗ trợ kỹ thuật"}
 LOG  Item: {"cong_viec": "Dịch sách"}
 LOG  Item: {"cong_viec": "Giảng viên online"}
 LOG  Kết quả từ AI model: [
  {
    "job": ""
  },
  {
    "job": ""
  },
  {
    "job": ""
  },
  {
    "job": ""
  },
  {
    "job": ""
  }
]
    `,
}