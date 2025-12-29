/**
 * WhatsApp Web Clone - Terminal Edition
 *
 * A full-featured WhatsApp Web clone built entirely with tuiuiu.js components.
 * Demonstrates: SplitPanel, ScrollList, TextInput, Badge, theming, and real-time updates.
 *
 * Run: pnpm example examples/whatsapp-clone.ts
 */

import {
  render,
  Box,
  Text,
  SplitPanel,
  ScrollList,
  createScrollList,
  createTextInput,
  renderTextInput,
  Badge,
  Spinner,
  useHotkeys,
  useMouse,
  useApp,
  useState,
  useTerminalSize,
  createSignal,
  setTheme,
  darkTheme,
} from '../src/index.js';
import type { VNode } from '../src/utils/types.js';

// =============================================================================
// Theme - WhatsApp Dark Mode Colors
// =============================================================================

const colors = {
  // WhatsApp brand colors
  primary: '#25D366',      // WhatsApp green
  primaryDark: '#128C7E',  // Darker green
  teal: '#075E54',         // Teal accent

  // Background colors
  bgDark: '#111B21',       // Main background
  bgPanel: '#202C33',      // Panel background
  bgHover: '#2A3942',      // Hover state
  bgSelected: '#2A3942',   // Selected item
  bgInput: '#2A3942',      // Input background
  bgBubbleSent: '#005C4B', // Sent message bubble
  bgBubbleReceived: '#202C33', // Received message bubble

  // Text colors
  textPrimary: '#E9EDEF',  // Primary text
  textSecondary: '#8696A0', // Secondary text
  textMuted: '#667781',    // Muted text

  // Status colors
  online: '#25D366',       // Online indicator
  typing: '#25D366',       // Typing indicator
  unread: '#25D366',       // Unread badge
  checkmark: '#53BDEB',    // Blue checkmarks
};

// =============================================================================
// Types
// =============================================================================

interface Contact {
  id: string;
  name: string;
  avatar: string;       // Emoji avatar
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  typing: boolean;
}

interface Message {
  id: string;
  contactId: string;
  text: string;
  time: string;
  sent: boolean;        // true = sent by user, false = received
  read: boolean;
  delivered: boolean;
}

// =============================================================================
// Mock Data
// =============================================================================

const LOREM_PHRASES = [
  'Hey! How are you doing?',
  'Did you see the news today?',
  'I just finished that project we talked about',
  'Can we meet tomorrow for coffee?',
  'Thanks for your help yesterday!',
  'Haha that was so funny',
  'Sure, sounds good to me',
  'Let me check and get back to you',
  'I am on my way',
  'Just woke up, what is up?',
  'Sorry, I was busy. What did I miss?',
  'That is awesome news!',
  'I will send you the files later',
  'Are you free this weekend?',
  'Happy birthday! Hope you have a great day',
  'The meeting has been rescheduled',
  'Check out this cool thing I found',
  'miss you!',
  'Call me when you can',
  'Running late, be there in 10',
];

const initialContacts: Contact[] = [
  { id: '1', name: 'Alice', avatar: '👩', lastMessage: 'See you tomorrow!', time: '10:30', unread: 2, online: true, typing: false },
  { id: '2', name: 'Bob', avatar: '👨', lastMessage: 'Thanks for the help', time: '09:45', unread: 0, online: false, typing: false },
  { id: '3', name: 'Carol', avatar: '👩‍💼', lastMessage: 'Meeting at 3pm', time: '09:15', unread: 0, online: true, typing: false },
  { id: '4', name: 'David', avatar: '👨‍💻', lastMessage: 'Check the PR', time: 'Yesterday', unread: 5, online: false, typing: false },
  { id: '5', name: 'Eva', avatar: '👩‍🎨', lastMessage: 'Love the new design!', time: 'Yesterday', unread: 0, online: true, typing: false },
  { id: '6', name: 'Frank', avatar: '👨‍🔧', lastMessage: 'Fixed the bug', time: 'Yesterday', unread: 0, online: false, typing: false },
  { id: '7', name: 'Grace', avatar: '👩‍🔬', lastMessage: 'Results are in', time: 'Monday', unread: 1, online: false, typing: false },
  { id: '8', name: 'Henry', avatar: '👨‍🍳', lastMessage: 'Dinner at 8?', time: 'Monday', unread: 0, online: true, typing: false },
  { id: '9', name: 'Iris', avatar: '👩‍🚀', lastMessage: 'Launch successful!', time: 'Sunday', unread: 0, online: false, typing: false },
  { id: '10', name: 'Jack', avatar: '👨‍🎤', lastMessage: 'Great show last night', time: 'Sunday', unread: 0, online: false, typing: false },
  { id: '11', name: 'Karen', avatar: '👩‍⚕️', lastMessage: 'Take your meds!', time: 'Saturday', unread: 0, online: true, typing: false },
  { id: '12', name: 'Leo', avatar: '🦁', lastMessage: 'Roar!', time: 'Saturday', unread: 3, online: false, typing: false },
];

