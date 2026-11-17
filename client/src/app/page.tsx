import ChatHeader from "@/components/chat/ChatHeader";
import {
  Conversation,
  ConversationList,
} from "@/components/chat/ConversationList";

export default function Home() {
  const conversations: Conversation[] = [
    {
      id: "1",
      name: "Олександр Шевченко",
      lastMessage: "Привіт! Як справи з проєктом?",
    },
    {
      id: "2",
      name: "Марія Коваль",
      lastMessage: "Зустріч переноситься на завтра о 15:00.",
    },
    {
      id: "3",
      name: "Робоча група",
      lastMessage: "Нові макети вже в Figma.",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold">ChatSpace</h1>
      <p className="mt-4 text-gray-500">Connect and chat with your friends.</p>

      <ChatHeader />
      <ConversationList conversations={conversations} />
    </main>
  );
}
