import Chat from "@/components/chat";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="max-w-2xl w-full h-full">
        <Chat />
      </div>
    </div>
  );
}