const initialMessages: Record<string, Message[]> = {
  '1': [
    { id: 'm1', contactId: '1', text: 'Hey! How are you?', time: '10:15', sent: false, read: true, delivered: true },
    { id: 'm2', contactId: '1', text: 'I am good, thanks! Working on the new project', time: '10:20', sent: true, read: true, delivered: true },
    { id: 'm3', contactId: '1', text: 'That sounds exciting! Need any help?', time: '10:25', sent: false, read: true, delivered: true },
    { id: 'm4', contactId: '1', text: 'Actually yes, can you review my PR?', time: '10:28', sent: true, read: true, delivered: true },
    { id: 'm5', contactId: '1', text: 'Sure! Send me the link', time: '10:29', sent: false, read: true, delivered: true },
    { id: 'm6', contactId: '1', text: 'See you tomorrow!', time: '10:30', sent: false, read: false, delivered: true },
  ],
  '2': [
    { id: 'm7', contactId: '2', text: 'Can you help me with something?', time: '09:30', sent: false, read: true, delivered: true },
    { id: 'm8', contactId: '2', text: 'Of course! What do you need?', time: '09:35', sent: true, read: true, delivered: true },
    { id: 'm9', contactId: '2', text: 'Thanks for the help', time: '09:45', sent: false, read: true, delivered: true },
  ],
  '3': [
    { id: 'm10', contactId: '3', text: 'Reminder: Meeting at 3pm today', time: '09:00', sent: false, read: true, delivered: true },
    { id: 'm11', contactId: '3', text: 'Got it, I will be there', time: '09:10', sent: true, read: true, delivered: true },
    { id: 'm12', contactId: '3', text: 'Meeting at 3pm', time: '09:15', sent: false, read: true, delivered: true },
  ],
};

// =============================================================================
// State Management
// =============================================================================

const [contacts, setContacts] = createSignal<Contact[]>(initialContacts);
const [messages, setMessages] = createSignal<Record<string, Message[]>>(initialMessages);
const [selectedContactId, setSelectedContactId] = createSignal<string>('1');
const [searchQuery, setSearchQuery] = createSignal('');
const [isTyping, setIsTyping] = createSignal(false);

// Scroll states
const chatScrollState = createScrollList({ initialScrollTop: 999 });
const contactsScrollState = createScrollList({});

// Text input states (created once, outside components)
const searchInputState = createTextInput({
  placeholder: 'Search or start new chat',
  onChange: setSearchQuery,
});

const messageInputState = createTextInput({
  placeholder: 'Type a message',
});

// Helper to get current time
function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// Add message to a conversation
function addMessage(contactId: string, text: string, sent: boolean): void {
  const newMessage: Message = {
    id: `m${Date.now()}`,
    contactId,
    text,
    time: getCurrentTime(),
    sent,
    read: sent,
    delivered: true,
  };

  setMessages(prev => ({
    ...prev,
    [contactId]: [...(prev[contactId] || []), newMessage],
  }));

  // Update contact's last message
  setContacts(prev => prev.map(c =>
    c.id === contactId
      ? { ...c, lastMessage: text, time: getCurrentTime(), unread: sent ? c.unread : c.unread + 1 }
      : c
  ));
}

// Mark messages as read
function markAsRead(contactId: string): void {
  setContacts(prev => prev.map(c =>
    c.id === contactId ? { ...c, unread: 0 } : c
  ));
}

// Simulate incoming messages
function simulateIncomingMessages(): void {
  setInterval(() => {
    // Random contact (excluding currently selected to avoid confusion)
    const availableContacts = contacts().filter(c => c.id !== selectedContactId());
    if (availableContacts.length === 0) return;

    const randomContact = availableContacts[Math.floor(Math.random() * availableContacts.length)];
    const randomMessage = LOREM_PHRASES[Math.floor(Math.random() * LOREM_PHRASES.length)];

    // Simulate typing indicator
    setContacts(prev => prev.map(c =>
      c.id === randomContact.id ? { ...c, typing: true } : c
    ));

    // After "typing", send the message
    setTimeout(() => {
      setContacts(prev => prev.map(c =>
        c.id === randomContact.id ? { ...c, typing: false } : c
      ));
      addMessage(randomContact.id, randomMessage, false);
    }, 1500 + Math.random() * 1000);

  }, 5000 + Math.random() * 10000); // Random interval 5-15 seconds
}

