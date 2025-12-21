import { 
  render, Box, Text, Spacer, Divider, useState, useInput, useApp, 
  BarChart, Sparkline, Gauge, Table, useTerminalSize
} from 'tuiuiu.js';

// Mock Data
const metrics = {
  cpu: 45,
  memory: 62,
  disk: 28,
  network: [10, 25, 15, 30, 22, 40, 35, 50, 45, 60, 55, 70],
  requests: [120, 135, 128, 142, 150, 145, 160, 155, 170, 180, 175, 190],
};

const recentLogs = [
  { time: '10:45:01', level: 'INFO', message: 'User login: admin' },
  { time: '10:45:15', level: 'WARN', message: 'High latency detected' },
  { time: '10:46:02', level: 'INFO', message: 'Scheduled backup started' },
  { time: '10:46:30', level: 'SUCCESS', message: 'Backup completed (2.4GB)' },
  { time: '10:47:12', level: 'ERROR', message: 'Connection timeout: db-01' },
];

// Components
function Navbar({ title }: { title: string }) {
  return Box(
    { 
      flexDirection: 'row', 
      borderStyle: 'single', 
      borderBottom: true, 
      borderTop: false, 
      borderLeft: false, 
      borderRight: false,
      paddingX: 1,
      height: 3,
      alignItems: 'center'
    },
    Text({ color: 'magenta', bold: true }, '⚡ Tuiuiu App'),
    Spacer(),
    Text({ color: 'white', bold: true }, title),
    Spacer(),
    Text({ color: 'gray' }, 'v1.0.0 '),
    Text({ color: 'green' }, '● Online')
  );
}

function Sidebar({ activeItem, onSelect }: { activeItem: string, onSelect: (id: string) => void }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'logs', label: 'Logs', icon: '📋' },
    { id: 'help', label: 'Help', icon: '❓' },
  ];

  return Box(
    { 
      flexDirection: 'column', 
      width: 20, 
      borderStyle: 'single', 
      borderRight: true, 
      borderTop: false, 
      borderBottom: false, 
      borderLeft: false,
      padding: 1
    },
    ...items.map(item => {
      const isActive = activeItem === item.id;
      return Box(
        { 
          flexDirection: 'row', 
          paddingY: 0, 
          marginBottom: 1,
          onClick: () => onSelect(item.id)
        },
        Text({ color: isActive ? 'cyan' : 'gray' }, item.icon + ' '),
        Text({ 
          color: isActive ? 'cyan' : 'gray',
          bold: isActive,
          underline: isActive
        }, item.label)
      );
    }),
    Spacer(),
    Text({ color: 'gray', dim: true }, 'Press [q] to quit')
  );
}

function Breadcrumbs({ path }: { path: string[] }) {
  return Box(
    { flexDirection: 'row', paddingX: 2, paddingY: 0, marginTop: 1 },
    ...path.flatMap((segment, i) => [
      Text({ color: i === path.length - 1 ? 'white' : 'gray' }, segment),
      i < path.length - 1 ? Text({ color: 'gray' }, ' › ') : null
    ])
  );
}

function Footer() {
  return Box(
    { 
      flexDirection: 'row', 
      borderStyle: 'single', 
      borderTop: true, 
      borderBottom: false, 
      borderLeft: false, 
      borderRight: false,
      paddingX: 1,
      height: 3,
      alignItems: 'center'
    },
    Text({ color: 'gray' }, 'Use '),
    Text({ color: 'white' }, '↑/↓'),
    Text({ color: 'gray' }, ' to navigate, '),
    Text({ color: 'white' }, 'Enter'),
    Text({ color: 'gray' }, ' to select'),
    Spacer(),
    Text({ color: 'gray', dim: true }, 'Copyright © 2025 Tuiuiu.js')
  );
}

