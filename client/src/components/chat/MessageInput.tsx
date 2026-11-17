export type MessageInputProps = {
  placeholder: string;
};

export function MessageInput({ placeholder }: MessageInputProps) {
  return (
    <form className="flex gap-2 p-4 border-t">
      <input
        type="text"
        className="flex-1 border rounded-lg px-3 py-2"
        placeholder={placeholder}
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Send
      </button>
    </form>
  );
}
