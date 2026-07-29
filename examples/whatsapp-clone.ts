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
  useInput,
  useMouse,
  useApp,
  useState,
  useTerminalSize,
  createSignal,
  measureHeight,
  setTheme,
  darkTheme,
} from '../src/index.js';
import { wrapText, stringWidth } from '../src/utils/text-utils.js';
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
  lastMessageSent: boolean;  // true = last message was sent by user (show checkmarks)
  time: string;
  unread: number;
  online: boolean;
  typing: boolean;
  favorite: boolean;    // For filter
  group: boolean;       // For filter
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
  { id: '1', name: 'Alice', avatar: '👩', lastMessage: 'See you tomorrow!', lastMessageSent: false, time: '10:30', unread: 2, online: true, typing: false, favorite: true, group: false },
  { id: '2', name: 'Bob', avatar: '👨', lastMessage: 'Thanks for the help', lastMessageSent: false, time: '09:45', unread: 0, online: false, typing: false, favorite: false, group: false },
  { id: '3', name: 'Carol', avatar: '👩‍💼', lastMessage: 'Got it, I will be there', lastMessageSent: true, time: '09:15', unread: 0, online: true, typing: false, favorite: true, group: false },
  { id: '4', name: 'David', avatar: '👨‍💻', lastMessage: 'Check the PR', lastMessageSent: false, time: 'Yesterday', unread: 5, online: false, typing: false, favorite: false, group: false },
  { id: '5', name: 'Eva', avatar: '👩‍🎨', lastMessage: 'Love the new design!', lastMessageSent: false, time: 'Yesterday', unread: 0, online: true, typing: false, favorite: true, group: false },
  { id: '6', name: 'Team Dev', avatar: '👥', lastMessage: 'Fixed the bug', lastMessageSent: true, time: 'Yesterday', unread: 0, online: false, typing: false, favorite: false, group: true },
  { id: '7', name: 'Grace', avatar: '👩‍🔬', lastMessage: 'Results are in', lastMessageSent: false, time: 'Monday', unread: 1, online: false, typing: false, favorite: false, group: false },
  { id: '8', name: 'Family', avatar: '👨‍👩‍👧', lastMessage: 'Dinner at 8?', lastMessageSent: false, time: 'Monday', unread: 0, online: true, typing: false, favorite: true, group: true },
  { id: '9', name: 'Iris', avatar: '👩‍🚀', lastMessage: 'Launch successful!', lastMessageSent: false, time: 'Sunday', unread: 0, online: false, typing: false, favorite: false, group: false },
  { id: '10', name: 'Work Group', avatar: '💼', lastMessage: 'Great show last night', lastMessageSent: true, time: 'Sunday', unread: 0, online: false, typing: false, favorite: false, group: true },
  { id: '11', name: 'Karen', avatar: '👩‍⚕️', lastMessage: 'Take your meds!', lastMessageSent: false, time: 'Saturday', unread: 0, online: true, typing: false, favorite: true, group: false },
  { id: '12', name: 'Leo', avatar: '🦁', lastMessage: 'Roar!', lastMessageSent: false, time: 'Saturday', unread: 3, online: false, typing: false, favorite: false, group: false },
  { id: '13', name: 'Marcus', avatar: '🧔', lastMessage: 'Great meeting today!', lastMessageSent: true, time: 'Friday', unread: 0, online: true, typing: false, favorite: false, group: false },
  { id: '14', name: 'Fitness Club', avatar: '🏋️', lastMessage: 'Who is coming tomorrow?', lastMessageSent: false, time: 'Friday', unread: 8, online: false, typing: false, favorite: true, group: true },
  { id: '15', name: 'Nina', avatar: '👩‍🎤', lastMessage: 'Check out my new song!', lastMessageSent: false, time: 'Thursday', unread: 1, online: true, typing: false, favorite: true, group: false },
  { id: '16', name: 'Oscar', avatar: '🧑‍🍳', lastMessage: 'Recipe is in the oven!', lastMessageSent: false, time: 'Thursday', unread: 0, online: false, typing: false, favorite: false, group: false },
  { id: '17', name: 'Gaming Squad', avatar: '🎮', lastMessage: 'GG everyone!', lastMessageSent: true, time: 'Wednesday', unread: 0, online: false, typing: false, favorite: true, group: true },
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
  '13': [
    { id: 'm13', contactId: '13', text: 'Hey, the presentation went well!', time: '14:00', sent: false, read: true, delivered: true },
    { id: 'm14', contactId: '13', text: 'Nice! Congrats on closing the deal', time: '14:05', sent: true, read: true, delivered: true },
    { id: 'm15', contactId: '13', text: 'Great meeting today!', time: '14:10', sent: true, read: true, delivered: true },
  ],
  '14': [
    { id: 'm16', contactId: '14', text: 'Workout at 7am tomorrow!', time: '20:00', sent: false, read: true, delivered: true },
    { id: 'm17', contactId: '14', text: 'I am in!', time: '20:15', sent: true, read: true, delivered: true },
    { id: 'm18', contactId: '14', text: 'Me too', time: '20:20', sent: false, read: true, delivered: true },
    { id: 'm19', contactId: '14', text: 'Who is coming tomorrow?', time: '21:00', sent: false, read: false, delivered: true },
  ],
  '15': [
    { id: 'm20', contactId: '15', text: 'Just finished recording!', time: '18:00', sent: false, read: true, delivered: true },
    { id: 'm21', contactId: '15', text: 'Can not wait to hear it!', time: '18:05', sent: true, read: true, delivered: true },
    { id: 'm22', contactId: '15', text: 'Check out my new song!', time: '19:00', sent: false, read: false, delivered: true },
  ],
  '16': [
    { id: 'm23', contactId: '16', text: 'What should I cook for dinner?', time: '17:00', sent: true, read: true, delivered: true },
    { id: 'm24', contactId: '16', text: 'Try my pasta recipe!', time: '17:10', sent: false, read: true, delivered: true },
    { id: 'm25', contactId: '16', text: 'Recipe is in the oven!', time: '18:30', sent: false, read: true, delivered: true },
  ],
  '17': [
    { id: 'm26', contactId: '17', text: 'Anyone up for ranked?', time: '22:00', sent: false, read: true, delivered: true },
    { id: 'm27', contactId: '17', text: 'Let us go!', time: '22:05', sent: true, read: true, delivered: true },
    { id: 'm28', contactId: '17', text: 'Victory!', time: '23:30', sent: false, read: true, delivered: true },
    { id: 'm29', contactId: '17', text: 'GG everyone!', time: '23:35', sent: true, read: true, delivered: true },
  ],
};