function Dashboard() {
  const { columns } = useTerminalSize();
  
  // Calculate available width for chart
  // Sidebar (20) + Dashboard Padding (2) + Row Gap (2)
  const availableWidth = Math.max(0, columns - 24);
  // Chart is flex 2/3 of available width
  const chartBoxWidth = Math.floor((availableWidth * 2) / 3);
  const chartWidth = Math.max(10, chartBoxWidth - 2); // Minus borders/padding

  return Box(
    { flexDirection: 'column', padding: 1, gap: 1 },
    // Top Row: Metrics
    Box(
      { flexDirection: 'row', gap: 2, height: 10 },
      Box(
        { flexDirection: 'column', flexGrow: 1, borderStyle: 'round', borderColor: 'cyan', padding: 1 },
        Text({ bold: true, color: 'cyan' }, 'CPU Usage'),
        Box({ flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
          Gauge({ value: metrics.cpu, color: 'cyan', width: 20 })
        )
      ),
      Box(
        { flexDirection: 'column', flexGrow: 1, borderStyle: 'round', borderColor: 'yellow', padding: 1 },
        Text({ bold: true, color: 'yellow' }, 'Memory'),
        Box({ flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
          Gauge({ value: metrics.memory, color: 'yellow', width: 20 })
        )
      ),
      Box(
        { flexDirection: 'column', flexGrow: 1, borderStyle: 'round', borderColor: 'green', padding: 1 },
        Text({ bold: true, color: 'green' }, 'Network In'),
        Sparkline({ data: metrics.network, color: 'green', width: 20 })
      )
    ),
    
    // Bottom Row: Charts & Logs
    Box(
      { flexDirection: 'row', gap: 2, flexGrow: 1 },
      // Main Chart
      Box(
        { flexDirection: 'column', flexGrow: 2, borderStyle: 'single', borderColor: 'gray', padding: 1 },
        Text({ bold: true }, 'Request Traffic (24h)'),
        Spacer({ size: 1 }),
        BarChart({ 
          data: metrics.requests.map((v, i) => ({ label: `${i}h`, value: v })),
          color: 'blue',
          width: chartWidth,
          height: 10
        })
      ),
      // Recent Logs
      Box(
        { flexDirection: 'column', flexGrow: 1, borderStyle: 'single', borderColor: 'gray', padding: 1 },
        Text({ bold: true }, 'Recent Activity'),
        Spacer({ size: 1 }),
        ...recentLogs.map(log => 
          Box(
            { flexDirection: 'row', marginBottom: 0 },
            Text({ color: 'gray', dim: true }, `[${log.time}] `),
            Text({ 
              color: log.level === 'INFO' ? 'blue' : 
                     log.level === 'WARN' ? 'yellow' :
                     log.level === 'ERROR' ? 'red' : 'green' 
            }, `${log.level.padEnd(7)}`),
            Text({}, log.message)
          )
        )
      )
    )
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return Box(
    { flexDirection: 'column', flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
    Text({ color: 'gray', bold: true }, `content for ${title}`),
    Text({ color: 'gray', dim: true }, 'This page is under construction.')
  );
}

// Main App
function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const app = useApp();

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      app.exit();
    }
    
    // Simple navigation shortcuts
    if (input === '1') setActivePage('dashboard');
    if (input === '2') setActivePage('users');
    if (input === '3') setActivePage('settings');
  });

  const getPageTitle = (id: string) => {
    return id.charAt(0).toUpperCase() + id.slice(1);
  };

  return Box(
    { flexDirection: 'column', width: '100%', height: '100%' },
    Navbar({ title: getPageTitle(activePage()) }),
    Box(
      { flexDirection: 'row', flexGrow: 1 },
      Sidebar({ activeItem: activePage(), onSelect: setActivePage }),
      Box(
        { flexDirection: 'column', flexGrow: 1 },
        Breadcrumbs({ path: ['Home', getPageTitle(activePage())] }),
        Box(
          { flexGrow: 1 },
          activePage() === 'dashboard' ? Dashboard() : PlaceholderPage({ title: activePage() })
        )
      )
    ),
    Footer()
  );
}

render(App);
