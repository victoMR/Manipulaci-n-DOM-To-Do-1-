import { useState } from 'react';
import { Button, Form, Input, message, Card, Typography } from 'antd';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';


const RegisterPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Validador de correo sin espacios
  const validateEmail = (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    if (/\s/.test(value)) {
      return Promise.reject('El correo electrónico no debe contener espacios');
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (regex.test(value)) {
      return Promise.resolve();
    }
    return Promise.reject('Correo electrónico no válido');
  };

  // Validador de contraseña sin espacios y con requisitos específicos
  const validatePassword = (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    if (/\s/.test(value)) {
      return Promise.reject('La contraseña no debe contener espacios');
    }
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,20}$/;
    if (regex.test(value)) {
      return Promise.resolve();
    }
    return Promise.reject('La contraseña no cumple con los requisitos específicos');
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Agregar el campo "role" con el valor "user" (o el que desees)
      const payload = { ...values, role: 'master' }; // Aquí defines el rol

      const response = await api.post('/api/auth/register', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(response.data);
      message.success('¡Registro exitoso!');
      navigate('/login');
    } catch (error) {
      if (error.response) {
        message.error(`Fallo en el registro: ${error.response.data.error}`);
      } else if (error.request) {
        message.error('No se recibió respuesta del servidor. Por favor, inténtalo de nuevo.');
      } else {
        message.error('Ocurrió un error. Por favor, inténtalo de nuevo.');
      }
      console.error('Error en el registro:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar si se han tocado todos los campos y no existen errores para habilitar el botón
  const isButtonDisabled =
    !form.isFieldsTouched(true) ||
    form.getFieldsError().some(({ errors }) => errors.length > 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)', padding: '20px' }}>
      <Card style={{ width: 400, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>
          Registro
        </Typography.Title>
        <Form form={form} onFinish={onFinish} layout="vertical" initialValues={{ role: 'user' }}>
          {/* Campo oculto para el rol */}
          <Form.Item name="role" style={{ display: 'none' }}>
            <Input type="hidden" />
          </Form.Item>

          <Form.Item
            name="username"
            rules={[{ required: true, message: '¡Por favor, ingresa tu usuario!' }]}
          >
            <Input placeholder="Usuario" size="large" />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { required: true, type: 'email', message: '¡Por favor, ingresa un correo electrónico válido!' },
              { validator: validateEmail },
            ]}
          >
            <div>
              <Input placeholder="Correo electrónico" size="large" />
              <span style={{ fontSize: '12px', color: '#999' }}>Ej: usuario@ejemplo.com</span>
            </div>
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '¡Por favor, ingresa tu contraseña!' },
              { min: 6, message: '¡La contraseña debe tener al menos 6 caracteres!' },
              { max: 20, message: '¡La contraseña debe tener como máximo 20 caracteres!' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,20}$/,
                message: '¡La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial!'
              },
              { validator: validatePassword }
            ]}
          >
            <div>
              <Input.Password placeholder="Contraseña" size="large" />
              <span style={{ fontSize: '12px', color: '#999' }}>La contraseña debe tener al menos 6 caracteres.</span>
            </div>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large" disabled={isButtonDisabled}>
              Registrarse
            </Button>
          </Form.Item>
        </Form>
        <Typography.Paragraph style={{ textAlign: 'center', margin: '0', color: 'rgba(0,0,0,0.65)' }}>
          ¿Ya tienes una cuenta? <a href="/login" style={{ color: '#1890ff' }}>Ingresa aquí</a>.
        </Typography.Paragraph>
      </Card>
    </div>
  );
};

export default RegisterPage;
