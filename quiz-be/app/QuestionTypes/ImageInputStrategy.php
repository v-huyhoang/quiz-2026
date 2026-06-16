<?php

namespace App\QuestionTypes;

use App\Models\Question;

class ImageInputStrategy implements QuestionTypeStrategyInterface
{
    public function evaluate(array $submittedData, Question $question): bool
    {
        $playerText  = $submittedData['text'] ?? '';
        $correctAnswer = $question->answers->firstWhere('is_correct', true);

        if (!$correctAnswer || $playerText === '') {
            return false;
        }

        // FE already normalizes (no diacritics, lowercase, trimmed)
        // BE normalizes the stored answer for comparison
        return $this->normalize($playerText) === $this->normalize($correctAnswer->content);
    }

    private function normalize(string $text): string
    {
        $text = mb_strtolower(trim($text));
        $text = preg_replace('/\s+/', ' ', $text);

        // Strip Vietnamese diacritics
        $from = ['à','á','ả','ã','ạ','ă','ắ','ặ','ằ','ẳ','ẵ','â','ấ','ầ','ẩ','ẫ','ậ',
                 'è','é','ẻ','ẽ','ẹ','ê','ế','ề','ể','ễ','ệ',
                 'ì','í','ỉ','ĩ','ị',
                 'ò','ó','ỏ','õ','ọ','ô','ố','ồ','ổ','ỗ','ộ','ơ','ớ','ờ','ở','ỡ','ợ',
                 'ù','ú','ủ','ũ','ụ','ư','ứ','ừ','ử','ữ','ự',
                 'ỳ','ý','ỷ','ỹ','ỵ',
                 'đ'];

        $to   = ['a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a',
                 'e','e','e','e','e','e','e','e','e','e','e',
                 'i','i','i','i','i',
                 'o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o',
                 'u','u','u','u','u','u','u','u','u','u','u',
                 'y','y','y','y','y',
                 'd'];

        return str_replace($from, $to, $text);
    }
}
