import Sidebar from './Sidebar'
import { useLocation } from 'react-router-dom'

const Layout = ({ children }) => {
  const { pathname } = useLocation()

  if (pathname === '/') {
    return children
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  )
}

export default Layout