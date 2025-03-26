// EditTaskPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import {
  Typography,
  Card,
  Button,
  Spin,
  message,
  Form,
  Input,
  Select,
  Tag,
  Switch,
  InputNumber,
  Tooltip,
  Space,
  Divider,
  Radio,
  Avatar,
  Row,
  Col
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  TeamOutlined,
  UserOutlined,
  UserAddOutlined,
  SearchOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import MDEditor from '@uiw/react-md-editor';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Option } = Select;

const EditTaskPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [mdValue, setMdValue] = useState<string | undefined>("");


  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/tasks/${taskId}`, getAuthHeaders());
        const taskData = response.data.task; // Access the task property of the response data
        console.log("Task data fetched:", response.data);
        setTask(taskData);
        setMdValue(taskData.description);

        // Set form values
        form.setFieldsValue({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          category: taskData.category,
          remind_me: taskData.remind_me,
          is_group_task: taskData.is_group_task,
          time_until_finish: taskData.time_until_finish ? taskData.time_until_finish / 3600000000000 : 0,
        });
        console.log("Form values set:", form.getFieldsValue());

        if (taskData.arr_collaborators) {
          setCollaborators(taskData.arr_collaborators);
        }
      } catch (error: any) {
        message.error(`Error al cargar la tarea: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId, form]);

  const handleSaveTask = async (values: any) => {
    setSaving(true);
    const taskData = {
      ...values,
      time_until_finish: values.time_until_finish ? Number(values.time_until_finish * 3600000000000) : 0,
      arr_collaborators: collaborators.map((c: any) => c.id),
    };

    try {
      await api.put(`/api/tasks/${taskId}`, taskData, getAuthHeaders());
      message.success('¡Tarea actualizada con éxito!');
      navigate('/tasks');
    } catch (error: any) {
      message.error(`Error al guardar la tarea: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>Editar Tarea</Title>
          <Text type="secondary">Edita los detalles de la tarea</Text>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Form
            form={form}
            onFinish={handleSaveTask}
            layout="vertical"
          >
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Card title="Opciones de la tarea" style={{ marginBottom: '20px' }}>
                  <Form.Item name="status" label="Estado">
                    <Select size="large">
                      <Option value="pending">Pendiente</Option>
                      <Option value="in_progress">En Progreso</Option>
                      <Option value="completed">Completada</Option>
                      <Option value="archived">Archivada</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="category" label="Categoría">
                    <Select size="large">
                      <Option value="work">Trabajo</Option>
                      <Option value="personal">Personal</Option>
                      <Option value="study">Estudio</Option>
                      <Option value="other">Otro</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="time_until_finish" label="Tiempo estimado (horas)">
                    <InputNumber min={0} step={0.5} style={{ width: '100%' }} size="large" />
                  </Form.Item>

                  <Form.Item name="remind_me" valuePropName="checked">
                    <Switch checkedChildren="Recordarme" unCheckedChildren="No recordar" />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                        Guardar
                      </Button>
                      <Button onClick={() => navigate('/tasks')} icon={<CloseOutlined />}>
                        Cancelar
                      </Button>
                    </Space>
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24} md={16}>
                <Card style={{ marginBottom: '20px' }}>
                  <Form.Item
                    name="title"
                    label="Título"
                    rules={[{ required: true, message: 'Por favor ingresa el título de la tarea' }]}
                  >
                    <Input size="large" placeholder="Título de la tarea" />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Descripción"
                    rules={[{ required: true, message: 'Por favor ingresa la descripción de la tarea' }]}
                  >
                    <MDEditor
                      value={mdValue}
                      onChange={(val) => {
                        setMdValue(val);
                        form.setFieldsValue({ description: val });
                      }}
                      height={500}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Card>
              </Col>
            </Row>
          </Form>
        )}
      </div>
    </MainLayout>
  );
};

export default EditTaskPage;
