import { Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { HomeOutlined, CheckCircleOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState('1');

  // Mapear rutas a claves del menú
  const routeToKeyMap = useMemo(() => ({
    '/dashboard': '1',
    '/tasks': '2',
    '/profile': '3',
    '/settings': '4',
  }), []);

  // Actualizar la clave seleccionada cuando cambia la ruta
  useEffect(() => {
    const key = routeToKeyMap[location.pathname];
    if (key) {
      setSelectedKey(key);
    }
  }, [location.pathname, routeToKeyMap]);

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]} // Usar selectedKeys en lugar de defaultSelectedKeys
      style={{ height: '100%', borderRight: 0 }}
    >
      <Menu.Item key="1" icon={<HomeOutlined />}>
        <Link to="/dashboard">Dashboard</Link>
      </Menu.Item>
      <Menu.Item key="2" icon={<CheckCircleOutlined />}>
        <Link to="/tasks">Tasks</Link>
      </Menu.Item>
      <Menu.Item key="3" icon={<UserOutlined />}>
        <Link to="/profile">Profile</Link>
      </Menu.Item>
      <Menu.Item key="4" icon={<SettingOutlined />}>
        <Link to="/settings">Settings</Link>
      </Menu.Item>
    </Menu>
  );
};

export default Sidebar;
