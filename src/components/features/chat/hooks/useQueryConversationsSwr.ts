"use client"

import useSWR from "swr"

/** One row in the conversation list (left pane). */
export interface Conversation {
    id: string
    name: string
    lastMessage: string
    unread: number
    avatarInitials: string
}

/** One bubble in a message thread (right pane). */
export interface ChatMessage {
    id: string
    fromMe: boolean
    text: string
    time: string
}

// ponytail: mock BE — no messaging endpoint yet. Deterministic sample list + a
// per-conversation thread, all SWR-shaped so the shell can swap to a real query
// (conversations() / messages(conversationId)) without touching the UI.
const fetchConversationsMock = async (): Promise<Array<Conversation>> => [
    { id: "co1", name: "Lê Minh Quân", lastMessage: "Mai nộp bài PRF192 nhé", unread: 2, avatarInitials: "LQ" },
    { id: "co2", name: "Nhóm SWP391", lastMessage: "Đã push nhánh feature/login", unread: 0, avatarInitials: "SW" },
    { id: "co3", name: "Trần Thu Hà", lastMessage: "Cảm ơn thầy đã giải đáp!", unread: 0, avatarInitials: "TH" },
    { id: "co4", name: "Cố vấn học tập", lastMessage: "Lịch đăng ký kỳ tới đã mở", unread: 1, avatarInitials: "CV" },
    { id: "co5", name: "Phạm Gia Bảo", lastMessage: "Bạn xem hộ mình bài DBI202 với", unread: 0, avatarInitials: "PB" },
    { id: "co6", name: "Nhóm CSD201", lastMessage: "Ai làm xong quiz chương 3 chưa?", unread: 5, avatarInitials: "CS" },
]

const fetchMessagesMock = async (conversationId: string): Promise<Array<ChatMessage>> => [
    { id: `${conversationId}-m1`, fromMe: false, text: "Chào bạn, bài tập tuần này bạn làm tới đâu rồi?", time: "09:12" },
    { id: `${conversationId}-m2`, fromMe: true, text: "Mình xong phần lý thuyết, đang làm phần code.", time: "09:14" },
    { id: `${conversationId}-m3`, fromMe: false, text: "Chỗ đệ quy khó phết, mình bí câu 3.", time: "09:15" },
    { id: `${conversationId}-m4`, fromMe: true, text: "Câu 3 dùng vòng lặp cũng được mà, đỡ tràn stack.", time: "09:17" },
    { id: `${conversationId}-m5`, fromMe: false, text: "Ừ đúng rồi, để mình thử lại xem.", time: "09:18" },
    { id: `${conversationId}-m6`, fromMe: true, text: "Ok, xong thì gửi mình review cho nhé.", time: "09:20" },
]

/** Loads the conversation list. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryConversationsSwr = () => {
    const { data, isLoading, error } = useSWR(["conversations"], () => fetchConversationsMock())
    return { conversations: data ?? [], isLoading, error }
}

/**
 * Loads the thread for one conversation. Mocked; SWR-shaped. Keyed by id so it
 * refetches when the selected conversation changes (drop-in BE swap point).
 */
export const useQueryConversationMessagesSwr = (conversationId: string | null) => {
    const { data, isLoading, error } = useSWR(
        conversationId ? ["conversation-messages", conversationId] : null,
        () => fetchMessagesMock(conversationId as string),
    )
    return { messages: data ?? [], isLoading, error }
}
