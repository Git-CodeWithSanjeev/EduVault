// ══════════════════════════════════════════════════════════════════════
// EDUVAULT CORE PAGE COMPONENTS
// ══════════════════════════════════════════════════════════════════════

// Main Educational Discovery & Library Pages
export { Home as HomePage, Home } from './Home';
export { Library as LibraryPage, Library } from './Library';
export { Categories as CategoriesPage, Categories } from './Categories';
export { CategoryView as CategoryDetailPage, CategoryView } from './CategoryDetail';
export { Detail as BookDetailPage, Detail } from './BookDetail';
export { SavedPage as SavedWishlistPage, SavedPage } from './SavedWishlist';

// Video Learning & Course Hub
export { VideoHub as VideoHubPage, VideoHub } from './VideoHub';
export { VideoTheater as VideoTheaterPage, VideoTheater } from './VideoTheater';

// Auth & User Management Pages
export { Login as LoginPage, Login } from './Login';
export { Register as RegisterPage, Register } from './Register';
export { Profile as ProfilePage, Profile } from './Profile';
export { ResetPassword as ResetPasswordPage, ResetPassword } from './ResetPassword';
export { VerifyEmailPage } from './VerifyEmail';
export { AuthCallback as AuthCallbackPage, AuthCallback } from './AuthCallback';

// Admin Infrastructure & Contribution Gateway
export { AdminPanel as AdminDashboardPage, AdminPanel } from './AdminDashboard';
export { Form as ContributeReportPage, Form } from './ContributeReport';
export { Outbound as OutboundGatewayPage, Outbound } from './OutboundGateway';
export { StaticInfoPage } from './StaticInfo';
