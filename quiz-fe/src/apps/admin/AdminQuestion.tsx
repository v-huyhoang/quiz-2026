import { useCallback, useState, useEffect, useRef } from "react";
import {
  Plus,
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useForm, useFieldArray, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Question, QuestionType } from "../../type/question";
import type { PaginatedResponse, PaginationMeta } from "../../type/pagination";
import type { ApiResponse } from "../../type/api";
import { api } from "../../services/api";
import { Pagination } from "../../components/Pagination";
import { getApiErrorMessage, resolveStorageUrl } from "../../libs/utils";
import QuestionTypeBadge from "../../components/ui/QuestionTypeBadge";

// ── Schemas ───────────────────────────────────────────────────────────────────

const choiceSchema = z.object({
  type: z.literal("single_choice"),
  text: z.string().min(1, "Question content is required"),
  totalTime: z.number().min(5, "Min 5s").max(300, "Max 300s"),
  options: z
    .array(z.object({ text: z.string().min(1, "Option text is required"), isCorrect: z.boolean() }))
    .length(4, "Exactly 4 options are required")
    .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
      message: "Please select exactly one correct answer",
    }),
});

const imageSchema = z.object({
  type: z.literal("image_input"),
  text: z.string().optional(),
  totalTime: z.number().min(5, "Min 5s").max(300, "Max 300s"),
  answerText: z.string().min(1, "Correct answer is required"),
});

const questionSchema = z.discriminatedUnion("type", [choiceSchema, imageSchema]);

type QuestionFormValues = z.infer<typeof questionSchema>;

type ImportQuestionsResponse = { imported: number };
type ImportNotice = { type: "success" | "error"; message: string };

const defaultPaginationMeta: PaginationMeta = {
  currentPage: 1, from: null, lastPage: 1, perPage: 20, to: null, total: 0,
};

// ── Component ─────────────────────────────────────────────────────────────────

