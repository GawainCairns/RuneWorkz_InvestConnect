import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AlertStack from './components/AlertStack';
import ConfirmationPage from './components/attendee/ConfirmationPage';
import DietaryPage from './components/attendee/DietaryPage';
import InvitationLanding from './components/attendee/InvitationLanding';
import InvoiceForm from './components/attendee/InvoiceForm';
import PaymentPage from './components/attendee/PaymentPage';
import RSVPPage from './components/attendee/RSVPPage';
import AdminLayout from './components/organizer/AdminLayout';
import AdminDashboard from './components/organizer/AdminDashboard';
import AllEmailLogs from './components/organizer/AllEmailLogs';
import EmailEditPage from './components/organizer/EmailEditPage';
import EmailLogs from './components/organizer/EmailLogs';
import EventDetails from './components/organizer/EventDetails';
import EventEditForm from './components/organizer/EventEditForm';
import EventForm from './components/organizer/EventForm';
import EventList from './components/organizer/EventList';
import InviteeDashboard from './components/organizer/InviteeDashboard';
import InviteeList from './components/organizer/InviteeList';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { AlertProvider } from './contexts/AlertContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EmailLogProvider } from './contexts/EmailLogContext';
import { EventProvider } from './contexts/EventContext';
import { InviteeProvider } from './contexts/InviteeContext';
import { TenantProvider } from './contexts/TenantContext';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function RootRedirect() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return token ? <Navigate to="/home" replace /> : <LandingPage />;
}

export default function App() {
  return (
    <Router>
      <TenantProvider>
        <AuthProvider>
          <AlertProvider>
            <EventProvider>
              <InviteeProvider>
                <EmailLogProvider>
                  <AlertStack />
                  <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset" element={<ResetPasswordPage />} />
                    <Route
                      path="/home"
                      element={
                        <ProtectedRoute>
                          <HomePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="events" element={<EventList />} />
                      <Route path="events/new" element={<EventForm />} />
                      <Route path="events/:eventId" element={<EventDetails />} />
                      <Route path="events/:eventId/edit" element={<EventEditForm />} />
                      <Route path="events/:eventId/invitees" element={<InviteeList />} />
                      <Route path="events/:eventId/emails" element={<EmailLogs />} />
                      <Route path="events/:eventId/email" element={<EmailEditPage />} />
                      <Route path="emails" element={<AllEmailLogs />} />
                      <Route path="invitee-dashboard" element={<InviteeDashboard />} />
                    </Route>
                    <Route path="/rsvp/:token" element={<InvitationLanding />} />
                    <Route path="/rsvp/:token/respond" element={<RSVPPage />} />
                    <Route path="/rsvp/:token/dietary" element={<DietaryPage />} />
                    <Route path="/rsvp/:token/payment" element={<PaymentPage />} />
                    <Route path="/rsvp/:token/invoice" element={<InvoiceForm />} />
                    <Route path="/rsvp/:token/confirmation" element={<ConfirmationPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </EmailLogProvider>
              </InviteeProvider>
            </EventProvider>
          </AlertProvider>
        </AuthProvider>
      </TenantProvider>
    </Router>
  );
}
