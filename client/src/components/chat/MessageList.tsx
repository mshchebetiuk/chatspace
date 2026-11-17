export type Message = {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
};

export type MessageListProps = {
  messages: Message[];
};

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <section className="w-full max-w-2xl p-4">
        <h2 className="text-xl font-semibold mb-4">Messages</h2>
        <p className="text-xs text-gray-500 mt-2">No messages yet.</p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-2xl p-4">
      <h2 className="text-xl font-semibold mb-4">Messages</h2>
      <div className="space-y-3">
        {messages.map((message) => (
          <article key={message.id} className="rounded-lg bg-gray-100 p-3">
            <h3 className="font-semibold text-sm">{message.sender}</h3>
            <p className="text-sm mt-1">{message.content}</p>
            <p className="text-xs text-gray-500 mt-2">{message.createdAt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
