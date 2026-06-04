interface QuestionTypeBadgeProps {
  type: "image_input" | "single_choice" | string;
}

const QuestionTypeBadge = ({ type }: QuestionTypeBadgeProps) => {
  const config = {
    image_input: {
      label: "Tự điền",
      className:
        "text-purple-600 bg-purple-50 border-purple-200",
    },
    single_choice: {
      label: "Trắc nghiệm",
      className:
        "text-blue-600 bg-blue-50 border-blue-200",
    },
  };

  const badge = config[type as keyof typeof config] || {
    label: type,
    className: "text-gray-600 bg-gray-50 border-gray-200",
  };

  return (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
    >
      {badge.label}
    </span>
  );
};

export default QuestionTypeBadge;