import { Button, Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #ece9e6, #ffffff)',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Card
        style={{
          textAlign: 'center',
          padding: '50px',
          borderRadius: '15px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
        }}
      >
        <Title level={2}>Bienvenido a Task Manager</Title>
        <Paragraph style={{ color: '#555', fontSize: '16px' }}>
          Organiza y maneja tus tareas de forma sencilla y eficaz.
        </Paragraph>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/login')}
          style={{ marginTop: '20px', fontWeight: 'bold', padding: '10px 20px', backgroundColor: '#007bff', color: '#fff' }}
        >
          <a
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <img
              src="https://cdn3.emoji.gg/emojis/5519_angerypingcircle.gif"
              width="64px"
              height="64px"
              alt="angerypingcircle"
              style={{ transition: 'transform 0.3s', cursor: 'pointer' }}
              onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </a>
        </Button>
      </Card>
    </div>
  );
};

export default LandingPage;
