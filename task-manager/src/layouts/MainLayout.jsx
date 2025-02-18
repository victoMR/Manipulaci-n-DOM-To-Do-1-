import { Layout } from 'antd';
import PropTypes from 'prop-types';
import Sidebar from '../components/Sidebar';

const { Content } = Layout;

const MainLayout = ({ children }) => {
  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .responsive-content {
            margin: 0;
            padding: 0;
            max-width: 100%;
            min-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
          }
        }
      `}</style>
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex' }}>
        <Sidebar />
        <Content className="responsive-content" style={{
          flex: 1,
          margin: '24px',
          padding: '24px',
          maxWidth: '1200px',
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          transition: 'all 0.3s ease'
        }}>
          {children}
        </Content>
      </Layout>
    </>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MainLayout;