// =============================================================================
// State Management
// =============================================================================

const [contacts, setContacts] = createSignal<Contact[]>(initialContacts);
const [messages, setMessages] = createSignal<Record<string, Message[]>>(initialMessages);
const [selectedContactId, setSelectedContactId] = createSignal<string>('1');
const [searchQuery, setSearchQuery] = createSignal('');
const [activeInput, setActiveInput] = createSignal<'search' | 'message'>('message');
const [isTyping, setIsTyping] = createSignal(false);
const [activeFilter, setActiveFilter] = createSignal<'all' | 'unread' | 'favorites' | 'groups'>('all');
const [messageInputHeight, setMessageInputHeight] = createSignal(3);
const MESSAGE_INPUT_MAX_LINES = 5;

// Scroll states
const chatScrollState = createScrollList({ inverted: true });
const contactsScrollState = createScrollList({});

// Text input states (created once, outside components)
const searchInputState = createTextInput({
  placeholder: 'Search or start new chat',
  onChange: setSearchQuery,
  isActive: () => activeInput() === 'search',
});

const messageInputState = createTextInput({
  placeholder: 'Type a message',
  wordWrap: true,
  maxLines: MESSAGE_INPUT_MAX_LINES,
  autoGrow: true,
  showScrollbar: true,
  isActive: () => activeInput() === 'message',
  onSubmit: (value: string) => {
    if (!value.trim()) return;
    addMessage(selectedContactId(), value, true);
    messageInputState.clear();
  },
});

// Helper to get current time
function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// Add message to a conversation and reorder contacts (most recent first)
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

  // Update contact's last message AND move to top of list
  setContacts(prev => {
    const contactIndex = prev.findIndex(c => c.id === contactId);
    if (contactIndex === -1) return prev;

    const updatedContact = {
      ...prev[contactIndex],
      lastMessage: text,
      lastMessageSent: sent,
      time: getCurrentTime(),
      unread: sent ? prev[contactIndex].unread : prev[contactIndex].unread + 1,
    };

    // Move contact to top of list
    const newList = [
      updatedContact,
      ...prev.slice(0, contactIndex),
      ...prev.slice(contactIndex + 1),
    ];

    return newList;
  });
}

