import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Component to test
import Front from './Front';

// Mock history and location for withRouter
const mockHistoryPush = jest.fn();
const mockLocation = { pathname: '/' };

// Mock Store
const mockStore = {
  appname: 'TestApp',
  register: jest.fn(),
  login: jest.fn(),
  // Add any other store properties/methods Front component might access
  default_fo_address: '0x123DefaultAddress', 
};

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  withRouter: Component => props => (
    <Component
      {...props}
      history={{ ...props.history, push: mockHistoryPush }}
      location={{ ...props.location, ...mockLocation }}
    />
  ),
}));

jest.mock('react-i18next', () => ({
  withTranslation: () => Component => {
    Component.defaultProps = { ...Component.defaultProps, t: jest.fn(key => key) };
    return Component;
  },
}));

jest.mock('mobx-react', () => ({
  ...jest.requireActual('mobx-react'),
  inject: (...stores) => Component => props => <Component {...props} {...stores.reduce((acc, storeName) => ({...acc, [storeName]: mockStore}), {})} />,
  observer: Component => Component,
}));

jest.mock('../util/Function', () => ({
  toast: jest.fn(),
  showApiError: jest.fn(),
  is_fo_address: jest.fn(() => true), // Default to true for FO address validation
}));

jest.mock('../Icon', () => () => <div data-testid="mock-icon" />);
jest.mock('../component/LangIcon', () => () => <div data-testid="mock-lang-icon" />);
jest.mock('../component/ScrollTopView', () => () => <div data-testid="mock-scroll-top-view" />);
jest.mock('react-document-title', () => ({ children }) => <>{children}</>); // Simple passthrough
jest.mock('react-cookie-consent', () => () => <div data-testid="mock-cookie-consent" />);


