import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Progress,
  Button,
  Spin,
  message,
  Empty,
  Tag,
  Timeline,
  Badge,
  Alert
} from 'antd';
import {
  CheckCircleTwoTone,
  TrophyOutlined,
  BellFilled,
  FolderOutlined,
  FireOutlined,
  SyncOutlined
} from '@ant-design/icons';
import MainLayout from '../../layouts/MainLayout';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('No token found. Please log in.');
        window.location.href = '/login';
        setLoading(false);
        return;
      }
      const response = await axios.get('http://localhost:8080/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response.data);
      setTasks(response.data?.tasks ?? []);
    } catch (error) {
      message.error(`Failed to fetch tasks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Removed unused updateTaskStatus function

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  // Removed pendingTasks as it was never used
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const tasksWithReminders = tasks.filter(task => task.remind_me).length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {});

  // Sort tasks by timeUntilFinish
  const urgentTasks = [...tasks]
    .filter(task => task.status !== 'completed' && task.time_until_finish > 0)
    .sort((a, b) => a.time_until_finish - b.time_until_finish)
    .slice(0, 5);

  const getTimeUntilFinishText = (nanoseconds, createdAt) => {
    // Convertir nanosegundos a milisegundos
    const remainingTime = nanoseconds / 1000000; // nanosegundos a milisegundos
    const currentTime = new Date().getTime(); // Tiempo actual en milisegundos
    const timeLeft = remainingTime - (currentTime - new Date(createdAt).getTime());

    if (timeLeft <= 0) {
      return 'Caducado';
    }

    // Convertir milisegundos a horas
    const hours = timeLeft / 3600000; // milisegundos a horas
    if (hours < 24) {
      return `${Math.round(hours)} horas`;
    }

    // Si supera las 24 horas, calcular días
    const days = hours / 24;
    return `${Math.round(days)} días`;
  };

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        <Row gutter={[24, 24]} align="middle" justify="space-between" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              Panel de Control
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Resumen de tus tareas y actividades
            </Text>
          </Col>
          <Col>
            <Button type="primary" onClick={() => navigate('/tasks')} size="large">
              Gestionar Tareas
            </Button>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card">
              <Statistic
                title="Total de Tareas"
                value={totalTasks}
                prefix={<TrophyOutlined style={{ color: '#722ED1' }} />}
                valueStyle={{ color: '#722ED1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card">
              <Statistic
                title="Completadas"
                value={completedTasks}
                prefix={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Progress percent={completionRate} strokeColor="#52c41a" />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card">
              <Statistic
                title="En Progreso"
                value={inProgressTasks}
                prefix={<SyncOutlined spin style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card">
              <Statistic
                title="Con Recordatorio"
                value={tasksWithReminders}
                prefix={<BellFilled style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              title={<><FireOutlined style={{ color: '#ff4d4f' }} /> Tareas Urgentes</>}
              className="dashboard-card"
            >
              {urgentTasks.length > 0 ? (
                <Timeline items={urgentTasks.map(task => ({
                  color: task.status === 'in_progress' ? 'blue' : 'red',
                  children: (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{task.title}</Text>
                        <Tag color={task.status === 'in_progress' ? 'processing' : 'error'}>
                          {getTimeUntilFinishText(task.time_until_finish, task.created_at)}
                        </Tag>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <Tag icon={<FolderOutlined />} color="default">
                          {task.category}
                        </Tag>
                        {task.remind_me && (
                          <Tag icon={<BellFilled />} color="warning">
                            Recordatorio
                          </Tag>
                        )}
                      </div>
                    </div>
                  )
                }))} />
              ) : (
                <Empty description="No hay tareas urgentes pendientes" />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={<><FolderOutlined /> Tareas por Categoría</>}
              className="dashboard-card"
            >
              {Object.entries(tasksByCategory).map(([category, count]) => (
                <div key={category} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{category}</Text>
                    <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
                  </div>
                  <Progress
                    percent={Math.round((count / totalTasks) * 100)}
                    strokeColor="#1890ff"
                    size="small"
                  />
                </div>
              ))}
            </Card>

            <div style={{ marginTop: '24px' }}>
              <Alert
                message="Recordatorios Activos"
                description={`Tienes ${tasksWithReminders} tareas con recordatorios configurados`}
                type="info"
                showIcon
                icon={<BellFilled />}
              />
            </div>
          </Col>
        </Row>

        <style>{`
          .dashboard-card {
            border-radius: 8px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03),
                        0 2px 4px rgba(0, 0, 0, 0.03),
                        0 4px 8px rgba(0, 0, 0, 0.03);
            height: 100%;
            transition: all 0.3s ease;
          }

          .dashboard-card:hover {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05),
                        0 4px 8px rgba(0, 0, 0, 0.05),
                        0 8px 16px rgba(0, 0, 0, 0.05);
          }

          .ant-card-head-title {
            font-weight: 600;
          }

          .ant-timeline-item-content {
            width: 100%;
          }
        `}</style>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
