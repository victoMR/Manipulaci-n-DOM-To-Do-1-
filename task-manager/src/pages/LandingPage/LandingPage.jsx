import { Button, Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ textAlign: 'center', padding: '50px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
        <Title level={2}>Bienvenido a Task Manager</Title>
        <Button type="primary" size="large" onClick={() => navigate('/login')} style={{ marginTop: '20px' }}>
          Vamos a empezar!
        </Button>
      </Card>
    </div>
  );
};

export default LandingPage;
