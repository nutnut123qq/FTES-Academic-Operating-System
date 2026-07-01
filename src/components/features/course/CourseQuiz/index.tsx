"use client"

import React, { useState } from "react"
import { Button, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryQuizSwr } from "../hooks/useQueryQuizSwr"

/**
 * Course quiz (§4/§10). DEFAULT on-canon layout: a question list with selectable
 * options + a submit that scores locally. ponytail: options are selectable rows
 * (icon-free); mock questions; scoring is client-side only.
 */
export const CourseQuiz = () => {
    const t = useTranslations("courseSystem")
    const { courseId } = useParams<{ courseId: string }>()
    const { questions } = useQueryQuizSwr(courseId)
    const [answers, setAnswers] = useState<Record<string, number>>({})
    const [submitted, setSubmitted] = useState(false)

    const score = questions.filter((q) => answers[q.id] === q.correctIndex).length

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("quiz.title")}
            </Typography>

            <div className="flex flex-col gap-6">
                {questions.map((question, index) => (
                    <div key={question.id} className="flex flex-col gap-3">
                        <Typography type="body" weight="medium">
                            {index + 1}. {question.text}
                        </Typography>
                        <div className="flex flex-col gap-2">
                            {question.options.map((option, optionIndex) => {
                                const selected = answers[question.id] === optionIndex
                                const isCorrect = submitted && optionIndex === question.correctIndex
                                return (
                                    <button
                                        key={optionIndex}
                                        type="button"
                                        onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                                        className={cn(
                                            "flex items-center gap-3 rounded-large border p-4 text-left transition-colors",
                                            selected ? "border-accent bg-accent/10" : "border-separator hover:bg-default/40",
                                            isCorrect && "border-accent bg-accent/10",
                                        )}
                                    >
                                        <Typography type="body-sm" className="min-w-0 flex-1">
                                            {option}
                                        </Typography>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* submit / result */}
            <div className="flex items-center justify-between border-t border-separator pt-6">
                {submitted ? (
                    <Typography type="body-sm" weight="medium">
                        {t("quiz.result", { score, total: questions.length })}
                    </Typography>
                ) : (
                    <span />
                )}
                <Button variant="secondary" onPress={() => setSubmitted(true)} isDisabled={submitted}>
                    {t("quiz.submit")}
                </Button>
            </div>
        </div>
    )
}
