export type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
};

export type ConversationListProps = {
  conversations: Conversation[];
};

export function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return <section className="w-full max-w-md"></section>;
  }

  return (
    <section className="w-full max-w-md">
      <ul className="divide-y">
        {conversations.map((conversation) => (
          <li
            key={conversation.id}
            className="p-4 hover:bg-gray-100 cursor-pointer"
          >
            <h3 className="font-semibold text-lg">{conversation.name}</h3>
            <p className="text-sm text-gray-500">{conversation.lastMessage}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
