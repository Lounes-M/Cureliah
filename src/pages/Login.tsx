
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

const Login = () => {
  return (
    <AuthLayout
      title="Connexion"
      description="Connectez-vous à votre compte Projet Med"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;
