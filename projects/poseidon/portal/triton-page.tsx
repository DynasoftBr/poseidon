import Button from '@components/ui-button';
import Icon from '@components/ui-icon';
import Chat from '@components/portal-chat';
import Sidebar from '@components/portal-sidebar';

type Work = { title: string; steps: string[] };
type Message = { role: string; text: string; work?: Work };
type Conversation = {
    id: string;
    version: number;
    data: { title?: string; messages?: Message[] };
};

export default function TritonPage({
    conversations,
    activeConversationId,
    messages,
    prompt,
    setPrompt,
    send,
    work,
    setWork,
    onNewChat,
    onResume,
}: {
    conversations: Conversation[];
    activeConversationId?: string;
    messages: Message[];
    prompt: string;
    setPrompt: (value: string) => void;
    send: () => Promise<void>;
    work?: Work;
    setWork: (value: Work | undefined) => void;
    onNewChat: () => void;
    onResume: (conversation: Conversation) => void;
}) {
    const item = 'min-h-10 w-full justify-start rounded-md px-3 py-2 text-left hover:bg-selected';
    return (
        <div className="flex h-full min-h-0 flex-col md:flex-row">
            <Sidebar
                element="nav"
                aria-label="Triton conversations"
                className="max-h-56 w-full shrink-0 border-b border-line md:max-h-none md:w-52 md:border-b-0 md:border-r"
            >
                <div className="flex h-10 shrink-0 items-center justify-between border-b border-line px-3">
                    <span className="text-xs uppercase tracking-wide text-muted">Chats</span>
                    <Button
                        variant="ghost"
                        className="size-8 min-h-8 px-0"
                        aria-label="New chat"
                        title="New chat"
                        onClick={onNewChat}
                    >
                        <Icon name="plus" />
                    </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-1">
                    {conversations.length ? (
                        conversations
                            .slice()
                            .reverse()
                            .map((conversation) => (
                                <Button
                                    variant="ghost"
                                    key={conversation.id}
                                    className={
                                        item +
                                        (conversation.id === activeConversationId
                                            ? ' bg-selected text-primary'
                                            : '')
                                    }
                                    onClick={() => onResume(conversation)}
                                >
                                    <span className="truncate">
                                        {conversation.data.title || 'Untitled chat'}
                                    </span>
                                </Button>
                            ))
                    ) : (
                        <p className="px-3 py-2 text-sm text-muted">No conversations yet.</p>
                    )}
                </div>
                <div className="shrink-0 border-t border-line p-1">
                    <Button variant="ghost" className={item} onClick={onNewChat}>
                        <Icon name="plus" /> New chat
                    </Button>
                </div>
            </Sidebar>
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-8">
                <div className="mx-auto max-w-5xl">
                    <Chat
                        messages={messages}
                        prompt={prompt}
                        setPrompt={setPrompt}
                        send={send}
                        work={work}
                        setWork={setWork}
                    />
                </div>
            </div>
        </div>
    );
}
