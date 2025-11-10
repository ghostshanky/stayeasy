import React from 'react';
import ProfilePage from '../pages/ProfilePage';

// Mock the imagekitio-react library
jest.mock('imagekitio-react', () => ({
  IKContext: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
  IKImage: () => React.createElement('img', { src: 'test-image.png', alt: 'Test' }),
  IKUpload: () => React.createElement('input', { type: 'file' })
}));

// Mock the supabase client
const mockUser = {
  id: 'user123',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
    image_id: 'image123'
  }
};

const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
    updateUser: jest.fn().mockResolvedValue({ error: null })
  }
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => {
      React.createElement(ProfilePage);
    }).not.toThrow();
  });
});