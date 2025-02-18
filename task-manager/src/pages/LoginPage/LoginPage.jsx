import { useState, useEffect } from 'react';
import { Button, Form, Input, message, Card, Row, Col, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [healthStatus, setHealthStatus] = useState(null);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', values);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', response.data.username);
      message.success('¡Inicio de sesión exitoso!');
      navigate('/dashboard');
    } catch (error) {
      message.error('Error al iniciar sesión. Verifica tus credenciales.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const response = await axios.get('http://localhost:8080/health');
      setHealthStatus(response.data);
    } catch (error) {
      console.error('Health check error:', error);
      setHealthStatus({ status: 'unhealthy', time: 'N/A' });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const healthStatusStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '16px',
    width: 'fit-content',
    marginLeft: 'auto'
  };

  const indicatorStyle = {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: healthStatus?.status === 'healthy' ? '#52c41a' : '#ff4d4f',
    animation: healthStatus?.status === 'healthy' ? 'pulse 2s infinite' : 'none',
    boxShadow: healthStatus?.status === 'healthy'
      ? '0 0 8px rgba(82, 196, 26, 0.5)'
      : '0 0 8px rgba(255, 77, 79, 0.5)'
  };

  return (
    <Row
      align="middle"
      justify="center"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)',
        padding: '20px'
      }}
    >
      <Col xs={22} sm={16} md={12} lg={8}>
        <div style={healthStatusStyle}>
          <div style={indicatorStyle} />
          <Text style={{
            color: healthStatus?.status === 'healthy' ? '#52c41a' : '#ff4d4f',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {healthStatus?.status === 'healthy' ? 'Sistema Operativo' : 'Sistema en Mantenimiento'}
          </Text>
        </div>

        <Card
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '24px'
          }}
        >
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ marginBottom: '8px' }}>
                Bienvenido
              </Title>
              <Text type="secondary">
                Ingresa tus credenciales para continuar
              </Text>
            </div>

            <Form
              form={form}
              onFinish={onFinish}
              layout="vertical"
              style={{ width: '100%' }}
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '¡Por favor ingresa tu usuario!' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Usuario"
                  size="large"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '¡Por favor ingresa tu contraseña!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Contraseña"
                  size="large"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '12px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)'
                  }}
                >
                  {loading ? <LoadingOutlined /> : 'Iniciar sesión'}
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                ¿No tienes una cuenta?{' '}
                <a href="/register" style={{ fontWeight: 500 }}>
                  Regístrate aquí
                </a>
              </Text>
            </div>
          </Space>
        </Card>
      </Col>

      <style>
        {`
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.4);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(82, 196, 26, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
            }
          }
        `}
      </style>
    </Row>
  );
};

export default LoginPage;
