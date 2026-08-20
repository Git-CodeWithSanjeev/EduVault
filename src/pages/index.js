// ══════════════════════════════════════════════════════════════════════
// EDUVAULT CORE PAGE COMPONENTS
// ══════════════════════════════════════════════════════════════════════

// Main Educational Discovery & Library Pages
export { Home as HomePage, Home } from './HomePage';
export { Library as LibraryPage, Library } from './LibraryPage';
export { Categories as CategoriesPage, Categories } from './CategoriesPage';
export { CategoryView as CategoryDetailPage, CategoryView } from './CategoryDetailPage';
export { Detail as BookDetailPage, Detail } from './BookDetailPage';
export { SavedPage as SavedWishlistPage, SavedPage } from './SavedWishlistPage';

// Video Learning & Course Hub
export { VideoHub as VideoHubPage, VideoHub } from './VideoHubPage';
export { VideoTheater as VideoTheaterPage, VideoTheater } from './VideoTheaterPage';

// Auth & User Management Pages
export { Login as LoginPage, Login } from './LoginPage';
export { Register as RegisterPage, Register } from './RegisterPage';
export { Profile as ProfilePage, Profile } from './ProfilePage';
export { ResetPassword as ResetPasswordPage, ResetPassword } from './ResetPasswordPage';
export { VerifyEmailPage } from './VerifyEmailPage';
export { AuthCallback as AuthCallbackPage, AuthCallback } from './AuthCallbackPage';

// Admin Infrastructure & Contribution Gateway
export { AdminPanel as AdminDashboardPage, AdminPanel } from './AdminDashboardPage';
export { Form as ContributeReportPage, Form } from './ContributeReportPage';
export { Outbound as OutboundGatewayPage, Outbound } from './OutboundGatewayPage';
