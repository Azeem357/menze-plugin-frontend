import { NavLink } from 'react-router-dom'
import {
  MdDashboard,
  MdAnalytics,
  MdAttachMoney,
  MdAutoGraph,
  MdLightbulb,
  MdCampaign,
  MdDescription,
  MdSettings,
  MdLogout
} from 'react-icons/md'

const navItems = [
  {
    path: '/',
    icon: <MdDashboard size={20} />,
    label: 'Dashboard'
  },
  {
    path: '/analytics',
    icon: <MdAnalytics size={20} />,
    label: 'Analytics'
  },
  {
    path: '/financial',
    icon: <MdAttachMoney size={20} />,
    label: 'Financial Metrics'
  },
  {
    path: '/predictions',
    icon: <MdAutoGraph size={20} />,
    label: 'AI Predictions'
  },
  {
    path: '/suggestions',
    icon: <MdLightbulb size={20} />,
    label: 'AI Suggestions'
  },
  {
    path: '/campaigns',
    icon: <MdCampaign size={20} />,
    label: 'Campaigns'
  },
  {
    path: '/reports',
    icon: <MdDescription size={20} />,
    label: 'Reports'
  },
  {
    path: '/setup',
    icon: <MdSettings size={20} />,
    label: 'Plugin Setup'
  },
]

const Sidebar = () => {
  return (
    <div className="
      fixed left-0 top-0 h-full w-64
      bg-navy text-white flex flex-col
      z-50 shadow-xl
    ">
      {/* Logo */}
      <div className="p-6 border-b border-navy-light">
        <h1 className="text-2xl font-bold text-gold">
          MENZ
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Analytics Dashboard
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-6 py-3
              text-sm transition-all duration-200
              ${isActive
                ? 'bg-gold text-navy font-semibold'
                : 'text-gray-300 hover:bg-navy-light hover:text-white'
              }
            `}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-navy-light">
        <div className="flex items-center gap-3 mb-3">
          <div className="
            w-9 h-9 rounded-full bg-gold
            flex items-center justify-center
            text-navy font-bold text-sm
          ">
            AZ
          </div>
          <div>
            <p className="text-sm font-medium">Azeem</p>
            <p className="text-xs text-gray-400">
              Store Owner
            </p>
          </div>
        </div>
        <button className="
          flex items-center gap-2 text-gray-400
          hover:text-red-400 text-sm transition-colors
        ">
          <MdLogout size={18} />
          Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar