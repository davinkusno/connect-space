"use client"

import type React from "react"

import { createContext, useContext, useState, useCallback } from "react"
import { EnhancedChatbotWidget } from "./enhanced-chatbot-widget"

interface ChatbotContextType {
  isOpen: boolean
  openChatbot: (context?: string) => void
  closeChatbot: () => void
  sendMessage: (message: string) => void
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined)

export function useChatbot() {
  const context = useContext(ChatbotContext)
  if (context === undefined) {
    throw new Error("useChatbot must be used within a ChatbotProvider")
  }
  return context
}

interface GlobalChatbotProviderProps {
  children: React.ReactNode
}

export function GlobalChatbotProvider({ children }: GlobalChatbotProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [context, setContext] = useState<string>("general")
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const openChatbot = useCallback((newContext?: string) => {
    if (newContext) {
      setContext(newContext)
    }
    setIsOpen(true)
  }, [])

  const closeChatbot = useCallback(() => {
    setIsOpen(false)
    setPendingMessage(null)
  }, [])

  const sendMessage = useCallback((message: string) => {
    setPendingMessage(message)
    setIsOpen(true)
  }, [])

  const value = {
    isOpen,
    openChatbot,
    closeChatbot,
    sendMessage,
  }

  return (
    <ChatbotContext.Provider value={value}>
      {children}
      <EnhancedChatbotWidget defaultOpen={isOpen} context={context} size="normal" className="z-[9999]" />
    </ChatbotContext.Provider>
  )
}
