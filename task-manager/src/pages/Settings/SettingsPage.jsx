// src/pages/Settings/SettingsPage.jsx
import MainLayout from '../../layouts/MainLayout';
import { Typography } from 'antd';

const { Title } = Typography;

const SettingsPage = () => {
  return (
    <MainLayout>
      <Title level={2}>Settings</Title>
      <p>Configure your application preferences here.</p>
    </MainLayout>
  );
};

export default SettingsPage;