export const AdminQuestion = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(defaultPaginationMeta);
  const [isLoading, setIsLoading]   = useState(false);
  const [isAdding, setIsAdding]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting]   = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile]   = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<ImportNotice | null>(null);

  // Image upload state (not inside react-hook-form because File can't be serialized by zod easily)
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Active question type tab
  const [activeType, setActiveType] = useState<QuestionType>("single_choice");

  const fetchQuestions = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      const res = await api.get<ApiResponse<PaginatedResponse<Question>>>("/admin/questions", { params: { page } });
      setQuestions(res.data.data.data);
      setPagination(res.data.data.meta);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuestions(1); }, [fetchQuestions]);

  const handlePageChange = (page: number) => fetchQuestions(page);

  const {
    register, control, handleSubmit, setValue, watch, reset,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: "single_choice",
      text: "",
      totalTime: 15,
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    } as QuestionFormValues,
  });

  const { fields } = useFieldArray({ control, name: "options" as never });
  const watchOptions = watch("options" as never) as { text: string; isCorrect: boolean }[] | undefined;

  const handleSetCorrect = (index: number) => {
    watchOptions?.forEach((_, i) => {
      setValue(
        `options.${i}.isCorrect` as Path<QuestionFormValues>,
        i === index,
        { shouldValidate: true }
      );
    });
  };

  const handleTypeChange = (type: QuestionType) => {
    setActiveType(type);
    reset({
      type,
      text: "",
      totalTime: type === "image_input" ? 60 : 15,
      ...(type === "single_choice"
        ? { options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }] }
        : { answerText: "" }),
    } as QuestionFormValues);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const onSubmit = async (data: QuestionFormValues) => {
    try {
      setIsSubmitting(true);

      if (data.type === "image_input") {
        if (!imageFile) {
          alert("Vui lòng chọn ảnh cho câu hỏi.");
          return;
        }
        const formData = new FormData();
        formData.append("type", "image_input");
        formData.append("totalTime", String(data.totalTime));
        formData.append("answer_text", data.answerText);
        formData.append("text", data.text ?? "");
        formData.append("image", imageFile);

        await api.post("/admin/questions", formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/admin/questions", {
          type: "single_choice",
          text: data.text,
          totalTime: data.totalTime,
          options: data.options.map((opt) => ({ text: opt.text, isCorrect: opt.isCorrect })),
        });
      }

      await fetchQuestions(1);
      setImportNotice({ type: "success", message: "Tạo câu hỏi thành công." });
      handleCloseForm();
    } catch (error) {
      console.error("Failed to create question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      const nextTotal    = Math.max(pagination.total - 1, 0);
      const nextLastPage = Math.max(Math.ceil(nextTotal / pagination.perPage), 1);
      const nextPage     = Math.min(pagination.currentPage, nextLastPage);
      await fetchQuestions(nextPage);
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  };

  const handleCloseForm = () => {
    setIsAdding(false);
    setImageFile(null);
    setImagePreview(null);
    setActiveType("single_choice");
    reset();
  };

  const handleCloseImport = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportError(null);
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setImportError(null);
      setImportNotice(null);
      if (!importFile) throw new Error("Please choose a CSV or XLSX file.");
      const formData = new FormData();
      formData.append("file", importFile);
      const response = await api.post<ApiResponse<ImportQuestionsResponse>>("/admin/questions/import", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await fetchQuestions(1);
      setImportNotice({ type: "success", message: `Imported ${response.data.data.imported} questions successfully.` });
      handleCloseImport();
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to import questions.");
      setImportError(message);
      setImportNotice({ type: "error", message });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Ngân hàng câu hỏi</h3>
          <p className="text-sm text-gray-500">Quản lý câu hỏi</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 rounded-lg font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all">
            <Upload size={18} /> IMPORT
          </button>
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all">
            <Plus size={18} /> Thêm câu hỏi
          </button>
        </div>
      </div>

      {importNotice && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm ${importNotice.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {importNotice.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{importNotice.message}</span>
        </div>
      )}

      {/* Question list */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 bg-white border border-dashed border-gray-300 rounded-xl">Loading ...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white border border-dashed border-gray-300 rounded-xl">Hiện không có câu hỏi nào, hãy tạo hoặc import câu hỏi</div>
        ) : (
          questions.map((q) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm group relative">
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-2">
                  <QuestionTypeBadge type={q.type} />
                  <span className="text-xs text-gray-400 font-bold">{q.totalTime}s</span>
                </div>
                <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => handleDelete(q.id)}>
                  <Trash2 size={18} />
                </button>
              </div>

              {q.type === "image_input" ? (
                <div className="flex gap-4">
                  {q.imageUrl ? (
                    <div className="w-fit border border-gray-200 bg-transparent rounded-lg overflow-hidden shrink-0">
                      <img src={resolveStorageUrl(q.imageUrl) ?? ""} alt="Question" className="h-24 w-auto object-contain" />
                    </div>
                  ) : (
                    <div className="w-32 h-24 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0">
                      <ImageIcon size={24} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-gray-900">{q.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle size={14} className="text-green-500 shrink-0" />
                      <span className="text-xs font-bold text-gray-400">Đáp án chính xác</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">{q.text}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt) => (
                      <div key={opt.id} className={`p-3 rounded-lg border flex justify-between items-center ${opt.isCorrect ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"}`}>
                        <span className={`text-sm font-medium ${opt.isCorrect ? "text-green-700" : "text-gray-600"}`}>{opt.text}</span>
                        {opt.isCorrect && <CheckCircle className="text-green-500" size={16} />}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>

      <Pagination meta={pagination} isLoading={isLoading} onPageChange={handlePageChange} />

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-3xl rounded-2xl p-8 shadow-2xl my-auto">
            <div className="flex items-center gap-3 mb-6">
              <Upload className="text-primary" size={32} />
              <h3 className="text-2xl font-black text-gray-900">Import câu hỏi</h3>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CSV hoặc Excel XLSX file</label>
              <label className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-gray-50 px-6 py-8 text-center transition hover:bg-gray-100 ${importError ? "border-red-500" : "border-gray-200"}`}>
                <FileText className="text-gray-400" size={36} />
                <div>
                  <p className="text-sm font-bold text-gray-900">{importFile ? importFile.name : "Choose a CSV or Excel XLSX file"}</p>
                  <p className="mt-1 text-xs font-medium text-gray-400">Columns: question, total_time, A, B, C, D, correct_answer</p>
                </div>
                <input type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => { setImportFile(e.target.files?.[0] ?? null); setImportError(null); }} />
              </label>
              <a href="/samples/question-import-template.csv" download className="w-fit text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80">Tải CSV mẫu</a>
              {importError && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={14} /> {importError}</p>}
            </div>
            <div className="flex gap-4 mt-6 pt-4 border-t border-gray-100">
              <button type="button" onClick={handleCloseImport} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all uppercase tracking-widest text-xs">Cancel</button>
              <button type="button" disabled={isImporting} onClick={handleImport} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all uppercase tracking-widest text-xs shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed">{isImporting ? "Importing..." : "Import"}</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Question Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl my-auto">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="text-primary" size={32} />
              <h3 className="text-2xl font-black text-gray-900">Tạo câu hỏi mới</h3>
            </div>

            {/* Type tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
              {(["single_choice", "image_input"] as QuestionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeType === type ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {type === "single_choice" ? "Trắc nghiệm" : "Nhìn hình đoán thành ngữ"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              {/* Common: time */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời gian trả lời (giây)</label>
                <input
                  {...register("totalTime", { valueAsNumber: true })}
                  type="number"
                  className={`bg-gray-50 border rounded-lg px-4 py-2 text-sm w-32 ${errors.totalTime ? "border-red-500" : "border-gray-200"}`}
                  placeholder="15"
                />
                {errors.totalTime && <p className="text-xs text-red-500 font-medium mt-1">{errors.totalTime.message}</p>}
              </div>

              {activeType === "image_input" ? (
                // ── image_input fields ──────────────────────────────────────
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ảnh câu hỏi *</label>
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition hover:bg-gray-50 ${imageFile ? "border-primary/40 bg-transparent" : "border-gray-200 bg-gray-50"} min-h-40 p-4`}
                    >
                      {imagePreview ? (
                        <div className="w-fit mx-auto border-4 border-white shadow-lg rounded-xl overflow-hidden">
                          <img src={imagePreview} alt="Preview" className="max-h-48 w-auto object-contain block" />
                        </div>
                      ) : (
                        <>
                          <ImageIcon size={32} className="text-gray-300" />
                          <p className="text-sm font-bold text-gray-400">Click để chọn ảnh</p>
                          <p className="text-xs text-gray-400">JPG, PNG — tối đa 5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                    />
                    {imageFile && (
                      <button type="button" onClick={() => handleImageChange(null)} className="text-xs text-red-400 hover:text-red-600 font-bold self-start">Xoá ảnh</button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đáp án đúng *</label>
                    <input
                      {...register("answerText" as never)}
                      type="text"
                      className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${(errors as Record<string, { message?: string }>).answerText ? "border-red-500" : "border-gray-200"}`}
                      placeholder="Ví dụ: Dậu đổ bìm leo"
                    />
                    {(errors as Record<string, { message?: string }>).answerText && (
                      <p className="text-xs text-red-500 font-medium mt-1">{(errors as Record<string, { message?: string }>).answerText?.message}</p>
                    )}
                    <p className="text-xs text-gray-400">Hệ thống sẽ tự bỏ dấu khi so khớp — nhập đáp án đúng dạng đầy đủ để hiển thị đẹp trên màn hình.</p>
                  </div>
                </>
              ) : (
                // ── single_choice fields ────────────────────────────────────
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nội dung câu hỏi</label>
                    <textarea
                      {...register("text")}
                      className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.text ? "border-red-500" : "border-gray-200"}`}
                      placeholder="Nhập câu hỏi ..."
                      rows={3}
                    />
                    {errors.text && <p className="text-xs text-red-500 font-medium mt-1">{errors.text.message}</p>}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Options (đánh dấu đáp án đúng)</label>
                      {(errors as Record<string, { root?: { message?: string } }>).options?.root && (
                        <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                          <AlertCircle size={14} /> {(errors as Record<string, { root?: { message?: string } }>).options?.root?.message}
                        </span>
                      )}
                    </div>
                    <div className="grid gap-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex flex-col gap-1">
                          <div className={`flex gap-3 items-center bg-gray-50 border rounded-lg p-2 ${watchOptions?.[index]?.isCorrect ? "border-green-400 bg-green-50" : "border-gray-200"}`}>
                            <div className="flex items-center justify-center pl-2">
                              <input
                                type="radio"
                                checked={watchOptions?.[index]?.isCorrect || false}
                                onChange={() => handleSetCorrect(index)}
                                className="w-5 h-5 accent-green-500 cursor-pointer"
                              />
                            </div>
                            <input
                              {...register(`options.${index}.text` as never)}
                              type="text"
                              className="flex-1 bg-transparent border-none px-2 py-1 text-sm focus:outline-none focus:ring-0"
                              placeholder={`Option ${index + 1}`}
                            />
                          </div>
                          {(errors as Record<string, Array<{ text?: { message?: string } }>>).options?.[index]?.text && (
                            <p className="text-xs text-red-500 font-medium pl-10">
                              {(errors as Record<string, Array<{ text?: { message?: string } }>>).options?.[index]?.text?.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={handleCloseForm} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all uppercase tracking-widest text-xs">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all uppercase tracking-widest text-xs shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed">
                  {isSubmitting ? "Đang lưu..." : "Lưu câu hỏi"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
