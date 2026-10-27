"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BookOpen, ArrowRight, Check } from "lucide-react";
import type { OnboardingQuestion } from "@/types";

export default function OnboardingPage() {
  const { user, refreshUser, loading } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [freeTextDraft, setFreeTextDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.onboardingQuestions().then((r) => setQuestions((r as { questions: OnboardingQuestion[] }).questions));
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user?.onboarding_complete) router.push("/dashboard");
  }, [loading, user, router]);

  if (!questions.length) return null;

  const q = questions[step];
  const isLast = step === questions.length - 1;

  function setAnswer(key: string, value: unknown) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function toggleMulti(key: string, value: string) {
    const current = (answers[key] as string[]) || [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setAnswer(key, next);
  }

  function addFreeText() {
    if (!freeTextDraft.trim()) return;
    const current = (answers[q.key] as string[]) || [];
    setAnswer(q.key, [...current, freeTextDraft.trim()]);
    setFreeTextDraft("");
  }

  async function next() {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setSubmitting(true);
    try {
      const acc = (answers["accessibility"] as string[]) || [];
      await api.submitOnboarding({
        reading_frequency: answers["reading_frequency"] || "regular",
        daily_minutes_goal: 15,
        favorite_genres: answers["favorite_genres"] || [],
        loved_books_or_authors: answers["loved_books_or_authors"] || [],
        preferred_format: answers["preferred_format"] || "text",
        primary_purpose: answers["primary_purpose"] || "pleasure",
        accessibility: {
          large_text: acc.includes("large_text"),
          dyslexic_font: acc.includes("dyslexic_font"),
          high_contrast: acc.includes("high_contrast"),
        },
      });
      await refreshUser();
      router.push("/dashboard");
    } catch {
      setSubmitting(false);
    }
  }

  const canProceed =
    q.type === "free_text_list"
      ? true // optional
      : q.type === "single_choice"
      ? Boolean(answers[q.key])
      : true;

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-6">
          <BookOpen size={22} className="text-amber" />
          <span className="font-serif text-xl font-semibold text-navy">Folio</span>
        </div>

        <div className="flex gap-1.5 mb-6">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-amber" : "bg-ink/10"}`} />
          ))}
        </div>

        <div className="rounded-card border border-ink/10 bg-cream p-7">
          <p className="text-xs font-medium text-amber mb-2">
            Question {step + 1} of {questions.length}
          </p>
          <h1 className="font-serif text-xl font-semibold text-navy mb-6 leading-snug">{q.prompt}</h1>

          {q.type === "single_choice" && (
            <div className="space-y-2">
              {(q.options as Array<{ value: string; label: string }>).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnswer(q.key, opt.value)}
                  className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    answers[q.key] === opt.value ? "border-amber bg-amber/10 font-medium" : "border-ink/15 hover:bg-ink/5"
                  }`}
                >
                  {opt.label}
                  {answers[q.key] === opt.value && <Check size={16} className="text-amber" />}
                </button>
              ))}
            </div>
          )}

          {q.type === "multi_choice" && (
            <div className="flex flex-wrap gap-2">
              {(q.options as string[]).map((opt) => {
                const active = ((answers[q.key] as string[]) || []).includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleMulti(q.key, opt)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                      active ? "border-amber bg-amber text-cream font-medium" : "border-ink/15 hover:bg-ink/5"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "accessibility_picker" && (
            <div className="flex flex-wrap gap-2">
              {(q.options as Array<{ value: string; label: string }>).map((opt) => {
                const active = ((answers[q.key] as string[]) || []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleMulti(q.key, opt.value)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                      active ? "border-amber bg-amber text-cream font-medium" : "border-ink/15 hover:bg-ink/5"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "free_text_list" && (
            <div>
              <div className="flex gap-2 mb-3">
                <input
                  value={freeTextDraft}
                  onChange={(e) => setFreeTextDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFreeText())}
                  placeholder="e.g. Agatha Christie"
                  className="flex-1 rounded-lg border border-ink/15 bg-paper px-3.5 py-2.5 text-sm focus:outline-none"
                />
                <button onClick={addFreeText} className="rounded-lg bg-navy text-cream px-4 text-sm font-medium">
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {((answers[q.key] as string[]) || []).map((item, i) => (
                  <span key={i} className="rounded-full bg-forest/10 text-forest px-3 py-1 text-xs font-medium">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-xs text-ink-soft mt-3">Optional — skip if nothing comes to mind.</p>
            </div>
          )}

          <button
            onClick={next}
            disabled={!canProceed || submitting}
            className="mt-8 w-full flex items-center justify-center gap-2 rounded-full bg-navy text-cream py-3 text-sm font-semibold hover:bg-navy-deep disabled:opacity-50"
          >
            {submitting ? "Setting up your library…" : isLast ? "Finish setup" : "Continue"}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
