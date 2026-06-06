<?php

namespace App\QuestionTypes;

class QuestionTypeResolver
{
    private static array $map = [
        'single_choice'   => SingleChoiceStrategy::class,
        'multiple_choice' => SingleChoiceStrategy::class,
        'image_input'     => ImageInputStrategy::class,
    ];

    public static function resolve(string $type): QuestionTypeStrategyInterface
    {
        $class = self::$map[$type] ?? null;

        if (!$class) {
            throw new \InvalidArgumentException("Unknown question type: {$type}");
        }

        return new $class();
    }
}
