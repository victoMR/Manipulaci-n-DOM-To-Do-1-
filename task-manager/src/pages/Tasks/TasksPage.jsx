import { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';
import { Typography, List, Card, Button, Spin, message, Empty, Modal, Form, Input, Select } from 'antd';

const { Title } = Typography;
const { Option } = Select;

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();

  // Obtener tareas del usuario
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('No token found. Please log in.');
        setLoading(false);
        return;
      }
      const response = await axios.get('http://localhost:8080/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data?.tasks ?? []);
    } catch (error) {
      message.error(`Failed to fetch tasks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Crear o actualizar una tarea
  const handleSaveTask = async (values) => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('No token found. Please log in.');
      return;
    }

    try {
      if (editingTask) {
        // Actualizar tarea existente
        await axios.put(`http://localhost:8080/api/tasks/${editingTask.id}`, values, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Task updated successfully!');
      } else {
        // Crear nueva tarea
        await axios.post('http://localhost:8080/api/tasks', values, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Task created successfully!');
      }
      setIsModalVisible(false);
      setEditingTask(null);
      fetchTasks(); // Recargar la lista de tareas
    } catch (error) {
      message.error(`Failed to save task: ${error.message}`);
    }
  };

  // Eliminar una tarea
  const handleDeleteTask = async (taskId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('No token found. Please log in.');
      return;
    }

    try {
      await axios.delete(`http://localhost:8080/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Task deleted successfully!');
      fetchTasks(); // Recargar la lista de tareas
    } catch (error) {
      message.error(`Failed to delete task: ${error.message}`);
    }
  };

  // Abrir modal para crear o editar tarea
  const showModal = (task = null) => {
    setEditingTask(task);
    form.setFieldsValue(task || { title: '', description: '', status: 'pending' });
    setIsModalVisible(true);
  };

  // Cerrar modal
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingTask(null);
  };

  // Cargar tareas al montar el componente
  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <MainLayout>
      <Title level={2}>Your Tasks</Title>
      <Button type="primary" onClick={() => showModal()} style={{ marginBottom: '16px' }}>
        Create Task
      </Button>
      {loading ? (
        <Spin size="large" />
      ) : tasks?.length ? (
        <List
          grid={{ gutter: 16, column: 3 }}
          dataSource={tasks}
          renderItem={(task) => (
            <List.Item>
              <Card
                title={task.title}
                actions={[
                  <Button key="edit" type="primary" onClick={() => showModal(task)}>
                    Edit
                  </Button>,
                  <Button key="delete" type="danger" onClick={() => handleDeleteTask(task.id)}>
                    Delete
                  </Button>,
                ]}
              >
                <p>{task.description}</p>
                <p>Status: {task.status}</p>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="No tasks found. Create one to get started!" />
      )}

      {/* Modal para crear/editar tareas */}
      <Modal
        title={editingTask ? 'Edit Task' : 'Create Task'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleSaveTask} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please input the task title!' }]}
          >
            <Input placeholder="Task title" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input the task description!' }]}
          >
            <Input.TextArea placeholder="Task description" />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select the task status!' }]}
          >
            <Select placeholder="Select status">
              <Option value="pending">Pending</Option>
              <Option value="in_progress">In Progress</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingTask ? 'Update Task' : 'Create Task'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default TasksPage;
