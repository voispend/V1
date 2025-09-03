import { useState, useCallback } from 'react';

interface ProfileFormData {
  name: string;
  email: string;
}

interface UseProfileFormProps {
  initialName?: string;
  initialEmail?: string;
}

/**
 * Custom hook for managing profile form state
 * @param initialName - Initial name value
 * @param initialEmail - Initial email value
 * @returns Object containing form state and handlers
 */
export const useProfileForm = ({ initialName = '', initialEmail = '' }: UseProfileFormProps) => {
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: initialName,
    email: initialEmail,
  });

  const updateForm = (updates: Partial<ProfileFormData>) => {
    setProfileForm(prev => ({ ...prev, ...updates }));
  };

  const resetForm = (name?: string, email?: string) => {
    setProfileForm({
      name: name || initialName,
      email: email || initialEmail,
    });
  };

  const setFormData = useCallback((name: string, email: string) => {
    setProfileForm({ name, email });
  }, []);

  return {
    profileForm,
    setProfileForm,
    updateForm,
    resetForm,
    setFormData,
  };
};