// Mark messages as read
function markAsRead(contactId: string): void {
  setContacts(prev => prev.map(c =>
    c.id === contactId ? { ...c, unread: 0 } : c
  ));
}

// Simulate incoming messages (frequent - every 2-4 seconds)
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
    }, 800 + Math.random() * 500);  // Faster typing: 0.8-1.3 seconds

  }, 2000 + Math.random() * 2000); // Every 2-4 seconds
}

// =============================================================================
// Components
// =============================================================================

/**
 * WhatsApp Header (inside left panel like real WhatsApp Web)
 * 2 lines: Logo row + spacing
 */
function PanelHeader(): VNode {
  return Box(
    {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingX: 1,
      paddingY: 1,
      backgroundColor: colors.bgPanel,
    },
    Box(
      { flexDirection: 'row', gap: 1 },
      Text({ color: colors.primary, bold: true }, ''),
      Text({ color: colors.textPrimary, bold: true }, 'WhatsApp'),
    ),
    Box(
      { flexDirection: 'row', gap: 1 },
      Text({ color: colors.textSecondary }, '⊕'),
      Text({ color: colors.textSecondary }, '⋮'),
    ),
  );
}

/**
 * Filter Tabs - All | Unread | Favorites | Groups (simple chip style)
 */
function FilterTabs(): VNode {
  const filters: Array<{ key: 'all' | 'unread' | 'favorites' | 'groups'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'groups', label: 'Groups' },
  ];

  return Box(
    { flexDirection: 'row', paddingX: 1, gap: 1 },
    ...filters.map(f =>
      Text({
        color: activeFilter() === f.key ? colors.primary : colors.textMuted,
        bold: activeFilter() === f.key,
        backgroundColor: activeFilter() === f.key ? colors.bgSelected : undefined,
      }, ` ${f.label} `)
    ),
  );
}

/**
 * Search Input Component - Simple full-width search like WhatsApp Web
 */
function SearchBar(props: { width: number }): VNode {
  return Box(
    {
      flexDirection: 'row',
      backgroundColor: colors.bgInput,
      paddingX: 1,
      gap: 1,
      width: props.width,
      flexGrow: 1,
      onClick: () => setActiveInput('search'),
      onMouseUp: () => setActiveInput('search'),
    },
    Text({ color: colors.textMuted }, '🔍'),
    renderTextInput(searchInputState, {
      width: props.width - 4,
      borderStyle: 'none',
      isActive: activeInput() === 'search',
      placeholder: 'Search or start new chat',
      fullWidth: true,
    }),
  );
}

/**
 * Single Contact Item in the list - 3-line layout with spacing
 * Line 1: Avatar + Name + Time
 * Line 2: [✓✓] Last message... + Badge
 * Line 3: Spacing
 */
function ContactItem(props: { contact: Contact; isSelected: boolean; width: number }): VNode {
  const { contact, isSelected, width } = props;
  // Reserve space for: avatar(2) + gap(1) + badge(4) + time(8) + padding(2)
  const maxMsgLen = Math.max(10, width - 18);

  // Checkmark prefix for sent messages
  const checkPrefix = contact.lastMessageSent ? '✓✓ ' : '';
  const msgText = contact.typing
    ? 'typing...'
    : checkPrefix + (contact.lastMessage.length > maxMsgLen - checkPrefix.length
        ? contact.lastMessage.slice(0, maxMsgLen - checkPrefix.length) + '...'
        : contact.lastMessage);

  return Box(
    {
      flexDirection: 'column',
      paddingX: 1,
      paddingTop: 1,
      backgroundColor: isSelected ? colors.bgSelected : undefined,
    },
    // Line 1: Avatar + Name (left) + Time (right)
    Box(
      { flexDirection: 'row', justifyContent: 'space-between' },
      Box(
        { flexDirection: 'row', gap: 1 },
        Text({}, contact.avatar),
        Text({ color: colors.textPrimary, bold: true }, contact.name),
      ),
      Text({ color: contact.unread > 0 ? colors.primary : colors.textMuted, dim: contact.unread === 0 }, contact.time),
    ),
    // Line 2: Message (left) + Badge (right)
    Box(
      { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 3 },
      Text(
        {
          color: contact.typing ? colors.typing : colors.textSecondary,
          italic: contact.typing,
          dim: !contact.typing,
        },
        msgText
      ),
      contact.unread > 0
        ? Badge({
            label: contact.unread.toString(),
            style: 'solid',
            color: colors.unread,
          })
        : null,
    ),
  );
}

