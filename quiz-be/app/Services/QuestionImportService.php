<?php

namespace App\Services;

use App\Repositories\QuestionRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use SimpleXMLElement;
use ZipArchive;

class QuestionImportService
{
    public function __construct(
        private readonly QuestionRepository $questionRepository
    ) {
    }

    public function importFromFile(UploadedFile $file): array
    {
        $questions = $this->parseImportFile($file);

        $importedCount = DB::transaction(function () use ($questions) {
            return $this->questionRepository->createManyWithAnswers($questions);
        });

        return [
            'imported' => $importedCount,
        ];
    }

    private function parseImportFile(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        $rows = match ($extension) {
            'csv', 'txt' => $this->parseCsvRows($file->getRealPath()),
            'xlsx' => $this->parseXlsxRows($file->getRealPath()),
            default => throw new InvalidArgumentException('Only CSV and XLSX files are supported.'),
        };

        return $this->mapImportRowsToQuestions($rows);
    }

    private function parseCsvRows(string $path): array
    {
        $handle = fopen($path, 'r');

        if ($handle === false) {
            throw new InvalidArgumentException('Unable to read the import file.');
        }

        $rows = [];

        while (($row = fgetcsv($handle)) !== false) {
            $rows[] = $row;
        }

        fclose($handle);

        return $rows;
    }

    private function parseXlsxRows(string $path): array
    {
        if (!class_exists(ZipArchive::class)) {
            throw new InvalidArgumentException('XLSX import requires the PHP zip extension.');
        }

        $zip = new ZipArchive();

        if ($zip->open($path) !== true) {
            throw new InvalidArgumentException('Unable to read the XLSX file.');
        }

        $sharedStrings = $this->readSharedStrings($zip);
        $sheetPath = $this->resolveFirstSheetPath($zip);
        $sheetXml = $zip->getFromName($sheetPath);
        $zip->close();

        if ($sheetXml === false) {
            throw new InvalidArgumentException('Unable to read the first worksheet.');
        }

        $sheet = simplexml_load_string($sheetXml);

        if (!$sheet instanceof SimpleXMLElement) {
            throw new InvalidArgumentException('Invalid XLSX worksheet data.');
        }

        $rows = [];

        foreach ($sheet->sheetData->row as $row) {
            $cells = [];

            foreach ($row->c as $cell) {
                $cellReference = (string) $cell['r'];
                $columnIndex = $this->columnIndexFromCellReference($cellReference);
                $cells[$columnIndex] = $this->readXlsxCellValue($cell, $sharedStrings);
            }

            if ($cells !== []) {
                ksort($cells);
                $maxColumn = max(array_keys($cells));
                $normalizedRow = [];

                for ($index = 0; $index <= $maxColumn; $index++) {
                    $normalizedRow[] = $cells[$index] ?? '';
                }

                $rows[] = $normalizedRow;
            }
        }

        return $rows;
    }

    private function readSharedStrings(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');

        if ($xml === false) {
            return [];
        }

        $sharedStringsXml = simplexml_load_string($xml);

        if (!$sharedStringsXml instanceof SimpleXMLElement) {
            return [];
        }

        $strings = [];

        foreach ($sharedStringsXml->si as $item) {
            if (isset($item->t)) {
                $strings[] = (string) $item->t;
                continue;
            }

            $text = '';

            foreach ($item->r as $run) {
                $text .= (string) $run->t;
            }

            $strings[] = $text;
        }

        return $strings;
    }

