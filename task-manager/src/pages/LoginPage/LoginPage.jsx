import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', values);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', response.data.username); // Guardar el nombre del usuario
      message.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      message.error('Login failed. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#fff', marginBottom: '20px' }}>Login</h1>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input placeholder="Username" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </Form.Item>
      </Form>
      <p style={{ textAlign: 'center', color: '#fff' }}>
        Dont have an account? <a href="/register" style={{ color: '#1890ff' }}>Register here</a>.
      </p>
    </div>
  );
};

export default LoginPage;
