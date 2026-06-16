<?php

namespace Database\Seeders;

use App\Models\Question;
use Illuminate\Database\Seeder;

class QuestionSeeder extends Seeder
{
    public function run(): void
    {
        $questions = [
            [
                'content'            => 'Thủ đô của Việt Nam là gì?',
                'time_limit_seconds' => 30,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'Hà Nội',          'is_correct' => true],
                    ['content' => 'TP. Hồ Chí Minh', 'is_correct' => false],
                    ['content' => 'Đà Nẵng',          'is_correct' => false],
                    ['content' => 'Huế',               'is_correct' => false],
                ],
            ],
            [
                'content'            => 'Hành tinh lớn nhất trong Hệ Mặt Trời là gì?',
                'time_limit_seconds' => 30,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'Sao Thổ',  'is_correct' => false],
                    ['content' => 'Sao Mộc',  'is_correct' => true],
                    ['content' => 'Sao Hỏa',  'is_correct' => false],
                    ['content' => 'Trái Đất', 'is_correct' => false],
                ],
            ],
            [
                'content'            => 'Ngôn ngữ lập trình nào được tạo ra bởi Guido van Rossum?',
                'time_limit_seconds' => 20,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'Java',   'is_correct' => false],
                    ['content' => 'Ruby',   'is_correct' => false],
                    ['content' => 'Python', 'is_correct' => true],
                    ['content' => 'PHP',    'is_correct' => false],
                ],
            ],
            [
                'content'            => 'HTML là viết tắt của gì?',
                'time_limit_seconds' => 20,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'HyperText Markup Language',   'is_correct' => true],
                    ['content' => 'HighText Machine Language',    'is_correct' => false],
                    ['content' => 'HyperText Modern Language',    'is_correct' => false],
                    ['content' => 'HyperTransfer Markup Language','is_correct' => false],
                ],
            ],
            [
                'content'            => 'Năm ánh sáng là đơn vị đo gì?',
                'time_limit_seconds' => 30,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'Thời gian',   'is_correct' => false],
                    ['content' => 'Khối lượng',  'is_correct' => false],
                    ['content' => 'Khoảng cách', 'is_correct' => true],
                    ['content' => 'Nhiệt độ',    'is_correct' => false],
                ],
            ],
            [
                'content'            => 'Ai là người phát minh ra bóng đèn điện?',
                'time_limit_seconds' => 20,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'Thomas Edison',    'is_correct' => true],
                    ['content' => 'Nikola Tesla',     'is_correct' => false],
                    ['content' => 'Albert Einstein',  'is_correct' => false],
                    ['content' => 'Alexander Bell',   'is_correct' => false],
                ],
            ],
            [
                'content'            => 'HTTP là viết tắt của gì?',
                'time_limit_seconds' => 20,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'HyperText Transfer Protocol',  'is_correct' => true],
                    ['content' => 'HighText Transfer Protocol',   'is_correct' => false],
                    ['content' => 'HyperText Transport Protocol', 'is_correct' => false],
                    ['content' => 'HyperText Transmission Protocol','is_correct' => false],
                ],
            ],
            [
                'content'            => 'Ngôn ngữ nào được dùng để tạo phong cách cho trang web?',
                'time_limit_seconds' => 15,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'HTML', 'is_correct' => false],
                    ['content' => 'CSS',  'is_correct' => true],
                    ['content' => 'PHP',  'is_correct' => false],
                    ['content' => 'SQL',  'is_correct' => false],
                ],
            ],
            [
                'content'            => 'Ai là tác giả của lý thuyết tiến hóa?',
                'time_limit_seconds' => 30,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'Isaac Newton',   'is_correct' => false],
                    ['content' => 'Gregor Mendel',  'is_correct' => false],
                    ['content' => 'Charles Darwin', 'is_correct' => true],
                    ['content' => 'Louis Pasteur',  'is_correct' => false],
                ],
            ],
            [
                'content'            => 'Con số Pi (π) gần bằng bao nhiêu?',
                'time_limit_seconds' => 15,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => '2.14', 'is_correct' => false],
                    ['content' => '3.14', 'is_correct' => true],
                    ['content' => '4.14', 'is_correct' => false],
                    ['content' => '1.14', 'is_correct' => false],
                ],
            ],
            [
                'content'            => 'Sông nào dài nhất thế giới?',
                'time_limit_seconds' => 30,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'Sông Amazon',   'is_correct' => false],
                    ['content' => 'Sông Nile',     'is_correct' => true],
                    ['content' => 'Sông Dương Tử', 'is_correct' => false],
                    ['content' => 'Sông Mekong',   'is_correct' => false],
                ],
            ],
            [
                'content'            => 'Đơn vị cơ bản của di truyền học là gì?',
                'time_limit_seconds' => 20,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'Protein',    'is_correct' => false],
                    ['content' => 'Gene',       'is_correct' => true],
                    ['content' => 'Tế bào',     'is_correct' => false],
                    ['content' => 'Nhiễm sắc thể','is_correct' => false],
                ],
            ],
            [
                'content'            => 'Tốc độ ánh sáng trong chân không xấp xỉ bao nhiêu km/s?',
                'time_limit_seconds' => 20,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => '150.000 km/s', 'is_correct' => false],
                    ['content' => '300.000 km/s', 'is_correct' => true],
                    ['content' => '450.000 km/s', 'is_correct' => false],
                    ['content' => '600.000 km/s', 'is_correct' => false],
                ],
            ],
            [
                'content'            => 'Quốc gia nào có diện tích lớn nhất thế giới?',
                'time_limit_seconds' => 15,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'Trung Quốc', 'is_correct' => false],
                    ['content' => 'Mỹ',         'is_correct' => false],
                    ['content' => 'Nga',         'is_correct' => true],
                    ['content' => 'Canada',      'is_correct' => false],
                ],
            ],
            [
                'content'            => 'Framework PHP nào được sử dụng trong dự án này?',
                'time_limit_seconds' => 10,
                'type'               => 'single_choice',
                'answers' => [
                    ['content' => 'Symfony',  'is_correct' => false],
                    ['content' => 'Laravel',  'is_correct' => true],
                    ['content' => 'CodeIgniter','is_correct' => false],
                    ['content' => 'Yii',       'is_correct' => false],
                ],
            ],
        ];

        foreach ($questions as $qData) {
            if (Question::where('content', $qData['content'])->exists()) {
                continue;
            }

            $question = Question::create([
                'content'            => $qData['content'],
                'time_limit_seconds' => $qData['time_limit_seconds'],
                'type'               => $qData['type'],
            ]);

            foreach ($qData['answers'] as $answer) {
                $question->answers()->create($answer);
            }
        }
    }
}
