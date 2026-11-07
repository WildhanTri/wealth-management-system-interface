import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';
import { apiService } from '../../services/apiService';
import '../../App.css';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import appLogo from '../../assets/logo.png';

interface AuthScreenProps {
  initialMode?: AuthMode;
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'login', onSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const getModeFromPath = (path: string): AuthMode => {
    if (path.includes('register')) return 'register';
    if (path.includes('forgot')) return 'forgot';
    if (path.includes('reset')) return 'reset';
    return initialMode;
  };

  const [mode, setMode] = useState<AuthMode>(() => getModeFromPath(location.pathname));

  useEffect(() => {
    const currentMode = getModeFromPath(location.pathname);
    setMode(currentMode);
  }, [location.pathname]);

  // Form states
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedTokenNotice, setGeneratedTokenNotice] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const resetFormFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetFormFeedback();
    if (newMode === 'login') navigate('/login');
    else if (newMode === 'register') navigate('/register');
    else if (newMode === 'forgot') navigate('/forgot-password');
    else if (newMode === 'reset') navigate('/reset-password');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormFeedback();

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiService.login({ email, password });
      if (res.success && res.data) {
        dispatch(
          setCredentials({
            user: res.data.user,
            token: res.data.token,
          })
        );
        onSuccess?.();
        navigate('/dashboard');
      } else {
        setErrorMessage(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormFeedback();

    if (!fullname.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiService.register({
        fullname: fullname.trim(),
        email: email.trim(),
        password,
      });

      if (res.success && res.data) {
        dispatch(
          setCredentials({
            user: res.data.user,
            token: res.data.token,
          })
        );
        onSuccess?.();
        navigate('/dashboard');
      } else {
        setErrorMessage(res.message || 'Registration failed. Email may already be in use.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormFeedback();

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiService.forgotPassword({ email: email.trim() });
      if (res.success) {
        const token = res.data?.resetToken;
        setSuccessMessage('Password reset token generated successfully.');
        if (token) {
          setGeneratedTokenNotice(token);
          setResetToken(token);
        }
      } else {
        setErrorMessage(res.message || 'Could not process password reset.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormFeedback();

    if (!resetToken.trim() || !password) {
      setErrorMessage('Please enter the reset token and your new password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiService.resetPassword({
        token: resetToken.trim(),
        newPassword: password,
      });

      if (res.success) {
        setSuccessMessage('Password successfully reset! You can now log in.');
        setPassword('');
        setConfirmPassword('');
        setGeneratedTokenNotice(null);
        setTimeout(() => {
          handleSwitchMode('login');
        }, 1500);
      } else {
        setErrorMessage(res.message || 'Failed to reset password. Token may be invalid or expired.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="onboarding-desktop-viewport" style={{ zIndex: 100 }}>
      {/* Background ambient glows */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      <div
        className="auth-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '36px 32px',
        }}
      >
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 253, 244, 0.98) 100%)',
              border: '1.5px solid var(--border-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 28px -4px rgba(5, 150, 105, 0.25)',
              marginBottom: '16px',
              padding: '8px',
            }}
          >
            <img src={appLogo} alt="Crescent Wealth Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.4px',
            }}
          >
            Crescent Wealth
          </h2>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: 'var(--primary)',
              fontWeight: 700,
              marginTop: '2px',
            }}
          >
            Personal Wealth Management System
          </div>
        </div>

        {/* Subtitle based on mode */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {mode === 'login' && 'Sign In to Your Portfolio'}
            {mode === 'register' && 'Create Your Wealth Account'}
            {mode === 'forgot' && 'Reset Your Password'}
            {mode === 'reset' && 'Set New Password'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {mode === 'login' && 'Enter your credentials to access your financial command center'}
            {mode === 'register' && 'Create your account to start managing and growing your wealth'}
            {mode === 'forgot' && 'Enter your account email to receive your secure reset token'}
            {mode === 'reset' && 'Enter the reset token along with your new secure password'}
          </p>
        </div>

        {/* Alerts / Feedback */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--rose)',
              fontSize: '13px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(72, 176, 125, 0.12)',
              border: '1px solid rgba(72, 176, 125, 0.3)',
              color: 'var(--emerald)',
              fontSize: '13px',
              marginBottom: '18px',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Generated Token Notice in Forgot Password flow */}
        {generatedTokenNotice && (
          <div
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Your Reset Token
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(generatedTokenNotice)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {copiedToken ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
              </button>
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: 'var(--primary)',
                wordBreak: 'break-all',
                background: 'var(--bg-app)',
                padding: '8px 10px',
                borderRadius: '6px',
              }}
            >
              {generatedTokenNotice}
            </div>
            <button
              type="button"
              onClick={() => handleSwitchMode('reset')}
              className="btn-primary"
              style={{ width: '100%', marginTop: '10px', padding: '8px' }}
            >
              <span>Proceed to Reset Password</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                <Mail size={15} />
                <span>Email Address</span>
              </label>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <Mail size={16} />
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  className="auth-input-field"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <label htmlFor="login-password" className="form-label" style={{ margin: 0 }}>
                  <Lock size={15} />
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('forgot')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: '2px 4px',
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <Lock size={16} />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="auth-input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-input-action"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%', height: '46px', marginTop: '6px', fontSize: '14px', borderRadius: 'var(--radius-md)' }}
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="reg-fullname" className="form-label">
                <User size={15} />
                <span>Full Name</span>
              </label>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <User size={16} />
                </div>
                <input
                  id="reg-fullname"
                  name="fullname"
                  type="text"
                  required
                  className="auth-input-field"
                  placeholder="e.g. Alexander Vance"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">
                <Mail size={15} />
                <span>Email Address</span>
              </label>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <Mail size={16} />
                </div>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  className="auth-input-field"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">
                <Lock size={15} />
                <span>Password (min. 6 characters)</span>
              </label>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <Lock size={16} />
                </div>
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="auth-input-field"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-input-action"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm-password" className="form-label">
                <CheckCircle2 size={15} />
                <span>Confirm Password</span>
              </label>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <CheckCircle2 size={16} />
                </div>
                <input
                  id="reg-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="auth-input-field"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="auth-input-action"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%', height: '46px', marginTop: '6px', fontSize: '14px', borderRadius: 'var(--radius-md)' }}
            >
              <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="forgot-email" className="form-label">
                <Mail size={15} />
                <span>Registered Email</span>
              </label>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <Mail size={16} />
                </div>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  required
                  className="auth-input-field"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  spellCheck={false}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%', height: '46px', marginTop: '6px', fontSize: '14px', borderRadius: 'var(--radius-md)' }}
            >
              <span>{isLoading ? 'Generating Token...' : 'Generate Reset Token'}</span>
              <KeyRound size={16} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '13px' }}>
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                &larr; Back to Login
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('reset')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Have a token? Reset now
              </button>
            </div>
          </form>
        )}

        {/* 4. RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="reset-token" className="form-label">
                <KeyRound size={15} />
                <span>Reset Token</span>
              </label>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <KeyRound size={16} />
                </div>
                <input
                  id="reset-token"
                  name="token"
                  type="text"
                  required
                  className="auth-input-field"
                  placeholder="Paste the reset token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reset-new-password" className="form-label">
                <Lock size={15} />
                <span>New Password</span>
              </label>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <Lock size={16} />
                </div>
                <input
                  id="reset-new-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="auth-input-field"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-input-action"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reset-confirm-password" className="form-label">
                <CheckCircle2 size={15} />
                <span>Confirm New Password</span>
              </label>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <CheckCircle2 size={16} />
                </div>
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="auth-input-field"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="auth-input-action"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%', height: '46px', marginTop: '6px', fontSize: '14px', borderRadius: 'var(--radius-md)' }}
            >
              <span>{isLoading ? 'Updating Password...' : 'Save New Password'}</span>
              <CheckCircle2 size={16} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px' }}>
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                &larr; Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

