import { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
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
  Divider,
  Radio,
  Avatar
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
  FolderOutlined,
  TeamOutlined,
  UserOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import api from '../../api/axios';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const TasksPage = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [userRole, setUserRole] = useState('');
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assignmentType, setAssignmentType] = useState('personal');
  const [userData, setUserData] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorDetails, setCollaboratorDetails] = useState({});
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const categories = [
    'work',
    'personal',
    'shopping',
    'health',
    'education',
    'other'
  ];

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Fetch user data on component mount
  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await api.get('/api/user', getAuthHeaders());
        setUserData(response.data);
        setUserRole(response.data.role || '');
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    getUserData();
    fetchTasks();
    if (localStorage.getItem('token')) {
      fetchUserGroups();
    }
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('No se encontró token. Por favor, inicia sesión.');
        return;
      }
      const response = await api.get('/api/tasks', getAuthHeaders());
      const tasksData = response.data?.tasks ?? [];

      // 1. Extraer todos los IDs de colaboradores únicos de todas las tareas
      const allCollaboratorIds = new Set();
      tasksData.forEach(task => {
        if (task.arr_collaborators && task.arr_collaborators.length > 0) {
          task.arr_collaborators.forEach(id => allCollaboratorIds.add(id));
        }
      });
      const uniqueCollaboratorIds = Array.from(allCollaboratorIds);

      // 2. Obtener los detalles de todos los colaboradores únicos en una sola llamada
      let collaboratorDetailsMap = {};
      if (uniqueCollaboratorIds.length > 0) {
        const collaboratorsResponse = await api.post(
          '/api/users/batch',
          { ids: uniqueCollaboratorIds },
          getAuthHeaders()
        );
        if (collaboratorsResponse.data && collaboratorsResponse.data.users) {
          collaboratorDetailsMap = collaboratorsResponse.data.users.reduce((acc, user) => {
            acc[user.id] = user.username;
            return acc;
          }, {});
        }
      }

      // 3. Mapear los usernames de los colaboradores a cada tarea
      const tasksWithUsernames = tasksData.map(task => {
        if (task.arr_collaborators && task.arr_collaborators.length > 0) {
          const collaboratorUsernames = task.arr_collaborators.map(id => collaboratorDetailsMap[id] || 'Usuario no encontrado');
          return { ...task, collaboratorUsernames };
        }
        return task;
      });

      // 4. Establecer el estado de las tareas con los usernames de los colaboradores
      setTasks(tasksWithUsernames);

    } catch (error) {
      message.error(`Error al obtener tareas: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGroups = async () => {
    setLoadingGroups(true);
    try {
      const response = await api.get('/api/groups', getAuthHeaders());
      setUserGroups(response.data?.groups ?? []);
    } catch (error) {
      console.error('Error fetching user groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchGroupMembers = async (groupId) => {
    if (!groupId) return;

    setLoadingMembers(true);
    try {
      const response = await api.get(`/api/groups/${groupId}`, getAuthHeaders());
      if (response.data && response.data.members) {
        setGroupMembers(response.data.members);
      } else if (response.data && response.data.group && response.data.group.members) {
        setGroupMembers(response.data.group.members);
      } else {
        setGroupMembers([]);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
      message.error('Error al cargar los miembros del grupo');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleGroupChange = (value) => {
    const group = userGroups.find(g => g.id === value);
    setSelectedGroup(group);
    fetchGroupMembers(value);
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
      assigned_by: userData?.username || '',
      arr_collaborators: collaborators.map(c => c.id), // Agregar colaboradores
    };

    // Add group and assignee data if task is not personal
    if (values.assignment_type === 'group') {
      taskData.group_id = values.group_id;
      taskData.is_group_task = true;
    } else if (values.assignment_type === 'member') {
      taskData.group_id = values.group_id;
      taskData.assigned_to = values.assigned_to;
      taskData.is_group_task = false;
    }

    console.log('Datos de la tarea a guardar:', taskData);

    try {
      if (editingTask) {
        await api.put(`/api/tasks/${editingTask.id}`, taskData, getAuthHeaders());
        message.success('¡Tarea actualizada con éxito!');
      } else {
        await api.post(`/api/tasks`, taskData, getAuthHeaders());
        message.success('¡Tarea creada con éxito!');
      }
      setIsModalVisible(false);
      form.resetFields();
      setCollaborators([]); // Limpiar colaboradores después de guardar
      fetchTasks();
    } catch (error) {
      message.error(`Error al guardar la tarea: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const showEditPage = (taskId) => {
    navigate(`/tasks/edit/${taskId}`);
  };

  const showDeleteConfirm = (taskId) => {
    confirm({
      title: '¿Estás seguro de que deseas eliminar esta tarea?',
      icon: <ExclamationCircleOutlined />,
      content: 'Esta acción no se puede deshacer.',
      onOk: async () => {
        const token = localStorage.getItem('token');
        try {
          await api.delete(`/api/tasks/${taskId}`, getAuthHeaders());
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
      await api.put(`/api/tasks/${task.id}`, { ...task, status: 'completed' }, getAuthHeaders());
      message.success('¡Tarea marcada como completada!');
      fetchTasks();
    } catch (error) {
      message.error(`Error al actualizar la tarea: ${error.response?.data?.message || error.message}`);
    }
  };

  const getTimeUntilFinishText = (nanoseconds, createdAt) => {
    if (!nanoseconds || nanoseconds <= 0) return { text: '', color: '' };

    const remainingTime = nanoseconds / 1000000; // Convertir nanosegundos a milisegundos
    const currentTime = new Date().getTime(); // Tiempo actual en milisegundos
    const createTime = new Date(createdAt || Date.now()).getTime();
    const timeLeft = remainingTime - (currentTime - createTime);

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

    // Reset form fields
    form.resetFields();

    if (task) {
      // Convert nanoseconds to hours for display
      const timeInHours = task.time_until_finish / 3600000000000;

      const formValues = {
        ...task,
        time_until_finish: timeInHours,
      };

      // Handle assignment type for editing
      if (task.is_group_task && task.group_id) {
        formValues.assignment_type = 'group';
        formValues.group_id = task.group_id;
        handleGroupChange(task.group_id);
      } else if (task.assigned_to && task.group_id) {
        formValues.assignment_type = 'member';
        formValues.group_id = task.group_id;
        formValues.assigned_to = task.assigned_to;
        handleGroupChange(task.group_id);
      } else {
        formValues.assignment_type = 'personal';
      }

      form.setFieldsValue(formValues);
      setAssignmentType(formValues.assignment_type);

      // Load collaborators' names
      if (task.arr_collaborators && task.arr_collaborators.length > 0) {
        fetchCollaborators(task.arr_collaborators);
      }
    } else {
      setAssignmentType('personal');
      setCollaborators([]); // Limpiar colaboradores para nueva tarea
    }

    setIsModalVisible(true);
  };

  const fetchCollaborators = async (collaboratorIds) => {
    try {
      const response = await api.post(
        '/api/users/batch',
        { ids: collaboratorIds },
        getAuthHeaders()
      );

      if (response.data && response.data.users) {
        setCollaborators(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    }
  };

  const handleAssignmentTypeChange = (e) => {
    const value = e.target.value;
    setAssignmentType(value);

    // If no longer using group assignment, clear group-related fields
    if (value === 'personal') {
      form.setFieldsValue({
        group_id: undefined,
        assigned_to: undefined
      });
      setSelectedGroup(null);
      setGroupMembers([]);
    }
  };

  const handleSearchCollaborators = async () => {
    if (!searchEmail.trim()) {
      message.warning('Por favor, ingresa un correo electrónico');
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get(`/api/users/search?email=${encodeURIComponent(searchEmail)}`, getAuthHeaders());
      if (response.data.users && response.data.users.length > 0) {
        setSearchResults(response.data.users);
      } else {
        setSearchResults([]);
        message.info('No se encontró ningún usuario con ese correo electrónico');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      message.error('Error al buscar el usuario');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddCollaborator = (user) => {
    if (collaborators.length >= 3) {
      message.warning('Solo puedes agregar hasta 3 colaboradores');
      return;
    }

    if (collaborators.some(c => c.id === user.id)) {
      message.warning('Este usuario ya es un colaborador');
      return;
    }

    setCollaborators([...collaborators, user]);
    setSearchEmail('');
    setSearchResults([]);
  };

  const handleRemoveCollaborator = (userId) => {
    setCollaborators(collaborators.filter(c => c.id !== userId));
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
          {userRole === 'master' && (
            <Tag color="gold" style={{ marginLeft: '8px' }}>
              Administrador
            </Tag>
          )}
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
                        <Button type="text" icon={<EditOutlined />} onClick={() => showEditPage(task.id)} />
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
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{task.title}</span>
                          {(task.is_group_task || task.assigned_to) && (
                            <Tag color="purple" icon={task.is_group_task ? <TeamOutlined /> : <UserOutlined />}>
                              {task.is_group_task ? 'Grupal' : 'Asignada'}
                            </Tag>
                          )}
                        </div>
                      }
                      description={
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Divider style={{ margin: '8px 0' }} />
                          <Space wrap>
                            <Tag icon={<FolderOutlined />} color="blue">
                              {task.category || 'Sin categoría'}
                            </Tag>
                            {task.remind_me && (
                              <Tag icon={<BellOutlined />} color="gold">
                                Recordatorio
                              </Tag>
                            )}
                            {task.time_until_finish > 0 && (
                              <Tag
                                icon={<ClockCircleOutlined />}
                                color={getTimeUntilFinishText(task.time_until_finish, task.created_at).color}
                              >
                                {getTimeUntilFinishText(task.time_until_finish, task.created_at).text}
                              </Tag>
                            )}
                          </Space>

                          {/* Assignment information */}
                          {(task.assigned_by || task.assigned_to) && (
                            <>
                              <Divider style={{ margin: '8px 0' }} />
                              <Space wrap>
                                {task.assigned_by && (
                                  <Text type="secondary">
                                    Asignado por: <Text strong>{task.assigned_by}</Text>
                                  </Text>
                                )}
                                {task.assigned_to && (
                                  <Text type="secondary">
                                    Asignado a: <Text strong>{task.assigned_to}</Text>
                                  </Text>
                                )}
                              </Space>
                            </>
                          )}

                          {/* Collaborators */}
                          {task.arr_collaborators && task.arr_collaborators.length > 0 && (
                            <>
                              <Divider style={{ margin: '8px 0' }} />
                              <Text type="secondary">Colaboradores:</Text>
                              <Space wrap>
                                {task.arr_collaborators.map((collaborator, index) => (
                                  <Tag key={index} color="cyan">
                                    {collaborator.username || collaborator}
                                  </Tag>
                                ))}
                              </Space>
                            </>
                          )}
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
            setSelectedGroup(null);
            setGroupMembers([]);
            setCollaborators([]); // Limpiar colaboradores al cerrar el modal
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
              time_until_finish: 0,
              assignment_type: 'personal'
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

            {/* Assignment section - only visible for master role */}
            {userRole === 'master' && (
              <>
                <Divider>Asignación de Tarea</Divider>

                <Form.Item
                  name="assignment_type"
                  label="Tipo de asignación"
                >
                  <Radio.Group onChange={handleAssignmentTypeChange} value={assignmentType}>
                    <Radio value="personal">Personal</Radio>
                    <Radio value="group">Grupo completo</Radio>
                    <Radio value="member">Miembro específico</Radio>
                  </Radio.Group>
                </Form.Item>

                {(assignmentType === 'group' || assignmentType === 'member') && (
                  <Form.Item
                    name="group_id"
                    label="Seleccionar grupo"
                    rules={[{ required: true, message: 'Por favor selecciona un grupo' }]}
                  >
                    <Select
                      loading={loadingGroups}
                      placeholder="Selecciona un grupo"
                      onChange={handleGroupChange}
                    >
                      {userGroups.map(group => (
                        <Option key={group.id} value={group.id}>
                          {group.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}

                {assignmentType === 'member' && selectedGroup && (
                  <Form.Item
                    name="assigned_to"
                    label="Asignar a miembro"
                    rules={[{ required: true, message: 'Por favor selecciona un miembro' }]}
                  >
                    <Select
                      loading={loadingMembers}
                      placeholder="Selecciona un miembro"
                      notFoundContent={
                        groupMembers.length === 0
                          ? "No hay miembros en este grupo"
                          : "No se encontraron miembros"
                      }
                    >
                      {groupMembers.map(member => (
                        <Option key={member.id} value={member.username}>
                          <Space>
                            <Avatar size="small">{member.username.charAt(0).toUpperCase()}</Avatar>
                            {member.username}
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}
              </>
            )}

            {/* Collaborators section */}
            <Divider>Colaboradores</Divider>
            <Form.Item label="Agregar colaboradores">
              <Space>
                <Input
                  placeholder="Buscar usuario por correo electrónico"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  prefix={<SearchOutlined />}
                  onPressEnter={handleSearchCollaborators}
                  disabled={searchLoading}
                  style={{ width: '250px' }}
                />
                <Button
                  type="primary"
                  onClick={handleSearchCollaborators}
                  loading={searchLoading}
                  icon={<SearchOutlined />}
                >
                  Buscar
                </Button>
              </Space>
            </Form.Item>

            {searchResults.length > 0 && (
              <List
                dataSource={searchResults}
                renderItem={(user) => (
                  <List.Item
                    key={user.id}
                    actions={[
                      <Button
                        key={`add-${user.id}`}
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={() => handleAddCollaborator(user)}
                        disabled={collaborators.length >= 3}
                      >
                        Agregar
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: '#1890ff' }}>
                          {user.username ? user.username.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={user.username}
                      description={user.email}
                    />
                  </List.Item>
                )}
                style={{ marginBottom: '24px' }}
              />
            )}

            {collaborators.length > 0 && (
              <Form.Item label="Colaboradores seleccionados">
                <Space wrap>
                  {collaborators.map((collaborator) => (
                    <Tag
                      key={collaborator.id}
                      closable
                      onClose={() => handleRemoveCollaborator(collaborator.id)}
                    >
                      {collaborator.username}
                    </Tag>
                  ))}
                </Space>
              </Form.Item>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving}>
                  {editingTask ? 'Actualizar' : 'Crear'}
                </Button>
                <Button onClick={() => {
                  setIsModalVisible(false);
                  setSelectedGroup(null);
                  setGroupMembers([]);
                  setCollaborators([]);
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
