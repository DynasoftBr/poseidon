import EntityTypeEditor from '@components/entity-type-editor';
import Records from '@components/portal-records';
import Button from '@components/ui-button';
import Switch from '@components/ui-switch';
import Home from '@components/portal-home';
import TritonPage from '@components/triton-page';
import ResourceEditorPage from '@components/resource-editor-page';
import Header from '@components/portal-header';
import Sidebar from '@components/portal-sidebar';
import Icon from '@components/ui-icon';
import { useEffect, useState, useRef } from 'react';
import {
    MemoryRouter,
    Routes,
    Route,
    Link,
    useNavigate,
    useLocation,
    NavLink,
} from 'react-router-dom';
type Work = { title: string; steps: string[] };
type Message = { role: string; text: string; work?: Work };
type RecordItem = {
    id: string;
    version: number;
    data: { name?: string; title?: string; messages?: Message[] };
};
type Props = {
    user?: { name: string };
    route?: string;
    onEvent: (name: string, payload: object) => Promise<unknown>;
};
export default function Portal(props: Props) {
    return (
        <MemoryRouter initialEntries={[props.route || '/']}>
            <Layout {...props} />
        </MemoryRouter>
    );
}
function Layout({ user, route, onEvent }: Props) {
    const [dark, setDark] = useState(false),
        [collapsed, setCollapsed] = useState(false),
        [menu, setMenu] = useState(false),
        [platform, setPlatform] = useState(true),
        [mobile, setMobile] = useState(false);
    const [prompt, setPrompt] = useState(''),
        [messages, setMessages] = useState<Message[]>([]),
        [history, setHistory] = useState<RecordItem[]>([]),
        [entities, setEntities] = useState<RecordItem[]>([]),
        [error, setError] = useState('');
    const [conversation, setConversation] = useState<RecordItem>();
    const [saving, setSaving] = useState(false);
    const [work, setWork] = useState<Work>();
    useEffect(() => setWork(undefined), [conversation?.id]);
    const wasMobile = useRef(false);
    useEffect(() => {
        if (mobile)
            document.querySelector<HTMLButtonElement>('[data-portal-sidebar] button')?.focus();
        else if (wasMobile.current)
            document.querySelector<HTMLButtonElement>('[aria-label="Toggle navigation"]')?.focus();
        wasMobile.current = mobile;
    }, [mobile]);
    const navigate = useNavigate();
    const currentRoute = useLocation();
    const editing = ['/components', '/themes'].includes(currentRoute.pathname);
    const tritonPage = currentRoute.pathname.startsWith('/chat');
    const workspace = editing || tritonPage;
    const breadcrumb = breadcrumbFor(currentRoute.pathname);
    useEffect(() => {
        void onEvent('navigate', { path: currentRoute.pathname }).catch((reason) =>
            setError(String(reason)),
        );
    }, [currentRoute.pathname]);
    useEffect(() => {
        if (route) navigate(route);
    }, [route]);
    useEffect(() => {
        const id = route?.split('/')[2];
        const selected = history.find((item) => item.id === id);
        if (selected) {
            setConversation(selected);
            setMessages(selected.data.messages || []);
        }
    }, [route, history]);
    useEffect(() => {
        onEvent('conversations', {})
            .then((value) => setHistory(value as RecordItem[]))
            .catch((reason) => setError(String(reason)));
        onEvent('entities', {})
            .then((value) => setEntities(value as RecordItem[]))
            .catch((reason) => setError(String(reason)));
    }, []);
    function resume(item: RecordItem) {
        setMessages(item.data.messages || []);
        setConversation(item);
        setWork(undefined);
        navigate('/chat/' + item.id);
        setMobile(false);
    }
    function newChat() {
        setMessages([]);
        setConversation(undefined);
        setWork(undefined);
        navigate('/chat');
        setMobile(false);
    }
    async function send(stayOnPage = false) {
        if (!prompt.trim() || saving) return;
        setSaving(true);
        const activeConversation = currentRoute.pathname === '/' ? undefined : conversation;
        const next = [
            ...(activeConversation ? messages : []),
            { role: 'user', text: prompt },
            {
                role: 'assistant',
                text: 'Simulated Triton response: I can help you shape this workflow. Live AI and automated changes are not connected in this prototype.',
                work: {
                    title: 'Example next steps',
                    steps: [
                        'Identify the information you want to track',
                        'Review its fields and relationships',
                        'Choose the components your team will use',
                    ],
                },
            },
        ];
        setMessages(next);
        setPrompt('');
        if (!stayOnPage) navigate('/chat');
        try {
            const saved = await onEvent(
                activeConversation ? 'updateConversation' : 'createConversation',
                {
                    ...(activeConversation
                        ? { id: activeConversation.id, expectedVersion: activeConversation.version }
                        : {}),
                    data: { title: next[0].text.slice(0, 60), messages: next },
                },
            );
            setConversation(saved as RecordItem);
            if (!stayOnPage) navigate('/chat/' + (saved as RecordItem).id);
            setHistory((await onEvent('conversations', {})) as RecordItem[]);
        } catch (reason) {
            setError(String(reason));
        } finally {
            setSaving(false);
        }
    }
    const button =
        'min-h-11 justify-start rounded-lg px-3 py-2 text-left hover:bg-indigo-500/10 focus-visible:outline-2 focus-visible:outline-indigo-500';
    return (
        <div
            data-mode={dark ? 'dark' : 'light'}
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    if (menu)
                        document
                            .querySelector<HTMLButtonElement>('[data-user-menu] > button')
                            ?.focus();
                    setMenu(false);
                    setMobile(false);
                }
            }}
            className={'min-h-screen font-sans bg-canvas text-ink'}
        >
            <Header>
                <Button
                    variant="ghost"
                    className="size-10 min-h-10 px-0"
                    aria-label="Toggle navigation"
                    title="Toggle navigation"
                    onClick={() => {
                        if (window.matchMedia('(min-width: 768px)').matches) {
                            setCollapsed(!collapsed);
                        } else {
                            setMobile(!mobile);
                            setCollapsed(false);
                        }
                    }}
                >
                    <span aria-hidden="true" className="text-lg leading-none">
                        ☰
                    </span>
                </Button>
                <nav aria-label="Breadcrumb" className="ml-2 min-w-0 flex-1 truncate text-sm">
                    <span className="font-semibold">Poseidon</span>
                    {breadcrumb !== 'Home' && (
                        <>
                            <span className="mx-2 text-muted">/</span>
                            <span className="text-muted">{breadcrumb}</span>
                        </>
                    )}
                </nav>
                <div
                    className="relative"
                    data-user-menu
                    onBlur={(event) => {
                        if (menu && !event.currentTarget.contains(event.relatedTarget))
                            setMenu(false);
                    }}
                >
                    <Button
                        variant="ghost"
                        className="size-10 min-h-10 rounded-full bg-primary px-0 text-xs text-white hover:bg-primary-hover"
                        aria-label={`${user?.name || 'Local user'} menu`}
                        title={user?.name || 'Local user'}
                        aria-expanded={menu}
                        onClick={() => setMenu(!menu)}
                    >
                        {initials(user?.name || 'Local user')}
                    </Button>
                    {menu && (
                        <div className="absolute right-0 top-12 w-56 rounded-lg border border-line bg-surface p-2 shadow-xl">
                            <div className="border-b border-line px-2 py-2">
                                <div className="text-sm font-medium">
                                    {user?.name || 'Local user'}
                                </div>
                                <div className="text-xs text-muted">Local account</div>
                            </div>
                            <div className="px-2 py-1">
                                <Switch label="Dark mode" checked={dark} onChange={setDark} />
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() =>
                                    setError(
                                        'Logout is unavailable with the local development identity.',
                                    )
                                }
                            >
                                Logout
                            </Button>
                        </div>
                    )}
                </div>
            </Header>
            {mobile && (
                <button
                    aria-label="Close navigation"
                    className="fixed inset-x-0 bottom-0 top-14 z-10 bg-black/40 md:hidden"
                    onClick={() => setMobile(false)}
                />
            )}
            <Sidebar
                data-portal-sidebar
                role={mobile ? 'dialog' : undefined}
                aria-modal={mobile ? true : undefined}
                aria-label="Navigation"
                onKeyDown={(event) => {
                    if (!mobile || event.key !== 'Tab') return;
                    const nodes = Array.from(
                        event.currentTarget.querySelectorAll<HTMLElement>('button,a,input'),
                    );
                    const first = nodes[0],
                        last = nodes[nodes.length - 1];
                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last?.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first?.focus();
                    }
                }}
                className={
                    (mobile ? 'flex' : 'hidden') +
                    (collapsed ? ' md:hidden' : ' md:flex') +
                    ' fixed z-20 bottom-0 top-14 left-0 w-60 flex-col border-r border-zinc-500/20 p-3 bg-surface'
                }
            >
                <>
                    <div className="px-3 py-6 text-xl font-semibold">
                        Poseidon <span className="text-indigo-500">↗</span>
                    </div>
                    <NavLink
                        className={({ isActive }) =>
                            button + (isActive ? ' bg-selected text-primary' : '')
                        }
                        to="/"
                        onClick={() => setMobile(false)}
                    >
                        Home
                    </NavLink>
                    <NavLink
                        className={({ isActive }) =>
                            button +
                            ' flex items-center gap-2' +
                            (isActive ? ' bg-selected text-primary' : '')
                        }
                        to="/chat"
                        onClick={() => setMobile(false)}
                    >
                        <Icon name="ai" /> Triton
                    </NavLink>
                    <Button
                        variant="ghost"
                        className={button + ' mt-6'}
                        aria-expanded={platform}
                        onClick={() => setPlatform(!platform)}
                    >
                        Platform {platform ? '⌄' : '›'}
                    </Button>
                    {platform && (
                        <nav className="ml-3 flex flex-col">
                            <NavLink
                                className={({ isActive }) =>
                                    button + (isActive ? ' bg-selected text-primary' : '')
                                }
                                to="/entities"
                            >
                                Entity types
                            </NavLink>
                            <NavLink
                                className={({ isActive }) =>
                                    button + (isActive ? ' bg-selected text-primary' : '')
                                }
                                to="/components"
                            >
                                Components
                            </NavLink>
                            <NavLink
                                className={({ isActive }) =>
                                    button + (isActive ? ' bg-selected text-primary' : '')
                                }
                                to="/users"
                            >
                                Users
                            </NavLink>
                        </nav>
                    )}
                    <NavLink
                        className={({ isActive }) =>
                            button + (isActive ? ' bg-selected text-primary' : '')
                        }
                        to="/themes"
                    >
                        Themes
                    </NavLink>
                    <NavLink
                        className={({ isActive }) =>
                            button + (isActive ? ' bg-selected text-primary' : '')
                        }
                        to="/activity"
                    >
                        Activity
                    </NavLink>
                    <NavLink
                        className={({ isActive }) =>
                            button + (isActive ? ' bg-selected text-primary' : '')
                        }
                        to="/account"
                    >
                        Account
                    </NavLink>
                </>
            </Sidebar>
            <main
                className={
                    'transition-all ' +
                    (workspace
                        ? 'h-[calc(100dvh-3.5rem)] overflow-hidden '
                        : 'px-4 py-8 md:px-10 ') +
                    (collapsed ? 'md:ml-0' : 'md:ml-60')
                }
            >
                <div className={workspace ? 'h-full min-h-0 flex flex-col' : 'max-w-5xl mx-auto'}>
                    {!workspace && (
                        <div className="text-xs text-zinc-500 mb-8">
                            LOCAL PROTOTYPE · AI SIMULATED
                        </div>
                    )}
                    {error && (
                        <div role="alert" className="p-4 mb-4 border border-red-400 rounded-xl">
                            {error}
                            <Button variant="ghost" className={button} onClick={() => setError('')}>
                                Dismiss
                            </Button>
                        </div>
                    )}
                    <Routes>
                        <Route path="/users" element={<Records kind="users" onEvent={onEvent} />} />
                        <Route
                            path="/activity"
                            element={<Records kind="releases" onEvent={onEvent} />}
                        />
                        <Route
                            path="/account"
                            element={<Records kind="account" onEvent={onEvent} />}
                        />
                        <Route path="/entities" element={<EntityTypeEditor onEvent={onEvent} />} />
                        <Route
                            path="/components"
                            element={
                                <ResourceEditorPage
                                    kind="components"
                                    onEvent={onEvent}
                                    triton={{
                                        history,
                                        messages,
                                        prompt,
                                        setPrompt,
                                        send: () => send(true),
                                    }}
                                />
                            }
                        />
                        <Route
                            path="/themes"
                            element={<ResourceEditorPage kind="themes" onEvent={onEvent} />}
                        />
                        <Route
                            path="/"
                            element={
                                <Home
                                    user={user}
                                    prompt={prompt}
                                    setPrompt={setPrompt}
                                    send={send}
                                    history={history}
                                    onResume={resume}
                                />
                            }
                        />
                        <Route
                            path="/chat/*"
                            element={
                                <TritonPage
                                    conversations={history}
                                    activeConversationId={conversation?.id}
                                    messages={messages}
                                    prompt={prompt}
                                    setPrompt={setPrompt}
                                    send={send}
                                    work={work}
                                    setWork={setWork}
                                    onNewChat={newChat}
                                    onResume={resume}
                                />
                            }
                        />
                        <Route
                            path="/entity-list"
                            element={
                                <>
                                    <h1 className="text-2xl font-semibold mb-6">Entity types</h1>
                                    <div className="overflow-x-auto rounded-xl border border-zinc-500/20">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr>
                                                    <th className="p-4">Name</th>
                                                    <th className="p-4">Type</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {entities.map((item) => (
                                                    <tr
                                                        key={item.id}
                                                        className="border-t border-zinc-500/20"
                                                    >
                                                        <td className="p-4">{item.data.name}</td>
                                                        <td className="p-4 text-zinc-500">
                                                            Platform entity
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            }
                        />
                        <Route
                            path="*"
                            element={
                                <>
                                    <h1 className="text-2xl">This page is not available yet</h1>
                                    <Link to="/" className={button + ' inline-block mt-6'}>
                                        Back to Home
                                    </Link>
                                </>
                            }
                        />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

function breadcrumbFor(pathname: string): string {
    const section = pathname.split('/')[1];
    return (
        {
            chat: 'Triton',
            entities: 'Entity types',
            components: 'Components',
            users: 'Users',
            themes: 'Themes',
            activity: 'Activity',
            account: 'Account',
        }[section] || 'Home'
    );
}

function initials(name: string): string {
    return (
        name
            .split(/\s+/)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'U'
    );
}
