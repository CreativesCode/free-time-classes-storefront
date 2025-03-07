"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/UserContext";
import { BookOpen, Settings, User } from "lucide-react";
import Image from "next/image";

export default function StudentProfile() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Profile Header */}
      <div className="flex items-center space-x-6 mb-8">
        <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100">
          <Image
            src={user?.profilePicture || "/images/default-avatar.png"}
            alt="Profile"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user?.username}</h1>
          <p className="text-gray-600">{user?.email}</p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Mis Cursos
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <p className="mt-1">{user?.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Fecha de Registro
                  </label>
                  <p className="mt-1">
                    {new Date(user?.createdAt || "").toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Última Actualización
                  </label>
                  <p className="mt-1">
                    {new Date(user?.updatedAt || "").toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button className="mt-4">Editar Perfil</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mis Cursos Inscritos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Placeholder for enrolled courses */}
                <div className="text-center text-gray-500 py-8">
                  No hay cursos inscritos aún
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Notificaciones por Email
                  </label>
                  <div className="mt-2">
                    <Button variant="outline" className="w-full justify-start">
                      Configurar Notificaciones
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Cambiar Contraseña
                  </label>
                  <div className="mt-2">
                    <Button variant="outline" className="w-full justify-start">
                      Actualizar Contraseña
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Eliminar Cuenta
                  </label>
                  <div className="mt-2">
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                    >
                      Eliminar Mi Cuenta
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