// =============================================================================
// Components
// =============================================================================

/**
 * WhatsApp Header
 */
function Header(): VNode {
  return Box(
    {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingX: 2,
      paddingY: 1,
      backgroundColor: colors.teal,
    },
    Box(
      { flexDirection: 'row', gap: 2 },
      Text({ color: colors.primary, bold: true }, ''),
      Text({ color: colors.textPrimary, bold: true }, 'WhatsApp'),
    ),
    Box(
      { flexDirection: 'row', gap: 2 },
      Text({ color: colors.textSecondary }, ''),
      Text({ color: colors.textSecondary }, '⋮'),
    ),
  );
}

/**
 * Search Input Component
 */
function SearchBar(props: { width: number }): VNode {
  return Box(
    { paddingX: 1, paddingY: 1, backgroundColor: colors.bgPanel },
    Box(
      {
        flexDirection: 'row',
        backgroundColor: colors.bgInput,
        borderStyle: 'round',
        borderColor: colors.bgInput,
        paddingX: 1,
      },
      Text({ color: colors.textSecondary }, '🔍 '),
      renderTextInput(searchInputState, {
        width: Math.max(10, props.width - 10),
        borderStyle: 'none',
        isActive: false,
      }),
    ),
  );
}

/**
 * Single Contact Item in the list
 */
function ContactItem(props: { contact: Contact; isSelected: boolean; width: number }): VNode {
  const { contact, isSelected, width } = props;
  const maxMsgLen = Math.max(10, width - 20);

  return Box(
    {
      flexDirection: 'row',
      paddingX: 1,
      paddingY: 1,
      backgroundColor: isSelected ? colors.bgSelected : undefined,
      gap: 1,
    },
    // Avatar
    Box(
      {
        width: 3,
        height: 2,
        justifyContent: 'center',
        alignItems: 'center',
      },
      Text({ }, contact.avatar),
    ),
    // Content
    Box(
      { flexDirection: 'column', flexGrow: 1 },
      // Name row
      Box(
        { flexDirection: 'row', justifyContent: 'space-between' },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: colors.textPrimary, bold: true }, contact.name),
          contact.online ? Text({ color: colors.online }, '●') : null,
        ),
        Text({ color: contact.unread > 0 ? colors.primary : colors.textMuted, dim: contact.unread === 0 }, contact.time),
      ),
      // Last message row
      Box(
        { flexDirection: 'row', justifyContent: 'space-between', gap: 1 },
        contact.typing
          ? Text({ color: colors.typing, italic: true }, 'typing...')
          : Text(
              { color: colors.textSecondary, dim: true },
              contact.lastMessage.length > maxMsgLen
                ? contact.lastMessage.slice(0, maxMsgLen) + '...'
                : contact.lastMessage
            ),
        contact.unread > 0
          ? Badge({
              label: contact.unread.toString(),
              variant: 'solid',
              color: colors.unread,
            })
          : null,
      ),
    ),
  );
}

/**
 * Contacts List (Left Panel)
 */
function ContactsList(props: { width: number; height: number }): VNode {
  const { width, height } = props;
  const query = searchQuery().toLowerCase();
  const listHeight = Math.max(5, height - 4);

  const filteredContacts = query
    ? contacts().filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.lastMessage.toLowerCase().includes(query)
      )
    : contacts();

  return Box(
    { flexDirection: 'column', backgroundColor: colors.bgPanel, height },
    SearchBar({ width }),
    ScrollList({
      items: filteredContacts,
      children: (contact: Contact) => ContactItem({
        contact,
        isSelected: contact.id === selectedContactId(),
        width,
      }),
      height: listHeight,
      width,
      itemHeight: 3,
      keysEnabled: false,
      isActive: false,
      state: contactsScrollState,
    }),
  );
}

/**
 * Chat Header (shows selected contact info)
 */
function ChatHeader(props: { contact: Contact; width: number }): VNode {
  const { contact } = props;

  return Box(
    {
      flexDirection: 'row',
      paddingX: 2,
      paddingY: 1,
      backgroundColor: colors.bgPanel,
      gap: 2,
    },
    // Avatar
    Text({ }, contact.avatar),
    // Info
    Box(
      { flexDirection: 'column', flexGrow: 1 },
      Text({ color: colors.textPrimary, bold: true }, contact.name),
      contact.typing
        ? Text({ color: colors.typing, italic: true }, 'typing...')
        : contact.online
          ? Text({ color: colors.textSecondary, dim: true }, 'online')
          : Text({ color: colors.textMuted, dim: true }, 'last seen today'),
    ),
    // Actions
    Box(
      { flexDirection: 'row', gap: 2 },
      Text({ color: colors.textSecondary }, ''),
      Text({ color: colors.textSecondary }, '⋮'),
    ),
  );
}

