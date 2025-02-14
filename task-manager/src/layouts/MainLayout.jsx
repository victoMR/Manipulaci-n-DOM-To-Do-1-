import { Layout, Dropdown, Menu, Avatar } from 'antd';
import PropTypes from 'prop-types';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const { Header, Content, Sider } = Layout;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();

  // Obtener el nombre del usuario desde el localStorage (o desde el backend)
  const username = localStorage.getItem('username') || 'Usuario';

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token'); // Eliminar el token
    localStorage.removeItem('username'); // Eliminar el nombre de usuario
    navigate('/login'); // Redirigir al login
  };

  // Menú desplegable para el usuario
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Perfil
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Cerrar Sesión
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="80" style={{ background: '#001529' }}>
        <div
          className="logo"
          style={{
            height: '32px',
            margin: '16px',
            color: '#fff',
            fontSize: '20px',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          TaskPro
        </div>
        <Sidebar />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Task Manager</div>
          <Dropdown overlay={userMenu} trigger={['click']}>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Avatar
                style={{ backgroundColor: '#1890ff', marginRight: '8px' }}
                icon={<UserOutlined />}
              />
              <span style={{ fontWeight: '500' }}>{username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: 8 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MainLayout;
