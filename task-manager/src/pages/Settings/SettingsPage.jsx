// src/pages/Settings/SettingsPage.jsx
import { useContext } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { Typography, Switch } from 'antd';
import { PreferencesContext } from '../../context/PreferencesContext';

const { Title } = Typography;

const SettingsPage = () => {
  const { darkMode, setDarkMode } = useContext(PreferencesContext);

  const handleDarkModeChange = (checked) => {
    setDarkMode(checked);
  };

  return (
    <MainLayout>
      <Title level={2}>Settings</Title>
      <p>Configure your application preferences here.</p>
      <div>
        <span>Modo Oscuro: </span>
        <Switch checked={darkMode} onChange={handleDarkModeChange} />
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
