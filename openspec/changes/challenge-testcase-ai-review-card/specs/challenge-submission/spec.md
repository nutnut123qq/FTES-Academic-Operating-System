# challenge-submission

## ADDED Requirements

### Requirement: Nhận xét AI của bài chấm bằng test case không hiện điểm của AI
Màn hình kết quả bài nộp SHALL KHÔNG hiện điểm và verdict do AI đưa ra khi bài nộp đó có kết quả
test case, vì điểm của bài thuộc về bộ test. Thay vào đó màn hình SHALL hiện tiêu đề nhận xét kèm
một dòng nói rõ điểm đến từ đâu.

Nội dung nhận xét, tiêu chí và gợi ý cải thiện SHALL vẫn được hiện đầy đủ.

#### Scenario: Bài pass hết test case nhưng AI chấm thấp
- **WHEN** học viên mở kết quả một bài nộp có bảng kết quả test case và có nhận xét AI
- **THEN** điểm do AI đưa ra SHALL KHÔNG được hiện
- **AND** màn hình SHALL nói rõ điểm đến từ bộ test
- **AND** nội dung nhận xét SHALL vẫn hiện

#### Scenario: Bài do AI chấm điểm
- **WHEN** bài nộp KHÔNG có kết quả test case
- **THEN** điểm và verdict của AI SHALL hiện như trước