/**
 * Contacts List (Left Panel) - Includes header, search, and filters like WhatsApp Web
 */
function ContactsList(props: { width: number; height: number }): VNode {
  const { width, height } = props;
  const query = searchQuery().toLowerCase();
  const filter = activeFilter();

  // Header(3 with padding) + Search(1) + FilterTabs(1) = 5 rows reserved
  const listHeight = Math.max(5, height - 5);

  // Apply search filter (by chat name)
  let filteredContacts = query
    ? contacts().filter(c => c.name.toLowerCase().includes(query))
    : contacts();

  // Apply tab filter
  if (filter === 'unread') {
    filteredContacts = filteredContacts.filter(c => c.unread > 0);
  } else if (filter === 'favorites') {
    filteredContacts = filteredContacts.filter(c => c.favorite);
  } else if (filter === 'groups') {
    filteredContacts = filteredContacts.filter(c => c.group);
  }

  return Box(
    { flexDirection: 'column', backgroundColor: colors.bgPanel, height, width },
    PanelHeader(),
    SearchBar({ width }),
    FilterTabs(),
    ScrollList({
      items: filteredContacts,
      children: (contact: Contact) => ContactItem({
        contact,
        isSelected: contact.id === selectedContactId(),
        width,
      }),
      height: listHeight,
      width,
      itemHeight: 3,  // 3-line items with spacing
      keysEnabled: false,
      isActive: false,
      state: contactsScrollState,
    }),
  );
}

/**
 * Chat Header (shows selected contact info) - 4 lines with vertical centering
 */
function ChatHeader(props: { contact: Contact; width: number }): VNode {
  const { contact } = props;

  return Box(
    {
      flexDirection: 'row',
      paddingX: 2,
      height: 4,
      alignItems: 'center',
      backgroundColor: colors.bgPanel,
      gap: 2,
    },
    // Avatar (larger, centered)
    Box(
      { justifyContent: 'center', alignItems: 'center' },
      Text({ }, contact.avatar),
    ),
    // Info (centered vertically)
    Box(
      { flexDirection: 'column', flexGrow: 1, justifyContent: 'center' },
      Text({ color: colors.textPrimary, bold: true }, contact.name),
      contact.typing
        ? Text({ color: colors.typing, italic: true }, 'typing...')
        : contact.online
          ? Text({ color: colors.textSecondary, dim: true }, 'online')
          : Text({ color: colors.textMuted, dim: true }, 'last seen today'),
    ),
    // Actions (centered)
    Box(
      { flexDirection: 'row', gap: 2, alignItems: 'center' },
      Text({ color: colors.textSecondary }, '🔍'),
      Text({ color: colors.textSecondary }, '⋮'),
    ),
  );
}

/**
 * Single Message Bubble - Solid background, no borders (like real WhatsApp)
 */
function getMessageBubbleLayout(message: Message, width: number) {
  const maxWidth = Math.floor(width * 0.7);
  const availableWidth = Math.max(2, width - 4);
  const bubbleWidth = Math.max(2, Math.min(maxWidth, availableWidth));
  const contentWidth = Math.max(1, bubbleWidth - 2);
  const wrappedText = wrapText(message.text, contentWidth, { wordWrap: true });
  const lines = wrappedText.length > 0 ? wrappedText.split('\n') : [''];
  const maxLineWidth = lines.reduce((max, line) => Math.max(max, stringWidth(line)), 0);
  const checkmarkText = message.sent
    ? message.read
      ? ' ✓✓'
      : message.delivered
        ? ' ✓✓'
        : ' ✓'
    : '';
  const timeRowWidth = stringWidth(message.time) +
    (checkmarkText ? stringWidth(checkmarkText) + 1 : 0);
  const resolvedBubbleWidth = Math.min(bubbleWidth, Math.max(maxLineWidth, timeRowWidth) + 2);

  return { lines, resolvedBubbleWidth, checkmarkText };
}

