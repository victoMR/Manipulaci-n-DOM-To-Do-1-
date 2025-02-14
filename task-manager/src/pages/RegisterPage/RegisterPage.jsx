import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', values, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(response.data);
      message.success('Registration successful!');
      navigate('/login');
    } catch (error) {
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        message.error(`Registration failed: ${error.response.data.error}`);
      } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        message.error('No response from the server. Please try again.');
      } else {
        // Algo sucedió al configurar la solicitud
        message.error('An error occurred. Please try again.');
      }
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#fff', marginBottom: '20px' }}>Register</h1>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input placeholder="Username" />
        </Form.Item>
        <Form.Item
          name="email"
          rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
        >
          <Input placeholder="Email" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Register
          </Button>
        </Form.Item>
      </Form>
      <p style={{ textAlign: 'center', color: '#fff' }}>
        Already have an account? <a href="/login" style={{ color: '#1890ff' }}>Login here</a>.
      </p>
    </div>
  );
};

export default RegisterPage;