    private function resolveFirstSheetPath(ZipArchive $zip): string
    {
        $workbookXml = $zip->getFromName('xl/workbook.xml');
        $relationshipsXml = $zip->getFromName('xl/_rels/workbook.xml.rels');

        if ($workbookXml === false || $relationshipsXml === false) {
            return 'xl/worksheets/sheet1.xml';
        }

        $workbook = simplexml_load_string($workbookXml);
        $relationships = simplexml_load_string($relationshipsXml);

        if (!$workbook instanceof SimpleXMLElement || !$relationships instanceof SimpleXMLElement) {
            return 'xl/worksheets/sheet1.xml';
        }

        $workbook->registerXPathNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships');
        $sheet = $workbook->sheets->sheet[0] ?? null;
        $relationshipId = $sheet?->attributes('r', true)?->id;

        if ($relationshipId === null) {
            return 'xl/worksheets/sheet1.xml';
        }

        foreach ($relationships->Relationship as $relationship) {
            if ((string) $relationship['Id'] === (string) $relationshipId) {
                $target = (string) $relationship['Target'];

                return str_starts_with($target, '/')
                    ? ltrim($target, '/')
                    : 'xl/' . ltrim($target, '/');
            }
        }

        return 'xl/worksheets/sheet1.xml';
    }

    private function readXlsxCellValue(SimpleXMLElement $cell, array $sharedStrings): string
    {
        $type = (string) $cell['t'];

        if ($type === 's') {
            return $sharedStrings[(int) $cell->v] ?? '';
        }

        if ($type === 'inlineStr') {
            return trim((string) $cell->is->t);
        }

        return trim((string) $cell->v);
    }

    private function columnIndexFromCellReference(string $cellReference): int
    {
        $letters = preg_replace('/[^A-Z]/', '', strtoupper($cellReference));
        $index = 0;

        foreach (str_split($letters) as $letter) {
            $index = ($index * 26) + (ord($letter) - 64);
        }

        return $index - 1;
    }

    private function mapImportRowsToQuestions(array $rows): array
    {
        $normalizedRows = collect($rows)
            ->map(fn (array $row) => array_map(fn ($cell) => trim((string) $cell), $row))
            ->filter(fn (array $row) => collect($row)->contains(fn (string $cell) => $cell !== ''))
            ->values();

        if ($normalizedRows->isEmpty()) {
            throw new InvalidArgumentException('The import file is empty.');
        }

        $firstCell = strtolower($normalizedRows->first()[0] ?? '');
        $dataRows = in_array($firstCell, ['question', 'text', 'content'], true)
            ? $normalizedRows->slice(1)->values()
            : $normalizedRows;

        if ($dataRows->isEmpty()) {
            throw new InvalidArgumentException('The import file does not contain any questions.');
        }

        if ($dataRows->count() > 500) {
            throw new InvalidArgumentException('You can import up to 500 questions at a time.');
        }

        return $dataRows->map(function (array $row, int $index) {
            $rowNumber = $index + 2;
            $questionText = $row[0] ?? '';
            $totalTime = (int) ($row[1] ?? 0);
            $optionTexts = array_slice($row, 2, 4);
            $correctAnswer = strtoupper($row[6] ?? '');
            $correctOptions = ['A', 'B', 'C', 'D'];
            $correctIndex = array_search($correctAnswer, $correctOptions, true);

            if ($questionText === '') {
                throw new InvalidArgumentException("Row {$rowNumber}: question is required.");
            }

            if ($totalTime < 5 || $totalTime > 300) {
                throw new InvalidArgumentException("Row {$rowNumber}: total_time must be between 5 and 300.");
            }

            if (count($optionTexts) !== 4 || collect($optionTexts)->contains(fn (string $option) => $option === '')) {
                throw new InvalidArgumentException("Row {$rowNumber}: options A-D are required.");
            }

            if ($correctIndex === false) {
                throw new InvalidArgumentException("Row {$rowNumber}: correct_answer must be A, B, C, or D.");
            }

            return [
                'text' => $questionText,
                'totalTime' => $totalTime,
                'options' => collect($optionTexts)
                    ->map(fn (string $option, int $optionIndex) => [
                        'text' => $option,
                        'isCorrect' => $optionIndex === $correctIndex,
                    ])
                    ->all(),
            ];
        })->all();
    }
}