function MessageBubble(props: { message: Message; width: number }): VNode {
  const { message, width } = props;
  const isSent = message.sent;
  const { lines, resolvedBubbleWidth, checkmarkText } = getMessageBubbleLayout(message, width);

  // Checkmarks for sent messages
  const checkmarks = checkmarkText
    ? Text({ color: message.read ? colors.checkmark : colors.textMuted }, checkmarkText)
    : null;

  return Box(
    {
      flexDirection: 'row',
      justifyContent: isSent ? 'flex-end' : 'flex-start',
      paddingX: 1,
    },
    Box(
      {
        flexDirection: 'column',
        backgroundColor: isSent ? colors.bgBubbleSent : colors.bgBubbleReceived,
        paddingX: 1,
        width: resolvedBubbleWidth,
      },
      ...lines.map(line => Text({ color: colors.textPrimary }, line)),
      Box(
        { flexDirection: 'row', justifyContent: 'flex-end', gap: 1 },
        Text({ color: colors.textMuted, dim: true }, message.time),
        checkmarks,
      ),
    ),
  );
}

/**
 * Chat Messages Area - with top padding for spacing from header
 */
function ChatMessages(props: { contactId: string; width: number; height: number }): VNode {
  const { contactId, width, height } = props;
  const chatMessages = messages()[contactId] || [];
  // Account for top padding (2 lines)
  const scrollHeight = Math.max(5, height - 3);
  const getMessageHeight = (message: Message) => {
    const { lines } = getMessageBubbleLayout(message, width);
    return lines.length + 1;
  };

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
    {
      flexDirection: 'column',
      backgroundColor: colors.bgDark,
      height: Math.max(5, height),
      paddingTop: 2,  // Spacing between header and first message
    },
    ScrollList({
      items: chatMessages,
      children: (msg: Message) => MessageBubble({ message: msg, width }),
      height: scrollHeight,
      width,
      itemHeight: getMessageHeight,
      keysEnabled: true,
      isActive: activeInput() === 'message',
      autoScroll: true,
      autoScrollThreshold: 0,
      state: chatScrollState,
      hotkeyScope: 'global',
    }),
  );
}

/**
 * Message Input Area - Simple flat design with auto-grow behavior
 */
