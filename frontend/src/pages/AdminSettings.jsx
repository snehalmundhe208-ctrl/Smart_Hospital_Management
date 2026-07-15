import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { Settings as SettingsIcon, Bell, Lock, Save, X } from 'lucide-react';

const defaultSettings = { emailNotifications: true, maintenanceMode: false, hospitalName: 'NovaCare General', supportEmail: 'support@novacare.com' };

const AdminSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('novacare-settings');
    if (saved) setSettings({ ...defaultSettings, ...JSON.parse(saved) });
  }, []);

  const toggle = (key) => setSettings((current) => ({ ...current, [key]: !current[key] }));
  const saveSettings = () => {
    localStorage.setItem('novacare-settings', JSON.stringify(settings));
    setNotice('Settings saved for this browser.');
  };

  return (
    <AdminLayout title="System Settings">
      <div className="max-w-4xl mx-auto space-y-6">
        {notice && <div role="status" className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-6 text-white"><div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl"><SettingsIcon className="w-6 h-6" /></div><div><h2 className="text-2xl font-bold">General Settings</h2><p className="text-slate-400 text-sm">Manage local platform preferences for this admin workspace.</p></div></div>
          <div className="space-y-4">
            {[{ key: 'emailNotifications', icon: Bell, title: 'Enable Email Notifications', detail: 'Receive alerts for new patients and appointments', enabled: 'bg-blue-600', disabled: 'bg-slate-700' }, { key: 'maintenanceMode', icon: Lock, title: 'Maintenance Mode', detail: 'Show a maintenance notice in this administrator workspace', enabled: 'bg-amber-500', disabled: 'bg-slate-700' }].map((item) => <div key={item.key} className="flex items-center justify-between gap-5 p-4 bg-slate-950 rounded-2xl border border-slate-800"><div className="flex items-start gap-3"><item.icon className="mt-0.5 h-5 w-5 text-slate-400" /><div><p className="font-bold text-white">{item.title}</p><p className="text-sm text-slate-500">{item.detail}</p></div></div><button type="button" role="switch" aria-checked={settings[item.key]} aria-label={item.title} onClick={() => toggle(item.key)} className={`relative h-7 w-12 rounded-full transition-colors ${settings[item.key] ? item.enabled : item.disabled}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>)}
          </div>
        </section>
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl"><h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2><div className="grid md:grid-cols-2 gap-6"><label className="block text-slate-400 text-sm font-medium">Hospital Name<input type="text" value={settings.hospitalName} onChange={(event) => setSettings((current) => ({ ...current, hospitalName: event.target.value }))} className="mt-2 w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none ring-blue-500 focus:ring-2" /></label><label className="block text-slate-400 text-sm font-medium">Support Email<input type="email" value={settings.supportEmail} onChange={(event) => setSettings((current) => ({ ...current, supportEmail: event.target.value }))} className="mt-2 w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none ring-blue-500 focus:ring-2" /></label></div><button onClick={saveSettings} className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"><Save className="h-4 w-4" /> Save Changes</button></section>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