/**
 * Single Message Bubble
 */
function MessageBubble(props: { message: Message; width: number }): VNode {
  const { message, width } = props;
  const maxWidth = Math.floor(width * 0.7);
  const isSent = message.sent;

  // Checkmarks for sent messages
  const checkmarks = isSent
    ? message.read
      ? Text({ color: colors.checkmark }, ' ✓✓')
      : message.delivered
        ? Text({ color: colors.textMuted }, ' ✓✓')
        : Text({ color: colors.textMuted }, ' ✓')
    : null;

  return Box(
    {
      flexDirection: 'row',
      justifyContent: isSent ? 'flex-end' : 'flex-start',
      paddingX: 1,
      marginBottom: 1,
    },
    Box(
      {
        flexDirection: 'column',
        backgroundColor: isSent ? colors.bgBubbleSent : colors.bgBubbleReceived,
        borderStyle: 'round',
        borderColor: isSent ? colors.bgBubbleSent : colors.bgBubbleReceived,
        paddingX: 1,
        maxWidth,
      },
      Text({ color: colors.textPrimary }, message.text),
      Box(
        { flexDirection: 'row', justifyContent: 'flex-end', gap: 1 },
        Text({ color: colors.textMuted, dim: true }, message.time),
        checkmarks,
      ),
    ),
  );
}

/**
 * Chat Messages Area
 */
function ChatMessages(props: { contactId: string; width: number; height: number }): VNode {
  const { contactId, width, height } = props;
  const chatMessages = messages()[contactId] || [];
  const scrollHeight = Math.max(5, height - 1);

  if (chatMessages.length === 0) {
    return Box(
      {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: Math.max(5, height),
        backgroundColor: colors.bgDark,
      },
      Text({ color: colors.textMuted, dim: true }, 'No messages yet'),
      Text({ color: colors.textMuted, dim: true }, 'Say hello!'),
    );
  }

  return Box(
    { backgroundColor: colors.bgDark, height: Math.max(5, height) },
    ScrollList({
      items: chatMessages,
      children: (msg: Message) => MessageBubble({ message: msg, width }),
      height: scrollHeight,
      width,
      itemHeight: 3,
      keysEnabled: true,
      isActive: true,
      autoScroll: true,
      autoScrollThreshold: 0,
      state: chatScrollState,
      hotkeyScope: 'global',
    }),
  );
}

/**
 * Message Input Area
 */
function MessageInput(props: { width: number; onSend: (text: string) => void }): VNode {
  const { width, onSend } = props;

  // Set up the submit handler
  messageInputState.onSubmit = (value: string) => {
    if (value.trim()) {
      onSend(value);
      messageInputState.clear();
    }
  };

  return Box(
    {
      flexDirection: 'row',
      paddingX: 2,
      paddingY: 1,
      backgroundColor: colors.bgPanel,
      gap: 1,
    },
    Text({ color: colors.textSecondary }, '😀'),
    Box(
      {
        flexGrow: 1,
        backgroundColor: colors.bgInput,
        borderStyle: 'round',
        borderColor: colors.bgInput,
        paddingX: 1,
      },
      renderTextInput(messageInputState, {
        width: Math.max(10, width - 14),
        borderStyle: 'none',
        isActive: true,
        foreground: colors.textPrimary,
      }),
    ),
    Text({ color: colors.textSecondary }, '🎤'),
  );
}

/**
 * Chat Panel (Right Side)
 */
function ChatPanel(props: { width: number; height: number }): VNode {
  const { width, height } = props;
  const selectedId = selectedContactId();
  const contact = contacts().find(c => c.id === selectedId);

  if (!contact) {
    return Box(
      {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height,
        backgroundColor: colors.bgDark,
      },
      Text({ color: colors.primary, bold: true }, ''),
      Text({ color: colors.textPrimary, bold: true }, 'WhatsApp Web'),
      Box({ height: 1 }),
      Text({ color: colors.textMuted }, 'Select a chat to start messaging'),
    );
  }

  const headerHeight = 3;
  const inputHeight = 3;
  const messagesHeight = Math.max(5, height - headerHeight - inputHeight);

  const handleSend = (text: string) => {
    addMessage(selectedId, text, true);
  };

  return Box(
    { flexDirection: 'column', height },
    ChatHeader({ contact, width }),
    ChatMessages({ contactId: selectedId, width, height: messagesHeight }),
    MessageInput({ width, onSend: handleSend }),
  );
}

