import { useState, useEffect, useCallback } from 'react';
import { Input, Button, List, message, Typography, Card, Row, Col, Modal, Form, Divider, Avatar, Tag, Spin, Empty, Tooltip } from 'antd';
import { SearchOutlined, UserAddOutlined, UserDeleteOutlined, TeamOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import MainLayout from '../../layouts/MainLayout';

const { Title } = Typography;

const GroupView = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [form] = Form.useForm();

  const API_BASE_URL = 'http://localhost:8080/api';

  const getAuthHeaders = useCallback(() => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  }), []);

  // Function to fetch groups
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/groups`, getAuthHeaders());

      if (response.data && response.data.groups) {
        setGroups(response.data.groups);
        if (response.data.groups.length > 0 && !selectedGroup) {
          handleSelectGroup(response.data.groups[0]);
        }
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      message.error('Error al cargar los grupos');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, selectedGroup]);

  // Load groups on component mount
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Function to create a new group
  const handleCreateGroup = async (values) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/groups`,
        {
          name: values.groupName,
          description: values.description
        },
        getAuthHeaders()
      );

      if (response.data && response.data.group) {
        message.success('Grupo creado con éxito');
        const newGroup = response.data.group;
        setGroups([...groups, newGroup]);
        setCreatingGroup(false);
        form.resetFields();
        handleSelectGroup(newGroup);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      message.error('Error al crear el grupo: ' + (error.response?.data?.error || 'Error del servidor'));
    }
  };

  // Function to select a group
  const handleSelectGroup = useCallback(async (group) => {
    setSelectedGroup(group);
    await fetchGroupMembers(group.id);
  }, []);

  // Function to fetch group members
  const fetchGroupMembers = useCallback(async (groupId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/groups/${groupId}`, getAuthHeaders());

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
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Function to search users by email
  const handleSearch = useCallback(async () => {
    if (!searchEmail.trim()) {
      message.warning('Por favor, ingresa un correo electrónico');
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/search?email=${encodeURIComponent(searchEmail)}`,
        getAuthHeaders()
      );

      if (response.data.users && response.data.users.length > 0) {
        const filteredResults = response.data.users.filter(
          user => !groupMembers.some(member => member.id === user.id)
        );

        if (filteredResults.length > 0) {
          setSearchResults(filteredResults);
        } else {
          setSearchResults([]);
          message.info('El usuario ya es miembro del grupo o no se encontró ningún usuario');
        }
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
  }, [searchEmail, groupMembers, getAuthHeaders]);

  // Function to add a user to the group
  const handleAddToGroup = useCallback(async (user) => {
    if (!selectedGroup) {
      message.warning('Por favor, selecciona un grupo primero');
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/groups/${selectedGroup.id}/members/${user.id}`,
        {},
        getAuthHeaders()
      );

      if (response.status === 200) {
        message.success(`Usuario ${user.username} agregado al grupo`);
        await fetchGroupMembers(selectedGroup.id);
        setSearchResults([]);
        setSearchEmail('');
      }
    } catch (error) {
      console.error('Error adding user to group:', error);
      message.error('Error al agregar el usuario al grupo: ' + (error.response?.data?.error || 'Error del servidor'));
    }
  }, [selectedGroup, fetchGroupMembers, getAuthHeaders]);

  // Function to remove a user from the group
  const handleRemoveFromGroup = useCallback(async (userId, username) => {
    if (!selectedGroup) return;

    Modal.confirm({
      title: '¿Estás seguro?',
      content: `¿Realmente deseas eliminar a ${username} del grupo ${selectedGroup.name}?`,
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const response = await axios.delete(
            `${API_BASE_URL}/groups/${selectedGroup.id}/members/${userId}`,
            getAuthHeaders()
          );

          if (response.status === 200) {
            message.success('Usuario eliminado del grupo');
            await fetchGroupMembers(selectedGroup.id);
          }
        } catch (error) {
          console.error('Error removing user from group:', error);
          message.error('Error al eliminar el usuario del grupo: ' + (error.response?.data?.error || 'Error del servidor'));
        }
      }
    });
  }, [selectedGroup, fetchGroupMembers, getAuthHeaders]);

  // Color generator for avatars
  const getRandomColor = useCallback((str) => {
    const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, []);

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        <Row gutter={24}>
          {/* Groups Panel */}
          <Col span={8}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span><TeamOutlined /> Mis Grupos</span>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreatingGroup(true)}
                    size="small"
                  >
                    Nuevo
                  </Button>
                </div>
              }
              style={{ marginBottom: '24px', height: '100%' }}
              loading={loading && groups.length === 0}
            >
              {groups.length > 0 ? (
                <List
                  dataSource={groups}
                  renderItem={(group) => (
                    <List.Item
                      key={group.id}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedGroup?.id === group.id ? '#f0f5ff' : 'transparent',
                        padding: '12px',
                        borderRadius: '4px',
                        transition: 'all 0.3s'
                      }}
                      onClick={() => handleSelectGroup(group)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{ backgroundColor: getRandomColor(group.name || '?') }}
                            size="large"
                          >
                            {group.name ? group.name.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                        }
                        title={group.name}
                        description={group.description || ''}
                      />
                      <Tag color="blue">{(groupMembers || []).length + ' miembros'}</Tag>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="No hay grupos disponibles" />
              )}
            </Card>
          </Col>

          {/* Members Management Panel */}
          <Col span={16}>
            <Card style={{ marginBottom: '24px' }}>
              <Title level={4}>
                {selectedGroup ? `Grupo: ${selectedGroup.name}` : 'Selecciona un grupo'}
              </Title>

              {selectedGroup && (
                <>
                  {/* User search */}
                  <div style={{ marginBottom: '24px', display: 'flex' }}>
                    <Input
                      placeholder="Buscar usuario por correo electrónico"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      style={{ marginRight: '8px', flex: 1 }}
                      prefix={<SearchOutlined />}
                      onPressEnter={handleSearch}
                      disabled={searchLoading}
                    />
                    <Button
                      type="primary"
                      onClick={handleSearch}
                      loading={searchLoading}
                      icon={<SearchOutlined />}
                    >
                      Buscar
                    </Button>
                  </div>

                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <>
                      <Title level={5}>Resultados de búsqueda</Title>
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
                                onClick={() => handleAddToGroup(user)}
                              >
                                Agregar
                              </Button>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={
                                <Avatar style={{ backgroundColor: getRandomColor(user.username || user.email) }}>
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
                      <Divider />
                    </>
                  )}

                  {/* Group members */}
                  <Title level={5}>
                    Miembros del Grupo
                    <Tag color="blue" style={{ marginLeft: '8px' }}>
                      {groupMembers.length} miembros
                    </Tag>
                  </Title>

                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Spin />
                    </div>
                  ) : groupMembers.length > 0 ? (
                    <List
                      dataSource={groupMembers}
                      renderItem={(member) => (
                        <List.Item
                          key={member.id}
                          actions={[
                            <Tooltip title="Eliminar del grupo">
                              <Button
                                danger
                                icon={<UserDeleteOutlined />}
                                onClick={() => handleRemoveFromGroup(member.id, member.username)}
                              />
                            </Tooltip>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              <Avatar style={{ backgroundColor: getRandomColor(member.username || member.email) }}>
                                {member.username ? member.username.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                              </Avatar>
                            }
                            title={member.username}
                            description={member.email}
                          />
                          {member.role && (
                            <Tag color="green" style={{ marginLeft: '8px' }}>
                              {member.role}
                            </Tag>
                          )}
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="No hay miembros en este grupo" />
                  )}
                </>
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Create Group Modal */}
      <Modal
        title="Crear Nuevo Grupo"
        visible={creatingGroup}
        onCancel={() => setCreatingGroup(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateGroup}
        >
          <Form.Item
            name="groupName"
            label="Nombre del Grupo"
            rules={[{ required: true, message: 'Por favor ingresa un nombre para el grupo' }]}
          >
            <Input placeholder="Ej. Equipo de Marketing" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Descripción"
          >
            <Input.TextArea placeholder="Describe el propósito de este grupo" rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              Crear Grupo
            </Button>
            <Button onClick={() => setCreatingGroup(false)}>
              Cancelar
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default GroupView;
