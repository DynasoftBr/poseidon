import Button from '@components/ui-button';
import Icon from '@components/ui-icon';
import Sidebar from '@components/portal-sidebar';

type Conversation = { id: string; version: number; data: { title?: string } };

export default function TritonSidebar({
    conversations,
    activeConversationId,
    onNewChat,
    onResume,
    className,
}: {
    conversations: Conversation[];
    activeConversationId?: string;
    onNewChat: () => void;
    onResume: (conversation: Conversation) => void;
    className?: string;
}) {
    const item = 'min-h-10 w-full justify-start rounded-md px-3 py-2 text-left hover:bg-selected';
    return (
        <Sidebar aria-label="Triton conversations" className={className}>
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-line px-3">
                <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon name="ai" /> Triton
                </span>
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
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
                <p className="px-3 pb-2 pt-1 text-xs text-muted">RECENT CHATS</p>
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
            <div className="shrink-0 border-t border-line p-2">
                <Button variant="ghost" className={item} onClick={onNewChat}>
                    <Icon name="plus" /> New chat
                </Button>
            </div>
        </Sidebar>
    );
}