/**
 * Status Bar at bottom
 */
function StatusBar(props: { width: number }): VNode {
  const totalUnread = contacts().reduce((sum, c) => sum + c.unread, 0);
  const onlineCount = contacts().filter(c => c.online).length;

  return Box(
    {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingX: 2,
      backgroundColor: colors.teal,
    },
    Text({ color: colors.textSecondary, dim: true }, `${onlineCount} online`),
    totalUnread > 0
      ? Text({ color: colors.primary }, `${totalUnread} unread messages`)
      : Text({ color: colors.textMuted, dim: true }, 'All caught up'),
    Text({ color: colors.textMuted, dim: true }, '↑↓ Navigate │ 🖱️ Click │ Esc Quit'),
  );
}

// =============================================================================
// Main App
// =============================================================================

function WhatsAppClone(): VNode {
  const { exit } = useApp();
  const termSize = useTerminalSize();
  // Fallback to default terminal size if not available
  const width = termSize.width || process.stdout.columns || 80;
  const height = termSize.height || process.stdout.rows || 24;
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcuts
  useHotkeys('escape', () => exit());
  useHotkeys('q', () => exit());

  useHotkeys('up', () => {
    const filtered = searchQuery()
      ? contacts().filter(c => c.name.toLowerCase().includes(searchQuery().toLowerCase()))
      : contacts();
    const newIndex = Math.max(0, selectedIndex() - 1);
    setSelectedIndex(newIndex);
    if (filtered[newIndex]) {
      setSelectedContactId(filtered[newIndex].id);
      markAsRead(filtered[newIndex].id);
    }
  });

  useHotkeys('down', () => {
    const filtered = searchQuery()
      ? contacts().filter(c => c.name.toLowerCase().includes(searchQuery().toLowerCase()))
      : contacts();
    const newIndex = Math.min(filtered.length - 1, selectedIndex() + 1);
    setSelectedIndex(newIndex);
    if (filtered[newIndex]) {
      setSelectedContactId(filtered[newIndex].id);
      markAsRead(filtered[newIndex].id);
    }
  });

  const headerHeight = 3;
  const statusBarHeight = 1;
  const contentHeight = Math.max(10, height - headerHeight - statusBarHeight);
  // Increased left panel width (was 25-35, now 30-45)
  const leftPanelWidth = Math.max(30, Math.min(45, Math.floor(width * 0.40)));

  // Mouse click support for contacts
  useMouse((event) => {
    // Only handle left clicks in the contacts panel area
    if (event.action === 'click' && event.button === 'left') {
      // Check if click is within the left panel (contacts area)
      if (event.x < leftPanelWidth) {
        // Calculate which contact was clicked
        // Layout: Header (3 rows) + SearchBar (5 rows: paddingY:1 + round border)
        // Each contact item is 3 rows tall (itemHeight: 3)
        const contactsStartY = 8; // Header(3) + SearchBar(5) = 8
        const clickedRow = event.y - contactsStartY;

        if (clickedRow >= 0) {
          const itemHeight = 3;
          const clickedIndex = Math.floor(clickedRow / itemHeight);
          const filtered = searchQuery()
            ? contacts().filter(c => c.name.toLowerCase().includes(searchQuery().toLowerCase()))
            : contacts();

          if (clickedIndex >= 0 && clickedIndex < filtered.length) {
            setSelectedIndex(clickedIndex);
            setSelectedContactId(filtered[clickedIndex].id);
            markAsRead(filtered[clickedIndex].id);
          }
        }
      }
    }
  }, { enableTracking: true });

  return Box(
    { flexDirection: 'column', height, backgroundColor: colors.bgDark },
    Header(),
    SplitPanel({
      direction: 'horizontal',
      width,
      height: contentHeight,
      ratio: leftPanelWidth / width,
      left: ContactsList({ width: leftPanelWidth, height: contentHeight }),
      right: ChatPanel({ width: width - leftPanelWidth - 1, height: contentHeight }),
      divider: true,
      dividerStyle: 'line',
      dividerColor: colors.bgHover,
    }),
    StatusBar({ width }),
  );
}

// =============================================================================
// Entry Point
// =============================================================================

// Set dark theme
setTheme(darkTheme);

// Start incoming message simulation
simulateIncomingMessages();

// Start the app
const { waitUntilExit } = render(WhatsAppClone, {
  fullHeight: true,
  exitOnCtrlC: true,
});

await waitUntilExit();
