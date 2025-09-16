import React, { useState } from 'react';
import { auth } from '../firebase';
import { quickSeed } from '../utils/seedData';

const SeedDataButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSeedData = async () => {
    if (!auth.currentUser) return;

    const confirmed = confirm(
      'Örnek veriler oluşturulsun mu?\n\n' +
      '• 4 örnek çalışan\n' +
      '• 7 örnek vardiya\n\n' +
      'Bu işlem mevcut verileri etkilemez.'
    );

    if (!confirmed) return;

    setLoading(true);
    setSuccess(false);

    try {
      const result = await quickSeed(auth.currentUser.uid);
      console.log('Seed başarılı:', result);
      setSuccess(true);
      
      // 3 saniye sonra success durumunu temizle
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Seed hatası:', error);
      alert('Örnek veri oluşturulurken bir hata oluştu: ' + error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <button className="btn-secondary" disabled>
        ✅ Örnek Veriler Oluşturuldu
      </button>
    );
  }

  return (
    <button
      onClick={handleSeedData}
      disabled={loading}
      className="btn-secondary"
      title="Geliştirme ve test için örnek veriler oluşturur"
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          <span>Oluşturuluyor...</span>
        </div>
      ) : (
        '🌱 Örnek Veri Oluştur'
      )}
    </button>
  );
};

export default SeedDataButton;

