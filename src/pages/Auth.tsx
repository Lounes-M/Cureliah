import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { User, Building2, ArrowLeft, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [isLogin, setIsLogin] = useState(true)
  const [isResetPassword, setIsResetPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userType: location.state?.userType || 'doctor',
    firstName: '',
    lastName: '',
    establishmentName: ''
  })

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: {
        length: password.length < minLength,
        upperCase: !hasUpperCase,
        lowerCase: !hasLowerCase,
        numbers: !hasNumbers,
        specialChar: !hasSpecialChar
      }
    }
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEmail(resetEmail)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      toast({
        title: "Email envoyé",
        description: "Les instructions de réinitialisation ont été envoyées à votre adresse email. Veuillez vérifier votre boîte de réception."
      })
      setIsResetPassword(false)
      setResetEmail('')
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi de l'email",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validation des données
      if (!signUpData.email || !signUpData.password) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive",
        })
        return
      }

      if (signUpData.password !== signUpData.confirmPassword) {
        toast({
          title: "Erreur",
          description: "Les mots de passe ne correspondent pas",
          variant: "destructive",
        })
        return
      }

      if (signUpData.userType === 'doctor' && (!signUpData.firstName || !signUpData.lastName)) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir votre nom et prénom",
          variant: "destructive",
        })
        return
      }

      if (signUpData.userType === 'establishment' && !signUpData.establishmentName) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir le nom de l'établissement",
          variant: "destructive",
        })
        return
      }

      const { error } = await signUp(
        signUpData.email,
        signUpData.password,
        signUpData.userType,
        {
          firstName: signUpData.firstName,
          lastName: signUpData.lastName,
          establishmentName: signUpData.establishmentName,
          is_active: true,
          is_verified: false
        }
      )

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Compte existant",
            description: "Cet email est déjà utilisé. Veuillez vous connecter.",
          })
          // Rediriger vers l'onglet connexion
          const tabsList = document.querySelector('[role="tablist"]')
          const signInTab = tabsList?.querySelector('[value="signin"]')
          if (signInTab) {
            (signInTab as HTMLElement).click()
          }
          // Pré-remplir l'email dans le formulaire de connexion
          setSignInData(prev => ({ ...prev, email: signUpData.email }))
          return
        }
        throw error
      }

      toast({
        title: "Compte créé !",
        description: "Un email de confirmation vous a été envoyé.",
      })

      // Rediriger vers la page de création de profil appropriée
      if (signUpData.userType === 'doctor') {
        navigate('/doctor/create-profile', {
          state: {
            email: signUpData.email,
            firstName: signUpData.firstName,
            lastName: signUpData.lastName,
            userType: signUpData.userType
          }
        })
      } else {
        navigate('/establishment/create-profile', {
          state: {
            email: signUpData.email,
            establishmentName: signUpData.establishmentName,
            userType: signUpData.userType
          }
        })
      }
    } catch (error: any) {
      console.error('Error signing up:', error)
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du compte",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateEmail(signInData.email)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive"
      })
      return
    }

    if (!signInData.password.trim()) {
      toast({
        title: "Erreur", 
        description: "Le mot de passe est requis",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const { data, error } = await signIn(signInData.email, signInData.password)

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Erreur",
            description: "Email ou mot de passe incorrect",
            variant: "destructive"
          })
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email non confirmé",
            description: "Veuillez vérifier votre email et cliquer sur le lien de confirmation",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Erreur",
            description: error.message || "Une erreur est survenue lors de la connexion",
            variant: "destructive"
          })
        }
      } else if (data?.user) {
        // Vérifier si l'utilisateur a un profil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', data.user.id)
          .single()

        // Si le profil n'existe pas ou s'il y a une erreur, on redirige vers la création de profil
        if (profileError || !profileData) {
          const userType = data.user.user_metadata?.user_type || 'doctor'
          const profileRoute = userType === 'doctor' 
            ? '/doctor/create-profile'
            : '/establishment/create-profile'
          
          navigate(profileRoute, {
            state: {
              email: data.user.email,
              userType: userType
            }
          })
          return
        }

        toast({
          title: "Connexion réussie !",
          description: "Vous êtes maintenant connecté(e).",
        })
        navigate('/')
      }
    } catch (error: any) {
      console.error('Unexpected error during signin:', error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue-light via-white to-medical-green-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Rejoignez Projet Med
            </CardTitle>
            <CardDescription>
              La plateforme qui révolutionne les vacations médicales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                {isResetPassword ? (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        placeholder="votre@email.com"
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Envoi..." : "Réinitialiser le mot de passe"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setIsResetPassword(false)}
                    >
                      Retour à la connexion
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        value={signInData.email}
                        onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                        required
                        placeholder="votre@email.com"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Mot de passe</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        required
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Connexion..." : "Se connecter"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setIsResetPassword(true);
                        setResetEmail(signInData.email); // Pré-remplir l'email
                      }}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Mot de passe oublié ?
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type de compte</Label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={signUpData.userType === 'doctor' ? 'default' : 'outline'}
                        className={`flex-1 ${
                          signUpData.userType === 'doctor'
                            ? 'bg-medical-blue hover:bg-medical-blue-dark text-white'
                            : 'border-medical-blue text-medical-blue hover:bg-medical-blue/10'
                        }`}
                        onClick={() => setSignUpData(prev => ({ ...prev, userType: 'doctor' }))}
                      >
                        Médecin
                      </Button>
                      <Button
                        type="button"
                        variant={signUpData.userType === 'establishment' ? 'default' : 'outline'}
                        className={`flex-1 ${
                          signUpData.userType === 'establishment'
                            ? 'bg-medical-green hover:bg-medical-green-dark text-white'
                            : 'border-medical-green text-medical-green hover:bg-medical-green/10'
                        }`}
                        onClick={() => setSignUpData(prev => ({ ...prev, userType: 'establishment' }))}
                      >
                        Établissement
                      </Button>
                    </div>
                  </div>

                  {signUpData.userType === 'doctor' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={signUpData.firstName}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={signUpData.lastName}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, lastName: e.target.value }))}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="establishmentName">Nom de l'établissement</Label>
                      <Input
                        id="establishmentName"
                        type="text"
                        value={signUpData.establishmentName}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, establishmentName: e.target.value }))}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                      placeholder="votre@email.com"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-gray-500">
                      Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirmer le mot de passe</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      required
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Création du compte..." : "Créer un compte"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Auth