describe('Front Screen Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockLocation.pathname = '/'; // Reset path to default for each test
  });

  // --- Rendering & Tabs ---
  test('renders the registration form by default', () => {
    render(<Front store={mockStore} />); // Pass mockStore directly if inject mock isn't picking it up or for clarity
    expect(screen.getByPlaceholderText('邮件地址')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('用户唯一标识，只能由英文、数字构成，全站唯一，最短3位，不可修改')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('昵称')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '注册' })).toBeInTheDocument(); // Registration button text
  });

  test('renders the login form when props.location.pathname is /login', () => {
    mockLocation.pathname = '/login'; // Set path for this test
    render(<Front store={mockStore} />);
    expect(screen.getByPlaceholderText('邮件地址')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('登入密码，最短6位')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
  });

  test('user can switch between register and login tabs', async () => {
    render(<Front store={mockStore} />);
    // Default is register form
    expect(screen.getByRole('button', { name: '注册' })).toBeInTheDocument();

    // Click login tab
    fireEvent.click(screen.getByRole('tab', { name: '登入' })); // Login tab
    // Wait for potential async state updates if any, though simple tab switch might be sync
    await waitFor(() => {
        expect(screen.getByPlaceholderText('邮件地址')).toBeInTheDocument();
    });
    expect(screen.queryByPlaceholderText('用户唯一标识，只能由英文、数字构成，全站唯一，最短3位，不可修改')).not.toBeInTheDocument(); // Register specific field

    // Click register tab again
    fireEvent.click(screen.getByRole('tab', { name: '注册' }));
    await waitFor(() => {
        expect(screen.getByPlaceholderText('用户唯一标识，只能由英文、数字构成，全站唯一，最短3位，不可修改')).toBeInTheDocument();
    });
    expect(screen.queryByPlaceholderText('邮件地址')).not.toBeInTheDocument(); // Login specific field
  });

  // --- Registration Form ---
  describe('Registration Form', () => {
    beforeEach(() => {
        mockLocation.pathname = '/'; // Ensure registration tab is active
    });

    test('typing in input fields updates their values', () => {
      render(<Front store={mockStore} />);
      const emailInputs = screen.getAllByPlaceholderText('邮件地址');
      const emailInput = emailInputs[0]; // Registration form is the first one (index 0)
      const usernameInput = screen.getByPlaceholderText('用户唯一标识，只能由英文、数字构成，全站唯一，最短3位，不可修改');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      expect(emailInput.value).toBe('test@example.com');
      expect(usernameInput.value).toBe('testuser');
    });

    test('client-side validation: submitting with empty email calls toast', () => {
      render(<Front store={mockStore} />);
      fireEvent.click(screen.getByRole('button', { name: '注册' }));
      expect(require('../util/Function').toast).toHaveBeenCalledWith('Email地址不能为空');
    });
    
    test('client-side validation: submitting with empty username calls toast', () => {
      render(<Front store={mockStore} />);
      const emailInputs = screen.getAllByPlaceholderText('邮件地址');
      fireEvent.change(emailInputs[0], { target: { value: 'test@example.com' } }); // Registration form email
      fireEvent.click(screen.getByRole('button', { name: '注册' }));
      expect(require('../util/Function').toast).toHaveBeenCalledWith('用户昵称地址不能为空');
    });


    test('successful registration', async () => {
      render(<Front store={mockStore} />);
      mockStore.register.mockResolvedValueOnce({ data: { code: 0, data: { nickname: 'testuser1' } } });

      const emailInputs = screen.getAllByPlaceholderText('邮件地址');
      const passwordInputs = screen.getAllByPlaceholderText('登入密码，最短6位');
      fireEvent.change(emailInputs[0], { target: { value: 'valid@example.com' } }); // Registration form email
      fireEvent.change(screen.getByPlaceholderText('用户唯一标识，只能由英文、数字构成，全站唯一，最短3位，不可修改'), { target: { value: 'testuser1' } });
      fireEvent.change(screen.getByPlaceholderText('昵称'), { target: { value: 'Test User' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } }); // Registration form password

      fireEvent.click(screen.getByRole('button', { name: '注册' }));

      expect(mockStore.register).toHaveBeenCalledWith(
        'valid@example.com', 
        'Test User', // Nickname
        'testuser1', // Username
        'password123',
        '' // FO Address (this.state.address default empty string)
      );
    });

    test('failed registration (API error)', async () => {
      render(<Front store={mockStore} />);
      mockStore.register.mockResolvedValueOnce({ code: 1, info: 'Registration failed' });

      const emailInputs = screen.getAllByPlaceholderText('邮件地址');
      const passwordInputs = screen.getAllByPlaceholderText('登入密码，最短6位');
      fireEvent.change(emailInputs[0], { target: { value: 'fail@example.com' } }); // Registration form email
      fireEvent.change(screen.getByPlaceholderText('用户唯一标识，只能由英文、数字构成，全站唯一，最短3位，不可修改'), { target: { value: 'failuser' } });
      fireEvent.change(screen.getByPlaceholderText('昵称'), { target: { value: 'Fail User' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } }); // Registration form password
      
      fireEvent.click(screen.getByRole('button', { name: '注册' }));

      expect(mockStore.register).toHaveBeenCalled();
    });
  });

  // --- Login Form ---
  describe('Login Form', () => {
    beforeEach(() => {
      mockLocation.pathname = '/login'; // Set to login tab
    });

    test('typing in input fields updates their values', () => {
      render(<Front store={mockStore} />);
      const emailInputs = screen.getAllByPlaceholderText('邮件地址');
      const emailInput = emailInputs[1]; // Login form is the second one (index 1)
      const passwordInputs = screen.getAllByPlaceholderText('登入密码，最短6位');
      const passwordInput = passwordInputs[1]; // Login form password is the second one (index 1)
      
      fireEvent.change(emailInput, { target: { value: 'login@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'secret' } });

      expect(emailInput.value).toBe('login@example.com');
      expect(passwordInput.value).toBe('secret');
    });

    test('client-side validation: submitting with empty email calls toast', () => {
      render(<Front store={mockStore} />);
      fireEvent.click(screen.getByRole('button', { name: '登入' }));
      expect(require('../util/Function').toast).toHaveBeenCalledWith('Email地址不能为空');
    });

    test('successful login', async () => {
      render(<Front store={mockStore} />);
      mockStore.login.mockResolvedValueOnce({ data: { code: 0, data: { nickname: 'logintestuser', group_count: 0 } } });
      
      const emailInputs = screen.getAllByPlaceholderText('邮件地址');
      const passwordInputs = screen.getAllByPlaceholderText('登入密码，最短6位');
      fireEvent.change(emailInputs[1], { target: { value: 'login@example.com' } }); // Login form email
      fireEvent.change(passwordInputs[1], { target: { value: 'password123' } }); // Login form password
      
      fireEvent.click(screen.getByRole('button', { name: '登入' }));

      expect(mockStore.login).toHaveBeenCalledWith('login@example.com', 'password123');
    });
    
    test('successful login redirects to /admin if group_count is -1 (admin)', async () => {
      render(<Front store={mockStore} />);
      mockStore.login.mockResolvedValueOnce({ data: { code: 0, data: { nickname: 'adminuser', group_count: -1 } } });
      
      const emailInputs = screen.getAllByPlaceholderText('邮件地址');
      const passwordInputs = screen.getAllByPlaceholderText('登入密码，最短6位');
      fireEvent.change(emailInputs[1], { target: { value: 'admin@example.com' } }); // Login form email
      fireEvent.change(passwordInputs[1], { target: { value: 'adminpass' } }); // Login form password
      
      fireEvent.click(screen.getByRole('button', { name: '登入' }));

      expect(mockStore.login).toHaveBeenCalledWith('admin@example.com', 'adminpass');
    });


    test('failed login (API error)', async () => {
      render(<Front store={mockStore} />);
      mockStore.login.mockResolvedValueOnce({ code: 1, info: 'Login failed' });

      const emailInputs = screen.getAllByPlaceholderText('邮件地址');
      const passwordInputs = screen.getAllByPlaceholderText('登入密码，最短6位');
      fireEvent.change(emailInputs[1], { target: { value: 'badlogin@example.com' } }); // Login form email
      fireEvent.change(passwordInputs[1], { target: { value: 'wrongpassword' } }); // Login form password

      fireEvent.click(screen.getByRole('button', { name: '登入' }));

      expect(mockStore.login).toHaveBeenCalled();
    });
  });
});
