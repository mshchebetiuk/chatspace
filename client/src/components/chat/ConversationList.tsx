export type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
};

export type ConversationListProps = {
  conversations: Conversation[];
  onSelectConversation: (conversationId: string) => void;
  activeConversationId: string | null;
};

export function ConversationList({
  conversations,
  onSelectConversation,
  activeConversationId,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return <section className="w-full max-w-md">No conversation yet.</section>;
  }

  return (
    <section className="w-full max-w-md">
      <ul className="divide-y">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;

          return (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
                className={`cursor-pointer w-full text-left p-4 ${isActive ? "bg-blue-100" : "hover:bg-gray-100"}`}
              >
                <h3 className="font-semibold text-lg">{conversation.name}</h3>
                <p className="text-sm text-gray-500">
                  {conversation.lastMessage}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
