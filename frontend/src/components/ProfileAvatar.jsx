import React, { useState } from 'react';

const ProfileAvatar = ({ user, className = 'w-10 h-10', fallbackClassName = 'bg-primary-100 text-primary-700', alt }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = `${user?.first_name?.charAt(0) || ''}${user?.last_name?.charAt(0) || ''}` || 'NC';
  const label = alt || `${user?.first_name || 'NovaCare'} ${user?.last_name || 'user'}`;

  if (user?.profile_image_url && !imageFailed) {
    return (
      <img
        src={user.profile_image_url}
        alt={label}
        onError={() => setImageFailed(true)}
        className={`${className} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div className={`${className} rounded-full flex items-center justify-center font-bold shrink-0 ${fallbackClassName}`} aria-label={label}>
      {initials}
    </div>
  );
};

export default ProfileAvatar;
