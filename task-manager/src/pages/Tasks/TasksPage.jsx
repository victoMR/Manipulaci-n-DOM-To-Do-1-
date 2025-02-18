import { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';
import {
  Typography,
  List,
  Card,
  Button,
  Spin,
  message,
  Empty,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Switch,
  InputNumber,
  Tooltip,
  Badge,
  Space,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  BellOutlined,
  FolderOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = [
    'work',
    'personal',
    'shopping',
    'health',
    'education',
    'other'
  ];

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('No se encontró token. Por favor, inicia sesión.');
        return;
      }
      const response = await axios.get('http://localhost:8080/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data?.tasks ?? []);
    } catch (error) {
      message.error(`Error al obtener tareas: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (values) => {
    setSaving(true);
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('No se encontró token. Por favor, inicia sesión.');
      return;
    }

    const taskData = {
      title: values.title,
      description: values.description,
      category: values.category,
      status: values.status,
      time_until_finish: values.time_until_finish ? Number(values.time_until_finish * 3600000000000) : 0,
      remind_me: Boolean(values.remind_me),
    };

    console.log('Datos de la tarea a guardar:', taskData);

    try {
      if (editingTask) {
        await axios.put(`http://localhost:8080/api/tasks/${editingTask.id}`, taskData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('¡Tarea actualizada con éxito!');
      } else {
        await axios.post('http://localhost:8080/api/tasks', taskData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('¡Tarea creada con éxito!');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchTasks();
    } catch (error) {
      message.error(`Error al guardar la tarea: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const showDeleteConfirm = (taskId) => {
    confirm({
      title: '¿Estás seguro de que deseas eliminar esta tarea?',
      icon: <ExclamationCircleOutlined />,
      content: 'Esta acción no se puede deshacer.',
      onOk: async () => {
        const token = localStorage.getItem('token');
        try {
          await axios.delete(`http://localhost:8080/api/tasks/${taskId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          message.success('¡Tarea eliminada con éxito!');
          fetchTasks();
        } catch (error) {
          message.error(`Error al eliminar la tarea: ${error.response?.data?.message || error.message}`);
        }
      },
    });
  };

  const markTaskAsCompleted = async (task) => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('No se encontró token. Por favor, inicia sesión.');
      return;
    }
    try {
      await axios.put(`http://localhost:8080/api/tasks/${task.id}`,
        { ...task, status: 'completed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('¡Tarea marcada como completada!');
      fetchTasks();
    } catch (error) {
      message.error(`Error al actualizar la tarea: ${error.response?.data?.message || error.message}`);
    }
  };

  const getTimeUntilFinishText = (nanoseconds, createdAt) => {
    const remainingTime = nanoseconds / 1000000; // Convertir nanosegundos a milisegundos
    const currentTime = new Date().getTime(); // Tiempo actual en milisegundos
    const timeLeft = remainingTime - (currentTime - new Date(createdAt).getTime());

    if (timeLeft <= 0) {
      return { text: 'Caducado', color: 'red' }; // Estado caducado
    }

    // Convertir milisegundos a horas
    const hours = timeLeft / 3600000; // milisegundos a horas
    if (hours < 24) {
      return { text: `${Math.round(hours)} horas`, color: 'cyan' }; // Menos de un día
    }

    // Si supera las 24 horas, calcular días
    const days = hours / 24;
    return { text: `${Math.round(days)} días`, color: 'green' }; // Más de un día
  };


  const showModal = (task = null) => {
    setEditingTask(task);
    if (task) {
      // Convert nanoseconds to hours for display
      const timeInHours = task.time_until_finish / 3600000000000
      form.setFieldsValue({
        ...task,
        time_until_finish: timeInHours
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'processing';
      default: return 'error';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'in_progress': return 'En Progreso';
      default: return 'Pendiente';
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>Gestión de Tareas</Title>
          <Text type="secondary">Organiza y mantén un seguimiento de todas tus tareas</Text>
        </div>

        <Space style={{ marginBottom: '24px' }} wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Crear Tarea
          </Button>
          <Input
            placeholder="Buscar tareas..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px' }}
          />
          <Select
            placeholder="Filtrar por categoría"
            value={filterCategory}
            onChange={setFilterCategory}
            style={{ width: '200px' }}
          >
            <Option value="all">Todas las categorías</Option>
            {categories.map(category => (
              <Option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Option>
            ))}
          </Select>
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : filteredTasks?.length ? (
          <List
            grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
            dataSource={filteredTasks}
            renderItem={(task) => (
              <List.Item>
                <Badge.Ribbon text={getStatusText(task.status)} color={getStatusColor(task.status)}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                    actions={[
                      <Tooltip title="Editar" key={`edit-${task.id}`}>
                        <Button type="text" icon={<EditOutlined />} onClick={() => showModal(task)} />
                      </Tooltip>,
                      <Tooltip title="Eliminar" key={`delete-${task.id}`}>
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => showDeleteConfirm(task.id)} />
                      </Tooltip>,
                      task.status !== 'completed' && (
                        <Tooltip title="Marcar como completada" key={`complete-${task.id}`}>
                          <Button type="text" icon={<CheckOutlined />} onClick={() => markTaskAsCompleted(task)} />
                        </Tooltip>
                      ),
                    ]}
                  >
                    <Card.Meta
                      title={task.title}
                      description={
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Text>{task.description}</Text>
                          <Divider style={{ margin: '8px 0' }} />
                          <Space wrap>
                            <Tag icon={<FolderOutlined />} color="blue">
                              {task.category || 'Sin categoría'}
                            </Tag>
                            {task.remind_me && (
                              <Tag icon={<BellOutlined />} color="gold">
                                Recordatorio activo
                              </Tag>
                            )}
                            {task.time_until_finish > 0 && (
                              <Tag icon={<ClockCircleOutlined />} color={getTimeUntilFinishText(task.time_until_finish, task.createdAt).color}>
                                {getTimeUntilFinishText(task.time_until_finish, task.created_at).text}
                              </Tag>
                            )}
                          </Space>
                        </Space>
                      }
                    />
                  </Card>
                </Badge.Ribbon>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No se encontraron tareas. ¡Crea una para comenzar!" />
        )}

        <Modal
          title={editingTask ? 'Editar Tarea' : 'Crear Tarea'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            onFinish={handleSaveTask}
            layout="vertical"
            initialValues={{
              status: 'pending',
              remind_me: false,
              category: 'other',
              time_until_finish: 0
            }}
          >
            <Form.Item
              name="title"
              label="Título"
              rules={[{ required: true, message: 'Por favor ingresa el título de la tarea' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="Descripción"
              rules={[{ required: true, message: 'Por favor ingresa la descripción de la tarea' }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="category"
              label="Categoría"
              rules={[{ required: true, message: 'Por favor selecciona una categoría' }]}
            >
              <Select>
                {categories.map(category => (
                  <Option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="Estado"
              rules={[{ required: true, message: 'Por favor selecciona el estado' }]}
            >
              <Select>
                <Option value="pending">Pendiente</Option>
                <Option value="in_progress">En Progreso</Option>
                <Option value="completed">Completada</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="time_until_finish"
              label="Tiempo estimado (horas)"
              rules={[{ type: 'number', min: 0, message: 'El tiempo debe ser mayor o igual a 0' }]}
            >
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="remind_me"
              label="Activar recordatorio"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving}>
                  {editingTask ? 'Actualizar' : 'Crear'}
                </Button>
                <Button onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}>
                  Cancelar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default TasksPage;