function MessageInput(props: { width: number }): VNode {
  const { width } = props;

  return Box(
    {
      flexDirection: 'row',
      paddingX: 2,
      paddingY: 1,
      backgroundColor: colors.bgPanel,
      gap: 2,
      alignItems: 'center',
      width,
      onClick: () => setActiveInput('message'),
      onMouseUp: () => setActiveInput('message'),
    },
    Text({ color: colors.textSecondary }, '+'),
    Text({ color: colors.textSecondary }, '😀'),
    Box(
      {
        flexGrow: 1,
        backgroundColor: colors.bgInput,
        paddingX: 1,
      },
      renderTextInput(messageInputState, {
        width: Math.max(10, width - 14),
        borderStyle: 'none',
        isActive: activeInput() === 'message',
        foreground: colors.textPrimary,
        fullWidth: true,
        wordWrap: true,
        maxLines: MESSAGE_INPUT_MAX_LINES,
        autoGrow: true,
        showScrollbar: true,
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

  const headerHeight = 4;  // 4 lines for chat header with centering
  const messageInputNode = MessageInput({ width });
  const inputHeight = measureHeight(messageInputNode, width);
  setMessageInputHeight(inputHeight);
  const messagesHeight = Math.max(5, height - headerHeight - inputHeight);

  return Box(
    { flexDirection: 'column', height, width },
    ChatHeader({ contact, width }),
    ChatMessages({ contactId: selectedId, width, height: messagesHeight }),
    messageInputNode,
  );
}


// =============================================================================
// Main App
// =============================================================================

// Helper to get filtered contacts based on search and tab filter
function getFilteredContacts(): Contact[] {
  const query = searchQuery().toLowerCase();
  const filter = activeFilter();

  let filtered = query
    ? contacts().filter(c => c.name.toLowerCase().includes(query))
    : contacts();

  if (filter === 'unread') {
    filtered = filtered.filter(c => c.unread > 0);
  } else if (filter === 'favorites') {
    filtered = filtered.filter(c => c.favorite);
  } else if (filter === 'groups') {
    filtered = filtered.filter(c => c.group);
  }

  return filtered;
}

function WhatsAppClone(): VNode {
  const { exit } = useApp();
  const termSize = useTerminalSize();
  // Fallback to default terminal size if not available
  const width = termSize.columns || process.stdout.columns || 80;
  const height = termSize.rows || process.stdout.rows || 24;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const contentHeight = Math.max(10, height);
  const contactsListHeight = Math.max(5, contentHeight - 5);
  const contactItemHeight = 3;

  const ensureContactVisible = (index: number) => {
    const itemTop = index * contactItemHeight;
    const itemBottom = itemTop + contactItemHeight;
    const currentTop = contactsScrollState.scrollTop();
    const currentBottom = currentTop + contactsListHeight;

    if (itemTop < currentTop) {
      contactsScrollState.scrollTo(itemTop);
    } else if (itemBottom > currentBottom) {
      contactsScrollState.scrollTo(Math.max(0, itemBottom - contactsListHeight));
    }
  };

  // Keyboard shortcuts
  useHotkeys('escape', () => exit());
  useHotkeys('q', () => exit());

  // Filter tab navigation with 1-4 keys
  useHotkeys('1', () => setActiveFilter('all'));
  useHotkeys('2', () => setActiveFilter('unread'));
  useHotkeys('3', () => setActiveFilter('favorites'));
  useHotkeys('4', () => setActiveFilter('groups'));

  // Tab focuses the search input; Shift+Tab returns to message input
  useInput((_, key) => {
    if (!key.tab) return;
    if (key.shift) {
      setActiveInput('message');
    } else {
      setActiveInput('search');
    }
    return true;
  }, { priority: 'critical', stopPropagation: true });

  useHotkeys('up', () => {
    if (activeInput() !== 'search') return;
    const filtered = getFilteredContacts();
    const newIndex = Math.max(0, selectedIndex() - 1);
    setSelectedIndex(newIndex);
    if (filtered[newIndex]) {
      setSelectedContactId(filtered[newIndex].id);
      markAsRead(filtered[newIndex].id);
      ensureContactVisible(newIndex);
    }
  });

  useHotkeys('down', () => {
    if (activeInput() !== 'search') return;
    const filtered = getFilteredContacts();
    const newIndex = Math.min(filtered.length - 1, selectedIndex() + 1);
    setSelectedIndex(newIndex);
    if (filtered[newIndex]) {
      setSelectedContactId(filtered[newIndex].id);
      markAsRead(filtered[newIndex].id);
      ensureContactVisible(newIndex);
    }
  });

  // Increased left panel width (was 25-35, now 30-45)
  const leftPanelWidth = Math.max(30, Math.min(45, Math.floor(width * 0.40)));

  // Mouse click support for contacts
  useMouse((event) => {
    const isPrimaryClick = (event.action === 'click' || event.action === 'release') &&
      (event.button === 'left' || event.button === 'none');
    // Only handle left clicks in the contacts panel area
    if (isPrimaryClick) {
      const panelHeaderHeight = 3;
      const searchBarHeight = 1;
      const filterTabsHeight = 1;
      const contactsStartY = panelHeaderHeight + searchBarHeight + filterTabsHeight;
      const chatHeaderHeight = 4;
      const chatInputHeight = messageInputHeight();
      const messagesHeight = Math.max(5, contentHeight - chatHeaderHeight - chatInputHeight);
      const messageInputStartY = chatHeaderHeight + messagesHeight;

      // Check if click is within the left panel (contacts area)
      if (event.x < leftPanelWidth) {
        if (event.y >= panelHeaderHeight && event.y < panelHeaderHeight + searchBarHeight) {
          setActiveInput('search');
          return;
        }

        // Calculate which contact was clicked
        // Layout: PanelHeader(3 with padding) + SearchBar(1) + FilterTabs(1) = 5 rows
        // Each contact item is 3 rows tall (itemHeight: 3)
        const clickedRow = event.y - contactsStartY;

        if (clickedRow >= 0) {
          const itemHeight = 3;
          const clickedIndex = Math.floor(clickedRow / itemHeight);
          const filtered = getFilteredContacts();

          if (clickedIndex >= 0 && clickedIndex < filtered.length) {
            setSelectedIndex(clickedIndex);
            setSelectedContactId(filtered[clickedIndex].id);
            markAsRead(filtered[clickedIndex].id);
            setActiveInput('message');
            ensureContactVisible(clickedIndex);
          }
        }
      } else if (event.x > leftPanelWidth) {
        if (event.y >= messageInputStartY) {
          setActiveInput('message');
        }
      }
    }
  }, { enableTracking: true });

  return Box(
    { flexDirection: 'column', height, backgroundColor: colors.bgDark },
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
  autoTabNavigation: false,
});

await waitUntilExit();
