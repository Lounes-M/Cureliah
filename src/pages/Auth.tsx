
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { User, Building2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    userType: 'doctor'
  })

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Starting signup process with data:', { 
      email: signUpData.email,
      userType: signUpData.userType,
      firstName: signUpData.firstName,
      lastName: signUpData.lastName
    })
    
    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      })
      return
    }

    if (signUpData.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      console.log('Calling signUp function...')
      const { data, error } = await signUp(
        signUpData.email,
        signUpData.password,
        {
          first_name: signUpData.firstName,
          last_name: signUpData.lastName,
          user_type: signUpData.userType
        }
      )

      console.log('SignUp response:', { data, error })

      if (error) {
        console.error('SignUp error:', error)
        if (error.message.includes('already registered')) {
          toast({
            title: "Erreur",
            description: "Un compte avec cette adresse email existe déjà",
            variant: "destructive"
          })
        } else if (error.message.includes('Invalid email')) {
          toast({
            title: "Erreur",
            description: "Adresse email invalide",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Erreur",
            description: error.message || "Une erreur est survenue lors de la création du compte",
            variant: "destructive"
          })
        }
      } else {
        console.log('Account created successfully')
        toast({
          title: "Compte créé !",
          description: "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
        })
        // Clear the form
        setSignUpData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          userType: 'doctor'
        })
      }
    } catch (error: any) {
      console.error('Unexpected error during signup:', error)
      toast({
        title: "Erreur",
        description: error.message || "Une erreur inattendue est survenue",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Starting signin process with email:', signInData.email)
    setIsLoading(true)
    
    try {
      const { data, error } = await signIn(signInData.email, signInData.password)

      console.log('SignIn response:', { data, error })

      if (error) {
        console.error('SignIn error:', error)
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Erreur",
            description: "Email ou mot de passe incorrect",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Erreur",
            description: error.message || "Une erreur est survenue lors de la connexion",
            variant: "destructive"
          })
        }
      } else {
        console.log('Signed in successfully')
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
        description: error.message || "Une erreur est survenue lors de la connexion",
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
                      placeholder="Votre mot de passe"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-medical-blue hover:bg-medical-blue-dark"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        value={signUpData.firstName}
                        onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                        required
                        placeholder="Jean"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        value={signUpData.lastName}
                        onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                        required
                        placeholder="Dupont"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Type de compte</Label>
                    <RadioGroup
                      value={signUpData.userType}
                      onValueChange={(value) => setSignUpData({ ...signUpData, userType: value })}
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="doctor" id="doctor" />
                        <Label htmlFor="doctor" className="flex items-center cursor-pointer">
                          <User className="w-4 h-4 mr-2 text-medical-blue" />
                          Je suis médecin
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="establishment" id="establishment" />
                        <Label htmlFor="establishment" className="flex items-center cursor-pointer">
                          <Building2 className="w-4 h-4 mr-2 text-medical-green" />
                          Je représente un établissement
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                      placeholder="votre@email.com"
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
                      minLength={6}
                      placeholder="Au moins 6 caractères"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                      placeholder="Répétez votre mot de passe"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-medical-blue hover:bg-medical-blue-dark"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Création...' : 'Créer mon compte'}
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
