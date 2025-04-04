import { Tooltip } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HomeOutlined, CheckCircleOutlined, UserOutlined, LogoutOutlined, TeamOutlined } from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';

// Dynamic menu items based on user role
const getMenuItems = (role) => {
  const items = [
    { key: '1', icon: <HomeOutlined />, label: 'Dashboard', path: '/dashboard' },
    { key: '2', icon: <CheckCircleOutlined />, label: 'Tasks', path: '/tasks' },
    { key: '3', icon: <UserOutlined />, label: 'Profile', path: '/profile' },
  ];

  // Add Groups menu item for master role
  if (role === 'master') {
    items.splice(3, 0, { key: '4', icon: <TeamOutlined />, label: 'Groups', path: '/groups' });
  }

  // Logout is always the last item, key changes based on presence of Groups
  items.push({
    key: role === 'master' ? '5' : '4',
    icon: <LogoutOutlined />,
    label: 'Log Out',
    path: '/logOut'
  });

  return items;
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState('1');
  const [hoveredKey, setHoveredKey] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Determine if the device is mobile based on window width
  const isMobile = useMemo(() => window.innerWidth < 768, []);

  // Get menu items based on user role
  const menuItems = useMemo(() => getMenuItems(userRole), [userRole]);

  // Build route to key map dynamically based on menu items
  const routeToKeyMap = useMemo(() => {
    const map = {};
    menuItems.forEach(item => {
      map[item.path] = item.key;
    });
    return map;
  }, [menuItems]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role'); // Cambia 'userRole' por 'role'
    navigate('/login');
  };

  // Check user role on component mount
  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem('role'); // Cambia 'userRole' por 'role'
    setUserRole(role);
  }, []);

  useEffect(() => {
    const key = routeToKeyMap[location.pathname];
    if (key) {
      setSelectedKey(key);
    }
  }, [location.pathname, routeToKeyMap]);

  // Container style adjustments based on device type
  const containerStyle = isMobile ? {
    position: 'fixed',
    left: '0',
    bottom: '0',
    width: '100%',
    height: '60px',
    borderRadius: '12px 12px 0 0',
    boxShadow: '0 -3px 10px rgba(0, 0, 0, 0.08)',
    backgroundColor: '#ffffff',
    padding: '8px 0',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    zIndex: 1000
  } : {
    position: 'fixed',
    left: '24px',
    top: '24px',
    width: '80px',
    height: 'calc(100vh - 48px)',
    borderRadius: '12px',
    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.08)',
    backgroundColor: '#ffffff',
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    zIndex: 1000
  };

  return (
    <div style={containerStyle}>
      <Tooltip title="Task Manager" placement={isMobile ? "top" : "right"}>
        <div
          style={{
            marginBottom: isMobile ? '0' : '20px',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#1890ff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: hoveredKey === 'logo' ? 'scale(1.05)' : 'scale(1)',
          }}
          onMouseEnter={() => setHoveredKey('logo')}
          onMouseLeave={() => setHoveredKey(null)}
          onClick={() => navigate('/dashboard')}
        >
          <span style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#ffffff',
          }}>TM</span>
        </div>
      </Tooltip>

      {menuItems.map(item => (
        <Tooltip
          key={item.key}
          title={item.label}
          placement={isMobile ? "top" : "right"}
          mouseEnterDelay={0.3}
        >
          {item.label === 'Log Out' ? (
            <div
              onClick={handleLogout}
              style={{ textDecoration: 'none', width: isMobile ? 'auto' : '100%' }}
            >
              <div
                style={{
                  padding: isMobile ? '8px 0' : '12px 0',
                  margin: isMobile ? '0' : '4px 0',
                  height: isMobile ? '40px' : '48px',
                  width: isMobile ? 'auto' : '100%',
                  borderRadius: '10px',
                  backgroundColor: selectedKey === item.key ? '#e6f7ff' : 'transparent',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: hoveredKey === item.key ? 'scale(1.05)' : 'scale(1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <div style={{
                  fontSize: '20px',
                  color: selectedKey === item.key ? '#1890ff' : '#666',
                  transition: 'all 0.3s ease',
                  opacity: hoveredKey === item.key ? 1 : 0.8
                }}>
                  {item.icon}
                </div>

                {/* Hover effect indicator */}
                <div
                  style={{
                    position: 'absolute',
                    right: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    backgroundColor: '#1890ff',
                    transition: 'all 0.3s ease',
                    opacity: hoveredKey === item.key ? 1 : 0,
                    height: hoveredKey === item.key ? '60%' : '0%',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          ) : (
            <Link
              to={item.path}
              style={{ textDecoration: 'none', width: isMobile ? 'auto' : '100%' }}
            >
              <div
                style={{
                  padding: isMobile ? '8px 0' : '12px 0',
                  margin: isMobile ? '0' : '4px 0',
                  height: isMobile ? '40px' : '48px',
                  width: isMobile ? 'auto' : '100%',
                  borderRadius: '10px',
                  backgroundColor: selectedKey === item.key ? '#e6f7ff' : 'transparent',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: hoveredKey === item.key ? 'scale(1.05)' : 'scale(1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <div style={{
                  fontSize: '20px',
                  color: selectedKey === item.key ? '#1890ff' : '#666',
                  transition: 'all 0.3s ease',
                  opacity: hoveredKey === item.key ? 1 : 0.8
                }}>
                  {item.icon}
                </div>

                {/* Hover effect indicator */}
                <div
                  style={{
                    position: 'absolute',
                    right: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    backgroundColor: '#1890ff',
                    transition: 'all 0.3s ease',
                    opacity: hoveredKey === item.key ? 1 : 0,
                    height: hoveredKey === item.key ? '60%' : '0%',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </Link>
          )}
        </Tooltip>
      ))}

      {!isMobile && (
        /* Bottom gradient effect for non-mobile view */
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '100%',
            height: '100px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 100%)',
            pointerEvents: 'none',
            borderRadius: '0 0 12px 12px'
          }}
        />
      )}
    </div>
  );
};

export default Sidebar;
