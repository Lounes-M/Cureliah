
import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

const Register = () => {
  return (
    <AuthLayout
      title="Inscription"
      description="Créez votre compte sur Projet Med"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default Register;
